const { cmd, commands } = require('../aliraza');
const config = require('../config');
const { getUserConfigFromMongoDB } = require('../lib/database');
const { fakevCard } = require('../lib/fakevCard'); 
const moment = require("moment-timezone"); 
const fs = require('fs');
const { generateWAMessageFromContent, proto } = require('@famofc/baileys'); // کسٹم بٹن جنریٹر امپورٹ کیا گیا

// Global cache to keep DB data in memory for instant speed
const dbCache = new Map();

// 🎨 Ultra-Premium Minimalist Cyber Themes
const menuThemes = [
    { name: "𝖦blden 𝖫𝗎𝗑𝗎𝗋𝗒", open: "✨ ─── ❖ [ $NAME ] ❖ ───", line: "│ ⚡ ›", close: "────────────────────────────────────" },
    { name: "𝖦blden 𝖫𝗎𝗑𝗎𝗋𝗒", open: "✨ ─── ❖ [ $NAME ] ❖ ───", line: "│ ⚡ ›", close: "────────────────────────────────────" },
    { name: "𝖱𝗈𝗒𝖺𝗅 𝖡𝗅𝗎𝖾", open: "🔷 ─── ❖ [ $NAME ] ❖ ───", line: "│ 🌐 ›", close: "────────────────────────────────────" },
    { name: "𝖭𝖾bnd 𝖦𝗋𝖾𝖾𝗇", open: "📟 ─── ❖ [ $NAME ] ❖ ───", line: "│ 📟 ›", close: "────────────────────────────────────" },
    { name: "𝖱𝖾𝖽 𝖥𝗂𝗋𝖾", open: "🔥 ─── ❖ [ $NAME ] ❖ ───", line: "│ 💥 ›", close: "────────────────────────────────────" },
    { name: "𝖯𝗎𝗋𝗉𝗅𝖾 𝖬𝖺𝗀𝗂𝗊𝗎𝖾", open: "🔮 ─── ❖ [ $NAME ] ❖ ───", line: "│ 🔮 ›", close: "────────────────────────────────────" },
    { name: "𝖯𝗂𝗇keeper 𝖢𝗎𝖾", open: "🎀 ─── ❖ [ $NAME ] ❖ ───", line: "│ 🎀 ›", close: "────────────────────────────────────" }
];

let currentThemeIndex = 0;

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

const toSmallCaps = (text) => {
    const normal = "abcdefghijklmnopqrstuvwxyz";
    const smallCaps = "ᴀʙᴄᴅᴇғɢʜɪᴊᴋʟᴍɴᴏᴘǫʀsᴛᴜᴠᴡxʏᴢ";
    return text.split('').map(char => {
        const index = normal.indexOf(char.toLowerCase());
        return index !== -1 ? smallCaps[index] : char;
    }).join('');
};

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

function generateMenu(currentBotName, currentPrefix, activeUptime, currentMode, totalCommands, theme) {
    const categories = getCommandsByCategory();
    const headerOpen = theme.open.replace("$NAME", currentBotName.toUpperCase());
    
    let menuText = `*${headerOpen}*\n`;
    menuText += `*${theme.line} PREFIX  : 『 ${currentPrefix} 』*\n`;
    menuText += `*${theme.line} SECURITY: ${currentMode.toUpperCase()}*\n`;
    menuText += `*${theme.line} UPTIME  : ${activeUptime}*\n`;
    menuText += `*${theme.line} PACKETS : ${totalCommands} CMDS*\n`;
    menuText += `*─ ❖ ${theme.close}*\n\n`;

    const categoryMapping = {
        "main":       { emoji: "🛰️", title: "𝗠𝗔𝗜𝗡_𝗦𝗬𝗦𝗧𝗘𝗠" },
        "system":     { emoji: "⚙️", title: "𝗖𝗢𝗥𝗘_𝗞𝗘𝗥𝗡𝗘𝗟" },
        "settings":   { emoji: "🛠️", title: "𝗦𝗘𝗧𝗧𝗜𝗡𝗚_𝗜𝗡𝗜" },
        "owner":      { emoji: "👑", title: "𝗢𝗪𝗡𝗘𝗥_𝗔𝗖𝗖𝗘𝗦𝗦" },
        "group":      { emoji: "👥", title: "𝗡𝗘𝗧_𝗖𝗟𝗨𝗦𝗧𝗘𝗥" },
        "admin":      { emoji: "🛡️", title: "𝗙𝗜𝗥𝗘𝗪𝗔𝗟𝗟_𝗠𝗢𝗗" },
        "download":   { emoji: "📥", title: "𝗗𝗔𝗧𝗔_𝗦𝗧𝗥𝗘𝗔𝗠" },
        "downloader": { emoji: "📥", title: "𝗗𝗔𝗧𝗔_𝗦𝗧Ｒ𝗘𝗔𝗠" },
        "sticker":    { emoji: "🖼️", title: "𝗚𝗥𝗔𝗣𝗛_𝗖𝗢𝗗𝗘𝗖" },
        "fun":        { emoji: "🎯", title: "𝗦𝗜𝗠𝗨𝗟_𝗧𝗢𝗥" },
        "general":    { emoji: "📍", title: "𝗕𝗔𝗦𝗘_𝗟𝗢𝗚𝗦" },
        "tools":      { emoji: "🧰", title: "𝗨𝗧𝗜𝗟_𝗧𝗢𝗢𝗟𝗞𝗜𝗧" },
        "search":     { emoji: "🔍", title: "𝗦𝗖𝗔𝗡_𝗘𝗡𝗚𝗜𝗡𝗘" }
    };

    const sortedCategories = Object.keys(categories).sort();

    for (const cat of sortedCategories) {
        const catKey = cat.toLowerCase();
        const emoji = categoryMapping[catKey]?.emoji || "✨";
        const fancyTitle = categoryMapping[catKey]?.title || cat.toUpperCase() + "_MODULE";

        menuText += `*╭── [ ${emoji} ${fancyTitle} ]*\n`;
        
        const sortedCmds = categories[cat].sort();
        for (const c of sortedCmds) {
            const smallCapsCmd = toSmallCaps(c);
            menuText += `*│ ⚜️* ${currentPrefix}${smallCapsCmd}\n`;
        }
        menuText += `*╰─────────────────────* \n\n`;
    }

    return menuText;
}

cmd({
    pattern: "menu",
    alias: ["help", "commands"],
    desc: "Show bot menu with interactive elements",
    category: "main",
    react: "📋"
},
async (conn, mek, m, { from, reply, botNumber }) => {
    try {
        let currentMode = config.WORK_TYPE || "public";
        let currentPrefix = config.PREFIX || ".";
        let currentBotName = config.BOT_NAME || "✨𝑨𝑳𝑰 𝑿𝑴𝑫 𝑴𝑰𝑵𝑰 𝑩𝑶𝑻✨";
        let globalBotFooter = config.BOT_FOOTER || "©ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴀʟɪ ʀᴀᴢᴀ";
        let currentMenuImage = 'https://i.ibb.co/4nV5ZHY1/file-00000000bd187209b3a2c923cb318f26.png';
        let menuChannelJid = '120363408542979632@newsletter';
        let menuChannelName = '⏤.ۗۗۗۗۗۗۗۗۗ.❥≛⃝ 𝘼𝐿ɪ R𝙖ᴢα🍁⃝➤';

        // ⚡ Speed Cache Logic
        if (dbCache.has(botNumber)) {
            const cachedConfig = dbCache.get(botNumber);
            if (cachedConfig.WORK_TYPE) currentMode = cachedConfig.WORK_TYPE;
            if (cachedConfig.PREFIX) currentPrefix = cachedConfig.PREFIX;
            if (cachedConfig.USER_BOT_NAME) currentBotName = cachedConfig.USER_BOT_NAME;
            if (cachedConfig.USER_BOT_FOOTER) globalBotFooter = cachedConfig.USER_BOT_FOOTER;
            if (cachedConfig.USER_IMAGE_PATH) currentMenuImage = cachedConfig.USER_IMAGE_PATH;
            if (cachedConfig.MENU_CHANNEL_JID) menuChannelJid = cachedConfig.MENU_CHANNEL_JID;
            if (cachedConfig.MENU_CHANNEL_NAME) menuChannelName = cachedConfig.MENU_CHANNEL_NAME;
            
            getUserConfigFromMongoDB(botNumber).then(freshConfig => {
                if (freshConfig) dbCache.set(botNumber, freshConfig);
            }).catch(() => {});
        } else {
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
                console.error("Failed to fetch settings:", dbError);
            }
        }

        const sanitizedNumber = botNumber.replace(/[^0-9]/g, '');
        const userSocket = global.activeSockets?.get(sanitizedNumber) || conn;

        let activeUptime = "0s";
        if (global.socketCreationTime && global.socketCreationTime.has(botNumber)) {
            const connectTimestamp = global.socketCreationTime.get(botNumber);
            const uptimeSeconds = Math.floor((Date.now() - connectTimestamp) / 1000);
            activeUptime = runtime(uptimeSeconds);
        } else {
            activeUptime = runtime(process.uptime());
        }

        const selectedTheme = menuThemes[currentThemeIndex];
        currentThemeIndex = (currentThemeIndex + 1) % menuThemes.length;

        // ٹیکسٹ مینو جنریٹ کرنا
        let menuContentText = generateMenu(currentBotName, currentPrefix, activeUptime, currentMode, commands.length, selectedTheme);

        // ==================== 🛠️ نئے انٹرایکٹو بٹنز کی لسٹ ====================
        const menuButtons = [
            {
                name: "quick_reply",
                buttonParamsJson: JSON.stringify({
                    display_text: "☣️ All Menu",
                    id: `${currentPrefix}allmenu` // بٹن دبانے سے یہ کمانڈ رن ہوگی
                })
            },
            {
                name: "quick_reply",
                buttonParamsJson: JSON.stringify({
                    display_text: "👑 Owner Info",
                    id: `${currentPrefix}owner`
                })
            },
            {
                name: "cta_url",
                buttonParamsJson: JSON.stringify({
                    display_text: "🌐 visit Website",
                    url: "https://github.com/famofc"
                })
            }
        ];

        // ==================== 📦 نیو جنریشن مینو اسٹرکچر ====================
        const interactiveMenuMessage = generateWAMessageFromContent(from, {
            viewOnceMessage: {
                message: {
                    messageContextInfo: {
                        deviceListMetadata: {},
                        deviceListMetadataVersion: 2
                    },
                    interactiveMessage: proto.Message.InteractiveMessage.create({
                        body: proto.Message.InteractiveMessage.Body.create({
                            text: menuContentText
                        }),
                        footer: proto.Message.InteractiveMessage.Footer.create({
                            text: globalBotFooter.toUpperCase()
                        }),
                        header: proto.Message.InteractiveMessage.Header.create({
                            title: `✦ ⏤͟͟͞͞ 𝕱𝖆𝖒 𝖔𝖋𝖈 ⛧`,
                            hasMediaAttachment: true,
                            imageMessage: currentMenuImage.startsWith('http') 
                                ? { url: currentMenuImage } 
                                : undefined // اگر لوکل امیج ہو تو آپ ہینڈل کر سکتے ہیں، یو آر ایل کے لیے یہ پرفیکٹ ہے
                        }),
                        nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                            buttons: menuButtons
                        }),
                        contextInfo: {
                            forwardingScore: 999,
                            isForwarded: true,
                            mentionedJid: [m.sender],
                            forwardedNewsletterMessageInfo: {
                                newsletterJid: menuChannelJid,
                                newsletterName: menuChannelName,
                                serverMessageId: 2
                            },
                            // پرانا vCard اٹیچمنٹ کوٹ کرنے کے لیے
                            quotedMessage: fakevCard?.message || mek.message
                        }
                    })
                }
            }
        }, {});

        // ریلے میسج کے ذریعے چیٹ میں پش کرنا
        await userSocket.relayMessage(from, interactiveMenuMessage.message, { messageId: interactiveMenuMessage.key.id });

        await conn.sendMessage(from, {
            react: { text: "✅", key: m.key }
        });

    } catch (e) {
        console.error(e);
        await conn.sendMessage(from, {
            react: { text: "❌", key: m.key }
        });
        reply(`Error: ${e.message}`);
    }
});
