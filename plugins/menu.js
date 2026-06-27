const { cmd, commands } = require('../aliraza');
const config = require('../config');
const { getUserConfigFromMongoDB } = require('../lib/database');
const { fakevCard } = require('../lib/fakevCard'); // Successfully Imported
const moment = require("moment-timezone"); // Successfully Imported
const fs = require('fs');

// Global cache to keep DB data in memory for instant speed
const dbCache = new Map();

// 🎨 Multi-Color Fancy Borders Array (Automatic Color Shifting)
const menuThemes = [
    { name: "𝖦𝗈𝗅𝖽𝖾𝗇 𝖫𝗎𝗑𝗎𝗋𝗒", open: "╭═══ 🍁 𓆩$NAME𓆪 🍁 ═══⊷", line: "┃💫│", close: "╰═════════════════⊷" },
    { name: "𝖱𝗈𝗒𝖺𝗅 𝖡𝗅𝗎𝖾", open: "╭═══ 💙 𓆩$NAME𓆪 💙 ═══⊷", line: "┃💐│", close: "╰═════════════════⊷" },
    { name: "𝖭 neon 𝖦𝗋𝖾𝖾𝗇", open: "╭═══ 💚 𓆩$NAME𓆪 💚 ═══⊷", line: "┃🌷│", close: "╰═════════════════⊷" },
    { name: "𝖱𝖾𝖽 𝖥𝗂𝗋𝖾", open: "╭═══ ❤️ 𓆩$NAME𓆪 ❤️ ═══⊷", line: "┃💖│", close: "╰═════════════════⊷" },
    { name: "𝖯𝗎𝗋𝗉𝗅𝖾 𝖬𝖺𝗀𝗂𝗊𝗎𝖾", open: "╭═══ 💜 𓆩$NAME𓆪 💜 ═══⊷", line: "┃💞│", close: "╰═════════════════⊷" },
    { name: "𝖯𝗂𝗇𝗄𝗒 𝖢𝗎𝗍𝖾", open: "╭═══ 🌸 𓆩$NAME𓆪 🌸 ═══⊷", line: "┃🎀│", close: "╰═════════════════⊷" }
];

// Index to track active theme cycle
let currentThemeIndex = 0;

// Function to calculate uptime/runtime
function runtime(seconds) {
    seconds = Number(seconds);
    var d = Math.floor(seconds / (3600 * 24));
    var h = Math.floor(seconds % (3600 * 24) / 3600);
    var m = Math.floor(seconds % 3600 / 60);
    var s = Math.floor(seconds % 60);
    
    var dDisplay = d > 0 ? d + "d " : "";
    var hDisplay = h > 0 ? h + "h " : "";
    var mDisplay = m > 0 ? m + "m " : "";
    var sDisplay = s > 0 ? s + "s" : "";
    return dDisplay + hDisplay + mDisplay + sDisplay;
}

// Function to convert command name to Small Caps text
const toSmallCaps = (text) => {
    const normal = "abcdefghijklmnopqrstuvwxyz";
    const smallCaps = "ᴀʙᴄᴅᴇғɢʜɪᴊᴋʟᴍɴᴏᴘǫʀsᴛᴜᴠᴡxʏᴢ";
    return text.split('').map(char => {
        const index = normal.indexOf(char.toLowerCase());
        return index !== -1 ? smallCaps[index] : char;
    }).join('');
};

// Function to group commands by category
function getCommandsByCategory() {
    const categories = {};
    commands.forEach(cmd => {
        const category = cmd.category || "general";
        if (!categories[category]) {
            categories[category] = [];
        }
        const cmdName = Array.isArray(cmd.pattern) ? cmd.pattern[0] : cmd.pattern;
        if (cmdName) categories[category].push(cmdName);
    });
    return categories;
}

// Function to generate dynamic menu text with color shifting layout
function generateMenu(currentBotName, currentPrefix, activeUptime, currentMode, totalCommands, time, date, theme) {
    const categories = getCommandsByCategory();
    const headerOpen = theme.open.replace("$NAME", currentBotName.toUpperCase());
    
    // 🎨 Build Header using dynamically picked style
    let menuText = `*${headerOpen}*\n`;
    menuText += `*┃❃╭──────────────*\n`;
    menuText += `*${theme.line} ⏰ ᴛɪᴍᴇ: ${time}*\n`;
    menuText += `*${theme.line} 📅 ᴅᴀᴛᴇ: ${date}*\n`;
    menuText += `*${theme.line} ⚙️ ᴘʀᴇғɪx: 『${currentPrefix}』*\n`;
    menuText += `*${theme.line} 🔌 ᴍᴏᴅᴇ: ${currentMode.toUpperCase()}*\n`;
    menuText += `*${theme.line} ⏱️ ʀᴜɴᴛɪᴍᴇ: ${activeUptime}*\n`;
    menuText += `*${theme.line} 📦 ᴛᴏᴛᴀʟ: ${totalCommands} ᴄᴏᴍᴍᴀɴᴅs*\n`;
    menuText += `*┃❃╰───────────────*\n`;
    menuText += `*${theme.close}*\n\n`;

    // Category Emojis & Fancy Headers Mapping
    const categoryMapping = {
        "main": { emoji: "💠", title: "𝐌𝐚𝐢𝐧" },
        "system": { emoji: "🔧", title: "𝐒𝐲𝐬𝐭𝐞𝐦" },
        "settings": { emoji: "⚙️", title: "𝐒𝐞𝐭𝐭𝐢𝐧𝐠𝐬" },
        "owner": { emoji: "👑", title: "𝐎𝐰𝐧𝐞𝐫" },
        "group": { emoji: "👥", title: "𝐆𝐫𝐨𝐮𝐩" },
        "admin": { emoji: "🛡️", title: "𝐀𝐝𝐦𝐢𝐧" },
        "download": { emoji: "📥", title: "𝐃𝐨𝐰𝐧𝐥𝐨𝐚𝐝" },
        "downloader": { emoji: "📥", title: "𝐃𝐨𝐰𝐧𝐥𝐨𝐚𝐝𝐞𝐫" },
        "sticker": { emoji: "🎨", title: "𝐒𝐭𝐢𝐜𝐤𝐞𝐫" },
        "fun": { emoji: "🎮", title: "𝐅𝐮𝐧" },
        "general": { emoji: "📌", title: "𝐆𝐞𝐧𝐞𝐫𝐚𝐥" },
        "tools": { emoji: "🔧", title: "𝐓𝐨𝐨𝐥𝐬" },
        "search": { emoji: "🔍", title: "𝐒𝐞𝐚𝐫𝐜𝐡" }
    };

    const sortedCategories = Object.keys(categories).sort();

    // Build Categories & Commands List
    for (const cat of sortedCategories) {
        const catKey = cat.toLowerCase();
        const emoji = categoryMapping[catKey]?.emoji || "✨";
        const fancyTitle = categoryMapping[catKey]?.title || cat.charAt(0).toUpperCase() + cat.slice(1);

        menuText += `*╭─❏ ${emoji} ${fancyTitle} ${emoji} ❏*\n`;
        
        const sortedCmds = categories[cat].sort();
        for (const c of sortedCmds) {
            const smallCapsCmd = toSmallCaps(c);
            menuText += `*│ ${smallCapsCmd}*\n`;
        }
        menuText += `*╰─────────────────*\n\n`;
    }

    return menuText;
}

cmd({
    pattern: "menu",
    alias: ["help", "commands"],
    desc: "Show bot menu",
    category: "main",
    react: "📋"
},
async (conn, mek, m, { from, reply, botNumber }) => {
    try {
        await conn.sendMessage(from, {
            react: { text: "📋", key: m.key }
        });

        let currentMode = config.WORK_TYPE || "public";
        let currentPrefix = config.PREFIX || ".";
        let currentBotName = config.BOT_NAME || "✨𝑨𝑳𝑰 𝑿𝑴𝑫 𝑴𝑰𝑵𝑰 𝑩𝑶𝑻✨";
        let globalBotFooter = config.BOT_FOOTER || "©ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴀʟɪ ʀᴀᴢᴀ";
        let currentMenuImage = 'https://i.ibb.co/4nV5ZHY1/file-00000000bd187209b3a2c923cb318f26.png';
        let menuChannelJid = '120363408542979632@newsletter';
        let menuChannelName = '⏤.ۗۗۗۗۗۗۗۗۗ.❥≛⃝ 𝘼𝐿𝐼 Rᴀᴢᴀ🍁⃝➤';

        // Fetch Date & Time dynamically
        const time = moment().tz("Asia/Karachi").format("hh:mm:ss A");
        const date = moment().tz("Asia/Karachi").format("dddd, DD MMMM YYYY");

        // ⚡ SPEED FIX: Use Cached configuration to save MongoDB roundtrips
        if (dbCache.has(botNumber)) {
            const cachedConfig = dbCache.get(botNumber);
            if (cachedConfig.WORK_TYPE) currentMode = cachedConfig.WORK_TYPE;
            if (cachedConfig.PREFIX) currentPrefix = cachedConfig.PREFIX;
            if (cachedConfig.USER_BOT_NAME) currentBotName = cachedConfig.USER_BOT_NAME;
            if (cachedConfig.USER_BOT_FOOTER) globalBotFooter = cachedConfig.USER_BOT_FOOTER;
            if (cachedConfig.USER_IMAGE_PATH) currentMenuImage = cachedConfig.USER_IMAGE_PATH;
            if (cachedConfig.MENU_CHANNEL_JID) menuChannelJid = cachedConfig.MENU_CHANNEL_JID;
            if (cachedConfig.MENU_CHANNEL_NAME) menuChannelName = cachedConfig.MENU_CHANNEL_NAME;
            
            // Asynchronously refresh cache in background so next calls are up to date without delaying current response
            getUserConfigFromMongoDB(botNumber).then(freshConfig => {
                if (freshConfig) dbCache.set(botNumber, freshConfig);
            }).catch(() => {});
        } else {
            // First time load from DB and populate cache
            try {
                const userDbConfig = await getUserConfigFromMongoDB(botNumber);
                if (userDbConfig) {
                    dbCache.set(botNumber, userDbConfig);
                    if (userDbConfig.WORK_TYPE) currentMode = userDbConfig.WORK_TYPE;
                    if (userDbConfig.PREFIX) currentPrefix = userDbConfig.PREFIX;
                    if (userDbConfig.USER_BOT_NAME) currentBotName = userDbConfig.USER_BOT_NAME;
                    if (userDbConfig.USER_BOT_FOOTER) globalBotFooter = userDbConfig.USER_BOT_FOOTER;
                    if (userDbConfig.USER_IMAGE_PATH) currentMenuImage = userDbConfig.USER_IMAGE_PATH;
                    if (userDbConfig.MENU_CHANNEL_JID) menuChannelJid = userDbConfig.MENU_CHANNEL_JID;
                    if (userDbConfig.MENU_CHANNEL_NAME) menuChannelName = userDbConfig.MENU_CHANNEL_NAME;
                }
            } catch (dbError) {
                console.error("Failed to fetch custom settings from DB in menu:", dbError);
            }
        }

        const sanitizedNumber = botNumber.replace(/[^0-9]/g, '');
        const userSocket = global.activeSockets?.get(sanitizedNumber) || conn;

        // Calculate dynamic runtime
        let activeUptime = "0s";
        if (global.socketCreationTime && global.socketCreationTime.has(botNumber)) {
            const connectTimestamp = global.socketCreationTime.get(botNumber);
            const uptimeSeconds = Math.floor((Date.now() - connectTimestamp) / 1000);
            activeUptime = runtime(uptimeSeconds);
        } else {
            activeUptime = runtime(process.uptime());
        }

        // 🎨 COLOR CHANGING LOGIC: Pick current theme and advance pointer
        const selectedTheme = menuThemes[currentThemeIndex];
        currentThemeIndex = (currentThemeIndex + 1) % menuThemes.length;

        // Generate full menu text with active theme style
        let menu = generateMenu(currentBotName, currentPrefix, activeUptime, currentMode, commands.length, time, date, selectedTheme);
        
        // Append Footer
        menu += `*> ${globalBotFooter}*`;

        const channelContext = {
            contextInfo: {
                forwardingScore: 999,
                isForwarded: true,
                mentionedJid: [m.sender],
                forwardedNewsletterMessageInfo: {
                    newsletterJid: menuChannelJid, 
                    newsletterName: menuChannelName, 
                    serverMessageId: 2
                }
            }
        };

        // Handle Image sending (Online URL vs Local File) with fakevCard quote
        if (currentMenuImage.startsWith('http://') || currentMenuImage.startsWith('https://')) {
            await userSocket.sendMessage(from, {
                image: { url: currentMenuImage },
                caption: menu,
                ...channelContext
            }, { quoted: fakevCard });
        } else {
            const finalPath = fs.existsSync(currentMenuImage) 
                ? currentMenuImage 
                : fs.existsSync('./media/menu.png') ? './media/menu.png' : null;

            if (finalPath) {
                await userSocket.sendMessage(from, {
                    image: fs.readFileSync(finalPath),
                    caption: menu,
                    ...channelContext 
                }, { quoted: fakevCard });
            } else {
                await userSocket.sendMessage(from, {
                    text: menu,
                    ...channelContext 
                }, { quoted: fakevCard });
            }
        }

        await conn.sendMessage(from, {
            react: { text: "✅", key: m.key }
        });

    } catch (e) {
        console.log(e);
        await conn.sendMessage(from, {
            react: { text: "❌", key: m.key }
        });
        reply(`Error: ${e.message}`);
    }
});
