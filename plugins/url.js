const axios = require("axios");
const FormData = require('form-data');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { cmd } = require("../aliraza");
const { fakevCard } = require('../lib/fakevCard'); // Successfully Imported

/* =========================================================================================================
   🖇️ IMAGE TO LIVE URL CONVERTER (DIRECT & STYLISH LAYOUT)
========================================================================================================= */
cmd({
  'pattern': "url",
  'alias': ["imgtourl", "imgurl", "tourl", "geturl", "upload"],
  'react': '🖇️',
  'desc': "Convert image to a direct URL using ImgBB API instantaneously",
  'category': "utility",
  'use': ".tourl (reply to image)",
  'filename': __filename
}, async (client, message, args, { reply, from }) => {
  try {
    
    // 1. Correctly detect if a message is quoted/replied
    const quoted = message.quoted || message.msg?.quoted || message;
    if (!quoted) {
      return client.sendMessage(from, { text: 
`*╭ׂ┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*
*│* ❌ Please reply to an image to generate a link.
*╰┄─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*` 
      }, { quoted: fakevCard });
    }

    let rawMessage = quoted.message || quoted.msg || quoted;
    if (rawMessage && rawMessage.extendedTextMessage?.contextInfo?.quotedMessage) {
        rawMessage = rawMessage.extendedTextMessage.contextInfo.quotedMessage;
    }

    let quotedType = Object.keys(rawMessage)[0];
    let mediaMessage = rawMessage[quotedType];
    let mimeType = mediaMessage?.mimetype || rawMessage?.mimetype || quoted.mimetype || '';

    // Validate that the shared file type is an image
    if (!mimeType.includes('image')) {
      return client.sendMessage(from, { text: 
`*╭ׂ┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*
*│* ❌ ImgBB platform only supports images. Please reply to a valid photo.
*╰┄─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*` 
      }, { quoted: fakevCard });
    }

    // 2. Fetch image buffers from WhatsApp servers
    let mediaBuffer;
    try {
        if (typeof quoted.download === 'function') {
            mediaBuffer = await quoted.download();
        }
    } catch (_) {}

    if (!mediaBuffer || mediaBuffer.length === 0) {
        const cleanType = quotedType.replace('Message', '');
        const stream = await downloadContentFromMessage(mediaMessage || rawMessage, cleanType);
        let chunks = [];
        for await (const chunk of stream) {
            chunks.push(chunk);
        }
        mediaBuffer = Buffer.concat(chunks);
    }

    // 3. ImgBB API Integration using base64 stream format
    const form = new FormData();
    form.append('image', mediaBuffer.toString('base64'));

    const apiKey = "12c813e1c4f7f26870c42c3854a4bd35"; 
    
    const response = await axios.post(`https://api.imgbb.com/1/upload?key=${apiKey}`, form, {
      headers: form.getHeaders(),
      timeout: 15000
    });

    if (!response.data || !response.data.success || !response.data.data?.url) {
      throw new Error("ImgBB server upload failed.");
    }

    const mediaUrl = response.data.data.url;
    const fileSizeKB = parseFloat((mediaBuffer.length / 1024).toFixed(2));

    // 4. Beautiful Box Layout Output with fakevCard Quote
    const responseText = `*╭ׂ┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*
*│ ╌─̇─̣⊰⚡ 𝐈𝐌𝐀𝐆𝐄 𝐓𝐎 𝐔𝐑𝐋 ⊱┈─̇─̣╌*
*│─̇─̣┄┄┄┄┄┄┄┄┄┄┄┄┄─̇─̣*
*│* 🟢 Status: SUCCESS
*│* 📦 File Size: ${fileSizeKB} KB
*│* 🔗 Link: ${mediaUrl}
*╰┄─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*`;

    return await client.sendMessage(from, { text: responseText }, { quoted: fakevCard });

  } catch (error) {
    console.error("Tourl Command Error:", error);
    return client.sendMessage(from, { text: 
`*╭ׂ┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*
*│* ❌ Error: ${error.message || error}
*╰┄─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*` 
    }, { quoted: fakevCard });
  }
});
