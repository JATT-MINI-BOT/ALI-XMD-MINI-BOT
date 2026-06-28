const { cmd } = require('../aliraza');

cmd({
    pattern: "repo",
    alias: ["sc", "script", "source", "website"],
    desc: "Get bot official links",
    category: "main",
    react: "🌐",
    filename: __filename
},
async (conn, mek, m, { from, pushname, reply }) => {
    try {
        // ========================================================
        // 🛠️ FIXED DATA: You can change your name and links here
        // ========================================================
        const botName = "✨𝑨𝑳𝑰 𝑿𝑴𝑫 𝑴𝑰𝑵𝑰 𝑩𝑶𝑻✨"; 
        const botFooter = "©ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴀʟɪ ʀᴀᴢᴀ"; 
        const botImage = "https://i.ibb.co/4nV5ZHY1/file-00000000bd187209b3a2c923cb318f26.png"; 

        // Your fixed links
        const officialWebsite = "https://ali-xmd-mini-bot.vercel.app";
        const supportGroup = "https://whatsapp.com/channel/0029VbDYYAzATRSkeyugCc2x";

        // ========================================================
        // ✨ DESIGN 1: ROYAL CROWN LOOK (FULL ENGLISH)
        // ========================================================
        const repoMessage = `👑 *━━━━━━━━━━━━━━━━━━━━* 👑\n` +
                            `🌟  *${botName.toUpperCase()}* 🌟\n` +
                            `✨ *OFFICIAL CHANNELS & LINKS* ✨\n` +
                            `*━━━━━━━━━━━━━━━━━━━━*\n\n` +
                            `👋 *Hello, ${pushname}!*\n` +
                            `Welcome to our premium service network. Here are the official active links you need:\n\n` +
                            `🌐 *𝐏𝐀𝐈𝐑𝐈𝐍𝐆 𝐖𝐄𝐁𝐒𝐈𝐓𝐄:*\n` +
                            `🔗 ${officialWebsite}\n\n` +
                            `💬 *𝐖𝐇𝐀𝐓𝐒𝐀𝐏𝐏 𝐒𝐔𝐏𝐏𝐎𝐑𝐓:*\n` +
                            `🔗 ${supportGroup}\n\n` +
                            `✨ *━━━━━━━━━━━━━━━━━━━━* ✨\n` +
                            `*${botFooter}*`;

        // Send the message with image
        await conn.sendMessage(from, {
            image: { url: botImage },
            caption: repoMessage
        }, { quoted: mek });

    } catch (e) {
        console.error("Error in repo command:", e);
        reply("❌ Error loading repository command.");
    }
});
