const { cmd } = require('../aliraza');
const config = require('../config');
const { getUserConfigFromMongoDB } = require('../lib/database');
const { fakevCard } = require('../lib/fakevCard'); // Successfully Imported
const fs = require('fs');
const os = require('os');

// Function to calculate uptime/runtime dynamically
function runtime(seconds) {
    seconds = Number(seconds);
    var d = Math.floor(seconds / (3600 * 24));
    var h = Math.floor(seconds % (3600 * 24) / 3600);
    var m = Math.floor(seconds % 3600 / 60);
    var s = Math.floor(seconds % 60);
    
    var dDisplay = d > 0 ? d + " days, " : "0 days, ";
    var hDisplay = h > 0 ? h + (h == 1 ? " hour, " : " hours, ") : "0 hours, ";
    var mDisplay = m > 0 ? m + (m == 1 ? " minute, " : " minutes, ") : "0 minutes, ";
    var sDisplay = s > 0 ? s + (s == 1 ? " second" : " seconds") : "0 seconds";
    return dDisplay + hDisplay + mDisplay + sDisplay;
}

cmd({
    pattern: "alive",
    alias: ["status"],
    desc: "Check bot status",
    category: "general",
    react: "🤖"
},
async (conn, mek, m, { from, reply, botNumber }) => {
    try {
        // 1. Fetch live user configs from MongoDB (Default Fallbacks)
        let currentBotName = config.BOT_NAME || "✨𝑨𝑳𝑰 𝑿𝑴𝑫 𝑴𝑰𝑵𝑰 𝑩𝑶𝑻✨";
        let globalBotFooter = config.BOT_FOOTER || '©ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴀʟɪ ʀᴀᴢᴀ';
        let currentMenuImage = './media/alive.jpg'; // Local fallback path

        try {
            const userDbConfig = await getUserConfigFromMongoDB(botNumber);
            if (userDbConfig) {
                if (userDbConfig.USER_BOT_NAME) currentBotName = userDbConfig.USER_BOT_NAME;
                if (userDbConfig.USER_BOT_FOOTER) globalBotFooter = userDbConfig.USER_BOT_FOOTER;
                if (userDbConfig.USER_IMAGE_PATH) currentMenuImage = userDbConfig.USER_IMAGE_PATH; // Synced with .setbotpic
            }
        } catch (dbError) {
            console.error("Failed to fetch custom settings from DB in alive:", dbError);
        }

        // 2. Dynamic Memory/RAM Calculation (Logic Changed to Priority)
        const totalRAM = (os.totalmem() / (1024 * 1024 * 1024)).toFixed(1); // GB
        const usedRAM = ((os.totalmem() - os.freemem()) / (1024 * 1024)).toFixed(1); // MB

        // 3. Live Uptime calculation matching panel core clock
        let activeUptime = "0 days, 0 hours, 0 minutes, 0 seconds";
        if (global.socketCreationTime && global.socketCreationTime.has(botNumber)) {
            const connectTimestamp = global.socketCreationTime.get(botNumber);
            const uptimeSeconds = Math.floor((Date.now() - connectTimestamp) / 1000);
            activeUptime = runtime(uptimeSeconds);
        } else {
            activeUptime = runtime(process.uptime());
        }

        // 4. Custom Sidebar Re-Ordered Interface (Bot Name -> Memory -> Uptime)
        const caption = `✦─────『 *STATUS PANEL* 』─────✦

✨ [🤖] *Bot Identity:* ${currentBotName}
💾 [📊] *Memory Allocation:* ${usedRAM}MB / ${totalRAM}GB
🤖 [⏱️] *Active Uptime Run:* ${activeUptime}

✦───────────────────────────✦
📢 *${globalBotFooter.toUpperCase()}*`;

        // 5. Message Sending Context supporting URL & Local File fallback with fakevCard
        if (currentMenuImage.startsWith('http://') || currentMenuImage.startsWith('https://')) {
            await conn.sendMessage(from, {
                image: { url: currentMenuImage },
                caption: caption
            }, { quoted: fakevCard });
        } else {
            const finalPath = fs.existsSync(currentMenuImage) 
                ? currentMenuImage 
                : fs.existsSync('./media/alive.png') ? './media/alive.png' : null;

            if (finalPath) {
                await conn.sendMessage(from, {
                    image: fs.readFileSync(finalPath),
                    caption: caption
                }, { quoted: fakevCard });
            } else {
                await conn.sendMessage(from, {
                    text: caption
                }, { quoted: fakevCard });
            }
        }

    } catch (e) {
        console.log("ALIVE CMD ERROR:", e);
        conn.sendMessage(from, { text: `Error: ${e.message}` }, { quoted: fakevCard });
    }
});
