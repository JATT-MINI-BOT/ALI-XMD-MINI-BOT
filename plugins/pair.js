const { cmd } = require('../aliraza');
const config = require('../config');
const axios = require('axios');

// Global store for pairing codes (if needed for logs or track)
global.pairingCodes = global.pairingCodes || new Map();

cmd({
    pattern: "pair",
    alias: ["pairing", "paircode"],
    desc: "Fetch WhatsApp pairing code from API with native copy button",
    category: "tools",
    react: "⚡"
},
async (conn, mek, m, { from, q, reply }) => {
    try {
        // 1. Check if number is provided
        if (!q) return await reply("⚡ *ᴘʟᴇᴀsᴇ ᴘʀᴏᴠɪᴅᴇ ᴀ ɴᴜᴍʙᴇʀ!*\n\n*ᴜsᴀɢᴇ:* .pair 92333xxxxxxx");

        // 2. Clean the input number
        const number = q.replace(/[^0-9]/g, '');
        if (number.length < 10) {
            await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
            return await reply("❌ *ɪɴᴠᴀʟɪᴅ ɴᴜᴍʙᴇʀ ғᴏʀᴍᴀᴛ!*");
        }

        // Loading reaction
        await conn.sendMessage(from, { react: { text: '⏳', key: mek.key } });

        // 3. Fetch Pairing Code from API
        const apiUrl = `https://fake-ff55425cf4ef.herokuapp.com/code?number=${number}`;
        const response = await axios.get(apiUrl);
        const data = response.data;

        if (data && data.code) {
            // Store code globally (with 5-minute auto cleanup)
            const codeId = `code_${Date.now()}`;
            global.pairingCodes.set(codeId, {
                code: data.code,
                number: number,
                timestamp: Date.now()
            });

            setTimeout(() => {
                global.pairingCodes.delete(codeId);
            }, 5 * 60 * 1000);

            // 4. Craft the Message Layout
            const message = `🪐 *ҒΔHᎠII ᎷᎠ*
───────────────
⚡ *ᴡʜᴀᴛsᴀᴘᴘ ᴘᴀɪʀɪɴɢ*
───────────────

👤 *ᴛᴀʀɢᴇᴛ ɪɴғᴏ*
• *ɴᴜᴍʙᴇʀ:* \`+${number}\`
• *sᴛᴀᴛᴜs:* \`sᴜᴄᴄᴇssғᴜʟ\`

🔑 *ᴘᴀɪʀɪɴɢ ᴄᴏᴅᴇ*
 
   »  *\`${data.code}\`* «

───────────────
💡 _Tap the button below to instantly copy the code._
👉 _Enter this code in your linked devices screen._
───────────────`;

            // 5. BestBaileys Supported Template/CTA Buttons Structure
            const buttonMessage = {
                text: message,
                footer: 'Powered by FAMOFC',
                templateButtons: [
                    {
                        index: 1,
                        urlButton: {
                            displayText: '📋 Copy Pairing Code',
                            // Native WhatsApp API format for 1-click clipboard copy
                            url: `https://www.whatsapp.com/otp/copy/${data.code}`
                        }
                    },
                    {
                        index: 2,
                        urlButton: {
                            displayText: '🔗 Join Channel',
                            url: 'https://whatsapp.com/channel/0029VbAnF9Q9hXFERv7Stc2v'
                        }
                    }
                ],
                headerType: 1
            };

            // 6. Send the payload
            await conn.sendMessage(from, buttonMessage, { quoted: m });
            
            // Success reaction
            await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });

        } else if (data && data.status === 'already_connected') {
            await reply("❌ *This number is already linked/connected!*");
            await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        } else {
            await reply("❌ *Failed to generate pairing code from server.*");
            await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        }

    } catch (e) {
        console.error(e);
        await reply("❌ *Server Unreachable or Connection Timeout!*");
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
    }
});
