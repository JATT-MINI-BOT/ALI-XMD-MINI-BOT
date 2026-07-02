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
    completelyWipeUserFromMongoDB // 👈 ڈیٹا بیس فائل کا نیا فنکشن یہاں امپورٹ کر دیا گیا ہے
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

function createAlirazaStore() {
    return {
        bind(ev) {
            ev.on('messages.upsert', ({ messages }) => {
                for (const msg of messages) {
                    if (!msg.key || !msg.key.id) continue;
                    const minimalMsg = {
                        key: msg.key,
                        message: msg.message,
                        pushName: msg.pushName,
                        type: msg.type
                    };
                    messageStore.set(msg.key.id, minimalMsg);
                    
                    if (messageStore.size > 800) {
                        const firstKey = messageStore.keys().next().value;
                        messageStore.delete(firstKey);
                    }
                }
            });
        },
        async loadMessage(jid, id) {
            return messageStore.get(id) || null;
        }
    };
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
    console.log(`${icons[type] || '📝'} [✨𝑨𝑳𝑰 𝑿𝑴𝑫 𝑴𝑰𝑵𝑰 𝑩𝑶𝑻✨] ${new Date().toISOString()}: ${message}`);
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

            // 🎯 1. لاگ آؤٹ ڈیٹیکشن: کسٹمر کا ڈیٹا اور کسٹم سیٹنگز مکمل صاف کر کے فریش اکاؤنٹ بنانا
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

                // کسٹم کنفیگریشنز اور سیشنز کو مکمل وائپ آؤٹ کرنا
                await completelyWipeUserFromMongoDB(sanitizedNumber);
                alirazaLog(`⚙️ All configurations and settings permanently wiped for ${sanitizedNumber}. Number is now a totally clean/fresh account!`, 'success');
                return;
            }

            // 🎯 2. کراس بوٹ کنفلکٹ پروٹیکشن: اب صرف 1 سیکنڈ کے ڈیلے پر انسٹنٹ ری کنیکٹ لاجک
            const isConflict = statusCode === 409 || 
                               (errorMessage && errorMessage.includes('conflict')) || 
                               (errorMessage && errorMessage.includes('Stream Errored'));

            if (isConflict) {
                alirazaLog(`⚡ CONFLICT / DUAL-BOT DETECTED ON ${sanitizedNumber}! Cleaning listener stack...`, 'warning');
                try { socket.end(); socket.ws.close(); } catch (_) {}
                socket.ev.removeAllListeners();
                activeSockets.delete(sanitizedNumber);
                socketCreationTime.delete(sanitizedNumber);

                // ⚡ اب 4 سیکنڈ کے بجائے صرف 1 سیکنڈ کا ڈیلے ہوگا
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
                return msg && msg.message ? msg.message : { conversation: '✨𝑨𝑳𝑰 𝑿𝑴𝑫 𝑴𝑰𝑵𝑰 𝑩𝑶𝑻✨' };
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

                setTimeout(async () => {
                    try {
                        const liveConfig = await getUserConfigFromMongoDB(sanitizedNumber);
                        const currentPrefix = liveConfig.PREFIX || config.PREFIX;
                        const currentMode = liveConfig.WORK_TYPE || config.WORK_TYPE || 'public';
                        const globalBotName = liveConfig.USER_BOT_NAME || config.BOT_NAME || "✨𝑨𝑳𝑰 𝑿𝑴𝑫 𝑴𝑰𝑵𝑰 𝑩𝑶𝑻✨";
                        const globalBotFooter = liveConfig.USER_BOT_FOOTER || config.BOT_FOOTER || '©ᴘᴏᴡᴇʀᴇ ʙʏ ᴀʟɪ ʀᴀᴢᴀ';
                        const globalImagePath = liveConfig.USER_IMAGE_PATH || config.IMAGE_PATH || 'https://i.ibb.co/JRd5Y3HH/menu.png';

                        await conn.sendMessage(targetUserJid, {
                            image: { url: globalImagePath },
                            caption: `\n┏━━━━━━━━━━━━━━━━━━━━┓\n┃ 🌟 *${globalBotName.toUpperCase()} — ACTIVE* 🌟\n┗━━━━━━━━━━━━━━━━━━━━┛\n✨ *System has successfully restarted!*\n\n💠 *Prefix* ➜  ${currentPrefix}\n💠 *Mode* ➜  ${currentMode.toUpperCase()}\n\n🎈 _Type *${currentPrefix}menu* for the command panel._\n\n❝ *${globalBotFooter}* ❞`
                        });
                    } catch (msgErr) {}
                }, 5000); 
            }
        });

        // ============ INCOMING MESSAGES HANDLER ============
        conn.ev.on('messages.upsert', async (msg) => {
            try {
                let mek = msg.messages[0];
                if (!mek || !mek.message) return;

                const from = mek.key.remoteJid;

                mek.message = (getContentType(mek.message) === 'ephemeralMessage') ? mek.message.ephemeralMessage.message : mek.message;
                const type = getContentType(mek.message);
                
                if (from === 'status@broadcast') {
                    const userConfig = await getUserConfigFromMongoDB(sanitizedNumber);
                    if (userConfig.AUTO_VIEW_STATUS === 'true') await conn.readMessages([mek.key]);
                    return;
                }

                const body = (type === 'conversation') ? mek.message.conversation : (type === 'extendedTextMessage') ? mek.message.extendedTextMessage.text : '';
                const userConfig = await getUserConfigFromMongoDB(sanitizedNumber);
                const currentPrefix = userConfig.PREFIX || config.PREFIX;
                const isCmd = body.startsWith(currentPrefix);

                // ============ ANTI-DELETE SYSTEM ============
                if ((userConfig.ANTIDELETE === 'true' || userConfig.ANTIDELETE === true) && mek.message?.protocolMessage && mek.message.protocolMessage.type === 0) {
                    if (!mek.key.fromMe) {
                        const deletedMsgKey = mek.message.protocolMessage.key;
                        const deletedMsg = messageStore.get(deletedMsgKey.id);

                        if (deletedMsg) {
                            const deletedBy = mek.key.participant || mek.key.remoteJid;
                            const originalSender = deletedMsg.key.participant || deletedMsg.key.remoteJid;
                            let originalContent = '';
                            let messageType = 'Media';
                            const originalType = getContentType(deletedMsg.message);

                            if (originalType === 'conversation') { originalContent = deletedMsg.message.conversation; messageType = 'Text'; }
                            else if (originalType === 'extendedTextMessage') { originalContent = deletedMsg.message.extendedTextMessage?.text; messageType = 'Text'; }
                            else { originalContent = 'Media / ViewOnce Payload Protected'; }

                            const chatType = from.includes('@g.us') ? 'Group' : 'Private Chat';
                            const deleteAlertMessage = `╭──❍ *🚫 ANTI-DELETE ALERT* ❍──╮\n│\n├─❍ *Chat Type:* ${chatType}\n├─❍ *Deleted By:* @${deletedBy.split('@')[0]}\n├─❍ *Original Sender:* @${originalSender.split('@')[0]}\n│\n├─❍ *Message Type:* ${messageType}\n├─❍ *Content:* \`${originalContent}\`\n│\n╰──────────────────────❍`;

                            await conn.sendMessage(from, { text: deleteAlertMessage, mentions: [deletedBy, originalSender] }, { quoted: mek }).catch(() => {});
                        }
                    }
                }

                if (mek.key && mek.key.fromMe && !isCmd) return;

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

                if (isGroup && isCmd) { 
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
            await delay(3000); 
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
        await socket.sendMessage(jidNormalizedUser(socket.user.id), { text: `*🔐 CONFIG UPDATE OTP: ${otp}*` });
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
    res.json({ status: 'success' });
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
        if (messageStore && messageStore.clear) {
            messageStore.clear();
        }
        if (global.gc) {
            global.gc(); // 👈 ہیروکو کی میموری کو فری کرنے والا کلینر برقرار رکھا گیا ہے
        }
    } catch (error) {}
}, 5 * 60 * 1000);

process.on('uncaughtException', (err) => {});

global.socketCreationTime = socketCreationTime;
global.activeSockets = activeSockets;

module.exports = router;
