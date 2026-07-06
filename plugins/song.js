const axios = require('axios');
const yts = require('yt-search');
const { cmd } = require('../aliraza');
const config = require('../config');
const { getUserConfigFromMongoDB } = require('../lib/database');
const { fakevCard } = require('../lib/fakevCard');

cmd({
    pattern: "song2",
    alias: ["play2", "mp3two"],
    react: "🎧",
    desc: "YouTube search & MP3 play with JerryCoder API",
    category: "download",
    use: ".song2 <song name>",
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
*│* 💡 Use: .song2 <song name>
*│* 📝 Ex: .song2 past lives
*╰┄─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*`;
            return conn.sendMessage(from, { text: noQueryLayout }, { quoted: fakevCard });
        }

        await conn.sendMessage(from, { react: { text: "🎧", key: m.key } });

        // ڈیٹا بیس سے بوٹ کی سیٹنگز نکالنا
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
        if (!ytsSearch || !ytsSearch.all || !ytsSearch.all[0]) {
            await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
            return conn.sendMessage(from, { text: `*❌ ɴᴏ ʀᴇsᴜʟᴛs ғᴏᴜɴᴅ*` }, { quoted: fakevCard });
        }

        const res = ytsSearch.all[0];
        const videoUrl = res.url;

        // 🚀 آپ کی کوڈ والی اصل API (کوئی تبدیلی نہیں کی گئی)
        const apiUrl = `https://jerrycoder.oggyapi.workers.dev/ytmp3?url=${encodeURIComponent(videoUrl)}`;
        const { data } = await axios.get(apiUrl);

        if (data.status !== "success" || !data.url) {
            throw new Error("ɴᴏ ᴀᴜᴅɪᴏ ʟɪɴᴋ ʀᴇᴄᴇɪᴠᴇᴅ");
        }

        const songTitle = data.title || res.title;
        const cleanFileName = `${songTitle.replace(/[^\w\s\-]/g, '')}.mp3`;

        const audioCaption = `*╭ׂ┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*
*│ ╌─̇─̣⊰🎵 𝐌𝐔𝐒𝐈𝐂 𝐃𝐎𝐖𝐍𝐋𝐎𝐀𝐃𝐄 ⊱┈─̇─̣╌*
*│─̇─̣┄┄┄┄┄┄┄┄┄┄┄┄┄─̇─̣*
*│* 🎵 Title: ${songTitle}
*│* ⏱️ Duration: ${data.duration || "Unknown"}
*│* 👥 Requested By: @${sender.split("@")[0]}
*│* 🤖 Bot: ${currentBotName}
*╰┄─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*

> _${globalBotFooter}_ 🔰`;

        // 1. تھمب نیل میسج ڈائریکٹ کمانڈ لگانے والے یوزر کو مینشن کر کے جائے گا
        const sentInfo = await conn.sendMessage(from, {
            image: { url: res.thumbnail },
            caption: audioCaption,
            mentions: [sender]
        }, { quoted: m });

        // 2. اس کے فوراً بعد گانا آڈیو فارمیٹ میں جائے گا (تصویر والے میسج کو رپلائی کر کے)
        await conn.sendMessage(from, {
            audio: { url: data.url },
            mimetype: "audio/mpeg",
            fileName: cleanFileName,
            ptt: false,
            contextInfo: {
                externalAdReply: {
                    thumbnailUrl: res.thumbnail,
                    title: songTitle,
                    body: `ᴅᴜʀᴀᴛɪᴏɴ: ${data.duration || "Unknown"} || ǫᴜᴀʟɪᴛʏ: ${data.quality || "128kbps"}`,
                    sourceUrl: videoUrl,
                    renderLargerThumbnail: true,
                    mediaType: 1
                }
            }
        }, { quoted: sentInfo });

        await conn.sendMessage(from, { react: { text: "✅", key: m.key } });

    } catch (error) {
        console.error("Play Error:", error.message);
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
        return conn.sendMessage(from, { text: `*❌ ᴅᴏᴡɴʟᴏᴀᴅ ғᴀɪʟᴇᴅ*\n\n📝 ${error.message}` }, { quoted: m });
    }
});
