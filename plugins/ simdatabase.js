const { cmd } = require('../aliraza');
const axios = require('axios');
const config = require('../config');
const { getUserConfigFromMongoDB } = require('../lib/database');
const { fakevCard } = require('../lib/fakevCard');

// Multi-user cache: key = "botNumber_field"
const dbCache = new Map();

async function loadConfig(botNumber) {
    const cacheKey = `${botNumber}_config`;

    let currentBotName = config.BOT_NAME || "ALI XMD MINI BOT";
    let globalBotFooter = config.BOT_FOOTER || "POWERED BY ALI RAZA";
    let menuChannelJid = '120363408542979632@newsletter';
    let menuChannelName = 'ALI RAZA';

    if (dbCache.has(cacheKey)) {
        const cached = dbCache.get(cacheKey);
        if (cached.USER_BOT_NAME) currentBotName = cached.USER_BOT_NAME;
        if (cached.USER_BOT_FOOTER) globalBotFooter = cached.USER_BOT_FOOTER;
        if (cached.MENU_CHANNEL_JID) menuChannelJid = cached.MENU_CHANNEL_JID;
        if (cached.MENU_CHANNEL_NAME) menuChannelName = cached.MENU_CHANNEL_NAME;

        // Background refresh
        getUserConfigFromMongoDB(botNumber).then(fresh => {
            if (fresh) dbCache.set(cacheKey, fresh);
        }).catch(() => {});
    } else {
        try {
            const dbConfig = await getUserConfigFromMongoDB(botNumber);
            if (dbConfig) {
                dbCache.set(cacheKey, dbConfig);
                if (dbConfig.USER_BOT_NAME) currentBotName = dbConfig.USER_BOT_NAME;
                if (dbConfig.USER_BOT_FOOTER) globalBotFooter = dbConfig.USER_BOT_FOOTER;
                if (dbConfig.MENU_CHANNEL_JID) menuChannelJid = dbConfig.MENU_CHANNEL_JID;
                if (dbConfig.MENU_CHANNEL_NAME) menuChannelName = dbConfig.MENU_CHANNEL_NAME;
            }
        } catch (e) {
            console.error("DB load error:", e);
        }
    }

    return { currentBotName, globalBotFooter, menuChannelJid, menuChannelName };
}

function getChannelContext(jid, name, sender) {
    return {
        contextInfo: {
            forwardingScore: 999,
            isForwarded: true,
            mentionedJid: [sender],
            forwardedNewsletterMessageInfo: {
                newsletterJid: jid,
                newsletterName: name,
                serverMessageId: 2
            }
        }
    };
}

cmd({
    pattern: "simdatabase",
    alias: ["simdata", "pkdata", "numberinfo"],
    desc: "Search Pakistan database by phone number",
    category: "tools",
    react: "🔍",
    filename: __filename
}, async (conn, mek, m, { from, q, reply, botNumber }) => {
    try {
        if (!q) return await reply("Please provide a phone number!\n\nExample: .simdata 3336504197");

        await conn.sendMessage(from, { react: { text: '⏳', key: mek.key } });

        const number = q.replace(/[^0-9]/g, '');
        if (number.length < 10) {
            await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
            return await reply("Please provide a valid phone number!\n\nMinimum 10 digits required.");
        }

        const { currentBotName, globalBotFooter, menuChannelJid, menuChannelName } = await loadConfig(botNumber);

        const api = `https://fam-official.serv00.net/api/famdatabase.php?number=${number}`;
        const res = await axios.get(api);
        const json = res.data;

        if (!json.success || !json.data || json.data.records_count === 0) {
            await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
            return await reply("No records found for this number!");
        }

        const { records_count, records } = json.data;
        const record = records[0];

        const message = `*╭ׂ┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*
*│ ╌─̇─̣┈⊰ ₊‧.°.⋆${currentBotName}•˚₊‧⋆. ⊱┈─̇─̣*
*│─̇─̣┄┄┄┄┄┄┄┄┄┄┄┄┄─̇─̣─᛭*
*│* 🔍 *DATABASE SEARCH*
*│*
*│* 📱 *NUMBER:* ${number}
*│* 📊 *RECORDS FOUND:* ${records_count}
*╰┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*

*╭ׂ┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*
*│* 👤 *NAME:* ${record.full_name}
*│* 📞 *PHONE:* ${record.phone}
*│* 🆔 *CNIC:* ${record.cnic}
*│* 📍 *ADDRESS:* ${record.address}
*╰┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*

*_${globalBotFooter}_*`;

        const channelContext = getChannelContext(menuChannelJid, menuChannelName, m.sender);

        await conn.sendMessage(from, {
            text: message,
            ...channelContext
        }, { quoted: fakevCard });

        await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });

    } catch (e) {
        console.error("simdata Error:", e);
        await reply("Error occurred! Please try again.");
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
    }
});

cmd({
    pattern: "cnicdata",
    alias: ["cnicinfo", "cnicsearch", "idcard"],
    desc: "Search all SIMs by CNIC number",
    category: "tools",
    react: "🆔",
    filename: __filename
}, async (conn, mek, m, { from, q, reply, botNumber }) => {
    try {
        if (!q) return await reply("Please provide a CNIC number!\n\nExample: .cnicdata 35202-1234567-8");

        await conn.sendMessage(from, { react: { text: '⏳', key: mek.key } });

        let cnic = q.replace(/[^0-9]/g, '');
        if (cnic.length !== 13) {
            await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
            return await reply("Invalid CNIC!\n\nCNIC must be 13 digits.");
        }

        const { currentBotName, globalBotFooter, menuChannelJid, menuChannelName } = await loadConfig(botNumber);

        const firstApi = `https://fam-official.serv00.net/api/famdatabase.php?number=${cnic}`;
        const firstRes = await axios.get(firstApi);
        const firstJson = firstRes.data;

        if (!firstJson.success || !firstJson.data || firstJson.data.records_count === 0) {
            await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
            return await reply("No records found for this CNIC!");
        }

        const allNumbers = new Set();
        firstJson.data.records.forEach(rec => {
            if (rec.phone) allNumbers.add(rec.phone.replace(/[^0-9]/g, ''));
        });

        const uniqueNumbers = Array.from(allNumbers);
        if (uniqueNumbers.length === 0) {
            await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
            return await reply("No phone numbers found linked to this CNIC!");
        }

        let allRecords = [];
        for (const num of uniqueNumbers) {
            try {
                const api = `https://fam-official.serv00.net/api/famdatabase.php?number=${num}`;
                const res = await axios.get(api);
                const json = res.data;
                if (json.success && json.data && json.data.records_count > 0) {
                    json.data.records.forEach(rec => allRecords.push(rec));
                }
            } catch (err) {
                console.log(`Skip number ${num}:`, err.message);
            }
        }

        const seen = new Set();
        allRecords = allRecords.filter(rec => {
            const key = rec.cnic + rec.phone;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });

        if (allRecords.length === 0) {
            await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
            return await reply("No detailed records found!");
        }

        let message = `*╭ׂ┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*
*│ ╌─̇─̣┈⊰ ₊‧.°.⋆${currentBotName}•˚₊‧⋆. ⊱┈─̇─̣*
*│─̇─̣┄┄┄┄┄┄┄┄┄┄┄┄┄─̇─̣─᛭*
*│* 🆔 *CNIC DATABASE SEARCH*
*│*
*│* 🆔 *CNIC:* ${cnic}
*│* 📊 *TOTAL SIMS:* ${allRecords.length}
*╰┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*\n\n`;

        for (let i = 0; i < allRecords.length; i++) {
            const rec = allRecords[i];
            message += `*╭ׂ┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*
*│* 📱 *SIM ${i + 1}*
*│─̇─̣┄┄┄┄┄┄┄┄┄┄┄┄┄─̇─̇─᛭*̣
*│* 👤 *NAME:* ${rec.full_name || 'N/A'}
*│* 📞 *PHONE:* ${rec.phone || 'N/A'}
*│* 🆔 *CNIC:* ${rec.cnic || 'N/A'}
*│* 📍 *ADDRESS:* ${rec.address || 'N/A'}
*╰┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*\n\n`;
        }
 `*_${globalBotFooter}_*`;

        const channelContext = getChannelContext(menuChannelJid, menuChannelName, m.sender);

        await conn.sendMessage(from, {
            text: message,
            ...channelContext
        }, { quoted: fakevCard });

        await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });

    } catch (e) {
        console.error("cnicdata Error:", e);
        await reply("Error occurred! Please try again.");
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
    }
});
