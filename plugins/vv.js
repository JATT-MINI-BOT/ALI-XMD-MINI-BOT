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
            return conn.sendMessage(from, { text: "*❌ Error:* This command is restricted to the Bot Owner only." }, { quoted: fakevCard });
        }

        // Check if user has quoted a message
        if (!mek.message.extendedTextMessage || !mek.message.extendedTextMessage.contextInfo || !mek.message.extendedTextMessage.contextInfo.quotedMessage) {
            const usageLayout = `╭═══ 💡 VIEWONCE USAGE ═══⊷
┃❃╭──────────────
┃❃│ *💡 Usage:* Please reply/quote a
┃❃│ *View Once* image, video, or audio
┃❃│ message with \`.vv\`
┃❃╰───────────────
╰═════════════════⊷`;
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
            return conn.sendMessage(from, { text: "*❌ Error:* The quoted message is not a valid View Once media." }, { quoted: fakevCard });
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
                ? `╭═══ 👁️ VIEWONCE CAPTION ═══⊷\n┃❃ ${mediaContent.caption}\n╰═════════════════⊷` 
                : `╭═══ 👁️ VIEWONCE MEDIA ═══⊷\n┃❃ Retrieved successfully!\n╰═════════════════⊷`;

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
            return conn.sendMessage(from, { text: "*❌ Error:* Failed to retrieve the View Once media." }, { quoted: fakevCard });
        }
    }
});
