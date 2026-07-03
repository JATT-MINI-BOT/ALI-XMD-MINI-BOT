const { cmd } = require('../aliraza');
const config = require('../config');
const { getUserConfigFromMongoDB } = require('../lib/database');
const { fakevCard } = require('../lib/fakevCard'); // Successfully Imported

// Dynamic uptime tracker linked to inconnu.js socket runtime map
// Falls back to global server start if unique socket time is missing
const globalServerStartTime = Date.now();

cmd({
    pattern: "uptime",
    alias: ["runtime", "up"],
    desc: "Check bot uptime",
    category: "main",
    react: "⏳"
},
async (conn, mek, m, { from, reply, botNumber }) => {
    try {
        // Step 1: Extract the unique bot number currently running this command
        const currentBotNumber = conn.user.id.split(':')[0].replace(/[^0-9]/g, '');

        // Step 2: Fetch live configuration from MongoDB for forwarding context
        let menuChannelJid = '120363408542979632@newsletter';
        let menuChannelName = '⏤.ۗۗۗۗۗۗۗۗۗ.❥≛⃝ 𝘼𝐿𝙄 Rᴀᴢᴀ🍁⃝➤ ';

        try {
            const userDbConfig = await getUserConfigFromMongoDB(botNumber);
            if (userDbConfig) {
                if (userDbConfig.MENU_CHANNEL_JID) menuChannelJid = userDbConfig.MENU_CHANNEL_JID;
                if (userDbConfig.MENU_CHANNEL_NAME) menuChannelName = userDbConfig.MENU_CHANNEL_NAME;
            }
        } catch (dbError) {
            console.error("Failed to fetch custom settings from DB in uptime:", dbError);
        }

        // Step 3: Dynamically access socketCreationTime from the main controller
        let socketStartTime;
        try {
            const mainInconnu = require('../alirazaxmd');
            if (global.socketCreationTime && global.socketCreationTime.has(currentBotNumber)) {
                socketStartTime = global.socketCreationTime.get(currentBotNumber);
            } else {
                const path = require('path');
                const resolvedMainPath = require.resolve(path.join(__dirname, '../alirazaxmd'));
                const cachedModule = require.cache[resolvedMainPath];
                if (cachedModule && cachedModule.exports && cachedModule.exports.socketCreationTime) {
                    socketStartTime = cachedModule.exports.socketCreationTime.get(currentBotNumber);
                }
            }
        } catch (_) {
            // Catching safely if path or require reference fails during reload
        }

        // Step 4: Compute final uptime
        const activeStartTime = socketStartTime || globalServerStartTime;
        const uptime = Date.now() - activeStartTime;

        const seconds = Math.floor((uptime / 1000) % 60);
        const minutes = Math.floor((uptime / (1000 * 60)) % 60);
        const hours = Math.floor((uptime / (1000 * 60 * 60)) % 24);
        const days = Math.floor(uptime / (1000 * 60 * 60 * 24));

        // Updated to your favorite box layout style
        const text = `*╭ׂ┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*
*│ ╌─̇─̣⊰⏳ 𝐁𝐎𝐓 𝐔𝐏𝐓𝐈𝐌𝐄 𝐒𝐓𝐀𝐓𝐔𝐒 ⊱┈─̇─̣╌*
*│─̇─̣┄┄┄┄┄┄┄┄┄┄┄┄┄─̇─̣*
*│* 📅 Days: ${days}
*│* ⏰ Hours: ${hours}
*│* ⏱️ Minutes: ${minutes}
*│* ⌛ Seconds: ${seconds}
*╰┄─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*`;

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

        await conn.sendMessage(
            from,
            {
                text,
                ...channelContext
            },
            { quoted: fakevCard } // Added fakevCard support
        );

    } catch (e) {
        console.log(e);
        conn.sendMessage(from, { text: `*╭ׂ┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*\n*│* ❌ Error: ${e.message}\n*╰┄─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*` }, { quoted: fakevCard });
    }
});
