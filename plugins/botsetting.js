const events = require('../aliraza');
const mongoose = require('mongoose');
const { updateUserConfigInMongoDB, getUserConfigFromMongoDB } = require('../lib/database');
const { fakevCard } = require('../lib/fakevCard'); // Successfully Imported

// ==========================================
// 🛡️ MONGODB SCHEMAS FOR GROUP SPECIFIC
// ==========================================
const AntiLinkSchema = new mongoose.Schema({
    groupJid: { type: String, required: true, unique: true },
    status: { type: Boolean, default: false }
});
const AntiLinkGroup = mongoose.models.InconnuAntiLink || mongoose.model('AlirazaAntiLink', AntiLinkSchema);

// ==========================================
// 1. ONLINE (ALWAYS ONLINE)
// ==========================================
events.cmd({
    pattern: "online",
    alias: ["alwaysonline", "alwayson"],
    react: "🟢",
    desc: "Enable/Disable Always Online Mode",
    category: "settings",
    use: "<on/off>",
    filename: __filename
}, async (conn, mek, m, { from, isGroup, isAdmins, isOwner, args, reply, config }) => {
    try {
        if (!isOwner && (!isGroup || !isAdmins)) return conn.sendMessage(from, { text: '*❌ Access Denied!* Only Admins or Owners can use this command.' }, { quoted: fakevCard });
        const sanitizedNumber = conn.user.id.split(':')[0].replace(/[^0-9]/g, '');
        const userConfig = await getUserConfigFromMongoDB(sanitizedNumber);
        const currentPrefix = userConfig.PREFIX || config.PREFIX || '.';
        const val = args[0]?.toLowerCase();
        
        if (!val || !["on", "off"].includes(val)) {
            const usageLayout = `╭═══ 💡 *COMMAND USAGE* ═══⊷
┃❃╭──────────────
┃❃│ 🟢 Cmd: ${currentPrefix}online
┃❃│ 💡 Use: ${currentPrefix}online on/off
┃❃│ 📝 Ex: ${currentPrefix}online on
┃❃╰───────────────
╰═════════════════⊷`;
            return conn.sendMessage(from, { text: usageLayout }, { quoted: fakevCard });
        }

        userConfig.ALWAYS_ONLINE = val === "on" ? "true" : "false";
        await updateUserConfigInMongoDB(sanitizedNumber, userConfig);

        const layout = `╭═══ 🟢 *ALWAYS ONLINE* ═══⊷
┃❃╭──────────────
┃❃│ 📌 Status: ${val === "on" ? "ON ✅" : "OFF ❌"}
┃❃│ 💡 Use: ${currentPrefix}online on/off
┃❃╰───────────────
╰═════════════════⊷`;

        return conn.sendMessage(from, { text: layout }, { quoted: fakevCard });
    } catch (e) { console.error(e); conn.sendMessage(from, { text: "❌ An error occurred." }, { quoted: fakevCard }); }
});

// ==========================================
// 2. ANTIDELETE (GLOBAL)
// ==========================================
events.cmd({
    pattern: "antidelete",
    alias: ["antidel"],
    react: "🔒",
    desc: "Enable/Disable Anti Delete Globally",
    category: "settings",
    use: "<on/off>",
    filename: __filename
}, async (conn, mek, m, { from, isGroup, isAdmins, isOwner, args, reply, config }) => {
    try {
        if (!isOwner && (!isGroup || !isAdmins)) return conn.sendMessage(from, { text: '*❌ Access Denied!* Only Admins or Owners can use this command.' }, { quoted: fakevCard });
        const sanitizedNumber = conn.user.id.split(':')[0].replace(/[^0-9]/g, '');
        const userConfig = await getUserConfigFromMongoDB(sanitizedNumber);
        const currentPrefix = userConfig.PREFIX || config.PREFIX || '.';
        const val = args[0]?.toLowerCase();
        
        if (!val || !["on", "off"].includes(val)) {
            const usageLayout = `╭═══ 💡 *COMMAND USAGE* ═══⊷
┃❃╭──────────────
┃❃│ 🔒 Cmd: ${currentPrefix}antidelete
┃❃│ 💡 Use: ${currentPrefix}antidelete on/off
┃❃│ 📝 Ex: ${currentPrefix}antidelete on
┃❃╰───────────────
╰═════════════════⊷`;
            return conn.sendMessage(from, { text: usageLayout }, { quoted: fakevCard });
        }

        userConfig.ANTIDELETE = val === "on" ? "true" : "false";
        await updateUserConfigInMongoDB(sanitizedNumber, userConfig);

        const layout = `╭═══ 🔒 *GLOBAL ANTI-DELETE* ═══⊷
┃❃╭──────────────
┃❃│ 📌 Status: ${val === "on" ? "ON ✅" : "OFF ❌"}
┃❃│ 💡 Use: ${currentPrefix}antidelete on/off
┃❃╰───────────────
╰═════════════════⊷`;

        return conn.sendMessage(from, { text: layout }, { quoted: fakevCard });
    } catch (e) { console.error(e); conn.sendMessage(from, { text: "❌ An error occurred." }, { quoted: fakevCard }); }
});

// ==========================================
// 3. ANTIDELETE2 (GROUP SPECIFIC)
// ==========================================
events.cmd({
    pattern: "antidelete2",
    desc: "Turn on/off anti-delete for this specific group only.",
    category: "group",
    filename: __filename
}, async (conn, mek, m, { from, isGroup, args, isAdmins, isOwner }) => {
    try {
        if (!isGroup) return conn.sendMessage(from, { text: "This command can only be used in groups!" }, { quoted: fakevCard });
        if (!isAdmins && !isOwner) return conn.sendMessage(from, { text: "Only group admins or bot owner can use this command." }, { quoted: fakevCard });
        
        if (!args[0] || !["on", "off"].includes(args[0].toLowerCase())) {
            const usageLayout = `╭═══ 💡 *COMMAND USAGE* ═══⊷
┃❃╭──────────────
┃❃│ 🛡️ Cmd: .antidelete2
┃❃│ 💡 Use: .antidelete2 on/off
┃❃│ 📝 Ex: .antidelete2 on
┃❃╰───────────────
╰═════════════════⊷`;
            return conn.sendMessage(from, { text: usageLayout }, { quoted: fakevCard });
        }

        const action = args[0].toLowerCase();
        const sanitizedNumber = conn.user.id.split(':')[0].replace(/[^0-9]/g, '');

        if (action === 'on') {
            await conn.db.collection('group_settings').updateOne(
                { botNumber: sanitizedNumber, groupId: from },
                { $set: { antidelete2: true } },
                { upsert: true }
            );
            const layout = `╭═══ 🛡️ *GROUP ANTI-DELETE* ═══⊷
┃❃╭──────────────
┃❃│ 📌 Status: ON ✅
┃❃│ 📝 Scope: This Group Only
┃❃╰───────────────
╰═════════════════⊷`;
            return conn.sendMessage(from, { text: layout }, { quoted: fakevCard });
        } else if (action === 'off') {
            await conn.db.collection('group_settings').updateOne(
                { botNumber: sanitizedNumber, groupId: from },
                { $set: { antidelete2: false } },
                { upsert: true }
            );
            const layout = `╭═══ 🛡️ *GROUP ANTI-DELETE* ═══⊷
┃❃╭──────────────
┃❃│ 📌 Status: OFF ❌
┃❃│ 📝 Scope: This Group Only
┃❃╰───────────────
╰═════════════════⊷`;
            return conn.sendMessage(from, { text: layout }, { quoted: fakevCard });
        }
    } catch (e) { conn.sendMessage(from, { text: `Error: ${e.message}` }, { quoted: fakevCard }); }
});

// ==========================================
// 4. ANTILINK (GROUP SPECIFIC)
// ==========================================
events.cmd({
    pattern: 'antilink',
    category: 'group',
    desc: 'Turn Anti-Link ON or OFF for this specific group only.',
    use: '.antilink [on/off]',
    react: '🔗',
    filename: __filename
}, async (conn, mek, m, { from, args, isGroup, isAdmins, isOwner, reply }) => {
    try {
        if (!isGroup) return conn.sendMessage(from, { text: "*❌ This command can only be used in groups.*" }, { quoted: fakevCard });
        if (!isAdmins && !isOwner) return conn.sendMessage(from, { text: "*❌ Only group administrators or owner can use this command.*" }, { quoted: fakevCard });
        
        if (!args[0] || !["on", "off"].includes(args[0].toLowerCase())) {
            const usageLayout = `╭═══ 💡 *COMMAND USAGE* ═══⊷
┃❃╭──────────────
┃❃│ 🔗 Cmd: .antilink
┃❃│ 💡 Use: .antilink on/off
┃❃│ 📝 Ex: .antilink on
┃❃╰───────────────
╰═════════════════⊷`;
            return conn.sendMessage(from, { text: usageLayout }, { quoted: fakevCard });
        }
        
        const action = args[0].toLowerCase();

        if (action === 'on') {
            await AntiLinkGroup.findOneAndUpdate({ groupJid: from }, { status: true }, { upsert: true, new: true });
            const layout = `╭═══ 🔗 *ANTI-LINK* ═══⊷
┃❃╭──────────────
┃❃│ 📌 Status: ON ✅
┃❃│ ⚠️ Action: Links are Blocked!
┃❃╰───────────────
╰═════════════════⊷`;
            return conn.sendMessage(from, { text: layout }, { quoted: fakevCard });
        } else if (action === 'off') {
            await AntiLinkGroup.findOneAndUpdate({ groupJid: from }, { status: false }, { upsert: true, new: true });
            const layout = `╭═══ 🔗 *ANTI-LINK* ═══⊷
┃❃╭──────────────
┃❃│ 📌 Status: OFF ❌
┃❃│ 🔓 Action: Links are Allowed!
┃❃╰───────────────
╰═════════════════⊷`;
            return conn.sendMessage(from, { text: layout }, { quoted: fakevCard });
        }
    } catch (e) { conn.sendMessage(from, { text: `Error: ${e.message}` }, { quoted: fakevCard }); }
});

// ==========================================
// 6. ANTICALL (GLOBAL)
// ==========================================
events.cmd({
    pattern: "anticall",
    alias: ["blockcall", "nocall"],
    react: "📵",
    desc: "Enable/Disable Anti-Call Feature to automatically reject incoming calls",
    category: "settings",
    use: "<on/off>",
    filename: __filename
}, async (conn, mek, m, { from, isGroup, isAdmins, isOwner, args, reply }) => {
    try {
        if (!isOwner && (!isGroup || !isAdmins)) return conn.sendMessage(from, { text: '*❌ Access Denied!* Only Admins or Owners can use this command.' }, { quoted: fakevCard });
        const sanitizedNumber = conn.user.id.split(':')[0].replace(/[^0-9]/g, '');
        const userConfig = await getUserConfigFromMongoDB(sanitizedNumber);
        const val = args[0]?.toLowerCase();
        
        if (!val || !["on", "off"].includes(val)) {
            const usageLayout = `╭═══ 💡 *COMMAND USAGE* ═══⊷
┃❃╭──────────────
┃❃│ 📵 Cmd: .anticall
┃❃│ 💡 Use: .anticall on/off
┃❃│ 📝 Ex: .anticall on
┃❃╰───────────────
╰═════════════════⊷`;
            return conn.sendMessage(from, { text: usageLayout }, { quoted: fakevCard });
        }

        userConfig.ANTI_CALL = val === "on" ? "true" : "false";
        await updateUserConfigInMongoDB(sanitizedNumber, userConfig);

        const layout = `╭═══ 📵 *ANTI-CALL* ═══⊷
┃❃╭──────────────
┃❃│ 📌 Status: ${val === "on" ? "ON ✅" : "OFF ❌"}
┃❃│ 💡 Use: .anticall on/off
┃❃╰───────────────
╰═════════════════⊷`;

        return conn.sendMessage(from, { text: layout }, { quoted: fakevCard });
    } catch (e) { conn.sendMessage(from, { text: "❌ An error occurred." }, { quoted: fakevCard }); }
});

// ==========================================
// 7. BOT NAME
// ==========================================
events.cmd({
    pattern: "botname",
    alias: ["setbotname"],
    react: "🤖",
    desc: "Change bot display name",
    category: "settings",
    use: "<name>",
    filename: __filename
}, async (conn, mek, m, { from, isGroup, isAdmins, isOwner, args, reply }) => {
    try {
        if (!isOwner && (!isGroup || !isAdmins)) return conn.sendMessage(from, { text: '*❌ Access Denied!*' }, { quoted: fakevCard });
        const sanitizedNumber = conn.user.id.split(':')[0].replace(/[^0-9]/g, '');
        const userConfig = await getUserConfigFromMongoDB(sanitizedNumber);
        const text = args.join(" ");
        
        if (!text) {
            const usageLayout = `╭═══ 💡 *COMMAND USAGE* ═══⊷
┃❃╭──────────────
┃❃│ 🤖 Cmd: .botname
┃❃│ 💡 Use: .botname <New Name>
┃❃│ 📝 Ex: .botname Aliraza Bot
┃❃╰───────────────
╰═════════════════⊷`;
            return conn.sendMessage(from, { text: usageLayout }, { quoted: fakevCard });
        }

        userConfig.USER_BOT_NAME = text;
        await updateUserConfigInMongoDB(sanitizedNumber, userConfig);

        const layout = `╭═══ 🤖 *BOT NAME UPDATE* ═══⊷
┃❃╭──────────────
┃❃│ ✅ Status: Name Updated!
┃❃│ 📝 New Name: ${text}
┃❃╰───────────────
╰═════════════════⊷`;

        return conn.sendMessage(from, { text: layout }, { quoted: fakevCard });
    } catch (e) { conn.sendMessage(from, { text: "❌ An error occurred." }, { quoted: fakevCard }); }
});

// ==========================================
// 8. BOT PICTURE
// ==========================================
events.cmd({
    pattern: "botpic",
    alias: ["setbotpic", "botimage"],
    react: "🖼️",
    desc: "Change bot menu image URL",
    category: "settings",
    use: "<image url>",
    filename: __filename
}, async (conn, mek, m, { from, isGroup, isAdmins, isOwner, args, reply }) => {
    try {
        if (!isOwner && (!isGroup || !isAdmins)) return conn.sendMessage(from, { text: '*❌ Access Denied!*' }, { quoted: fakevCard });
        const sanitizedNumber = conn.user.id.split(':')[0].replace(/[^0-9]/g, '');
        const userConfig = await getUserConfigFromMongoDB(sanitizedNumber);
        const url = args[0];
        
        if (!url || !url.startsWith('http')) {
            const usageLayout = `╭═══ 💡 *COMMAND USAGE* ═══⊷
┃❃╭──────────────
┃❃│ 🖼️ Cmd: .botpic
┃❃│ 💡 Use: .botpic <Direct Image URL>
┃❃│ 📝 Ex: .botpic https://i.ibb.co/example.png
┃❃╰───────────────
╰═════════════════⊷`;
            return conn.sendMessage(from, { text: usageLayout }, { quoted: fakevCard });
        }

        userConfig.USER_IMAGE_PATH = url;
        await updateUserConfigInMongoDB(sanitizedNumber, userConfig);

        const layout = `╭═══ 🖼️ *BOT PIC UPDATE* ═══⊷
┃❃╭──────────────
┃❃│ ✅ Status: Image URL Synced!
┃❃╰───────────────
╰═════════════════⊷`;

        return conn.sendMessage(from, { text: layout }, { quoted: fakevCard });
    } catch (e) { conn.sendMessage(from, { text: "❌ An error occurred." }, { quoted: fakevCard }); }
});

// ==========================================
// 9. BOT FOOTER
// ==========================================
events.cmd({
    pattern: "botfooter",
    alias: ["setfooter"],
    react: "📝",
    desc: "Change bot menu footer text",
    category: "settings",
    use: "<text>",
    filename: __filename
}, async (conn, mek, m, { from, isGroup, isAdmins, isOwner, args, reply }) => {
    try {
        if (!isOwner && (!isGroup || !isAdmins)) return conn.sendMessage(from, { text: '*❌ Access Denied!*' }, { quoted: fakevCard });
        const sanitizedNumber = conn.user.id.split(':')[0].replace(/[^0-9]/g, '');
        const userConfig = await getUserConfigFromMongoDB(sanitizedNumber);
        const text = args.join(" ");
        
        if (!text) {
            const usageLayout = `╭═══ 💡 *COMMAND USAGE* ═══⊷
┃❃╭──────────────
┃❃│ 📝 Cmd: .botfooter
┃❃│ 💡 Use: .botfooter <Text>
┃❃│ 📝 Ex: .botfooter © POWERED BY ALIRAZA
┃❃╰───────────────
╰═════════════════⊷`;
            return conn.sendMessage(from, { text: usageLayout }, { quoted: fakevCard });
        }

        userConfig.USER_BOT_FOOTER = text;
        await updateUserConfigInMongoDB(sanitizedNumber, userConfig);

        const layout = `╭═══ 📝 *BOT FOOTER UPDATE* ═══⊷
┃❃╭──────────────
┃❃│ ✅ Status: Footer Updated!
┃❃│ 📄 Content: ${text}
┃❃╰───────────────
╰═════════════════⊷`;

        return conn.sendMessage(from, { text: layout }, { quoted: fakevCard });
    } catch (e) { conn.sendMessage(from, { text: "❌ An error occurred." }, { quoted: fakevCard }); }
});

// ==========================================
// 10. AUTO VIEW STATUS
// ==========================================
events.cmd({
    pattern: "autoviewstatus",
    alias: ["statusview", "autoview"],
    react: "👁️",
    desc: "Enable/Disable Auto Status View",
    category: "settings",
    use: "<on/off>",
    filename: __filename
}, async (conn, mek, m, { from, isGroup, isAdmins, isOwner, args, reply }) => {
    try {
        if (!isOwner && (!isGroup || !isAdmins)) return conn.sendMessage(from, { text: '*❌ Access Denied!*' }, { quoted: fakevCard });
        const sanitizedNumber = conn.user.id.split(':')[0].replace(/[^0-9]/g, '');
        const userConfig = await getUserConfigFromMongoDB(sanitizedNumber);
        const val = args[0]?.toLowerCase();
        
        if (!val || !["on", "off"].includes(val)) {
            const usageLayout = `╭═══ 💡 *COMMAND USAGE* ═══⊷
┃❃╭──────────────
┃❃│ 👁️ Cmd: .autoviewstatus
┃❃│ 💡 Use: .autoviewstatus on/off
┃❃│ 📝 Ex: .autoviewstatus on
┃❃╰───────────────
╰═════════════════⊷`;
            return conn.sendMessage(from, { text: usageLayout }, { quoted: fakevCard });
        }

        userConfig.AUTO_VIEW_STATUS = val === "on" ? "true" : "false";
        await updateUserConfigInMongoDB(sanitizedNumber, userConfig);

        const layout = `╭═══ 👁️ *AUTO STATUS VIEW* ═══⊷
┃❃╭──────────────
┃❃│ 📌 Status: ${val === "on" ? "ON ✅" : "OFF ❌"}
┃❃│ 💡 Use: .autoviewstatus on/off
┃❃╰───────────────
╰═════════════════⊷`;

        return conn.sendMessage(from, { text: layout }, { quoted: fakevCard });
    } catch (e) { conn.sendMessage(from, { text: "❌ An error occurred." }, { quoted: fakevCard }); }
});

// ==========================================
// 11. AUTO STATUS REACT (LIKE)
// ==========================================
events.cmd({
    pattern: "autolikestatus",
    alias: ["statusreact", "statuslike"],
    react: "❤️",
    desc: "Enable/Disable Auto Status Reaction/Like",
    category: "settings",
    use: "<on/off>",
    filename: __filename
}, async (conn, mek, m, { from, isGroup, isAdmins, isOwner, args, reply }) => {
    try {
        if (!isOwner && (!isGroup || !isAdmins)) return conn.sendMessage(from, { text: '*❌ Access Denied!*' }, { quoted: fakevCard });
        const sanitizedNumber = conn.user.id.split(':')[0].replace(/[^0-9]/g, '');
        const userConfig = await getUserConfigFromMongoDB(sanitizedNumber);
        const val = args[0]?.toLowerCase();
        
        if (!val || !["on", "off"].includes(val)) {
            const usageLayout = `╭═══ 💡 *COMMAND USAGE* ═══⊷
┃❃╭──────────────
┃❃│ ❤️ Cmd: .autelikestatus
┃❃│ 💡 Use: .autelikestatus on/off
┃❃│ 📝 Ex: .autelikestatus on
┃❃╰───────────────
╰═════════════════⊷`;
            return conn.sendMessage(from, { text: usageLayout }, { quoted: fakevCard });
        }

        userConfig.AUTO_LIKE_STATUS = val === "on" ? "true" : "false";
        await updateUserConfigInMongoDB(sanitizedNumber, userConfig);

        const layout = `╭═══ ❤️ *AUTO STATUS REACT* ═══⊷
┃❃╭──────────────
┃❃│ 📌 Status: ${val === "on" ? "ON ✅" : "OFF ❌"}
┃❃│ 💡 Use: .autelikestatus on/off
┃❃╰───────────────
╰═════════════════⊷`;

        return conn.sendMessage(from, { text: layout }, { quoted: fakevCard });
    } catch (e) { conn.sendMessage(from, { text: "❌ An error occurred." }, { quoted: fakevCard }); }
});

// ==========================================
// 12. AUTO READ
// ==========================================
events.cmd({
    pattern: "autoread",
    alias: ["readmessage", "readmsg"],
    react: "✅",
    desc: "Enable/Disable Auto Read Messages",
    category: "settings",
    use: "<on/off>",
    filename: __filename
}, async (conn, mek, m, { from, isGroup, isAdmins, isOwner, args, reply }) => {
    try {
        if (!isOwner && (!isGroup || !isAdmins)) return conn.sendMessage(from, { text: '*❌ Access Denied!*' }, { quoted: fakevCard });
        const sanitizedNumber = conn.user.id.split(':')[0].replace(/[^0-9]/g, '');
        const userConfig = await getUserConfigFromMongoDB(sanitizedNumber);
        const val = args[0]?.toLowerCase();
        
        if (!val || !["on", "off"].includes(val)) {
            const usageLayout = `╭═══ 💡 *COMMAND USAGE* ═══⊷
┃❃╭──────────────
┃❃│ ✅ Cmd: .autoread
┃❃│ 💡 Use: .autoread on/off
┃❃│ 📝 Ex: .autoread on
┃❃╰───────────────
╰═════════════════⊷`;
            return conn.sendMessage(from, { text: usageLayout }, { quoted: fakevCard });
        }

        userConfig.READ_MESSAGE = val === "on" ? "true" : "false";
        await updateUserConfigInMongoDB(sanitizedNumber, userConfig);

        const layout = `╭═══ ✅ *AUTO READ MSG* ═══⊷
┃❃╭──────────────
┃❃│ 📌 Status: ${val === "on" ? "ON ✅" : "OFF ❌"}
┃❃│ 💡 Use: .autoread on/off
┃❃╰───────────────
╰═════════════════⊷`;

        return conn.sendMessage(from, { text: layout }, { quoted: fakevCard });
    } catch (e) { conn.sendMessage(from, { text: "❌ An error occurred." }, { quoted: fakevCard }); }
});

// ==========================================
// 13. AUTO REACT
// ==========================================
events.cmd({
    pattern: "autoreact",
    alias: ["msgreact"],
    react: "😊",
    desc: "Enable/Disable Auto Emoji Reaction on Messages",
    category: "settings",
    use: "<on/off>",
    filename: __filename
}, async (conn, mek, m, { from, isGroup, isAdmins, isOwner, args, reply }) => {
    try {
        if (!isOwner && (!isGroup || !isAdmins)) return conn.sendMessage(from, { text: '*❌ Access Denied!*' }, { quoted: fakevCard });
        const sanitizedNumber = conn.user.id.split(':')[0].replace(/[^0-9]/g, '');
        const userConfig = await getUserConfigFromMongoDB(sanitizedNumber);
        const val = args[0]?.toLowerCase();
        
        if (!val || !["on", "off"].includes(val)) {
            const usageLayout = `╭═══ 💡 *COMMAND USAGE* ═══⊷
┃❃╭──────────────
┃❃│ 😊 Cmd: .autoreact
┃❃│ 💡 Use: .autoreact on/off
┃❃│ 📝 Ex: .autoreact on
┃❃╰───────────────
╰═════════════════⊷`;
            return conn.sendMessage(from, { text: usageLayout }, { quoted: fakevCard });
        }

        userConfig.AUTO_REACT = val === "on" ? "true" : "false";
        await updateUserConfigInMongoDB(sanitizedNumber, userConfig);

        const layout = `╭═══ 😊 *AUTO MSG REACT* ═══⊷
┃❃╭──────────────
┃❃│ 📌 Status: ${val === "on" ? "ON ✅" : "OFF ❌"}
┃❃│ 💡 Use: .autoreact on/off
┃❃╰───────────────
╰═════════════════⊷`;

        return conn.sendMessage(from, { text: layout }, { quoted: fakevCard });
    } catch (e) { conn.sendMessage(from, { text: "❌ An error occurred." }, { quoted: fakevCard }); }
});

// ==========================================
// 14. AUTO TYPING
// ==========================================
events.cmd({
    pattern: "autotyping",
    alias: ["typing"],
    react: "⌨️",
    desc: "Enable/Disable Auto Typing Status",
    category: "settings",
    use: "<on/off>",
    filename: __filename
}, async (conn, mek, m, { from, isGroup, isAdmins, isOwner, args, reply }) => {
    try {
        if (!isOwner && (!isGroup || !isAdmins)) return conn.sendMessage(from, { text: '*❌ Access Denied!*' }, { quoted: fakevCard });
        const sanitizedNumber = conn.user.id.split(':')[0].replace(/[^0-9]/g, '');
        const userConfig = await getUserConfigFromMongoDB(sanitizedNumber);
        const val = args[0]?.toLowerCase();
        
        if (!val || !["on", "off"].includes(val)) {
            const usageLayout = `╭═══ 💡 *COMMAND USAGE* ═══⊷
┃❃╭──────────────
┃❃│ ⌨️ Cmd: .autotyping
┃❃│ 💡 Use: .autotyping on/off
┃❃│ 📝 Ex: .autotyping on
┃❃╰───────────────
╰═════════════════⊷`;
            return conn.sendMessage(from, { text: usageLayout }, { quoted: fakevCard });
        }

        userConfig.AUTO_TYPING = val === "on" ? "true" : "false";
        await updateUserConfigInMongoDB(sanitizedNumber, userConfig);

        const layout = `╭═══ ⌨️ *AUTO TYPING* ═══⊷
┃❃╭──────────────
┃❃│ 📌 Status: ${val === "on" ? "ON ✅" : "OFF ❌"}
┃❃│ 💡 Use: .autotyping on/off
┃❃╰───────────────
╰═════════════════⊷`;

        return conn.sendMessage(from, { text: layout }, { quoted: fakevCard });
    } catch (e) { conn.sendMessage(from, { text: "❌ An error occurred." }, { quoted: fakevCard }); }
});

// ==========================================
// 15. AUTO RECORDING
// ==========================================
events.cmd({
    pattern: "autorecording",
    alias: ["recording", "autorec"],
    react: "🎙️",
    desc: "Enable/Disable Auto Recording Status",
    category: "settings",
    use: "<on/off>",
    filename: __filename
}, async (conn, mek, m, { from, isGroup, isAdmins, isOwner, args, reply }) => {
    try {
        if (!isOwner && (!isGroup || !isAdmins)) return conn.sendMessage(from, { text: '*❌ Access Denied!*' }, { quoted: fakevCard });
        const sanitizedNumber = conn.user.id.split(':')[0].replace(/[^0-9]/g, '');
        const userConfig = await getUserConfigFromMongoDB(sanitizedNumber);
        const val = args[0]?.toLowerCase();
        
        if (!val || !["on", "off"].includes(val)) {
            const usageLayout = `╭═══ 💡 *COMMAND USAGE* ═══⊷
┃❃╭──────────────
┃❃│ 🎙️ Cmd: .autorecording
┃❃│ 💡 Use: .autorecording on/off
┃❃│ 📝 Ex: .autorecording on
┃❃╰───────────────
╰═════════════════⊷`;
            return conn.sendMessage(from, { text: usageLayout }, { quoted: fakevCard });
        }

        userConfig.AUTO_RECORDING = val === "on" ? "true" : "false";
        await updateUserConfigInMongoDB(sanitizedNumber, userConfig);

        const layout = `╭═══ 🎙️ *AUTO RECORDING* ═══⊷
┃❃╭──────────────
┃❃│ 📌 Status: ${val === "on" ? "ON ✅" : "OFF ❌"}
┃❃│ 💡 Use: .autorecording on/off
┃❃╰───────────────
╰═════════════════⊷`;

        return conn.sendMessage(from, { text: layout }, { quoted: fakevCard });
    } catch (e) { conn.sendMessage(from, { text: "❌ An error occurred." }, { quoted: fakevCard }); }
});

// ==========================================
// 16 AUTO REPLY
// ==========================================
events.cmd({
    pattern: "autoreply",
    alias: ["automsg"],
    react: "💬",
    desc: "Enable/Disable Auto Reply Feature",
    category: "settings",
    use: "<on/off>",
    filename: __filename
}, async (conn, mek, m, { from, isGroup, isAdmins, isOwner, args, reply }) => {
    try {
        if (!isOwner && (!isGroup || !isAdmins)) return conn.sendMessage(from, { text: '*❌ Access Denied!*' }, { quoted: fakevCard });
        const sanitizedNumber = conn.user.id.split(':')[0].replace(/[^0-9]/g, '');
        const userConfig = await getUserConfigFromMongoDB(sanitizedNumber);
        const val = args[0]?.toLowerCase();
        
        if (!val || !["on", "off"].includes(val)) {
            const usageLayout = `╭═══ 💡 *COMMAND USAGE* ═══⊷
┃❃╭──────────────
┃❃│ 💬 Cmd: .autoreply
┃❃│ 💡 Use: .autoreply on/off
┃❃│ 📝 Ex: .autoreply on
┃❃╰───────────────
╰═════════════════⊷`;
            return conn.sendMessage(from, { text: usageLayout }, { quoted: fakevCard });
        }

        userConfig.AUTO_REPLY = val === "on" ? "true" : "false";
        await updateUserConfigInMongoDB(sanitizedNumber, userConfig);

        const layout = `╭═══ 💬 *AUTO REPLY* ═══⊷
┃❃╭──────────────
┃❃│ 📌 Status: ${val === "on" ? "ON ✅" : "OFF ❌"}
┃❃│ 💡 Use: .autoreply on/off
┃❃╰───────────────
╰═════════════════⊷`;

        return conn.sendMessage(from, { text: layout }, { quoted: fakevCard });
    } catch (e) { conn.sendMessage(from, { text: "❌ An error occurred." }, { quoted: fakevCard }); }
});
// ==========================================
// 17 AUTO REPLY
// ==========================================
events.cmd({
    pattern: "setchannelname",
    alias: ["channelname", "cname"],
    react: "📢",
    desc: "Change bot menu channel display name",
    category: "settings",
    use: "<channel name>",
    filename: __filename
}, async (conn, mek, m, { from, isGroup, isAdmins, isOwner, args, text, reply, botNumber }) => {
    try {
        if (!isOwner) return conn.sendMessage(from, { text: '*❌ Access Denied! Owner Only Command*' }, { quoted: m });
        
        const sanitizedNumber = botNumber.replace(/[^0-9]/g, '');
        const userConfig = await getUserConfigFromMongoDB(sanitizedNumber);
        
        if (!text) {
            const usageLayout = `╭═══ 💡 *COMMAND USAGE* ═══⊷
┃❃╭──────────────
┃❃│ 📢 Cmd: .setchannelname
┃❃│ 💡 Use: .setchannelname <New Channel Name>
┃❃│ 📝 Ex: .setchannelname ⏤.ۗۗۗۗۗۗۗۗۗ.❥≛⃝ 𝘼𝐿𝐼 Rᴀᴢᴀ🍁⃝➤
┃❃╰───────────────
╰═════════════════⊷`;
            return conn.sendMessage(from, { text: usageLayout }, { quoted: m });
        }

        userConfig.MENU_CHANNEL_NAME = text.trim();
        await updateUserConfigInMongoDB(sanitizedNumber, userConfig);

        const layout = `╭═══ 📢 *CHANNEL NAME UPDATE* ═══⊷
┃❃╭──────────────
┃❃│ ✅ Status: Channel Name Synced!
┃❃│ 📝 Name: ${text.trim()}
┃❃╰───────────────
╰═════════════════⊷`;

        return conn.sendMessage(from, { text: layout }, { quoted: m });
    } catch (e) { 
        conn.sendMessage(from, { text: `❌ An error occurred: ${e.message}` }, { quoted: m }); 
    }
});

// ==========================================
// 18. SETTINGS PANEL (DYNAMIC VIEW)
// ==========================================
events.cmd({
  pattern: "settings",
  alias: ["setting", "panel"],
  react: "⚙️",
  desc: "View your personal bot settings panel",
  category: "settings",
  filename: __filename
}, async (conn, mek, m, { from, isGroup, isAdmins, isOwner, reply, config }) => {
  try {
    if (!isOwner && (!isGroup || !isAdmins)) return conn.sendMessage(from, { text: '*❌ Access Denied!* Only Admins or Owners can use this command.' }, { quoted: fakevCard });
    const sanitizedNumber = conn.user.id.split(':')[0].replace(/[^0-9]/g, '');
    const userConfig = await getUserConfigFromMongoDB(sanitizedNumber);

    const globalBotName = userConfig.USER_BOT_NAME || config.BOT_NAME || "✨𝑨𝑳𝑰 𝑿𝑴𝑫 𝑴𝑰𝑵𝑰 𝑩𝑶𝑻✨";
    const globalBotFooter = userConfig.USER_BOT_FOOTER || config.BOT_FOOTER || '©ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴀʟɪ ʀᴀᴢᴀ';
    const globalImagePath = userConfig.USER_IMAGE_PATH || config.IMAGE_PATH || 'https://i.ibb.co/JRd5Y3HH/menu.png';
    const currentPrefix = userConfig.PREFIX || config.PREFIX || '.';
    const currentMode = userConfig.WORK_TYPE || config.WORK_TYPE || 'public';

    const settingsText = `
╭──❍ *⚙️ ${globalBotName.toUpperCase()} PANEL* ❍──╮
│
├─❍ *🛡️ 𝘈𝘯𝘵𝘪 𝘍𝘦𝘢𝘵𝘶𝘳𝘦𝘴*
├─── 🔒 Anti Delete: ${userConfig.ANTIDELETE === "true" ? "✅ ON" : "❌ OFF"}
├─── 🔗 Anti Link: ${userConfig.ANTI_LINK === "true" ? "✅ ON" : "❌ OFF"}
├─── 📵 Anti Call: ${userConfig.ANTI_CALL === "true" ? "✅ ON" : "❌ OFF"}
│
├─❍ *⚙️ 𝘈𝘶𝘵𝘰 𝘍𝘦𝘢𝘵𝘶𝘳𝘦𝘴*
├─── 👁️ Status View: ${userConfig.AUTO_VIEW_STATUS === "true" ? "✅ ON" : "❌ OFF"}
├─── ❤️ Status React: ${userConfig.AUTO_LIKE_STATUS === "true" ? "✅ ON" : "❌ OFF"}
├─── ✅ Auto Read: ${userConfig.READ_MESSAGE === "true" ? "✅ ON" : "❌ OFF"}
├─── 😊 Auto React: ${userConfig.AUTO_REACT === "true" ? "✅ ON" : "❌ OFF"}
├─── ⌨️ Auto Typing: ${userConfig.AUTO_TYPING === "true" ? "✅ ON" : "❌ OFF"}
├─── 🎙️ Auto Recording: ${userConfig.AUTO_RECORDING === "true" ? "✅ ON" : "❌ OFF"}
├─── 🟢 Always Online: ${userConfig.ALWAYS_ONLINE === "true" ? "✅ ON" : "❌ OFF"}
│
├─❍ *🌐 𝘉𝘰𝘵 𝘊𝘰𝘯𝘧𝘪𝘨*
├─── 🤖 Bot Name: ${globalBotName}
├─── ⌨️ Prefix: 『 ${currentPrefix} 』
├─── 🌐 Mode: 〔${currentMode.toUpperCase()}〕
│
╰──────────────────────❍

> _${globalBotFooter}_ 🔰`;

    await conn.sendMessage(from, { image: { url: globalImagePath }, caption: settingsText }, { quoted: fakevCard });
  } catch (e) { console.error(e); conn.sendMessage(from, { text: "❌ An error occurred while fetching panel settings." }, { quoted: fakevCard }); }
});
