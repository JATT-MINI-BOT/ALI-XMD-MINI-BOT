const events = require('../aliraza');
const config = require('../config');
const { fakevCard } = require('../lib/fakevCard'); // Imported

events.commands.push({
    pattern: "dp",
    alias: ["getpp", "profile"],
    desc: "Fetch profile picture of a user.",
    category: "download",
    react: "⏳",
    use: "<reply/mention>",
    filename: __filename,
    function: async (conn, mek, m, { from, isGroup, sender, reply }) => {
        try {
            let target;
            
            // 1. Check if user is mentioned
            if (mek.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
                target = mek.message.extendedTextMessage.contextInfo.mentionedJid[0];
            } 
            // 2. Check if replied to a message
            else if (mek.message?.extendedTextMessage?.contextInfo?.participant) {
                target = mek.message.extendedTextMessage.contextInfo.participant;
            } 
            // 3. Default to sender/group target
            else {
                target = isGroup ? (mek.key.participant || mek.participant) : from;
            }

            if (!target) target = sender;

            let ppUrl;
            try {
                // Try fetching high-quality picture
                ppUrl = await conn.profilePictureUrl(target, 'image');
            } catch (e) {
                try {
                    // Fallback to preview picture
                    ppUrl = await conn.profilePictureUrl(target, 'preview');
                } catch (e2) {
                    // Fallback to default avatar
                    ppUrl = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png';
                }
            }

            // Exact layout copy with no script errors or word modifications
            const layout = `*╭ׂ┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*
*│ ╌─̇─̣⊰ 🖼️ 𝐔𝐒𝐄𝐑 𝐏𝐑𝐎𝐅𝐈𝐋𝐄 ⊱┈─̇─̣╌*
*│─̇─̣┄┄┄┄┄┄┄┄┄┄┄┄┄─̇─̣*
*│✅ 𝐒𝐭𝐚𝐭𝐮𝐬:* Picture Fetched!
*│👤 𝐔𝐬𝐞𝐫:* @${target.split('@')[0]}
*╰┄─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*`;

            // Send image with your original stylized layout caption and fakevCard quoting
            await conn.sendMessage(from, { 
                image: { url: ppUrl }, 
                caption: layout,
                mentions: [target]
            }, { quoted: fakevCard });

        } catch (error) {
            console.error("DP Command Error:", error);
            conn.sendMessage(from, { text: "❌ Error: Could not process DP command." }, { quoted: fakevCard });
        }
    }
});
