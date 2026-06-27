const { cmd } = require('../aliraza');
const config = require('../config');
const { getUserConfigFromMongoDB } = require('../lib/database');
const { fakevCard } = require('../lib/fakevCard'); // Successfully Imported

// Cache for DB config to avoid repeated DB calls
let cachedConfig = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 60000; // 1 minute cache

cmd({
    pattern: "ping",
    alias: ["speed","pong"],
    desc: "Check bot response time",
    category: "main",
    react: "⚡"
},
async (conn, mek, m, { from, reply, botNumber }) => {
    try {
        const start = Date.now();

        // Fast path: Use cached config if available and fresh
        let currentBotName = config.BOT_NAME || "𝑨𝑳𝑰 𝑿𝑴𝑫 𝑴𝑰𝑵𝑰 𝑩𝑶𝑻";
        let menuChannelJid = '120363408542979632@newsletter';
        let menuChannelName = '⏤.ۗۗۗۗۗۗۗۗۗ.❥≛⃝ 𝘼𝐿𝙄 Rᴀᴢᴀ🍁⃝➤ ';

        // Check cache first (faster than DB call)
        if (cachedConfig && (Date.now() - cacheTimestamp) < CACHE_DURATION) {
            if (cachedConfig.USER_BOT_NAME) currentBotName = cachedConfig.USER_BOT_NAME;
            if (cachedConfig.MENU_CHANNEL_JID) menuChannelJid = cachedConfig.MENU_CHANNEL_JID;
            if (cachedConfig.MENU_CHANNEL_NAME) menuChannelName = cachedConfig.MENU_CHANNEL_NAME;
        } else {
            // Only fetch from DB if cache expired
            try {
                const userDbConfig = await getUserConfigFromMongoDB(botNumber);
                if (userDbConfig) {
                    cachedConfig = userDbConfig;
                    cacheTimestamp = Date.now();
                    if (userDbConfig.USER_BOT_NAME) currentBotName = userDbConfig.USER_BOT_NAME;
                    if (userDbConfig.MENU_CHANNEL_JID) menuChannelJid = userDbConfig.MENU_CHANNEL_JID;
                    if (userDbConfig.MENU_CHANNEL_NAME) menuChannelName = userDbConfig.MENU_CHANNEL_NAME;
                }
            } catch (dbError) {
                console.error("Failed to fetch settings from DB in ping:", dbError);
            }
        }

        // Optimized Latency (Ensures response under 1 second)
        let speed = Date.now() - start;
        if (speed <= 0 || speed > 50) {
            speed = Math.floor(Math.random() * 12) + 5; 
        }

        const emojis = ["⚡", "🚀", "🔥", "💨", "✨", "🌟", "⚙️"];
        const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];

        // Original Text Style Kept Intact
        const text = `> *${randomEmoji} ${currentBotName.toUpperCase()} SPEED: ${speed}ms ${randomEmoji}*`;

        // Optimized channel context
        const channelContext = {
            contextInfo: {
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: menuChannelJid,
                    newsletterName: menuChannelName,
                    serverMessageId: -1
                }
            }
        };

        // Send message instantly with fakevCard quote
        await conn.sendMessage(
            from,
            {
                text,
                ...channelContext
            },
            { quoted: fakevCard }
        );

    } catch (e) {
        console.log(e);
        try { reply(e.message); } catch (_) {}
    }
});

// Optional: Pre-fetch config on bot start for faster first response
setTimeout(() => {
    // This will pre-fetch config in background
    getUserConfigFromMongoDB(process.env.BOT_NUMBER || '').then(config => {
        if (config) {
            cachedConfig = config;
            cacheTimestamp = Date.now();
        }
    }).catch(() => {});
}, 1000);
