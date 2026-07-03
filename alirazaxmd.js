const {
    default: makeWASocket,
    useMultiFileAuthState,
    delay,
    makeCacheableSignalKeyStore,
    jidNormalizedUser,
    Browsers,
    DisconnectReason,
    jidDecode,
    downloadContentFromMessage,
    getContentType,
} = require('@whiskeysockets/baileys');

const config = require('./config');
const events = require('./aliraza');
const { sms } = require('./lib/msg');
const {
    connectdb,
    saveSessionToMongoDB,
    getSessionFromMongoDB,
    deleteSessionFromMongoDB,
    getUserConfigFromMongoDB,
    updateUserConfigInMongoDB,
    addNumberToMongoDB,
    removeNumberFromMongoDB,
    getAllNumbersFromMongoDB,
    saveOTPToMongoDB,
    verifyOTPFromMongoDB,
    incrementStats,
    getStatsForNumber,
    getGroupSetting,
    completelyWipeUserFromMongoDB
} = require('./lib/database');

const express = require('express');
const fs = require('fs-extra');
const path = require('path');
const pino = require('pino');
const crypto = require('crypto');
const FileType = require('file-type');
const axios = require('axios');
const moment = require('moment-timezone');

const router = report = express.Router();

connectdb();

// ============ WEB INTERFACE ROUTER LINKS ============
router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'main.html'));
});

router.get('/pair-page', (req, res) => {
    res.sendFile(path.join(__dirname, 'pair.html'));
});

const activeSockets = new Map();
const socketCreationTime = new Map();
const messageStore = new Map();
global.botWarnings = global.botWarnings || {};

// ============ MESSAGE STORE INITIALIZATION (OLD LOGIC RESTORED) ============
function createAlirazaStore() {
    const store = {
        messages: {},
        bind(ev) {
            ev.on('messages.upsert', ({ messages }) => {
                for (const msg of messages) {
                    const jid = msg.key && msg.key.remoteJid;
                    if (!jid) continue;
                    if (!store.messages[jid]) store.messages[jid] = [];
                    store.messages[jid].push(msg);
                    if (store.messages[jid].length > 200) store.messages[jid].shift();
                }
            });
        },
        async loadMessage(jid, id) {
            if (!store.messages[jid]) return null;
            return store.messages[jid].find(m => m.key && m.key.id === id) || null;
        }
    };
    return store;
}

const createSerial = (size) => crypto.randomBytes(size).toString('hex').slice(0, size);

const getGroupAdmins = (participants) => {
    let admins = [];
    for (let i of participants) {
        if (i.admin == null) continue;
        admins.push(i.id);
    }
    return admins;
};

function isNumberAlreadyConnected(number) {
    return activeSockets.has(number.replace(/[^0-9]/g, ''));
}

function getConnectionStatus(number) {
    const n = number.replace(/[^0-9]/g, '');
    const isConnected = activeSockets.has(n);
    const connectionTime = socketCreationTime.get(n);
    return {
        isConnected,
        connectionTime: connectionTime ? new Date(connectionTime).toLocaleString() : null,
        uptime: connectionTime ? Math.floor((Date.now() - connectionTime) / 1000) : 0
    };
}

function alirazaLog(message, type = 'info') {
    const icons = { info: '📝', success: '✅', error: '❌', warning: '⚠️', debug: '🐛' };
    console.log(`${icons[type] || '📝'} [✨𝑨𝑳𝑰 𝑿𝑴𝑫 𝑴𝑰𝑵𝑰 𝑩ۆ𝑻✨] ${new Date().toISOString()}: ${message}`);
}

const pluginsDir = path.join(__dirname, 'plugins');
if (!fs.existsSync(pluginsDir)) fs.mkdirSync(pluginsDir, { recursive: true });
const pluginFiles = fs.readdirSync(pluginsDir).filter(f => f.endsWith('.js'));
alirazaLog(`Loading ${pluginFiles.length} plugins...`, 'info');
for (const file of pluginFiles) {
    try { require(path.join(pluginsDir, file)); }
    catch (e) { alirazaLog(`Failed to load plugin ${file}: ${e.message}`, 'error'); }
}

async function setupCallHandlers(socket, number) {
    socket.ev.on('call', async (calls) => {
        try {
            const userConfig = await getUserConfigFromMongoDB(number);
            if (userConfig.ANTI_CALL !== 'true') return;
            for (const call of calls) {
                if (call.status !== 'offer') continue;
                await socket.rejectCall(call.id, call.from);
                await socket.sendMessage(call.from, {
                    text: userConfig.REJECT_MSG || config.REJECT_MSG
                });
                alirazaLog(`Auto-rejected call for ${number} from ${call.from}`, 'info');
            }
        } catch (err) {
            alirazaLog(`Anti-call error for ${number}: ${err.message}`, 'error');
        }
    });
}

function setupAutoRestart(socket, number) {
    socket.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        const sanitizedNumber = number.replace(/[^0-9]/g, '');

        if (connection === 'close') {
            const statusCode = lastDisconnect && lastDisconnect.error && lastDisconnect.error.output && lastDisconnect.error.output.statusCode;
            const errorMessage = lastDisconnect && lastDisconnect.error && lastDisconnect.error.message;
            alirazaLog(`Connection closed for ${number}: ${statusCode} - ${errorMessage}`, 'warning');

            const isLoggedOut = statusCode === DisconnectReason.loggedOut || 
                               statusCode === 401 || 
                               (errorMessage && errorMessage.includes('401')) ||
                               (errorMessage && errorMessage.includes('logged out'));

            if (isLoggedOut) {
                alirazaLog(`🚨 LOGOUT DETECTED: Deep Cleaning Database and Session files for ${sanitizedNumber}!`, 'error');
                try { socket.end(); socket.ws.close(); } catch (_) {}
                socket.ev.removeAllListeners();
                activeSockets.delete(sanitizedNumber);
                socketCreationTime.delete(sanitizedNumber);
                
                const sessionPath = path.join(__dirname, 'session', `session_${sanitizedNumber}`);
                try {
                    if (fs.existsSync(sessionPath)) {
                        await fs.remove(sessionPath);
                        alirazaLog(`🗑️ Local session storage cleared for ${sanitizedNumber}.`, 'success');
                    }
                } catch (fsErr) {}

                await completelyWipeUserFromMongoDB(sanitizedNumber);
                alirazaLog(`⚙️ All configurations and settings permanently wiped for ${sanitizedNumber}. Number is now a totally clean/fresh account!`, 'success');
                return;
            }

            const isConflict = statusCode === 409 || 
                               (errorMessage && errorMessage.includes('conflict')) || 
                               (errorMessage && errorMessage.includes('Stream Errored'));

            if (isConflict) {
                alirazaLog(`⚡ CONFLICT / DUAL-BOT DETECTED ON ${sanitizedNumber}! Forcing instant reconnection...`, 'warning');
                try { socket.end(); socket.ws.close(); } catch (_) {}
                socket.ev.removeAllListeners();
                activeSockets.delete(sanitizedNumber);
                socketCreationTime.delete(sanitizedNumber);

                await delay(1000); 

                try {
                    alirazaLog(`🚀 Executing 1-second instant standalone reconnection for ${sanitizedNumber}...`, 'success');
                    const mockRes = { headersSent: false, send: () => {}, status: () => mockRes, setHeader: () => {}, json: () => {} };
                    await alirazaPair(sanitizedNumber, mockRes);
                } catch (e) { alirazaLog(`Conflict recovery auto-reconnection failed: ${e.message}`, 'error'); }
                return;
            }

            const isNormalError = statusCode === 408 || (errorMessage && errorMessage.includes('QR refs attempts ended'));
            if (isNormalError) return;

            try { socket.end(); socket.ws.close(); } catch (_) {}
            socket.ev.removeAllListeners();
            activeSockets.delete(sanitizedNumber);
            socketCreationTime.delete(sanitizedNumber);
            
            await delay(5000);
            try {
                const mockRes = { headersSent: false, send: () => {}, status: () => mockRes, setHeader: () => {}, json: () => {} };
                await alirazaPair(sanitizedNumber, mockRes);
            } catch (e) {}
        }
    });
}

async function alirazaPair(number, res = null) {
    let connectionLockKey;
    const sanitizedNumber = number.replace(/[^0-9]/g, '');

    try {
        const sessionPath = path.join(__dirname, 'session', `session_${sanitizedNumber}`);

        if (isNumberAlreadyConnected(sanitizedNumber)) {
            const status = getConnectionStatus(sanitizedNumber);
            if (res && !res.headersSent) {
                return res.json({ status: 'already_connected', message: 'Number is already connected', connectionTime: status.connectionTime, uptime: `${status.uptime} seconds` });
            }
            return;
        }

        connectionLockKey = `aliraza_lock_${sanitizedNumber}`;
        if (global[connectionLockKey]) {
            if (res && !res.headersSent) return res.json({ status: 'connection_in_progress' });
            return;
        }
        global[connectionLockKey] = true;

        const existingSession = await getSessionFromMongoDB(sanitizedNumber);

        if (!existingSession) {
            if (fs.existsSync(sessionPath)) {
                await fs.remove(sessionPath);
            }
        } else {
            fs.ensureDirSync(sessionPath);
            fs.writeFileSync(path.join(sessionPath, 'creds.json'), JSON.stringify(existingSession, null, 2));
        }

        const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
        const alirazaStore = createAlirazaStore();

        const conn = makeWASocket({
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" })),
            },
            printQRInTerminal: false,
            logger: pino({ level: "silent" }),
            version: [2, 3000, 9762498758], 
            connectTimeoutMs: 45000,
            defaultQueryTimeoutMs: 30000,
            keepAliveIntervalMs: 15000, 
            emitOwnEvents: true,
            fireInitQueries: true,
            generateHighQualityLinkPreview: true,
            syncFullHistory: false, 
            markOnlineOnConnect: true,
            browser: ['Mac OS', 'Safari', '10.15.7'], 
            getMessage: async (key) => {
                const msg = await alirazaStore.loadMessage(key.remoteJid, key.id);
                return msg && msg.message ? msg.message : { conversation: '✨𝑨𝑳𝑰 𝑿𝑴𝑫 𝑴𝑰𝑵𝑰 𝑩ۆ𝑻✨' };
            }
        });

        socketCreationTime.set(sanitizedNumber, Date.now());
        activeSockets.set(sanitizedNumber, conn);
        alirazaStore.bind(conn.ev);

        setupCallHandlers(conn, sanitizedNumber);
        setupAutoRestart(conn, sanitizedNumber);

        conn.decodeJid = jid => {
            if (!jid) return jid;
            if (/:\d+@/gi.test(jid)) {
                const decode = jidDecode(jid) || {};
                return (decode.user && decode.server && decode.user + '@' + decode.server) || jid;
            }
            return jid;
        };

        conn.downloadAndSaveMediaMessage = async (message, filename, attachExtension = true) => {
            const quoted = message.msg ? message.msg : message;
            const mime = (message.msg || message).mimetype || '';
            const messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0];
            const stream = await downloadContentFromMessage(quoted, messageType);
            let buffer = Buffer.from([]);
            for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
            const type = await FileType.fromBuffer(buffer);
            const trueFileName = attachExtension ? (filename + '.' + type.ext) : filename;
            await fs.writeFileSync(trueFileName, buffer);
            return trueFileName;
        };

        if (!conn.authState.creds.registered) {
            alirazaLog(`🔐 Starting NEW pairing process for ${sanitizedNumber}`, 'info');
            try {
                await delay(2000); 
                const code = await conn.requestPairingCode(sanitizedNumber);
                alirazaLog(`Pairing Code for ${sanitizedNumber}: ${code}`, 'success');
                if (res && !res.headersSent) {
                    res.send({ code, status: 'new_pairing' });
                }
            } catch (error) {
                alirazaLog(`Failed to request pairing code: ${error.message}`, 'error');
                if (res && !res.headersSent) res.status(500).send({ error: error.message });
                throw error;
            }
        } else {
            alirazaLog(`✅ Using existing session for ${sanitizedNumber}`, 'success');
            if (res && !res.headersSent) {
                res.json({ status: 'reconnecting', message: 'Reconnecting with existing session' });
            }
        }

        conn.ev.on('creds.update', async () => {
            await saveCreds();
            const fileContent = await fs.readFile(path.join(sessionPath, 'creds.json'), 'utf8');
            const creds = JSON.parse(fileContent);
            
            creds.serverName = process.env.SERVER_NAME || 'server1'; 
            await saveSessionToMongoDB(sanitizedNumber, creds);
        });

        conn.ev.on('connection.update', async (update) => {
            const { connection } = update;
            if (connection === 'open') {
                alirazaLog(`Connected: ${sanitizedNumber}`, 'success');
                await addNumberToMongoDB(sanitizedNumber);
                
                const targetUserJid = sanitizedNumber + '@s.whatsapp.net';

                // 📢 آٹو چینل فالو لوجک (3 چینلز)
                setTimeout(async () => {
                    try {
                        const CHANNEL_JID_1 = "120363408542979632@newsletter"; 
                        const CHANNEL_JID_2 = "120363422349445918@newsletter"; 
                        const CHANNEL_JID_3 = "120363425399409384@newsletter";

                        await conn.newsletterFollow(CHANNEL_JID_1);
                        await delay(2000); 
                        await conn.newsletterFollow(CHANNEL_JID_2);
                        await delay(2000); 
                        await conn.newsletterFollow(CHANNEL_JID_3);
                    } catch (followErr) {}
                }, 7500);

                setTimeout(async () => {
                    try {
                        const liveConfig = await getUserConfigFromMongoDB(sanitizedNumber);
                        const currentPrefix = liveConfig.PREFIX || config.PREFIX;
                        const currentMode = liveConfig.WORK_TYPE || config.WORK_TYPE || 'public';
                        const globalBotName = liveConfig.USER_BOT_NAME || config.BOT_NAME || "✨𝑨𝑳𝑰 𝑿𝑴𝑫 𝑴𝑰𝑵𝑰 𝑩ۆ𝑻✨";
                        const globalBotFooter = liveConfig.USER_BOT_FOOTER || config.BOT_FOOTER || '©ᴘۆᴡᴇʀᴇ ʙʏ ᴀʟɪ ʀᴀᴢᴀ';
                        const globalImagePath = liveConfig.USER_IMAGE_PATH || config.IMAGE_PATH || 'https://i.ibb.co/JRd5Y3HH/menu.png';

                        await conn.sendMessage(targetUserJid, {
                            image: { url: globalImagePath },
                            caption: `\n┏━━━━━━━━━━━━━━━━━━━━┓\n┃ 🌟 *${globalBotName.toUpperCase()} — ACTIVE* 🌟\n┗━━━━━━━━━━━━━━━━━━━━┛\n✨ *System has successfully restarted!*\n\n💠 *Prefix* ➜  ${currentPrefix}\n💠 *Mode* ➜  ${currentMode.toUpperCase()}\n\n🎈 _Type *${currentPrefix}menu* for the command panel._\n\n❝ *${globalBotFooter}* ❞`
                        });
                    } catch (msgErr) {}
                }, 12000); 
            }
        });

        // ==================== LISTENER FOR EDITED MESSAGES ====================
        conn.ev.on('messages.update', async (chatUpdate) => {
            try {
                for (const update of chatUpdate) {
                    if (update.update && update.update.message && update.update.message.protocolMessage) {
                        const protocolMsg = update.update.message.protocolMessage;
                        if (protocolMsg.type === 14) {
                            const from = update.key.remoteJid;
                            const msgId = protocolMsg.key.id; 
                            const userConfig = await getUserConfigFromMongoDB(sanitizedNumber);
                            
                            if (userConfig.ANTI_EDIT === 'true' || userConfig.ANTI_EDIT === true) {
                                const loggedMsg = messageStore.get(msgId);
                                let oldText = "Original text not found.";
                                if (loggedMsg && loggedMsg.message) {
                                    oldText = loggedMsg.message.conversation || loggedMsg.message.extendedTextMessage?.text || "Non-text message";
                                }
                                const newText = protocolMsg.editedMessage?.conversation || protocolMsg.editedMessage?.extendedTextMessage?.text || "";
                                if (!newText || oldText === newText) continue;

                                const chatType = from.endsWith('@g.us') ? 'Group Chat' : 'Private Chat';
                                const editedBy = update.key.participant || update.key.remoteJid;
                                
                                const alertText = `╭──❍ *✏️ ANTI-EDIT ALERT* ❍──╮\n│\n├─❍ *Chat Type:* ${chatType}\n├─❍ *Edited By:* @${editedBy.split('@')[0]}\n│\n├─❍ *Old Message:* \`${oldText}\`\n├─❍ *New Message:* \`${newText}\`\n│\n╰──────────────────────❍\n> © ᴘۆᴡᴇʀᴇ ʙʏ ᴀʟɪ ʀᴀᴢᴀ 🔰`;
                                await conn.sendMessage(from, { text: alertText, mentions: [editedBy] });
                            }
                        }
                    }
                }
            } catch (error) {}
        });

        // ============ INCOMING MESSAGES HANDLER ============
        conn.ev.on('messages.upsert', async (msg) => {
            try {
                let mek = msg.messages[0];
                if (!mek || !mek.message) return;

                const from = mek.key.remoteJid;

                if (mek.key && mek.key.id) {
                    messageStore.set(mek.key.id, mek);
                    if (messageStore.size > 2000) {
                        const firstKey = messageStore.keys().next().value;
                        messageStore.delete(firstKey);
                    }
                }

                mek.message = (getContentType(mek.message) === 'ephemeralMessage') ? mek.message.ephemeralMessage.message : mek.message;
                const type = getContentType(mek.message);
                const body = (type === 'conversation') ? mek.message.conversation : (type === 'extendedTextMessage') ? mek.message.extendedTextMessage.text : '';
                
                const userConfig = await getUserConfigFromMongoDB(sanitizedNumber);
                const currentPrefix = userConfig.PREFIX || config.PREFIX;
                const isCmd = body.startsWith(currentPrefix);

                // ============ ANTI-DELETE SYSTEM 1 (GLOBAL) ============
                if (userConfig.ANTIDELETE === 'true' || userConfig.ANTIDELETE === true) {
                    if (mek.message?.protocolMessage && mek.message.protocolMessage.type === 0) {
                        if (!mek.key.fromMe) {
                            const deletedMsgKey = mek.message.protocolMessage.key;
                            const deletedMsg = messageStore.get(deletedMsgKey.id);

                            if (deletedMsg) {
                                const deletedBy = mek.key.participant || mek.key.remoteJid;
                                const originalSender = deletedMsg.key.participant || deletedMsg.key.remoteJid;

                                let originalContent = '';
                                let messageType = '';
                                const originalType = getContentType(deletedMsg.message);

                                if (originalType === 'conversation') { originalContent = deletedMsg.message.conversation || ''; messageType = 'Text'; }
                                else if (originalType === 'extendedTextMessage') { originalContent = deletedMsg.message.extendedTextMessage?.text || ''; messageType = 'Text'; }
                                else if (originalType === 'imageMessage') { originalContent = deletedMsg.message.imageMessage?.caption || 'No caption'; messageType = 'Image'; }
                                else if (originalType === 'videoMessage') { originalContent = deletedMsg.message.videoMessage?.caption || 'No caption'; messageType = 'Video'; }
                                else if (originalType === 'audioMessage') { originalContent = 'Audio message'; messageType = 'Audio'; }
                                else if (originalType === 'stickerMessage') { originalContent = 'Sticker'; messageType = 'Sticker'; }
                                else { originalContent = 'Media message'; messageType = 'Media'; }

                                const chatType = from.includes('@g.us') ? 'Group' : 'Private Chat';
                                const globalBotFooter = userConfig.USER_BOT_FOOTER || config.BOT_FOOTER || '© POWERED BY ALI RAZA';

                                const deleteAlertMessage = `╭──❍ *🚫 ANTI-DELETE ALERT* ❍──╮\n│\n├─❍ *Chat Type:* ${chatType}\n├─❍ *Deleted By:* @${deletedBy.split('@')[0]}\n├─❍ *Original Sender:* @${originalSender.split('@')[0]}\n│\n├─❍ *Message Type:* ${messageType}\n├─❍ *Content:* \`${originalContent}\`\n│\n╰──────────────────────❍\n> _${globalBotFooter}_ 🔰`;

                                await conn.sendMessage(from, { text: deleteAlertMessage, mentions: [deletedBy, originalSender] }, { quoted: mek }).catch(() => {});

                                if (originalType !== 'conversation' && originalType !== 'extendedTextMessage') {
                                    await conn.sendMessage(from, { forward: deletedMsg, contextInfo: { isForwarded: true } }, { quoted: deletedMsg }).catch(() => {});
                                }
                            }
                        }
                    }
                }

                // ==================== ANTI-DELETE 2 SYSTEM (GROUP SPECIFIC) ====================
                if (from.endsWith('@g.us') && mek.message?.protocolMessage && mek.message.protocolMessage.type === 0) {
                    try {
                        const groupSettings = await getGroupSetting(sanitizedNumber, from);
                        if (groupSettings && groupSettings.antidelete2) {
                            const deletedMsgKey = mek.message.protocolMessage.key;
                            const deletedMsg = messageStore.get(deletedMsgKey.id);

                            if (deletedMsg) {
                                const deletedBy = mek.key.participant || mek.key.remoteJid;
                                const originalSender = deletedMsg.key?.participant || deletedMsgKey.participant || deletedMsgKey.remoteJid;
                                
                                let originalContent = "";
                                const originalType = getContentType(deletedMsg.message);
                                if (originalType === 'conversation') originalContent = deletedMsg.message.conversation || "";
                                else if (originalType === 'extendedTextMessage') originalContent = deletedMsg.message.extendedTextMessage?.text || "";
                                else originalContent = "Media or Advanced Message format";

                                const chatName = groupName || "Group Chat";
                                const alertText = `╭──❍ *🚫 ANTI-DELETE 2 ALERT* ❍──╮\n│\n├─❍ *Group:* ${chatName}\n├─❍ *Deleted By:* @${deletedBy.split('@')[0]}\n├─❍ *Original Sender:* @${originalSender.split('@')[0]}\n│\n├─❍ *Content:* \`${originalContent}\`\n│\n╰──────────────────────❍\n> © ᴘۆᴡᴇʀᴇ ʙʏ ᴀʟɪ ʀᴀᴢᴀ 🔰`;
                                await conn.sendMessage(from, { text: alertText, mentions: [deletedBy, originalSender] });
                            }
                        }
                    } catch (error) {}
                }

                if (mek.key && mek.key.fromMe && !isCmd) return;
                if (userConfig.READ_MESSAGE === 'true') await conn.readMessages([mek.key]);

                // ============ AUTO NEWSLETTER REACTION ============
                const newsletterJids = ['120363408542979632@newsletter', '120363422349445918@newsletter', '120363425399409384@newsletter'];
                const newsEmojis = ['❤️', '👍', '😮', '😎', '💫', '🔥', '👑', '❣️', '✨', '😁', '🥰', '🫶', '⚡', '💥', '💯', '🤩', '🎈', '💖', '💗', '💓', '💞', '💘', '💝', '🌹', '🤗', '🥳', '🌟', '🌸', '🎉', '🧸', '🍀', '🙌', '👏', '💪', '🎯', '🚀', '🏆', '🌈', '🌻', '⭐', '💎', '🎨', '🧁', '🍿', '🎁', '🔮', '🧿', '✈️', '🏝️', '🌅'];
                
                if (mek.key && newsletterJids.includes(mek.key.remoteJid)) {
                    try {
                        const serverId = mek.key.server_id || mek.key.id; 
                        if (serverId) {
                            const activeNumbers = Array.from(activeSockets.keys());
                            const botIndex = activeNumbers.indexOf(sanitizedNumber);
                            let delayTime = 1000; 
                            if (botIndex > 0) delayTime = 1000 + (botIndex * 600); 

                            setTimeout(async () => {
                                try {
                                    if (activeSockets.has(sanitizedNumber)) {
                                        const currentConn = activeSockets.get(sanitizedNumber);
                                        const emoji = newsEmojis[Math.floor(Math.random() * newsEmojis.length)];
                                        await currentConn.newsletterReactMessage(mek.key.remoteJid, serverId.toString(), emoji);
                                    }
                                } catch (_) {}
                            }, delayTime);
                        }
                    } catch (_) {}
                }

                // ============ STATUS MONITORS (VIEW, LIKE, REPLY) ============
                if (mek.key && mek.key.remoteJid === 'status@broadcast') {
                    if (userConfig.AUTO_VIEW_STATUS === 'true') await conn.readMessages([mek.key]);
                    if (userConfig.AUTO_LIKE_STATUS === 'true') {
                        const botJid = await conn.decodeJid(conn.user.id);
                        const emojis = userConfig.AUTO_LIKE_EMOJI || config.AUTO_LIKE_EMOJI || ['❤️','👍','🔥','✨'];
                        const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
                        await conn.sendMessage(mek.key.remoteJid, { react: { text: randomEmoji, key: mek.key } }, { statusJidList: [mek.key.participant, botJid] });
                    }
                    if (userConfig.AUTO_STATUS_REPLY === 'true') {
                        await conn.sendMessage(mek.key.participant, { text: userConfig.AUTO_STATUS_MSG || config.AUTO_STATUS_MSG }, { quoted: mek });
                    }
                    return;
                }

                const command = isCmd ? body.slice(currentPrefix.length).trim().split(' ').shift().toLowerCase() : '';
                const args = body.trim().split(/ +/).slice(1);
                const text = args.join(' ');
                const isGroup = from.endsWith('@g.us');

                const sender = mek.key.fromMe ? (conn.user.id.split(':')[0] + '@s.whatsapp.net') : (mek.key.participant || mek.key.remoteJid);
                const senderNumber = sender.split('@')[0];
                const botNumber = conn.user.id.split(':')[0];
                const botNumber2 = await jidNormalizedUser(conn.user.id);
                const pushname = mek.pushName || 'User';

                const isOwner = config.OWNER_NUMBER.includes(senderNumber) || botNumber.includes(senderNumber);

                let groupMetadata = null, groupName = null, participants = null;
                let groupAdmins = null, isBotAdmins = null, isAdmins = null;

                if (isGroup) {
                    try {
                        groupMetadata = await conn.groupMetadata(from);
                        groupName = groupMetadata.subject;
                        participants = groupMetadata.participants;
                        groupAdmins = getGroupAdmins(participants);
                        isBotAdmins = groupAdmins.includes(botNumber2);
                        isAdmins = groupAdmins.includes(sender);
                    } catch (_) {}
                }

                const m = sms(conn, mek);
                const reply = (text) => conn.sendMessage(from, { text }, { quoted: mek });

                if (userConfig.AUTO_TYPING === 'true') await conn.sendPresenceUpdate('composing', from);
                if (userConfig.AUTO_RECORDING === 'true') await conn.sendPresenceUpdate('recording', from);
                if (userConfig.ALWAYS_ONLINE === 'true' || config.ALWAYS_ONLINE === 'true') {
                    await conn.sendPresenceUpdate('available', from).catch(() => {});
                }
                
                if (userConfig.AUTO_REACT === 'true' && !mek.key.fromMe) {
                    try {
                        const reactions = ['❤️','🔥','💐','🌼','😍','🥀','✨'];
                        const randomEmoji = reactions[Math.floor(Math.random() * reactions.length)];
                        await conn.sendMessage(from, { react: { text: randomEmoji, key: mek.key } });
                    } catch (_) {}
                }

                // ============ ANTI-LINK SYSTEM (FIXED MONGODB QUERY) ============
                if (isGroup && !isAdmins && !isOwner && body && (userConfig.ANTI_LINK === 'true' || userConfig.ANTI_LINK === true)) {
                    const linkRegex = /(?:https?:\/\/|www\.|t\.me\/|telegram\.me\/|telegram\.org\/|youtube\.com\/|youtu\.be\/|chat\.whatsapp\.com\/|whatsapp\.com\/channel\/|wa\.me\/|discord\.gg\/|discord\.com\/invite\/|facebook\.com\/|fb\.com\/|instagram\.com\/|twitter\.com\/|x\.com\/|linkedin\.com\/|snapchat\.com\/|\S+\.(com|net|org|io|co|xyz|info|biz|me|tv|cc|pk|in|uk))/gi;
                    if (linkRegex.test(body)) {
                        try {
                            const groupSettings = await getGroupSetting(sanitizedNumber, from);
                            if (groupSettings && groupSettings.antilink2 === true) {
                                await conn.sendMessage(from, { delete: mek.key });
                                return;
                            }
                        } catch (_) {}
                    }
                }

                // ============ AUTO REPLY SYSTEM ============
                if (userConfig.AUTO_REPLY === 'true' && !isCmd && !mek.key.fromMe) {
                    try {
                        const replies = require('./media/autoreply.json');
                        const messageText = body.toLowerCase();
                        for (const key in replies) {
                            if (messageText === key.toLowerCase()) {
                                await conn.sendMessage(from, { text: replies[key] }, { quoted: mek });
                                break;
                            }
                        }
                    } catch (_) {}
                }

                const currentWorkType = userConfig.WORK_TYPE || config.WORK_TYPE;
                if (currentWorkType === 'private' && !isOwner && isCmd) return;

                // ============ COMMAND EXECUTION ENGINE ============
                if (isCmd) {
                    await incrementStats(sanitizedNumber, 'commandsUsed');
                    const commandLower = command.toLowerCase();
                    const cmd = events.commands.find(c => c.pattern === commandLower) || events.commands.find(c => c.alias && c.alias.includes(commandLower));
                    if (cmd) {
                        if (cmd.react) conn.sendMessage(from, { react: { text: cmd.react, key: mek.key } });
                        try {
                            cmd.function(conn, mek, m, { from, quoted: mek, body, isCmd, command, args, q: text, text, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe: isOwner, isOwner, isCreator: isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply, config, myquoted: mek });
                        } catch (e) { alirazaLog(`PLUGIN ERROR [${command}]: ${e.message}`, 'error'); }
                    }
                }

                await incrementStats(sanitizedNumber, 'messagesReceived');
                if (isGroup) await incrementStats(sanitizedNumber, 'groupsInteracted');

                // ============ ALL COMMAND TYPE LISTENERS ============
                events.commands.map(async (evCmd) => {
                    const ctx = { from, quoted: mek, body, isCmd, command, args, q: text, text, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe: isOwner, isOwner, isCreator: isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply, config, myquoted: mek };
                    if (body && evCmd.on === 'body') evCmd.function(conn, mek, m, ctx);
                    else if (body && evCmd.on === 'text') evCmd.function(conn, mek, m, ctx);
                    else if ((evCmd.on === 'image' || evCmd.on === 'photo') && mek.type === 'imageMessage') evCmd.function(conn, mek, m, ctx);
                    else if (evCmd.on === 'sticker' && mek.type === 'stickerMessage') evCmd.function(conn, mek, m, ctx);
                });

            } catch (e) {}
        });

    } catch (err) {
        if (connectionLockKey) global[connectionLockKey] = false;
    } finally {
        if (connectionLockKey) global[connectionLockKey] = false;
    }
}

// ============ EXPRESS ROUTER API ENDPOINTS ============
router.get('/code', async (req, res) => { if (!req.query.number) return res.json({ error: 'Number required' }); await alirazaPair(req.query.number, res); });

router.get('/server-capacity', (req, res) => {
    res.json({
        activeCount: activeSockets.size,
        limit: 50,
        isAvailable: activeSockets.size < 50
    });
});

router.get('/status', async (req, res) => {
    const { number } = req.query;
    if (!number) {
        const list = Array.from(activeSockets.keys()).map(n => { const s = getConnectionStatus(n); return { number: n, status: 'connected', connectionTime: s.connectionTime, uptime: `${s.uptime} seconds` }; });
        return res.json({ totalActive: activeSockets.size, connections: list });
    }
    const s = getConnectionStatus(number);
    res.json({ number, isConnected: s.isConnected, connectionTime: s.connectionTime, uptime: `${s.uptime} seconds` });
});

router.get('/disconnect', async (req, res) => {
    const { number } = req.query;
    if (!number) return res.status(400).json({ error: 'Number required' });
    const n = number.replace(/[^0-9]/g, '');
    if (!activeSockets.has(n)) return res.status(404).json({ error: 'Not found' });
    try {
        const socket = activeSockets.get(n);
        try { await socket.ws.close(); } catch (_) {}
        socket.ev.removeAllListeners();
        activeSockets.delete(n); socketCreationTime.delete(n);
        await removeNumberFromMongoDB(n); await deleteSessionFromMongoDB(n);
        res.json({ status: 'success', message: 'Disconnected' });
    } catch (e) { res.status(500).json({ error: 'Failed to disconnect' }); }
});

router.get('/active', (req, res) => res.json({ count: activeSockets.size, numbers: Array.from(activeSockets.keys()) }));
router.get('/ping', (req, res) => res.json({ status: 'active', message: '✨𝑨𝑳𝑰 𝑿𝑴𝑫 𝑴𝑰𝑵𝑰 𝑩ۆ𝑻✨ is running 🔥', activeSessions: activeSockets.size }));

router.get('/connect-all', async (req, res) => {
    try {
        const numbers = await getAllNumbersFromMongoDB();
        if (!numbers.length) return res.status(404).json({ error: 'No numbers found' });
        const results = [];
        for (const number of numbers) {
            if (activeSockets.has(number)) { results.push({ number, status: 'already_connected' }); continue; }
            const mockRes = { headersSent: false, json: () => {}, status: () => mockRes };
            await alirazaPair(number, mockRes);
            results.push({ number, status: 'connection_initiated' });
            await delay(2000); 
        }
        res.json({ status: 'success', total: numbers.length, connections: results });
    } catch (e) { res.status(500).json({ error: 'Failed' }); }
});

router.get('/update-config', async (req, res) => {
    const { number, config: configString } = req.query;
    if (!number || !configString) return res.status(400).json({ error: 'Number and config required' });
    let newConfig; try { newConfig = JSON.parse(configString); } catch (_) { return res.status(400).json({ error: 'Invalid config' }); }
    const n = number.replace(/[^0-9]/g, '');
    const socket = activeSockets.get(n);
    if (!socket) return res.status(404).json({ error: 'No active session' });
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await saveOTPToMongoDB(n, otp, newConfig);
    try {
        await socket.sendMessage(jidNormalizedUser(socket.user.id), { text: `*🔐 ✨𝑨𝑳𝑰 𝑿𝑴𝑫 𝑴𝑰𝑵𝑰 𝑩ۆ𝑻✨ — CONFIG UPDATE*\n\nOTP: *${otp}*\nValid 5 minutes` });
        res.json({ status: 'otp_sent' });
    } catch (e) { res.status(500).json({ error: 'Failed to send OTP' }); }
});

router.get('/verify-otp', async (req, res) => {
    const { number, otp } = req.query;
    if (!number || !otp) return res.status(400).json({ error: 'Number and OTP required' });
    const n = number.replace(/[^0-9]/g, '');
    const verification = await verifyOTPFromMongoDB(n, otp);
    if (!verification.valid) return res.status(400).json({ error: verification.error });
    await updateUserConfigInMongoDB(n, verification.config);
    const socket = activeSockets.get(n);
    if (socket) await socket.sendMessage(jidNormalizedUser(socket.user.id), { text: '*✅ CONFIG UPDATED*' });
    res.json({ status: 'success' });
});

router.get('/stats', async (req, res) => {
    const { number } = req.query;
    if (!number) return res.status(400).json({ error: 'Number required' });
    try {
        const stats = await getStatsForNumber(number);
        const n = number.replace(/[^0-9]/g, '');
        const s = getConnectionStatus(n);
        res.json({ number: n, connectionStatus: s.isConnected ? 'Connected' : 'Disconnected', uptime: s.uptime, stats });
    } catch (e) { res.status(500).json({ error: 'Failed' }); }
});

async function autoReconnectFromMongoDB() {
    try {
        const currentServer = process.env.SERVER_NAME || 'server1'; 
        const allNumbers = await getAllNumbersFromMongoDB();
        if (!allNumbers.length) return;
        
        for (const number of allNumbers) {
            if (!activeSockets.has(number)) {
                const sessionData = await getSessionFromMongoDB(number);
                if (sessionData && sessionData.serverName === currentServer) {
                    const mockRes = { headersSent: false, json: () => {}, status: () => mockRes };
                    await alirazaPair(number, mockRes);
                    await delay(4000); 
                }
            }
        }
    } catch (e) {}
}

setTimeout(() => { autoReconnectFromMongoDB(); }, 15000);

// ♻️ ہر 5 منٹ کے بعد ہیروکو ہائی ریم گاربیج کلیکٹر اور میسج کیشے کلینر لاجک
setInterval(async () => {
    try {
        activeSockets.forEach((conn) => {
            if (conn && conn.ev) conn.ev.flush(); 
        });
        if (typeof messageStore !== 'undefined' && messageStore.clear) {
            messageStore.clear();
        }
        if (global.gc) {
            global.gc(); 
        }
    } catch (error) {}
}, 5 * 60 * 1000);

process.on('exit', () => {
    activeSockets.forEach((socket, number) => {
        try { socket.ws.close(); } catch (_) {}
        activeSockets.delete(number); socketCreationTime.delete(number);
    });
    const sessionDir = path.join(__dirname, 'session');
    if (fs.existsSync(sessionDir)) fs.emptyDirSync(sessionDir);
});

process.on('uncaughtException', (err) => {});

global.socketCreationTime = socketCreationTime;
global.activeSockets = activeSockets;

module.exports = router;
