const { cmd, commands } = require('../aliraza');
const config = require('../config');
const { getUserConfigFromMongoDB } = require('../lib/database');
const { fakevCard } = require('../lib/fakevCard'); // Successfully Imported
const moment = require("moment-timezone"); // Successfully Imported
const fs = require('fs');

// Global cache to keep DB data in memory for instant speed
const dbCache = new Map();

// 🎨 Ultra-Premium Minimalist Cyber Themes
const menuThemes = [
    { name: "𝖦blden 𝖫𝗎𝗑𝗎𝗋𝗒", open: "✨ ─── ❖ [ 🗃️ MAIN_CORE // $NAME ] ❖ ───", line: "│ ⚡ ›", close: "────────────────────────────────────" },
    { name: "𝖱𝗈𝗒𝖺𝗅 𝖡𝗅𝗎𝖾", open: "🔷 ─── ❖ [ 📡 NETWORK // $NAME ] ❖ ───", line: "│ 🌐 ›", close: "────────────────────────────────────" },
    { name: "𝖭𝖾bnd 𝖦𝗋𝖾𝖾𝗇", open: "📟 ─── ❖ [ 🟢 ACCESS_SYS // $NAME ] ❖ ───", line: "│ 📟 ›", close: "────────────────────────────────────" },
    { name: "𝖱𝖾𝖽 𝖥𝗂𝗋𝖾", open: "🔥 ─── ❖ [ 🔴 HOST_MAIN // $NAME ] ❖ ───", line: "│ 💥 ›", close: "────────────────────────────────────" },
    { name: "𝖯𝗎𝗋𝗉𝗅𝖾 𝖬𝖺𝗀𝗂𝗊𝗎𝖾", open: "🔮 ─── ❖ [ 🟣 CYPHER_NET // $NAME ] ❖ ───", line: "│ 🔮 ›", close: "────────────────────────────────────" },
    { name: "𝖯𝗂𝗇keeper 𝖢𝗎𝖾", open: "🎀 ─── ❖ [ 🌸 DATA_LINK // $NAME ] ❖ ───", line: "│ 🎀 ›", close: "────────────────────────────────────" }
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
function generateMenu(currentBotName, currentPrefix, activeUptime, currentMode, totalCommands, theme) {
    const categories = getCommandsByCategory();
    const headerOpen = theme.open.replace("$NAME", currentBotName.toUpperCase());
    
    // 🎨 Build Header (Clean Premium Data Grid)
    let menuText = `*${headerOpen}*\n`;
    menuText += `*${theme.line} PREFIX  : 『 ${currentPrefix} 』*\n`;
    menuText += `*${theme.line} SECURITY: ${currentMode.toUpperCase()}*\n`;
    menuText += `*${theme.line} UPTIME  : ${activeUptime}*\n`;
    menuText += `*${theme.line} PACKETS : ${totalCommands} CMDS*\n`;
    menuText += `*─ ❖ ${theme.close}*\n\n`;

    // Next-Gen Premium Bold Headers
    const categoryMapping = {
        "main": { emoji: "🛰️", title: "𝗠𝗔𝗜𝗡_𝗦𝗬𝗦𝗧𝗘𝗠" },
        "system": { emoji: "⚙️", title: "𝗖𝗢𝗥𝗘_𝗞𝗘𝗥𝗡𝗘𝗟" },
        "settings": { emoji: "🛠️", title: "𝗦𝗘𝗧𝗧𝗜𝗡𝗚_𝗜𝗡𝗜" },
        "owner": { emoji: "👑", title: "𝗢𝗪𝗡𝗘𝗥_𝗔𝗖𝗖𝗘𝗦𝗦" },
        "group": { emoji: "👥", title: "𝗡𝗘𝗧_𝗖𝗟𝗨𝗦𝗧𝗘𝗥" },
        "admin": { emoji: "🛡️", title: "𝗙𝗜𝗥𝗘𝗪𝗔𝗟𝗟_𝗠𝗢𝗗" },
        "download": { emoji: "📥", title: "𝗗𝗔𝗧𝗔_𝗦𝗧𝗥block𝗠" },
        "downloader": { emoji: "📥", title: "𝗗𝗔𝗧𝗔_𝗦𝗧𝗥block𝗠" },
        "sticker": { emoji: "🖼️", title: "𝗚𝗥𝗔𝗣𝗛_𝗖𝗢𝗗𝗘𝗖" },
        "fun": { emoji: "🎯", title: "𝗦𝗜𝗠𝗨𝗟context_𝗧𝗢𝗥" },
        "general": { emoji: "📍", title: "𝗕context_𝗦𝗘_𝗟𝗢𝗚𝗦" },
        "tools": { emoji: "🧰", title: "𝗨𝗧𝗜𝗟_𝗧𝗢𝗢𝗟𝗞𝗜𝗧" },
        "search": { emoji: "🔍", title: "𝗦𝗖context_𝗡_𝗘𝗡𝗚𝗜𝗡𝗘" }
    };

    const sortedCategories = Object.keys(categories).sort();

    // Build Categories & Commands List
    for (const cat of sortedCategories) {
        const catKey = cat.toLowerCase();
        const emoji = categoryMapping[catKey]?.emoji || "✨";
        const fancyTitle = categoryMapping[catKey]?.title || cat.toUpperCase() + "_MODULE";

        menuText += `*╭── [ ${emoji} ${fancyTitle} ]*\n`;
        
        const sortedCmds = categories[cat].sort();
        for (const c of sortedCmds) {
            const smallCapsCmd = toSmallCaps(c);
            menuText += `*│ ⚜️* ${smallCapsCmd}\n`;
        }
        menuText += `*╰─────────────────────* \n\n`;
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
        let menuChannelName = '⏤.ۗۗۗۗۗۗۗۗۗ.❥≛⃝ 𝘼𝐿ɪ R𝙖ᴢα🍁⃝➤';

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
        let menu = generateMenu(currentBotName, currentPrefix, activeUptime, currentMode, commands.length, selectedTheme);
        
        // Append Footer
        menu += `*🛰️ SECURE_CONNECTION // ${globalBotFooter.toUpperCase()}*`;

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
