const axios = require('axios');
const yts = require('yt-search');
const { cmd } = require('../aliraza');
const config = require('../config');
const { getUserConfigFromMongoDB } = require('../lib/database');
const { fakevCard } = require('../lib/fakevCard');

cmd({
    pattern: "song",
    alias: ["ytmp3", "play", "mp3", "gana", "music", "audio"],
    react: "🎵",
    desc: "YouTube search & MP3 play with New Working Faizan Vercel API",
    category: "download",
    use: ".song <song name>",
    filename: __filename
},
async (conn, mek, m, { from, args, botNumber, sender }) => {
    try {
        const query = args.join(" ");
        if (!query) {
            const noQueryLayout = `*╭ׂ┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*
*│ ╌─̇─̣⊰🎵 𝐌𝐔𝐒𝐈𝐂 𝐏𝐋𝐀𝐘𝐄Ｒ ⊱┈─̇─̣╌*
*│─̇─̣┄┄┄┄┄┄┄┄┄┄┄┄┄─̇─̣*
*│* ❌ Please Provide A Song Name Or Link
*│* 💡 Use: .song <song name>
*│* 📝 Ex: .song past lives
*╰┄─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*`;
            return conn.sendMessage(from, { text: noQueryLayout }, { quoted: fakevCard });
        }

        await conn.sendMessage(from, { react: { text: "⏳", key: m.key } });

        // ڈیٹا بیس سے بوٹ کا نام اور فوٹر حاصل کرنا
        let currentBotName = "𝑨𝑳𝑰 𝑿𝑴𝑫 𝑴𝑰𝑵𝑰 𝑩𝑶𝑻";
        let globalBotFooter = config.BOT_FOOTER || "©ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴀʟɪ ʀᴀᴢᴀ";

        try {
            const userDbConfig = await getUserConfigFromMongoDB(botNumber);
            if (userDbConfig) {
                if (userDbConfig.USER_BOT_NAME) currentBotName = userDbConfig.USER_BOT_NAME;
                if (userDbConfig.USER_BOT_FOOTER) globalBotFooter = userDbConfig.USER_BOT_FOOTER;
            }
        } catch (dbError) {
            console.error("Failed to fetch custom settings from DB:", dbError);
        }

        // یوٹیوب سرچ
        const ytsSearch = await yts(query);
        if (!ytsSearch || !ytsSearch.videos.length) {
            await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
            return conn.sendMessage(from, { text: 
`*╭ׂ┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*
*│* ❌ No results found for your query!
*╰┄─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*` 
            }, { quoted: fakevCard });
        }

        const video = ytsSearch.videos[0];
        const videoUrl = video.url;

        // 🚀 آپ کی فراہم کردہ نئی فائیکان ورسل API (New Faizan Vercel API)
        const apiUrl = `https://faizan-api.vercel.app/api/ytmp3?url=${encodeURIComponent(videoUrl)}`;
        const { data } = await axios.get(apiUrl, { timeout: 30000 });

        // API کے نئے رسپانس فارمیٹ کے مطابق ڈیٹا چیک کرنا
        if (!data || data.status !== true || !data.result || !data.result.download) {
            throw new Error("ɴᴏ ᴀᴜᴅɪᴏ ʟɪɴᴋ ʀᴇᴄᴇɪᴠᴇᴅ ғʀᴏᴍ ᴠ🇪🇷ᴄ🇪🇱 ᴀᴘɪ");
        }

        const songTitle = data.result.title || video.title;
        const songDuration = data.result.duration || video.timestamp || "Unknown";
        const downloadUrl = data.result.download;
        
        const cleanFileName = `${songTitle.replace(/[^\w\s\-]/g, '')}.mp3`;

        const audioCaption = `*╭ׂ┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*
*│ ╌─̇─̣⊰🎵 𝐌𝐔𝐒𝐈𝐂 𝐃𝐎𝐖𝐍𝐋𝐎𝐀𝐃𝐄 ⊱┈─̇─̣╌*
*│─̇─̣┄┄┄┄┄┄┄┄┄┄┄┄┄─̇─̣*
*│* 🎵 Title: ${songTitle}
*│* ⏱️ Duration: ${songDuration}
*│* 👥 Requested By: @${sender.split("@")[0]}
*│* 🤖 Bot: ${currentBotName}
*╰┄─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*

> _${globalBotFooter}_ 🔰`;

        // 1. گانے کا تھمب نیل یوزر کو مینشن کر کے جائے گا
        const sentInfo = await conn.sendMessage(from, {
            image: { url: video.thumbnail },
            caption: audioCaption,
            mentions: [sender]
        }, { quoted: m });

        // 2. اس کے فوراً بعد گانا آڈیو فارمیٹ میں جائے گا (تھمب نیل کو رپلائی کر کے)
        await conn.sendMessage(from, {
            audio: { url: downloadUrl },
            mimetype: "audio/mpeg",
            fileName: cleanFileName,
            ptt: false
        }, { quoted: sentInfo });

        await conn.sendMessage(from, { react: { text: "✅", key: m.key } });

    } catch (error) {
        console.error("Play Error:", error.message);
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
        return conn.sendMessage(from, { text: 
`*╭ׂ┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*
*│* ❌ Download failed or API error!
*│* 📝 ${error.message}
*╰┄─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*` 
        }, { quoted: m });
    }
});
