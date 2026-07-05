const axios = require('axios');
const yts = require('yt-search');
const fs = require('fs');
const path = require('path');
const { cmd } = require('../aliraza');
const config = require('../config');
const { getUserConfigFromMongoDB } = require('../lib/database');
const { fakevCard } = require('../lib/fakevCard');
const { toAudio } = require('../lib/converter'); // پاتھ یقینی بنائیں کہ درست ہے

const AXIOS_DEFAULTS = {
	timeout: 60000,
	headers: {
		'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
		'Accept': 'application/json, text/plain, */*'
	}
};

async function tryRequest(getter, attempts = 3) {
	let lastError;
	for (let attempt = 1; attempt <= attempts; attempt++) {
		try {
			return await getter();
		} catch (err) {
			lastError = err;
			if (attempt < attempts) {
				await new Promise(r => setTimeout(r, 1000 * attempt));
			}
		}
	}
	throw lastError;
}

// APIs Chain Functions
async function getEliteProTechDownloadByUrl(youtubeUrl) {
	const apiUrl = `https://eliteprotech-apis.zone.id/ytdown?url=${encodeURIComponent(youtubeUrl)}&format=mp3`;
	const res = await tryRequest(() => axios.get(apiUrl, AXIOS_DEFAULTS));
	if (res?.data?.success && res?.data?.downloadURL) {
		return { download: res.data.downloadURL, title: res.data.title };
	}
	throw new Error('EliteProTech ytdown returned no download');
}

async function getYupraDownloadByUrl(youtubeUrl) {
	const apiUrl = `https://api.yupra.my.id/api/downloader/ytmp3?url=${encodeURIComponent(youtubeUrl)}`;
	const res = await tryRequest(() => axios.get(apiUrl, AXIOS_DEFAULTS));
	if (res?.data?.success && res?.data?.data?.download_url) {
		return { download: res.data.data.download_url, title: res.data.data.title };
	}
	throw new Error('Yupra returned no download');
}

async function getOkatsuDownloadByUrl(youtubeUrl) {
	const apiUrl = `https://okatsu-rolezapiiz.vercel.app/downloader/ytmp3?url=${encodeURIComponent(youtubeUrl)}`;
	const res = await tryRequest(() => axios.get(apiUrl, AXIOS_DEFAULTS));
	if (res?.data?.dl) {
		return { download: res.data.dl, title: res.data.title };
	}
	throw new Error('Okatsu ytmp3 returned no download');
}

cmd({
    pattern: "song",
    alias: ["ytmp3", "play", "mp3", "gana", "music", "audio"],
    react: "🎵",
    desc: "YouTube search & MP3 play with multi-API fallback chain",
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

        // Fetch user configs from DB
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

        // Search YouTube
        const search = await yts(query);
        if (!search.videos || !search.videos.length) {
            return conn.sendMessage(from, { text: 
`*╭ׂ┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*
*│* ❌ No results found for your query!
*╰┄─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*` 
            }, { quoted: fakevCard });
        }

        const video = search.videos[0];
        
        // Custom Caption Design
        const audioCaption = `*╭ׂ┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*
*│ ╌─̇─̣⊰🎵 𝐌𝐔𝐒𝐈𝐂 𝐃𝐎𝐖𝐍𝐋𝐎𝐀𝐃𝐄 ⊱┈─̇─̣╌*
*│─̇─̣┄┄┄┄┄┄┄┄┄┄┄┄┄─̇─̣*
*│* 🎵 Title: ${video.title}
*│* ⏱️ Duration: ${video.timestamp || "Unknown"}
*│* 👥 Requested By: @${sender.split("@")[0]}
*│* 🤖 Bot: ${currentBotName}
*╰┄─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*

> _${globalBotFooter}_ 🔰`;

        // Send Thumbnail & Info first
        const sentInfo = await conn.sendMessage(from, {
            image: { url: video.thumbnail },
            caption: audioCaption,
            mentions: [sender]
        }, { quoted: fakevCard });

        // Mult-API Download Logic
		let audioData;
		let audioBuffer;
		let downloadSuccess = false;
		
		const apiMethods = [
			{ name: 'EliteProTech', method: () => getEliteProTechDownloadByUrl(video.url) },
			{ name: 'Yupra', method: () => getYupraDownloadByUrl(video.url) },
			{ name: 'Okatsu', method: () => getOkatsuDownloadByUrl(video.url) }
		];
		
		for (const apiMethod of apiMethods) {
			try {
				audioData = await apiMethod.method();
				const audioUrl = audioData.download;
				
				if (!audioUrl) continue;
				
				try {
					const audioResponse = await axios.get(audioUrl, {
						responseType: 'arraybuffer',
						timeout: 90000,
						maxContentLength: Infinity,
						maxBodyLength: Infinity,
						decompress: true,
						validateStatus: s => s >= 200 && s < 400,
						headers: AXIOS_DEFAULTS.headers
					});
					audioBuffer = Buffer.from(audioResponse.data);
					if (audioBuffer && audioBuffer.length > 0) {
						downloadSuccess = true;
						break;
					}
				} catch (downloadErr) {
					if (downloadErr.response?.status === 451) continue;
					
					// Stream fallback
					try {
						const audioResponse = await axios.get(audioUrl, {
							responseType: 'stream',
							timeout: 90000,
							maxContentLength: Infinity,
							maxBodyLength: Infinity,
							validateStatus: s => s >= 200 && s < 400,
							headers: AXIOS_DEFAULTS.headers
						});
						const chunks = [];
						await new Promise((resolve, reject) => {
							audioResponse.data.on('data', c => chunks.push(c));
							audioResponse.data.on('end', resolve);
							audioResponse.data.on('error', reject);
						});
						audioBuffer = Buffer.concat(chunks);
						if (audioBuffer && audioBuffer.length > 0) {
							downloadSuccess = true;
							break;
						}
					} catch (streamErr) {
						continue;
					}
				}
			} catch (apiErr) {
				continue;
			}
		}
		
		if (!downloadSuccess || !audioBuffer) {
			throw new Error('All download sources failed.');
		}

		// Detect actual file format
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

		// Convert to MP3 if needed
		let finalBuffer = audioBuffer;
		if (fileExtension !== 'mp3') {
			try {
				finalBuffer = await toAudio(audioBuffer, fileExtension);
			} catch (convErr) {
				console.error("Conversion failed, sending raw original buffer:", convErr.message);
			}
		}

		const cleanFileName = `${(audioData?.title || video.title || 'song').replace(/[^\w\s\-]/g, '')}.mp3`;

		// Send Audio as reply to the thumbnail message
		await conn.sendMessage(from, {
			audio: finalBuffer,
			mimetype: 'audio/mpeg',
			fileName: cleanFileName,
			ptt: false
		}, { quoted: sentInfo });

		await conn.sendMessage(from, { react: { text: "✅", key: m.key } });

		// Fast Temp Cleanup
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
*│* ❌ An error occurred or all download APIs failed!
*╰┄─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*` 
        }, { quoted: fakevCard });
        await conn.sendMessage(from, { react: { text: "❌", key: m.key } });
    }
});
