const axios = require("axios");
const { cmd } = require("../aliraza");
const config = require("../config");
const { getUserConfigFromMongoDB } = require("../lib/database");
const { fakevCard } = require("../lib/fakevCard");

cmd({
    pattern: "xvideo",
    alias: ["xv", "xvid", "xvidio"],
    react: "🎬",
    desc: "Download video from xvideo URL",
    category: "download",
    use: ".xvideo <video url>",
    filename: __filename
},
async (conn, mek, m, { from, args, reply, botNumber, sender }) => {
    try {
        const query = args.join(" ");
        if (!query) {
            const noQueryLayout = `*╭ׂ┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*
*│ ╌─̇─̣⊰🎬 𝐗𝐕𝐈𝐃𝐄𝐎 𝐃𝐎𝐖𝐍𝐋𝐎𝐀𝐃𝐄𝐑 ⊱┈─̇─̣╌*
*│─̇─̣┄┄┄┄┄┄┄┄┄┄┄┄┄─̇─̣*
*│* ❌ Please Provide A Video URL
*│* 💡 Use: .xvideo <video url>
*│* 📝 Ex: .xvideo https://...
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
            console.error("Failed to fetch custom settings from DB in xvideo:", dbError);
        }

        /* 🔗 Validate URL */
        const urlRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
        if (!urlRegex.test(query)) {
            return conn.sendMessage(from, { text: 
`*╭ׂ┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*
*│* ❌ Invalid URL format!
*│* Please provide a valid video URL.
*╰┄─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*` 
            }, { quoted: fakevCard });
        }

        /* 🚀 Fetch Video Info from DavidCyril API */
        let apiData = null;
        try {
            const res = await axios.get(
                `https://apis.davidcyriltech.my.id/xvideo?url=${encodeURIComponent(query)}`,
                { 
                    timeout: 30000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                }
            );
            
            if (res.data && res.data.success) {
                apiData = res.data;
            } else {
                throw new Error('API returned unsuccessful response');
            }
        } catch (apiErr) {
            console.error('[xvideo] DavidCyril API error:', apiErr.message);
            return conn.sendMessage(from, { text: 
`*╭ׂ┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*
*│* ❌ Failed to fetch video from API.
*│* ${apiErr.message || 'Unknown error'}
*╰┄─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*` 
            }, { quoted: fakevCard });
        }

        if (!apiData || !apiData.download_url) {
            return conn.sendMessage(from, { text: 
`*╭ׂ┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*
*│* ❌ Video download link not found!
*╰┄─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*` 
            }, { quoted: fakevCard });
        }

        // 📝 کسٹم باکس ڈیزائن مع مینشن (Mentions)
        const videoCaption = `*╭ׂ┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*
*│ ╌─̇─̣⊰🎬 𝐗𝐕𝐈𝐃𝐄𝐎 𝐃𝐎𝐖𝐍𝐋𝐎𝐀𝐃𝐄 ⊱┈─̇─̣╌*
*│─̇─̣┄┄┄┄┄┄┄┄┄┄┄┄┄─̇─̣*
*│* 🎬 Title: ${apiData.title || "Unknown"}
*│* 👤 Creator: ${apiData.creator || "N/A"}
*│* ✅ Status: Ready for download
*│* 👥 Requested By: @${sender.split("@")[0]}
*│* 🤖 Bot: ${currentBotName}
*╰┄─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*

> _${globalBotFooter}_ 🔰`;

        /* 🖼️ 1. پہلے ویڈیو کی تھمب نیل تصویر ڈیزائن اور مینشن کے ساتھ جائے گی */
        const sentInfo = await conn.sendMessage(from, {
            image: { url: apiData.thumbnail },
            caption: videoCaption,
            mentions: [sender] // یہ لائن یوزر کو تھمب نیل پر ٹیگ (Mention) کرے گی
        }, { quoted: fakevCard });

        const cleanFileName = `${(apiData.title || "video").replace(/[^\w\s\-]/g, '')}.mp4`;

        /* 🎬 2. اس کے فوراً بعد ویڈیو فائل علیحدہ سے جائے گی (تصویر والے میسج کو رپلائی کر کے) */
        await conn.sendMessage(from, {
            video: { url: apiData.download_url },
            mimetype: "video/mp4",
            fileName: cleanFileName,
            caption: `*╭ׂ┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*
*│* ✅ Download Complete!
*│* 🎬 ${apiData.title || "Video"}
*│* 👤 By: ${apiData.creator || "Unknown"}
*╰┄─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*`,
            upload: conn.waUploadToServer
        }, { quoted: sentInfo });

        await conn.sendMessage(from, { react: { text: "✅", key: m.key } });

    } catch (err) {
        console.error("XVIDEO ERROR:", err);
        conn.sendMessage(from, { text: 
`*╭ׂ┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*
*│* ❌ An error occurred while processing the video.
*│* ${err.message || 'Unknown error'}
*╰┄─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*` 
        }, { quoted: fakevCard });
        await conn.sendMessage(from, { react: { text: "❌", key: m.key } });
    }
});
