const { cmd } = require("../aliraza");
const config = require('../config');
const { fakevCard } = require('../lib/fakevCard'); // Successfully Imported

/* =========================================================================================================
   🌐 ADVANCED ADMINISTRATIVE SECURITY STATUS TRACKER (CORE)
========================================================================================================= */
async function checkAdminStatus(conn, chatId, senderId) {
    try {
        const metadata = await conn.groupMetadata(chatId);
        const participants = metadata.participants || [];

        const botId = conn.user?.id || '';
        const botLid = conn.user?.lid || '';

        const extract = id =>
            id?.includes(':') ? id.split(':')[0] :
            id?.includes('@') ? id.split('@')[0] : id;

        const botNumber = extract(botId);
        const botIdClean = extract(botId);
        const botLidNumber = extract(botLid);
        const botLidClean = extract(botLid);

        const senderNumber = extract(senderId);
        const senderClean = extract(senderId);

        let isBotAdmin = false;
        let isSenderAdmin = false;

        for (let p of participants) {
            if (p.admin === "admin" || p.admin === "superadmin") {

                const pId = extract(p.id);
                const pLid = extract(p.lid);
                const pPhone = extract(p.phoneNumber);
                const pFullId = p.id || '';
                const pFullLid = p.lid || '';

                const botMatches =
                    botId === pFullId ||
                    botId === pFullLid ||
                    botLid === pFullLid ||
                    botLidNumber === pLid ||
                    botLidClean === pLid ||
                    botNumber === pPhone ||
                    botNumber === pId ||
                    botIdClean === pPhone ||
                    botIdClean === pId ||
                    (botLid && extract(botLid) === pLid);

                if (botMatches) isBotAdmin = true;

                const senderMatches =
                    senderId === pFullId ||
                    senderId === pFullLid ||
                    senderNumber === pPhone ||
                    senderNumber === pId ||
                    senderClean === pPhone ||
                    senderClean === pId ||
                    (pLid && senderClean === pLid);

                if (senderMatches) isSenderAdmin = true;
            }
        }

        return { isBotAdmin, isSenderAdmin };

    } catch (err) {
        console.error('❌ Admin check error:', err);
        return { isBotAdmin: false, isSenderAdmin: false };
    }
}

/* =========================================================================================================
   1. GET GROUP ADMINS COMMAND (PUBLIC USE)
========================================================================================================= */
cmd({
    pattern: "admins",
    alias: ["adminlist", "tagadmins"],
    desc: "Get a tagged list of all group admins",
    category: "group",
    use: ".admins",
    filename: __filename
}, async (conn, mek, m, { from, isGroup, reply }) => {
    try {
        if (!isGroup) return conn.sendMessage(from, { text: "❌ This command can only be used in groups." }, { quoted: fakevCard });
        const groupMetadata = await conn.groupMetadata(from);
        const adminParticipants = groupMetadata.participants.filter(p => p.admin === 'admin' || p.admin === 'superadmin');

        if (!adminParticipants.length) return conn.sendMessage(from, { text: "❌ No admins found in this group." }, { quoted: fakevCard });

        const adminMentions = adminParticipants.map(admin => admin.id);
        const adminTextList = adminParticipants.map(admin => `┃❃│ 👤 @${admin.id.split('@')[0]}`).join('\n');

        const layout = `╭═══ 🎯 *ADMINS LIST* ═══⊷
┃❃╭──────────────
${adminTextList}
┃❃│ ──────────────
┃❃│ ⚙️ Total Admins: ${adminParticipants.length}
┃❃╰───────────────
╰═════════════════⊷`;

        return await conn.sendMessage(from, {
            text: layout,
            mentions: adminMentions
        }, { quoted: fakevCard });
    } catch (e) {
        return conn.sendMessage(from, { text: "❌ Failed to fetch admin list." }, { quoted: fakevCard });
    }
});

/* =========================================================================================================
   2. SET GROUP DESCRIPTION COMMAND
========================================================================================================= */
cmd({
    pattern: "groupdesc",
    alias: ["setdesc", "changedesc"],
    desc: "Change the group description",
    category: "group",
    use: ".groupdesc <New Description>",
    filename: __filename
}, async (conn, mek, m, { from, args, isGroup, isOwner, reply, sender }) => {
    try {
        if (!isGroup) return conn.sendMessage(from, { text: "❌ This command can only be used in groups." }, { quoted: fakevCard });
        const { isBotAdmin, isSenderAdmin } = await checkAdminStatus(conn, from, sender);
        if (!isSenderAdmin && !isOwner) return conn.sendMessage(from, { text: "❌ Only admins or the owner can use this command." }, { quoted: fakevCard });
        if (!isBotAdmin) return conn.sendMessage(from, { text: "❌ I need to be an admin to change description." }, { quoted: fakevCard });
        if (args.length === 0) return conn.sendMessage(from, { text: "❌ Please provide description text." }, { quoted: fakevCard });

        const newDesc = args.join(' ');
        await conn.groupUpdateDescription(from, newDesc);

        const layout = `╭═══ 📝 *GROUP DESCRIPTION* ═══⊷
┃❃╭──────────────
┃❃│ 📄 New Desc: ${newDesc}
┃❃╰───────────────
╰═════════════════⊷`;

        return await conn.sendMessage(from, { text: layout }, { quoted: fakevCard });
    } catch (e) {
        return conn.sendMessage(from, { text: "❌ Failed to update description." }, { quoted: fakevCard });
    }
});

/* =========================================================================================================
   3. GET GROUP INFO COMMAND (PUBLIC USE)
========================================================================================================= */
cmd({
    pattern: "groupinfo",
    alias: ["ginfo", "infogroup"],
    desc: "Get basic information about the group",
    category: "group",
    use: ".groupinfo",
    filename: __filename
}, async (conn, mek, m, { from, isGroup, reply }) => {
    try {
        if (!isGroup) return conn.sendMessage(from, { text: "❌ This command can only be used in groups." }, { quoted: fakevCard });
        const groupMetadata = await conn.groupMetadata(from);
        
        const groupName = groupMetadata.subject;
        const groupDesc = groupMetadata.desc || 'No description provided.';
        const memberCount = groupMetadata.participants.length;
        const creationDate = new Date(groupMetadata.creation * 1000).toLocaleString();

        const layout = `╭═══ 📊 *GROUP INFO* ═══⊷
┃❃╭──────────────
┃❃│ 📝 Name: ${groupName}
┃❃│ 👥 Members: ${memberCount}
┃❃│ 📅 Created At: ${creationDate}
┃❃│ ──────────────
┃❃│ 📖 Description: ${groupDesc}
┃❃╰───────────────
╰═════════════════⊷`;

        return await conn.sendMessage(from, { text: layout }, { quoted: fakevCard });
    } catch (e) {
        return conn.sendMessage(from, { text: "❌ Failed to fetch group info." }, { quoted: fakevCard });
    }
});

/* =========================================================================================================
   4. GET GROUP LINK COMMAND (PUBLIC USE)
========================================================================================================= */
cmd({
    pattern: "grouplink",
    alias: ["glink", "invitecode"],
    desc: "Get the group's invite link",
    category: "group",
    use: ".grouplink",
    filename: __filename
}, async (conn, mek, m, { from, isGroup, reply, sender }) => {
    try {
        if (!isGroup) return conn.sendMessage(from, { text: "❌ This command can only be used in groups." }, { quoted: fakevCard });
        const { isBotAdmin } = await checkAdminStatus(conn, from, sender);
        if (!isBotAdmin) return conn.sendMessage(from, { text: "❌ I need to be an admin to generate link." }, { quoted: fakevCard });

        const inviteLink = await conn.groupInviteCode(from);
        
        const layout = `╭═══ 🔗 *GROUP LINK* ═══⊷
┃❃╭──────────────
┃❃│ 📌 Link: https://chat.whatsapp.com/${inviteLink}
┃❃╰───────────────
╰═════════════════⊷`;

        return await conn.sendMessage(from, { text: layout }, { quoted: fakevCard });
    } catch (e) {
        return conn.sendMessage(from, { text: "❌ Failed to fetch invite link." }, { quoted: fakevCard });
    }
});

/* =========================================================================================================
   5 & 6. CHANGE GROUP NAME COMMANDS (ADMIN ONLY)
========================================================================================================= */
const nameConfig = {
    category: "group",
    filename: __filename
};

cmd({ ...nameConfig, pattern: "gname", alias: ["setname", "changegname"], desc: "Change group name" }, changeGroupSubject);
cmd({ ...nameConfig, pattern: "setsubject", alias: ["subject", "gsubject"], desc: "Change group subject" }, changeGroupSubject);

async function changeGroupSubject(conn, mek, m, { from, args, isGroup, isOwner, reply, sender }) {
    try {
        if (!isGroup) return conn.sendMessage(from, { text: "❌ This command can only be used in groups." }, { quoted: fakevCard });
        const { isBotAdmin, isSenderAdmin } = await checkAdminStatus(conn, from, sender);
        if (!isSenderAdmin && !isOwner) return conn.sendMessage(from, { text: "❌ Only admins can use this command." }, { quoted: fakevCard });
        if (!isBotAdmin) return conn.sendMessage(from, { text: "❌ I need to be an admin to change name." }, { quoted: fakevCard });

        const newName = args.join(" ");
        if (!newName) return conn.sendMessage(from, { text: "❌ Please provide a new name." }, { quoted: fakevCard });

        await conn.groupUpdateSubject(from, newName);
        
        const layout = `╭═══ ✏️ *GROUP NAME* ═══⊷
┃❃╭──────────────
┃❃│ 📌 New Name: ${newName}
┃❃╰───────────────
╰═════════════════⊷`;

        return await conn.sendMessage(from, { text: layout }, { quoted: fakevCard });
    } catch (e) {
        return conn.sendMessage(from, { text: "❌ Failed to change group name." }, { quoted: fakevCard });
    }
}

/* =========================================================================================================
   7. VIEW JOIN REQUESTS COMMAND
========================================================================================================= */
cmd({
    pattern: "requests",
    alias: ["joinrequests", "reqlist"],
    desc: "View pending group join requests",
    category: "group",
    use: ".requests",
    filename: __filename
}, async (conn, mek, m, { from, isGroup, isOwner, reply, sender }) => {
    try {
        if (!isGroup) return conn.sendMessage(from, { text: "❌ This command can only be used in groups." }, { quoted: fakevCard });
        const { isBotAdmin, isSenderAdmin } = await checkAdminStatus(conn, from, sender);
        if (!isSenderAdmin && !isOwner) return conn.sendMessage(from, { text: "❌ Only admins can use this command." }, { quoted: fakevCard });
        if (!isBotAdmin) return conn.sendMessage(from, { text: "❌ I need to be an admin." }, { quoted: fakevCard });

        const requests = await conn.groupRequestParticipantsList(from);
        if (!requests || requests.length === 0) return conn.sendMessage(from, { text: "✨ *No pending join requests found.*" }, { quoted: fakevCard });

        let requestListText = "";
        requests.forEach((request, index) => {
            requestListText += `┃❃│ [${index + 1}] 👤 @${request.jid.split("@")[0]}\n`;
        });

        const layout = `╭═══ ⏳ *JOIN REQUESTS* ═══⊷
┃❃╭──────────────
${requestListText}┃❃│ ──────────────
┃❃│ ⚙️ Total Requests: ${requests.length}
┃❃│ 👉 Use: .accept <num> or .reject <num>
┃❃╰───────────────
╰═════════════════⊷`;

        return await conn.sendMessage(from, { text: layout, mentions: requests.map(r => r.jid) }, { quoted: fakevCard });
    } catch (error) {
        return conn.sendMessage(from, { text: "❌ Failed to retrieve requests." }, { quoted: fakevCard });
    }
});

/* =========================================================================================================
   8. ACCEPT JOIN REQUESTS COMMAND
========================================================================================================= */
cmd({
    pattern: "accept",
    alias: ["approve", "acc"],
    desc: "Accept group join request(s)",
    category: "group",
    use: ".accept <numbers>",
    filename: __filename
}, async (conn, mek, m, { from, isGroup, isOwner, reply, sender, args }) => {
    try {
        if (!isGroup) return conn.sendMessage(from, { text: "❌ This command can only be used in groups." }, { quoted: fakevCard });
        const { isBotAdmin, isSenderAdmin } = await checkAdminStatus(conn, from, sender);
        if (!isSenderAdmin && !isOwner) return conn.sendMessage(from, { text: "❌ Only admins can use this command." }, { quoted: fakevCard });
        if (!isBotAdmin) return conn.sendMessage(from, { text: "❌ I need to be an admin." }, { quoted: fakevCard });

        const requests = await conn.groupRequestParticipantsList(from);
        if (!requests || requests.length === 0) return conn.sendMessage(from, { text: "❌ No requests available." }, { quoted: fakevCard });

        const match = args.join(" ");
        if (!match) return conn.sendMessage(from, { text: "❌ Provide numbers. Example: `.accept 1` or `.accept 1,2`" }, { quoted: fakevCard });

        const indexes = match.split(",").map(num => parseInt(num.trim()) - 1);
        const validIndexes = indexes.filter(index => index >= 0 && index < requests.length);

        if (validIndexes.length === 0) return conn.sendMessage(from, { text: "❌ Invalid request number(s)." }, { quoted: fakevCard });

        for (let index of validIndexes) {
            await conn.groupRequestParticipantsUpdate(from, [requests[index].jid], "accept");
        }

        const layout = `╭═══ ✅ *REQUESTS ACCEPTED* ═══⊷
┃❃╭──────────────
┃❃│ 🎉 Successfully Accepted!
┃❃│ 📈 Total processed: ${validIndexes.length}
┃❃╰───────────────
╰═════════════════⊷`;

        return conn.sendMessage(from, { text: layout }, { quoted: fakevCard });
    } catch (error) {
        return conn.sendMessage(from, { text: "❌ Error processing approvals." }, { quoted: fakevCard });
    }
});

/* =========================================================================================================
   9. REJECT JOIN REQUESTS COMMAND
========================================================================================================= */
cmd({
    pattern: "reject",
    alias: ["deny", "rej"],
    desc: "Reject group join request(s)",
    category: "group",
    use: ".reject <numbers>",
    filename: __filename
}, async (conn, mek, m, { from, isGroup, isOwner, reply, sender, args }) => {
    try {
        if (!isGroup) return conn.sendMessage(from, { text: "❌ This command can only be used in groups." }, { quoted: fakevCard });
        const { isBotAdmin, isSenderAdmin } = await checkAdminStatus(conn, from, sender);
        if (!isSenderAdmin && !isOwner) return conn.sendMessage(from, { text: "❌ Only admins can use this command." }, { quoted: fakevCard });
        if (!isBotAdmin) return conn.sendMessage(from, { text: "❌ I need to be an admin." }, { quoted: fakevCard });

        const requests = await conn.groupRequestParticipantsList(from);
        if (!requests || requests.length === 0) return conn.sendMessage(from, { text: "❌ No requests available." }, { quoted: fakevCard });

        const match = args.join(" ");
        if (!match) return conn.sendMessage(from, { text: "❌ Provide numbers. Example: `.reject 1`" }, { quoted: fakevCard });

        const indexes = match.split(",").map(num => parseInt(num.trim()) - 1);
        const validIndexes = indexes.filter(index => index >= 0 && index < requests.length);

        if (validIndexes.length === 0) return conn.sendMessage(from, { text: "❌ Invalid request number(s)." }, { quoted: fakevCard });

        for (let index of validIndexes) {
            await conn.groupRequestParticipantsUpdate(from, [requests[index].jid], "reject");
        }

        const layout = `╭═══ ❌ *REQUESTS REJECTED* ═══⊷
┃❃╭──────────────
┃❃│ 🚫 Successfully Rejected!
┃❃│ 📉 Total processed: ${validIndexes.length}
┃❃╰───────────────
╰═════════════════⊷`;

        return conn.sendMessage(from, { text: layout }, { quoted: fakevCard });
    } catch (error) {
        return conn.sendMessage(from, { text: "❌ Error processing rejections." }, { quoted: fakevCard });
    }
});

/* =========================================================================================================
   10. HIDETAG / ANNOUNCEMENT COMMAND
========================================================================================================= */
cmd({
    pattern: "hidetag",
    alias: ["htag", "totag", "announce"],
    desc: "Tag all group members invisibly",
    category: "group",
    use: ".hidetag <Message>",
    filename: __filename
}, async (conn, mek, m, { from, args, isGroup, isOwner, reply, sender }) => {
    try {
        if (!isGroup) return conn.sendMessage(from, { text: "❌ This command can only be used in groups." }, { quoted: fakevCard });
        const { isSenderAdmin } = await checkAdminStatus(conn, from, sender);
        if (!isSenderAdmin && !isOwner) return conn.sendMessage(from, { text: "❌ Only admins can use this command." }, { quoted: fakevCard });

        const announcementText = args.join(" ") || "📢 Attention Everyone!";
        const groupMetadata = await conn.groupMetadata(from);
        const allParticipants = groupMetadata.participants.map(p => p.id);

        return await conn.sendMessage(from, { text: announcementText, mentions: allParticipants }, { quoted: fakevCard });
    } catch (e) {
        return conn.sendMessage(from, { text: "❌ Failed to execute hidetag." }, { quoted: fakevCard });
    }
});

/* =========================================================================================================
   11. LOCK GROUP SETTINGS
========================================================================================================= */
cmd({
    pattern: "lock",
    desc: "Only allow admins to modify group settings",
    category: "group",
    react: "🔒",
    filename: __filename
}, async (conn, mek, m, { from, isGroup, isOwner, reply, sender }) => {
    try {
        if (!isGroup) return conn.sendMessage(from, { text: "❌ This command is only for groups." }, { quoted: fakevCard });
        const { isBotAdmin, isSenderAdmin } = await checkAdminStatus(conn, from, sender);
        if (!isSenderAdmin && !isOwner) return conn.sendMessage(from, { text: "❌ Only admins can use this command." }, { quoted: fakevCard });
        if (!isBotAdmin) return conn.sendMessage(from, { text: "❌ I need to be an admin." }, { quoted: fakevCard });

        await conn.groupSettingUpdate(from, 'locked');
        
        const layout = `╭═══ 🔒 *SETTINGS LOCKED* ═══⊷
┃❃╭──────────────
┃❃│ ⚠️ Status: Settings Closed
┃❃│ 🔒 Only Admins can modify settings now!
┃❃╰───────────────
╰═════════════════⊷`;

        return conn.sendMessage(from, { text: layout }, { quoted: fakevCard });
    } catch (e) {
        return conn.sendMessage(from, { text: "❌ Failed to lock settings." }, { quoted: fakevCard });
    }
});

/* =========================================================================================================
   12. UNLOCK GROUP SETTINGS
========================================================================================================= */
cmd({
    pattern: "unlock",
    desc: "Allow all participants to modify group settings",
    category: "group",
    react: "🔓",
    filename: __filename
}, async (conn, mek, m, { from, isGroup, isOwner, reply, sender }) => {
    try {
        if (!isGroup) return conn.sendMessage(from, { text: "❌ This command is only for groups." }, { quoted: fakevCard });
        const { isBotAdmin, isSenderAdmin } = await checkAdminStatus(conn, from, sender);
        if (!isSenderAdmin && !isOwner) return conn.sendMessage(from, { text: "❌ Only admins can use this command." }, { quoted: fakevCard });
        if (!isBotAdmin) return conn.sendMessage(from, { text: "❌ I need to be an admin." }, { quoted: fakevCard });

        await conn.groupSettingUpdate(from, 'unlocked');
        
        const layout = `╭═══ 🔓 *SETTINGS UNLOCKED* ═══⊷
┃❃╭──────────────
┃❃│ 🌐 Status: Settings Opened
┃❃│ 🔓 All participants can modify settings now!
┃❃╰───────────────
╰═════════════════⊷`;

        return conn.sendMessage(from, { text: layout }, { quoted: fakevCard });
    } catch (e) {
        return conn.sendMessage(from, { text: "❌ Failed to unlock settings." }, { quoted: fakevCard });
    }
});

/* =========================================================================================================
   13. AUTO APPROVE SPECIFIC COUNTRY CODE
========================================================================================================= */
cmd({
    pattern: "approvecountry",
    alias: ["autounknown", "addcountry"],
    desc: "Automatically approve specific country users from waitlist",
    category: "group",
    react: "✅",
    filename: __filename
}, async (conn, mek, m, { from, isGroup, isOwner, reply, sender }) => {
    try {
        if (!isGroup) return conn.sendMessage(from, { text: "❌ This command is only for groups." }, { quoted: fakevCard });
        const { isBotAdmin, isSenderAdmin } = await checkAdminStatus(conn, from, sender);
        if (!isSenderAdmin && !isOwner) return conn.sendMessage(from, { text: "❌ Only admins can use this command." }, { quoted: fakevCard });
        if (!isBotAdmin) return conn.sendMessage(from, { text: "❌ I need to be an admin." }, { quoted: fakevCard });

        const response = await conn.groupRequestParticipantsList(from);
        if (!response || response.length === 0) return conn.sendMessage(from, { text: "❌ No participants found in waiting list." }, { quoted: fakevCard });

        const targetCode = config.AUTO_ADD_Country_Code || "92";
        const toAddUsers = response.filter(user => user.jid.startsWith(targetCode));

        if (toAddUsers.length === 0) return conn.sendMessage(from, { text: `❌ No members found with +${targetCode}.` }, { quoted: fakevCard });

        const userJids = toAddUsers.map(user => user.jid);
        await conn.groupRequestParticipantsUpdate(from, userJids, "approve");

        const layout = `╭═══ 🗺️ *COUNTRY APPROVAL* ═══⊷
┃❃╭──────────────
┃❃│ ✅ Auto Approve Executed!
┃❃│ 📌 Approved: ${userJids.length} users
┃❃│ 🌐 Target Code: +${targetCode}
┃❃╰───────────────
╰═════════════════⊷`;

        return conn.sendMessage(from, { text: layout }, { quoted: fakevCard });
    } catch (e) {
        return conn.sendMessage(from, { text: "❌ Error processing country approvals." }, { quoted: fakevCard });
    }
});

/* =========================================================================================================
   14. CREATE POLL (PUBLIC USE) - Polls do not support custom quoted wrappers natively, left direct
========================================================================================================= */
cmd({
    pattern: "poll",
    desc: "Create a group poll for voting",
    category: "group",
    use: ".poll Question | Option1 | Option2",
    react: "📊",
    filename: __filename
}, async (conn, mek, m, { from, isGroup, reply, args }) => {
    try {
        if (!isGroup) return conn.sendMessage(from, { text: "❌ This command can only be used in groups." }, { quoted: fakevCard });
        const match = args.join(" ");
        const [question, ...options] = match.split("|").map(item => item.trim());
        if (!question || options.length < 2) return conn.sendMessage(from, { text: "❌ *Usage:* .poll Question | Option1 | Option2" }, { quoted: fakevCard });

        return await conn.sendMessage(from, { poll: { name: question, values: options, selectableCount: 1 } });
    } catch (error) {
        return conn.sendMessage(from, { text: "❌ Failed to create poll." }, { quoted: fakevCard });
    }
});

/* =========================================================================================================
   15. GET GROUP PROFILE PICTURE (PUBLIC USE)
========================================================================================================= */
cmd({
    pattern: "getpic",
    alias: ["grouppic", "gdp"],
    desc: "Get the current group profile picture",
    category: "group",
    react: "🖼️",
    filename: __filename
}, async (conn, mek, m, { from, isGroup, reply }) => {
    try {
        if (!isGroup) return conn.sendMessage(from, { text: "❌ This command can only be used in groups." }, { quoted: fakevCard });
        const groupPic = await conn.getProfilePicture(from);
        
        const layout = `╭═══ 🖼️ *GROUP DP* ═══⊷
┃❃╭──────────────
┃❃│ 📸 Profile Picture Fetched!
┃❃╰───────────────
╰═════════════════⊷`;

        return await conn.sendMessage(from, { image: { url: groupPic }, caption: layout }, { quoted: fakevCard });
    } catch (e) {
        return conn.sendMessage(from, { text: "❌ Failed to fetch picture (DP might be private or empty)." }, { quoted: fakevCard });
    }
});

/* =========================================================================================================
   16. OPENTIME COMMAND
========================================================================================================= */
cmd({
    pattern: "opentime",
    alias: ["otime"],
    desc: "Automatically open the group after a specified time",
    category: "group",
    react: "🔓",
    filename: __filename
}, async (conn, mek, m, { from, args, isGroup, isOwner, reply, sender, q }) => {
    try {
        if (!isGroup) return conn.sendMessage(from, { text: "❌ This command can only be used in groups." }, { quoted: fakevCard });
        const { isBotAdmin, isSenderAdmin } = await checkAdminStatus(conn, from, sender);
        if (!isSenderAdmin && !isOwner) return conn.sendMessage(from, { text: "❌ Only admins can use this command." }, { quoted: fakevCard });
        if (!isBotAdmin) return conn.sendMessage(from, { text: "❌ I need to be an admin." }, { quoted: fakevCard });

        if (args.length < 2) return conn.sendMessage(from, { text: "❌ *Usage:* .opentime 10 minute" }, { quoted: fakevCard });

        const value = parseInt(args[0]);
        const unit = args[1].toLowerCase();
        let timer = 0;

        if (unit === 'second') timer = value * 1000;
        else if (unit === 'minute') timer = value * 60000;
        else if (unit === 'hour') timer = value * 3600000;
        else if (unit === 'day') timer = value * 86400000;
        else return conn.sendMessage(from, { text: "❌ Invalid unit." }, { quoted: fakevCard });

        const layout = `╭═══ 🔓 *OPENTIME SCHEDULED* ═══⊷
┃❃╭──────────────
┃❃│ ⏳ Timer Set!
┃❃│ 🔓 Group will open after: ${q}
┃❃╰───────────────
╰═════════════════⊷`;

        await conn.sendMessage(from, { text: layout }, { quoted: fakevCard });

        setTimeout(async () => {
            await conn.groupSettingUpdate(from, 'not_announcement');
            const openLayout = `╭═══ 🔓 *GROUP OPENED* ═══⊷
┃❃╭──────────────
┃❃│ 🌐 Status: Unmuted
┃❃│ 🔓 All members can send messages now!
┃❃╰───────────────
╰═════════════════⊷`;
            await conn.sendMessage(from, { text: openLayout });
        }, timer);
    } catch (e) {
        return conn.sendMessage(from, { text: "❌ Error setting time." }, { quoted: fakevCard });
    }
});

/* =========================================================================================================
   17. CLOSETIME COMMAND
========================================================================================================= */
cmd({
    pattern: "closetime",
    alias: ["ctime"],
    desc: "Automatically close the group after a specified time",
    category: "group",
    react: "🔒",
    filename: __filename
}, async (conn, mek, m, { from, args, isGroup, isOwner, reply, sender, q }) => {
    try {
        if (!isGroup) return conn.sendMessage(from, { text: "❌ This command can only be used in groups." }, { quoted: fakevCard });
        const { isBotAdmin, isSenderAdmin } = await checkAdminStatus(conn, from, sender);
        if (!isSenderAdmin && !isOwner) return conn.sendMessage(from, { text: "❌ Only admins can use this command." }, { quoted: fakevCard });
        if (!isBotAdmin) return conn.sendMessage(from, { text: "❌ I need to be an admin." }, { quoted: fakevCard });

        if (args.length < 2) return conn.sendMessage(from, { text: "❌ *Usage:* .closetime 1 hour" }, { quoted: fakevCard });

        const value = parseInt(args[0]);
        const unit = args[1].toLowerCase();
        let timer = 0;

        if (unit === 'second') timer = value * 1000;
        else if (unit === 'minute') timer = value * 60000;
        else if (unit === 'hour') timer = value * 3600000;
        else if (unit === 'day') timer = value * 86400000;
        else return conn.sendMessage(from, { text: "❌ Invalid unit." }, { quoted: fakevCard });

        const layout = `╭═══ 🔒 *CLOSETIME SCHEDULED* ═══⊷
┃❃╭──────────────
┃❃│ ⏳ Timer Set!
┃❃│ 🔒 Group will close after: ${q}
┃❃╰───────────────
╰═════════════════⊷`;

        await conn.sendMessage(from, { text: layout }, { quoted: fakevCard });

        setTimeout(async () => {
            await conn.groupSettingUpdate(from, 'announcement');
            const closeLayout = `╭═══ 🔒 *GROUP CLOSED* ═══⊷
┃❃╭──────────────
┃❃│ ⚠️ Status: Muted
┃❃│ 🔐 Only admins can send messages now!
┃❃╰───────────────
╰═════════════════⊷`;
            await conn.sendMessage(from, { text: closeLayout });
        }, timer);
    } catch (e) {
        return conn.sendMessage(from, { text: "❌ Error setting time." }, { quoted: fakevCard });
    }
});

/* =========================================================================================================
   18. TAGALL COMMAND
========================================================================================================= */
cmd({
    pattern: "tagall",
    alias: ["mentionall", "everyone"],
    desc: "Mention all group members",
    category: "group",
    react: "📣",
    filename: __filename
}, async (conn, mek, m, { from, isGroup, isOwner, reply, sender, args }) => {
    try {
        if (!isGroup) return conn.sendMessage(from, { text: "❌ This command can only be used in groups." }, { quoted: fakevCard });
        const { isSenderAdmin } = await checkAdminStatus(conn, from, sender);
        if (!isSenderAdmin && !isOwner) return conn.sendMessage(from, { text: "❌ Only admins can use this command." }, { quoted: fakevCard });

        const groupMetadata = await conn.groupMetadata(from);
        const members = groupMetadata.participants.map(u => u.id);
        const customMsg = args.join(" ") || "Attention Everyone!";

        let memberTagList = members.map(m => `┃❃│ 👤 @${m.split('@')[0]}`).join('\n');

        const layout = `╭═══ 📣 *GROUP ANNOUNCEMENT* ═══⊷
┃❃╭──────────────
┃❃│ 📢 Message: ${customMsg}
┃❃│ ──────────────
${memberTagList}
┃❃╰───────────────
╰═════════════════⊷`;

        return await conn.sendMessage(from, { text: layout, mentions: members }, { quoted: fakevCard });
    } catch (e) {
        return conn.sendMessage(from, { text: "❌ Failed to tag all." }, { quoted: fakevCard });
    }
});

/* =========================================================================================================
   19. MUTE GROUP
========================================================================================================= */
cmd({
    pattern: "mute",
    alias: ["close", "closegroup"],
    desc: "Close group messages for members",
    category: "group",
    react: "🔒",
    filename: __filename
}, async (conn, mek, m, { from, isGroup, isOwner, reply, sender }) => {
    try {
        if (!isGroup) return conn.sendMessage(from, { text: "❌ This command is only for groups." }, { quoted: fakevCard });
        const { isBotAdmin, isSenderAdmin } = await checkAdminStatus(conn, from, sender);
        if (!isSenderAdmin && !isOwner) return conn.sendMessage(from, { text: "❌ Only admins can use this command." }, { quoted: fakevCard });
        if (!isBotAdmin) return conn.sendMessage(from, { text: "❌ I need to be an admin." }, { quoted: fakevCard });

        await conn.groupSettingUpdate(from, 'announcement');
        
        const layout = `╭═══ 🔒 *GROUP MUTED* ═══⊷
┃❃╭──────────────
┃❃│ ⚠️ Status: Closed
┃❃│ 🔐 Only admins can send messages now!
┃❃╰───────────────
╰═════════════════⊷`;

        return conn.sendMessage(from, { text: layout }, { quoted: fakevCard });
    } catch (e) {
        return conn.sendMessage(from, { text: "❌ Failed to mute group." }, { quoted: fakevCard });
    }
});

/* =========================================================================================================
   20. UNMUTE GROUP
========================================================================================================= */
cmd({
    pattern: "unmute",
    alias: ["open", "opengroup"],
    desc: "Open group messages for all members",
    category: "group",
    react: "🔓",
    filename: __filename
}, async (conn, mek, m, { from, isGroup, isOwner, reply, sender }) => {
    try {
        if (!isGroup) return conn.sendMessage(from, { text: "❌ This command is only for groups." }, { quoted: fakevCard });
        const { isBotAdmin, isSenderAdmin } = await checkAdminStatus(conn, from, sender);
        if (!isSenderAdmin && !isOwner) return conn.sendMessage(from, { text: "❌ Only admins can use this command." }, { quoted: fakevCard });
        if (!isBotAdmin) return conn.sendMessage(from, { text: "❌ I need to be an admin." }, { quoted: fakevCard });

        await conn.groupSettingUpdate(from, 'not_announcement');
        
        const layout = `╭═══ 🔓 *GROUP UNMUTED* ═══⊷
┃❃╭──────────────
┃❃│ 🌐 Status: Opened
┃❃│ 🔓 All members can send messages now!
┃❃╰───────────────
╰═════════════════⊷`;

        return conn.sendMessage(from, { text: layout }, { quoted: fakevCard });
    } catch (e) {
        return conn.sendMessage(from, { text: "❌ Failed to unmute group." }, { quoted: fakevCard });
    }
});

/* =========================================================================================================
   21. PROMOTE USER
========================================================================================================= */
cmd({
    pattern: "promote",
    desc: "Promote a member to admin",
    category: "group",
    react: "🔼",
    filename: __filename
}, async (conn, mek, m, { from, isGroup, isOwner, reply, sender, q }) => {
    try {
        if (!isGroup) return conn.sendMessage(from, { text: "❌ This command is only for groups." }, { quoted: fakevCard });
        const { isBotAdmin, isSenderAdmin } = await checkAdminStatus(conn, from, sender);
        if (!isSenderAdmin && !isOwner) return conn.sendMessage(from, { text: "❌ Only admins can use this command." }, { quoted: fakevCard });
        if (!isBotAdmin) return conn.sendMessage(from, { text: "❌ I need to be an admin." }, { quoted: fakevCard });

        let user = m.quoted ? m.quoted.sender : mek.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || (q ? q.replace(/[^0-9]/g, '') + '@s.whatsapp.net' : null);
        if (!user) return conn.sendMessage(from, { text: "❌ Please reply to a user or tag them." }, { quoted: fakevCard });

        await conn.groupParticipantsUpdate(from, [user], 'promote');
        
        const layout = `╭═══ 🔼 *PROMOTION EXECUTED* ═══⊷
┃❃╭──────────────
┃❃│ 👑 @${user.split('@')[0]} has been promoted to Admin!
┃❃╰───────────────
╰═════════════════⊷`;

        return conn.sendMessage(from, { text: layout, mentions: [user] }, { quoted: fakevCard });
    } catch (e) {
        return conn.sendMessage(from, { text: "❌ Failed to promote." }, { quoted: fakevCard });
    }
});

/* =========================================================================================================
   22. DEMOTE USER
========================================================================================================= */
cmd({
    pattern: "demote",
    desc: "Demote an admin to member",
    category: "group",
    react: "🔽",
    filename: __filename
}, async (conn, mek, m, { from, isGroup, isOwner, reply, sender, q }) => {
    try {
        if (!isGroup) return conn.sendMessage(from, { text: "❌ This command is only for groups." }, { quoted: fakevCard });
        const { isBotAdmin, isSenderAdmin } = await checkAdminStatus(conn, from, sender);
        if (!isSenderAdmin && !isOwner) return conn.sendMessage(from, { text: "❌ Only admins can use this command." }, { quoted: fakevCard });
        if (!isBotAdmin) return conn.sendMessage(from, { text: "❌ I need to be an admin." }, { quoted: fakevCard });

        let user = m.quoted ? m.quoted.sender : mek.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || (q ? q.replace(/[^0-9]/g, '') + '@s.whatsapp.net' : null);
        if (!user) return conn.sendMessage(from, { text: "❌ Please reply to a user or tag them." }, { quoted: fakevCard });

        await conn.groupParticipantsUpdate(from, [user], 'demote');
        
        const layout = `╭═══ 🔽 *DEMOTION EXECUTED* ═══⊷
┃❃╭──────────────
┃❃│ 👤 @${user.split('@')[0]} has been demoted to a regular member!
┃❃╰───────────────
╰═════════════════⊷`;

        return conn.sendMessage(from, { text: layout, mentions: [user] }, { quoted: fakevCard });
    } catch (e) {
        return conn.sendMessage(from, { text: "❌ Failed to demote." }, { quoted: fakevCard });
    }
});

/* =========================================================================================================
   23. DELETE MESSAGE (WITH FIXED AUTO-CLEAN)
========================================================================================================= */
cmd({
    pattern: "del",
    alias: ["delete"],
    desc: "Delete a member's message and auto-delete the command",
    category: "group",
    react: "❌",
    filename: __filename
}, async (conn, mek, m, { from, isGroup, isOwner, reply, sender }) => {
    try {
        if (!isGroup) return conn.sendMessage(from, { text: "❌ This command is only for groups." }, { quoted: fakevCard });
        const { isBotAdmin, isSenderAdmin } = await checkAdminStatus(conn, from, sender);
        if (!isSenderAdmin && !isOwner) return conn.sendMessage(from, { text: "❌ Only admins can use this command." }, { quoted: fakevCard });
        if (!isBotAdmin) return conn.sendMessage(from, { text: "❌ I need to be an admin." }, { quoted: fakevCard });

        const targetMessage = m.quoted || mek.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        if (!targetMessage) return conn.sendMessage(from, { text: "❌ Please reply (Swipe) to the exact message you want to delete." }, { quoted: fakevCard });

        const contextInfo = mek.message?.extendedTextMessage?.contextInfo;
        const memberMsgKey = {
            remoteJid: from,
            fromMe: contextInfo?.participant === conn.user?.id,
            id: contextInfo?.stanzaId,
            participant: contextInfo?.participant
        };
        
        const commandMsgKey = {
            remoteJid: from,
            fromMe: m.key.fromMe,
            id: m.key.id,
            participant: sender
        };

        // First target delete
        await conn.sendMessage(from, { delete: memberMsgKey });
        
        // Second command self-clean delete
        setTimeout(async () => {
            try {
                await conn.sendMessage(from, { delete: commandMsgKey });
            } catch (err) {
                console.error("Auto clean failed:", err);
            }
        }, 400);

    } catch (e) {
        return conn.sendMessage(from, { text: "❌ Failed to delete message." }, { quoted: fakevCard });
    }
});

/* =========================================================================================================
   24. KICK MEMBER COMMAND (ADMIN ONLY)
========================================================================================================= */
cmd({
    pattern: "kick",
    alias: ["remove", "kk"],
    react: "🚷",
    desc: "Kick a member from the group using advanced admin check",
    category: "group",
    use: ".kick (reply or tag)",
    filename: __filename
}, async (conn, mek, m, { from, isGroup, isOwner, reply, sender }) => {
    try {
        if (!isGroup) return conn.sendMessage(from, { text: "❌ This command can only be used in groups." }, { quoted: fakevCard });

        const { isBotAdmin, isSenderAdmin } = await checkAdminStatus(conn, from, sender);

        if (!isSenderAdmin && !isOwner) {
            return conn.sendMessage(from, { text: "❌ Only admins or the owner can use this command." }, { quoted: fakevCard });
        }

        if (!isBotAdmin) {
            return conn.sendMessage(from, { text: "❌ I need to be an admin to kick someone." }, { quoted: fakevCard });
        }

        const quoted = mek.message?.extendedTextMessage?.contextInfo?.participant || 
                       mek.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];

        if (!quoted) return conn.sendMessage(from, { text: "❌ Please reply to a user's message or tag them to kick." }, { quoted: fakevCard });

        await conn.groupParticipantsUpdate(from, [quoted], "remove");
        
        const kickedUser = quoted.split("@")[0];
        
        const layout = `╭═══ 🚷 *MEMBER KICKED* ═══⊷
┃❃╭──────────────
┃❃│ 👤 Removed: @${kickedUser}
┃❃╰───────────────
╰═════════════════⊷`;

        return await conn.sendMessage(from, { 
            text: layout,
            mentions: [quoted]
        }, { quoted: fakevCard });

    } catch (e) {
        console.error("Kick Command Error:", e);
        return conn.sendMessage(from, { text: "❌ Failed to kick user. Something went wrong." }, { quoted: fakevCard });
    }
});
