const axios = require('axios');
const yts = require('yt-search');
const fs = require('fs');
const path = require('path');
const { cmd } = require('../aliraza');
const config = require('../config');
const { getUserConfigFromMongoDB } = require('../lib/database');
const { fakevCard } = require('../lib/fakevCard');
const { toAudio } = require('../lib/converter');

cmd({
    pattern: "song",
    alias: ["ytmp3", "play", "mp3", "gana", "music", "audio"],
    react: "🎵",
    desc: "YouTube search & MP3 play with custom super fast Railway API",
    category: "download",
    use: ".play <song name>",
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
*│* 📝 Ex: .song let me love you
*╰┄─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*`;
            return conn.sendMessage(from, { text: noQueryLayout }, { quoted: fakevCard });
        }

        await conn.sendMessage(from, { react: { text: "⏳", key: m.key } });

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
        const search = await yts(query);
        if (!search.videos || !search.videos.length) {
            return conn.sendMessage(from, { text: 
`*╭ׂ┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*
*│* ❌ No results found for your query!
*╰┄─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*` 
            }, { quoted: fakevCard });
        }

        const video = search.videos[0];
        
        // 🚀 آپ کی اپنی لائیو ریلوے API سے آڈیو ڈیٹا فیچ کرنا
        const apiUrl = `https://songmp3api-production.up.railway.app/api/ytmp3?url=${encodeURIComponent(video.url)}`;
        const apiRes = await axios.get(apiUrl, { timeout: 45000 });
        
        if (!apiRes.data || !apiRes.data.success || !apiRes.data.downloadURL) {
            throw new Error("Custom Railway API failed to fetch download URL");
        }

        const audioUrl = apiRes.data.downloadURL;
        const songTitle = apiRes.data.title || video.title;

        // ڈائریکٹ آڈیو بفر ڈاؤن لوڈ کرنا
        const audioResponse = await axios.get(audioUrl, {
            responseType: 'arraybuffer',
            timeout: 60000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        
        let audioBuffer = Buffer.from(audioResponse.data);
        if (!audioBuffer || audioBuffer.length === 0) {
            throw new Error("Downloaded buffer is empty");
        }

        // فائل فارمیٹ چیک اور کنورژن (اگر ضرورت ہو)
        const firstBytes = audioBuffer.slice(0, 12);
        const hexSignature = firstBytes.toString('hex');
        const asciiSignature = firstBytes.toString('ascii', 4, 8);

        let fileExtension = 'mp3';
        if (asciiSignature === 'ftyp' || hexSignature.startsWith('000000')) {
            if (audioBuffer.slice(4, 8).toString('ascii') === 'ftyp') fileExtension = 'm4a';
        } else if (audioBuffer.toString('ascii', 0, 4) === 'OggS') {
            fileExtension = 'ogg';
        } else if (audioBuffer.toString('ascii', 0, 4) === 'RIFF') {
            fileExtension = 'wav';
        }

        let finalBuffer = audioBuffer;
        if (fileExtension !== 'mp3') {
            try {
                finalBuffer = await toAudio(audioBuffer, fileExtension);
            } catch (convErr) {
                console.error("Conversion failed, using original buffer:", convErr.message);
            }
        }

        const cleanFileName = `${songTitle.replace(/[^\w\s\-]/g, '')}.mp3`;

        const audioCaption = `*╭ׂ┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*
*│ ╌─̇─̣⊰🎵 𝐌𝐔𝐒𝐈𝐂 𝐃𝐎𝐖𝐍𝐋𝐎𝐀𝐃𝐄 ⊱┈─̇─̣╌*
*│─̇─̣┄┄┄┄┄┄┄┄┄┄┄┄┄─̇─̣*
*│* 🎵 Title: ${songTitle}
*│* ⏱️ Duration: ${video.timestamp || "Unknown"}
*│* 👥 Requested By: @${sender.split("@")[0]}
*│* 🤖 Bot: ${currentBotName}
*╰┄─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*

> _${globalBotFooter}_ 🔰`;

        // 1. گانے کا تھمب نیل ڈائریکٹ کمانڈ لگانے والے یوزر کو رپلائی کر کے جائے گا
        const sentInfo = await conn.sendMessage(from, {
            image: { url: video.thumbnail },
            caption: audioCaption,
            mentions: [sender]
        }, { quoted: m }); 

        // 2. اس کے فوراً بعد گانا آڈیو میں جائے گا (تھمب نیل کو رپلائی کر کے)
        await conn.sendMessage(from, {
            audio: finalBuffer,
            mimetype: 'audio/mpeg',
            fileName: cleanFileName,
            ptt: false
        }, { quoted: sentInfo }); 

        await conn.sendMessage(from, { react: { text: "✅", key: m.key } });

        // عارضی فائلوں کی صفائی
        try {
            const tempDir = path.join(__dirname, '../temp');
            if (fs.existsSync(tempDir)) {
                const files = fs.readdirSync(tempDir);
                const now = Date.now();
                files.forEach(file => {
                    const filePath = path.join(tempDir, file);
                    try {
                        const stats = fs.statSync(filePath);
                        if (now - stats.mtimeMs > 10000) {
                            if (file.endsWith('.mp3') || file.endsWith('.m4a') || /^\d+\.(mp3|m4a)$/.test(file)) {
                                fs.unlinkSync(filePath);
                            }
                        }
                    } catch (e) {}
                });
            }
        } catch (cleanupErr) {}

    } catch (err) {
        console.error("PLAY ERROR:", err);
        conn.sendMessage(from, { text: 
`*╭ׂ┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*
*│* ❌ An error occurred or Custom Railway API failed!
*╰┄─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*` 
        }, { quoted: m });
        await conn.sendMessage(from, { react: { text: "❌", key: m.key } });
    }
});
