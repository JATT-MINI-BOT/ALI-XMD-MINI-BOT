const { cmd } = require("../aliraza");
const config = require('../config');

/* =========================================================================================================
   🖼️ IMAGE/VIDEO TO STICKER CONVERTER (DOWNLOAD FUNCTION FIXED)
========================================================================================================= */
cmd({
    pattern: "sticker",
    alias: ["s", "stiker"],
    react: "🎨",
    desc: "Convert image or video to a high-quality WhatsApp sticker",
    category: "tools",
    use: ".sticker (reply to image/video)",
    filename: __filename
}, async (conn, mek, m, { from, reply }) => {
    try {
        const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

        // 1. Correctly detect if a message is quoted/replied
        const isQuoted = !!(m.quoted || mek.message?.extendedTextMessage?.contextInfo?.quotedMessage);
        const quotedContent = mek.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const messageContent = isQuoted ? quotedContent : mek.message;

        if (!messageContent) {
            return reply("*⚠️ Alert:* Please reply to an image or a short video!");
        }

        // 2. Detect the type of message and get the inner message object
        let type = Object.keys(messageContent)[0] || "";
        let mediaMessage = messageContent[type];

        // Handle view once or document layout if wrapped
        if (type === 'viewOnceMessageV2' || type === 'viewOnceMessage') {
            mediaMessage = messageContent[type]?.message?.[Object.keys(messageContent[type]?.message || {})[0]];
            type = Object.keys(messageContent[type]?.message || {})[0] || "";
        }

        if (!type.includes("image") && !type.includes("video")) {
            return reply("*❌ Error:* This command only works by replying to an image or a video!");
        }

        // 3. Download media using official stream method
        const streamType = type.replace('Message', '');
        const stream = await downloadContentFromMessage(mediaMessage, streamType);
        let mediaBuffer = Buffer.from([]);
        
        for await (const chunk of stream) {
            mediaBuffer = Buffer.concat([mediaBuffer, chunk]);
        }

        if (!mediaBuffer || mediaBuffer.length === 0) {
            return reply("*❌ Error:* Failed to download media. Please try again.");
        }

        // 4. Generate sticker pack using formatter with your name
        const { Sticker, StickerTypes } = require('wa-sticker-formatter');
        const sticker = new Sticker(mediaBuffer, {
            pack: config.STICKER_NAME || "𝑨𝑳𝑰 𝑿𝑴𝑫 𝑴𝑰𝑵𝑰 𝑩𝑶𝑻", 
            author: "𝑨𝑳𝑰 𝑿𝑴𝑫 𝑴𝑰𝑵𝑰 𝑩𝑶𝑻", 
            type: StickerTypes.FULL, 
            quality: 50
        });

        const stickerBuffer = await sticker.toBuffer();
        
        // Send generated sticker to chat with standard quotation
        return await conn.sendMessage(from, { sticker: stickerBuffer }, { quoted: mek });

    } catch (e) {
        console.error("Sticker Command Error:", e);
        return reply(`*❌ Error:* Failed to generate sticker (${e.message})`);
    }
});
