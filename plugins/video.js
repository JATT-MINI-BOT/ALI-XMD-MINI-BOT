const axios = require("axios");
const yts = require("yt-search");
const { cmd } = require("../aliraza");
const config = require("../config");
const { getUserConfigFromMongoDB } = require("../lib/database");
const { fakevCard } = require("../lib/fakevCard"); // Successfully Imported

cmd({
    pattern: "video",
    alias: ["vid", "playvideo"],
    desc: "Download YouTube Video (Fast)",
    category: "download",
    react: "🎬",
    filename: __filename
},
async (conn, mek, m, { from, reply, text, botNumber }) => {
    try {
        if (!text) {
            return conn.sendMessage(from, { text: "❌ Example:\n.video pasoori" }, { quoted: fakevCard });
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
            console.error("Failed to fetch custom settings from DB in video:", dbError);
        }

        /* 🔍 Search YouTube */
        const search = await yts(text);
        if (!search.videos.length) {
            return conn.sendMessage(from, { text: "❌ No video found" }, { quoted: fakevCard });
        }

        const vid = search.videos[0];

        /* 🎥 Fetch Video Link from New Faizan API */
        const api = `https://faizan-api.vercel.app/api/ytmp4?url=${encodeURIComponent(vid.url)}`;
        const res = await axios.get(api, { timeout: 60000 });

        // API Response validation for new structure (result.url)
        if (
            !res.data ||
            !res.data.status ||
            !res.data.result ||
            !res.data.result.url
        ) {
            return conn.sendMessage(from, { text: "❌ Video API failed" }, { quoted: fakevCard });
        }

        const videoUrl = res.data.result.url;
        const title = res.data.result.title || vid.title;

        // Stylish Custom Box Layout for Video Caption
        const videoCaption = `╭═══ 🎬 VIDEO DOWNLOADED ═══⊷
┃❃╭──────────────
┃❃│ 🎬 Title: *${title}*
┃❃│ ⏱️ Duration: ${vid.timestamp}
┃❃╰───────────────
╰═════════════════⊷\n\n> ${globalBotFooter}`;

        /* 🚀 SEND VIDEO DIRECT WITH CARDING & NO SEPARATE THUMBNAIL IMAGE */
        await conn.sendMessage(from, {
            video: { url: videoUrl },
            mimetype: "video/mp4",
            caption: videoCaption
        }, { quoted: fakevCard });

        await conn.sendMessage(from, { react: { text: "✅", key: m.key } });

    } catch (err) {
        console.log(err);
        conn.sendMessage(from, { text: "❌ Video error occurred" }, { quoted: fakevCard });
        await conn.sendMessage(from, { react: { text: "❌", key: m.key } });
    }
});
