// plugins/viewonce.js
const events = require('../aliraza');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { fakevCard } = require('../lib/fakevCard'); // Successfully Imported

events.commands.push({
    pattern: 'vv',
    alias: ['viewonce', 'retrieved'],
    category: 'owner',
    desc: 'Retrieve and download View Once media messages without loading text.',
    react: '👁️',
    function: async (conn, mek, m, { from, isOwner, reply }) => {
        // Authorization check - Only owner can use this
        if (!isOwner) {
            return conn.sendMessage(from, { text: 
`*╭ׂ┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*
*│* ❌ Error: This command is restricted to the Bot Owner only.
*╰┄─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*` 
            }, { quoted: fakevCard });
        }

        // Check if user has quoted a message
        if (!mek.message.extendedTextMessage || !mek.message.extendedTextMessage.contextInfo || !mek.message.extendedTextMessage.contextInfo.quotedMessage) {
            const usageLayout = `*╭ׂ┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*
*│ ╌─̇─̣⊰💡 𝐕𝐈𝐄𝐖𝐎𝐍𝐂𝐄 𝐔𝐒𝐀𝐆𝐄 ⊱┈─̇─̣╌*
*│─̇─̣┄┄┄┄┄┄┄┄┄┄┄┄┄─̇─̣*
*│* 💡 Usage: Please reply/quote a View Once
*│* media (image, video, or audio) with .vv
*╰┄─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*`;
            return conn.sendMessage(from, { text: usageLayout }, { quoted: fakevCard });
        }

        const quotedMessage = mek.message.extendedTextMessage.contextInfo.quotedMessage;
        let viewOnceMessage = null;
        let mediaType = null;

        // Detect if the quoted message is View Once
        if (quotedMessage.viewOnceMessageV2 && quotedMessage.viewOnceMessageV2.message) {
            viewOnceMessage = quotedMessage.viewOnceMessageV2.message;
        } else if (quotedMessage.viewOnceMessage && quotedMessage.viewOnceMessage.message) {
            viewOnceMessage = quotedMessage.viewOnceMessage.message;
        } else if (quotedMessage.viewOnceMessageV2Extension && quotedMessage.viewOnceMessageV2Extension.message) {
            viewOnceMessage = quotedMessage.viewOnceMessageV2Extension.message;
        }

        // If not a View Once wrapper, check direct content
        if (!viewOnceMessage) {
            viewOnceMessage = quotedMessage;
        }

        // Identify media content type
        if (viewOnceMessage.imageMessage) {
            mediaType = 'image';
        } else if (viewOnceMessage.videoMessage) {
            mediaType = 'video';
        } else if (viewOnceMessage.audioMessage) {
            mediaType = 'audio';
        }

        // If no supported View Once media found
        if (!mediaType) {
            return conn.sendMessage(from, { text: 
`*╭ׂ┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*
*│* ❌ Error: The quoted message is not a valid View Once media.
*╰┄─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*` 
            }, { quoted: fakevCard });
        }

        const mediaContent = viewOnceMessage[`${mediaType}Message`];

        try {
            // Download stream from WhatsApp servers
            const stream = await downloadContentFromMessage(mediaContent, mediaType);
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }

            // Stylish Caption Layout
            const captionText = mediaContent.caption 
                ? `*╭ׂ┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*\n*│ ╌─̇─̣⊰👁️ 𝐕𝐈𝐄𝐖𝐎𝐍𝐂𝐄 𝐂𝐀𝐏𝐓𝐈𝐎𝐍 ⊱┈─̇─̣╌*\n*│─̇─̣┄┄┄┄┄┄┄┄┄┄┄┄┄─̇─̣*\n*│* ${mediaContent.caption}\n*╰┄─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*` 
                : `*╭ׂ┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*\n*│ ╌─̇─̣⊰👁️ 𝐕𝐈𝐄𝐖𝐎𝐍𝐂𝐄 𝐌𝐄𝐃𝐈𝐀 ⊱┈─̇─̣╌*\n*│─̇─̣┄┄┄┄┄┄┄┄┄┄┄┄┄─̇─̣*\n*│* Retrieved successfully!\n*╰┄─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*`;

            // Forward the downloaded media back to the chat with fakevCard
            if (mediaType === 'image') {
                await conn.sendMessage(from, { image: buffer, caption: captionText }, { quoted: fakevCard });
            } else if (mediaType === 'video') {
                await conn.sendMessage(from, { video: buffer, caption: captionText, mimetype: 'video/mp4' }, { quoted: fakevCard });
            } else if (mediaType === 'audio') {
                await conn.sendMessage(from, { audio: buffer, mimetype: 'audio/mp4', ptt: false }, { quoted: fakevCard });
            }

        } catch (error) {
            console.error('Error in View Once command:', error);
            return conn.sendMessage(from, { text: 
`*╭ׂ┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*
*│* ❌ Error: Failed to retrieve the View Once media.
*╰┄─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*` 
            }, { quoted: fakevCard });
        }
    }
});

// ==========================================
// 2️⃣ NEW VV2 COMMAND (INBOX FORWARDER)
// ==========================================
events.commands.push({
    pattern: 'vv2',
    alias: ['viewonce2', 'retrieved2', 'tome'],
    category: 'owner',
    desc: 'Retrieve View Once media and send it directly to bot inbox.',
    react: '👁️',
    function: async (conn, mek, m, { from, isOwner, reply, botNumber }) => {
        try {
            // Owner authorization check
            if (!isOwner) {
                return conn.sendMessage(from, { text: 
`*╭ׂ┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*
*│* ❌ Error: This command is restricted to the Bot Owner only.
*╰┄─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*` 
                }, { quoted: fakevCard });
            }

            // Quoted reply check
            if (!mek.message.extendedTextMessage || !mek.message.extendedTextMessage.contextInfo || !mek.message.extendedTextMessage.contextInfo.quotedMessage) {
                const usageLayout = `*╭ׂ┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*
*│ ╌─̇─̣⊰💡 𝐕𝐈𝐄𝐖𝐎𝐍𝐂𝐄 𝐕𝟐 ⊱┈─̇─̣╌*
*│─̇─̣┄┄┄┄┄┄┄┄┄┄┄┄┄─̇─̣*
*│* 💡 Usage: Reply to a View Once media with 
*│* .vv2 to receive it directly in your inbox.
*╰┄─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*`;
                return conn.sendMessage(from, { usageLayout }, { quoted: fakevCard });
            }

            const quotedMessage = mek.message.extendedTextMessage.contextInfo.quotedMessage;
            let viewOnceMessage = null;
            let mediaType = null;

            // View Once message format detection
            if (quotedMessage.viewOnceMessageV2 && quotedMessage.viewOnceMessageV2.message) {
                viewOnceMessage = quotedMessage.viewOnceMessageV2.message;
            } else if (quotedMessage.viewOnceMessage && quotedMessage.viewOnceMessage.message) {
                viewOnceMessage = quotedMessage.viewOnceMessage.message;
            } else if (quotedMessage.viewOnceMessageV2Extension && quotedMessage.viewOnceMessageV2Extension.message) {
                viewOnceMessage = quotedMessage.viewOnceMessageV2Extension.message;
            }

            if (!viewOnceMessage) {
                viewOnceMessage = quotedMessage;
            }

            if (viewOnceMessage.imageMessage) {
                mediaType = 'image';
            } else if (viewOnceMessage.videoMessage) {
                mediaType = 'video';
            } else if (viewOnceMessage.audioMessage) {
                mediaType = 'audio';
            }

            if (!mediaType) {
                return conn.sendMessage(from, { text: 
`*╭ׂ┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*
*│* ❌ Error: The quoted message is not a valid View Once media.
*╰┄─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*` 
                }, { quoted: fakevCard });
            }

            await conn.sendMessage(from, { react: { text: "⏳", key: m.key } });

            // Fetch live bot configurations from MongoDB
            let currentBotName = "𝑨𝑳𝑰 𝑿𝑴𝑫 𝑴𝑰𝑵𝑰 𝑩𝑶𝑻";
            let globalBotFooter = config.BOT_FOOTER || "©ᴘheader ʙʏ ᴀʟɪ ʀᴀᴢᴀ";

            try {
                const userDbConfig = await getUserConfigFromMongoDB(botNumber);
                if (userDbConfig) {
                    if (userDbConfig.USER_BOT_NAME) currentBotName = userDbConfig.USER_BOT_NAME;
                    if (userDbConfig.USER_BOT_FOOTER) globalBotFooter = userDbConfig.USER_BOT_FOOTER;
                }
            } catch (dbError) {
                console.error("Failed to fetch custom settings from DB in vv2:", dbError);
            }

            const mediaContent = viewOnceMessage[`${mediaType}Message`];

            // Download media streams from WhatsApp server
            const stream = await downloadContentFromMessage(mediaContent, mediaType);
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }

            const originalCaption = mediaContent.caption || "No Caption";
            const vvCaption = `*╭ׂ┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*
*│ ╌─̇─̣⊰👁️ 𝐕𝐈𝐄𝐖𝐎𝐍𝐂𝐄 𝐈𝐍𝐁𝐎𝐗 𝐕𝟐 ⊱┈─̇─̣╌*
*│─̇─̣┄┄┄┄┄┄┄┄┄┄┄┄┄─̇─̣*
*│* 📝 Caption: *${originalCaption}*
*│* 🤖 Bot: ${currentBotName}
*╰┄─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*

> _${globalBotFooter}_ 🔰`;

            // Define target JID to directly send to bot's owner chat inbox
            const targetInbox = botNumber.replace(/[^0-9]/g, '') + '@s.whatsapp.net';

            // Send processed buffer directly to the inbox
            if (mediaType === 'image') {
                await conn.sendMessage(targetInbox, { image: buffer, caption: vvCaption });
            } else if (mediaType === 'video') {
                await conn.sendMessage(targetInbox, { video: buffer, caption: vvCaption, mimetype: 'video/mp4' });
            } else if (mediaType === 'audio') {
                await conn.sendMessage(targetInbox, { text: vvCaption });
                await conn.sendMessage(targetInbox, { audio: buffer, mimetype: 'audio/mp4', ptt: false });
            }

            // Send confirmation reaction in original chat
            await conn.sendMessage(from, { react: { text: "✅", key: m.key } });

        } catch (err) {
            console.error("VIEWONCE V2 ERROR:", err);
            conn.sendMessage(from, { text: 
`*╭ׂ┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*
*│* ❌ An error occurred while retrieving View Once media.
*╰┄─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*` 
            }, { quoted: fakevCard });
            await conn.sendMessage(from, { react: { text: "❌", key: m.key } });
        }
    }
});
