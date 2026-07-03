const axios = require("axios");
const yts = require("yt-search");
const { cmd } = require("../aliraza");
const config = require("../config");
const { getUserConfigFromMongoDB } = require("../lib/database");
const { fakevCard } = require("../lib/fakevCard");

cmd({
    pattern: "song",
    alias: ["ytmp3", "play", "mp3", "gana", "music", "audio"],
    react: "🎵",
    desc: "YouTube search & MP3 play (2-in-1 Image + Audio Mode with User Mention)",
    category: "download",
    use: ".play <song name>",
    filename: __filename
},
async (conn, mek, m, { from, args, reply, botNumber, sender }) => {
    try {
        const query = args.join(" ");
        if (!query) {
            const noQueryLayout = `*╭ׂ┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*
*│ ╌─̇─̣⊰🎵 𝐌𝐔𝐒𝐈𝐂 𝐏𝐋𝐀𝐘𝐄𝐑 ⊱┈─̇─̣╌*
*│─̇─̣┄┄┄┄┄┄┄┄┄┄┄┄┄─̇─̣*
*│* ❌ Please Provide A Song Name Or Link
*│* 💡 Use: .song <song name>
*│* 📝 Ex: .song let me love you
*╰┄─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*`;
            return conn.sendMessage(from, { text: noQueryLayout }, { quoted: fakevCard });
        }

        await conn.sendMessage(from, { react: { text: "⏳", key: m.key } });

        // Fetch live user configs from MongoDB
        let currentBotName = "𝑨𝑳𝑰 𝑿𝑴𝑫 𝑴𝑰𝑵𝑰 𝑩𝑶𝑻";
        let globalBotFooter = config.BOT_FOOTER || "©ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴀʟɪ ʀᴀᴢᴀ";

        try {
            const userDbConfig = await getUserConfigFromMongoDB(botNumber);
            if (userDbConfig) {
                if (userDbConfig.USER_BOT_NAME) currentBotName = userDbConfig.USER_BOT_NAME;
                if (userDbConfig.USER_BOT_FOOTER) globalBotFooter = userDbConfig.USER_BOT_FOOTER;
            }
        } catch (dbError) {
            console.error("Failed to fetch custom settings from DB in song:", dbError);
        }

        /* 🔍 Search YouTube */
        const search = await yts(query);
        if (!search.videos || !search.videos.length) {
            return conn.sendMessage(from, { text: 
`*╭ׂ┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*
*│* ❌ No results found for your query!
*╰┄─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*` 
            }, { quoted: fakevCard });
        }

        const video = search.videos[0];
        let downloadUrl = "";
        let songTitle = video.title;

        /* 🚀 Fetch Audio Link from Faizan API */
        try {
            const res = await axios.get(
                `https://faizan-api.vercel.app/api/ytmp3?url=${encodeURIComponent(video.url)}`,
                { timeout: 20000 }
            );
            
            if (res.data && res.data.status && res.data.result?.download) {
                downloadUrl = res.data.result.download;
                songTitle = res.data.result.title || video.title;
            }
        } catch (apiErr) {
            console.error('[play] Faizan API error:', apiErr.message);
        }

        if (!downloadUrl) {
            return conn.sendMessage(from, { text: 
`*╭ׂ┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*
*│* ❌ Audio link could not be fetched from API.
*╰┄─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*` 
            }, { quoted: fakevCard });
        }

        // 📝 کسٹم باکس ڈیزائن مع مینشن (Mentions)
        const audioCaption = `*╭ׂ┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*
*│ ╌─̇─̣⊰🎵 𝐌𝐔𝐒𝐈𝐂 𝐃𝐎𝐖𝐍𝐋𝐎𝐀𝐃𝐄 ⊱┈─̇─̣╌*
*│─̇─̣┄┄┄┄┄┄┄┄┄┄┄┄┄─̇─̣*
*│* 🎵 Title: ${songTitle}
*│* ⏱️ Duration: ${video.timestamp || "Unknown"}
*│* 👥 Requested By: @${sender.split("@")[0]}
*│* 🤖 Bot: ${currentBotName}
*╰┄─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*

> _${globalBotFooter}_ 🔰`;

        /* 🖼️ 1. پہلے گانے کی پکچر ڈیزائن اور مینشن کے ساتھ جائے گی */
        const sentInfo = await conn.sendMessage(from, {
            image: { url: video.thumbnail },
            caption: audioCaption,
            mentions: [sender] // یہ لائن یوزر کو تھمب نیل پر ٹیگ (Mention) کرے گی
        }, { quoted: fakevCard });

        const cleanFileName = `${songTitle.replace(/[^\w\s\-]/g, '')}.mp3`;

        /* 🎵 2. اس کے فوراً بعد گانا علیحدہ سے آڈیو میں جائے گا (تصویر والے میسج کو رپلائی کر کے) */
        await conn.sendMessage(from, {
            audio: { url: downloadUrl }, 
            mimetype: "audio/mpeg",
            ptt: false,
            fileName: cleanFileName,
            upload: conn.waUploadToServer
        }, { quoted: sentInfo }); 

        await conn.sendMessage(from, { react: { text: "✅", key: m.key } });

    } catch (err) {
        console.error("PLAY ERROR:", err);
        conn.sendMessage(from, { text: 
`*╭ׂ┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*
*│* ❌ An error occurred while processing the song.
*╰┄─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*` 
        }, { quoted: fakevCard });
        await conn.sendMessage(from, { react: { text: "❌", key: m.key } });
    }
});
