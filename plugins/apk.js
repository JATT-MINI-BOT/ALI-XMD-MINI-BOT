const axios = require("axios");
const { cmd } = require("../aliraza"); 
const config = require("../config");
const { getUserConfigFromMongoDB } = require("../lib/database");
const { fakevCard } = require("../lib/fakevCard");

cmd({
    pattern: "apk",
    alias: ["app", "playstore", "application"],
    react: "📱",
    desc: "Download APK files via cloud base layout",
    category: "download",
    use: ".apk <app name>",
    filename: __filename
}, 
async (conn, mek, m, { from, args, reply, botNumber }) => {
    try {
        const query = args.join(" ");
        if (!query) {
            const noLinkCaption = `*╭ׂ┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*
*│ ╌─̇─̣⊰📱 𝐀𝐏𝐊 𝐃𝐎𝐖𝐍𝐋𝐎𝐀𝐃𝐄𝐑 ⊱┈─̇─̣╌*
*│─̇─̣┄┄┄┄┄┄┄┄┄┄┄┄┄─̇─̣*
*│* ❌ Please Provide Me An App Name
*│* 💡 Use: .apk <app name>
*╰┄─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*`;
            return conn.sendMessage(from, { text: noLinkCaption }, { quoted: fakevCard });
        }

        await conn.sendMessage(from, { react: { text: "⏳", key: m.key } });

        // Fetch live bot name and footer configurations from MongoDB
        let currentBotName = "𝑨𝑳𝑰 𝑿𝑴𝑫 𝑴𝑰𝑵𝑰 𝑩𝑶𝑻";
        let globalBotFooter = config.BOT_FOOTER || "©ᴘᴏᴡᴇʀᴇ ʙʏ ᴀʟɪ ʀᴀᴢᴀ";

        try {
            const userDbConfig = await getUserConfigFromMongoDB(botNumber);
            if (userDbConfig) {
                if (userDbConfig.USER_BOT_NAME) currentBotName = userDbConfig.USER_BOT_NAME;
                if (userDbConfig.USER_BOT_FOOTER) globalBotFooter = userDbConfig.USER_BOT_FOOTER;
            }
        } catch (dbError) {
            console.error("Failed to fetch custom settings from DB in apk:", dbError);
        }

        const apiUrl = `http://ws75.aptoide.com/api/7/apps/search/query=${encodeURIComponent(query)}/limit=1`;
        const { data } = await axios.get(apiUrl);

        if (!data || !data.datalist || !data.datalist.list.length) {
            await conn.sendMessage(from, { react: { text: "❌", key: m.key } });
            return conn.sendMessage(from, { text: 
`*╭ׂ┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*
*│* ❌ APK Not Found! Try a different name.
*╰┄─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*` 
            }, { quoted: fakevCard });
        }

        const app = data.datalist.list[0];
        const appSize = (app.size / 1048576).toFixed(2);
        const apkUrl = app.file.path || app.file.path_alt;

        // Beautiful Box Layout design frame for APK Details
        const apkCaption = `*╭ׂ┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*
*│ ╌─̇─̣⊰📱 𝐀𝐏𝐊 𝐃𝐎𝐖𝐍𝐋𝐎𝐀𝐃𝐄𝐑 ⊱┈─̇─̣╌*
*│─̇─̣┄┄┄┄┄┄┄┄┄┄┄┄┄─̇─̣*
*│* 📛 Name: *${app.name.toUpperCase()}*
*│* 📦 Size: *${appSize} MB*
*│* 🔢 Version: *${app.file.vername}*
*│* 🤖 Bot: ${currentBotName}
*╰┄─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*

> _${globalBotFooter}_ 🔰`;

        // 1️⃣ Send the application icon with layout in caption
        const sentStatus = await conn.sendMessage(from, {
            image: { url: app.icon || 'https://up6.cc/2026/05/177971006919991.png' },
            caption: apkCaption
        }, { quoted: fakevCard });

        if (!apkUrl) {
            await conn.sendMessage(from, { react: { text: "❌", key: m.key } });
            return conn.sendMessage(from, { text: 
`*╭ׂ┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*
*│* ❌ APK download link could not be fetched!
*╰┄─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*` 
            }, { quoted: sentStatus });
        }

        // 2️⃣ Send the actual document file replying to the icon message
        await conn.sendMessage(from, {
            document: { url: apkUrl },
            mimetype: "application/vnd.android.package-archive",
            fileName: `${app.name.toUpperCase()}.apk`
        }, { quoted: sentStatus });

        await conn.sendMessage(from, { react: { text: "✅", key: m.key } });

    } catch (err) {
        console.error("APK DOWNLOAD ERROR:", err);
        conn.sendMessage(from, { text: 
`*╭ׂ┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*
*│* ❌ An error occurred while processing the APK download.
*╰┄─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*` 
        }, { quoted: fakevCard });
        await conn.sendMessage(from, { react: { text: "❌", key: m.key } });
    }
});
