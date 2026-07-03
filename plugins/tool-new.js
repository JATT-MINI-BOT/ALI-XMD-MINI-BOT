const { sleep } = require('../lib/functions');
const { cmd, commands } = require('../aliraza');
const { fakevCard } = require('../lib/fakevCard'); // Successfully Imported

cmd({
    pattern: "rcolor",
    desc: "Generate a random color with name and code.",
    category: "utility",
    filename: __filename,
}, 
async (conn, mek, m, { from, reply }) => {
    try {
        const colorNames = [
            "Red", "Green", "Blue", "Yellow", "Orange", "Purple", "Pink", "Brown", "Black", "White", 
            "Gray", "Cyan", "Magenta", "Violet", "Indigo", "Teal", "Lavender", "Turquoise"
        ];
        
        const randomColorHex = "#" + Math.floor(Math.random()*16777215).toString(16);
        const randomColorName = colorNames[Math.floor(Math.random() * colorNames.length)];

        const layout = `*╭ׂ┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*
*│ ╌─̇─̣⊰🎨 𝐑𝐀𝐍𝐃𝐎𝐌 𝐂𝐎𝐋𝐎𝐑 ⊱┈─̇─̣╌*
*│─̇─̣┄┄┄┄┄┄┄┄┄┄┄┄┄─̇─̣*
*│* 📝 Name: ${randomColorName}
*│* 🔣 Code: ${randomColorHex}
*╰┄─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*`;

        await conn.sendMessage(from, { text: layout }, { quoted: fakevCard });
    } catch (e) {
        console.error("Error in .randomcolor command:", e);
        await conn.sendMessage(from, { text: "❌ An error occurred while generating the color." }, { quoted: fakevCard });
    }
});

cmd({
    pattern: "binary",
    desc: "Convert text into binary format.",
    category: "utility",
    filename: __filename,
}, 
async (conn, mek, m, { from, args, reply }) => {
    try {
        if (!args.length) {
            return conn.sendMessage(from, { text: 
`*╭ׂ┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*
*│* ❌ Please provide text to convert to binary.
*╰┄─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*` 
            }, { quoted: fakevCard });
        }

        const textToConvert = args.join(" ");
        const binaryText = textToConvert.split('').map(char => {
            return `00000000${char.charCodeAt(0).toString(2)}`.slice(-8);
        }).join(' ');

        const layout = `*╭ׂ┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*
*│ ╌─̇─̣⊰🔑 𝐓𝐄𝐗𝐓 𝐓𝐎 𝐁𝐈𝐍𝐀𝐑𝐘 ⊱┈─̇─̣╌*
*│─̇─̣┄┄┄┄┄┄┄┄┄┄┄┄┄─̇─̣*
*│* ${binaryText}
*╰┄─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*`;

        await conn.sendMessage(from, { text: layout }, { quoted: fakevCard });
    } catch (e) {
        console.error("Error in .binary command:", e);
        await conn.sendMessage(from, { text: "❌ An error occurred during conversion." }, { quoted: fakevCard });
    }
});

cmd({
    pattern: "dbinary",
    desc: "Decode binary string into text.",
    category: "utility",
    filename: __filename,
}, 
async (conn, mek, m, { from, args, reply }) => {
    try {
        if (!args.length) {
            return conn.sendMessage(from, { text: 
`*╭ׂ┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*
*│* ❌ Please provide a binary string to decode.
*╰┄─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*` 
            }, { quoted: fakevCard });
        }

        const binaryString = args.join(" ");
        const textDecoded = binaryString.split(' ').map(bin => {
            return String.fromCharCode(parseInt(bin, 2));
        }).join('');

        const layout = `*╭ׂ┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*
*│ ╌─̇─̣⊰🔓 𝐃𝐄𝐂𝐎𝐃𝐄 𝐁𝐈𝐍𝐀𝐑𝐘 ⊱┈─̇─̣╌*
*│─̇─̣┄┄┄┄┄┄┄┄┄┄┄┄┄─̇─̣*
*│* Text: ${textDecoded}
*╰┄─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*`;

        await conn.sendMessage(from, { text: layout }, { quoted: fakevCard });
    } catch (e) {
        console.error("Error in .binarydecode command:", e);
        await conn.sendMessage(from, { text: "❌ An error occurred during decoding." }, { quoted: fakevCard });
    }
});

cmd({
    pattern: "base64",
    desc: "Encode text into Base64 format.",
    category: "utility",
    filename: __filename,
}, 
async (conn, mek, m, { from, args, reply }) => {
    try {
        if (!args.length) {
            return conn.sendMessage(from, { text: 
`*╭ׂ┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*
*│* ❌ Please provide text to encode into Base64.
*╰┄─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*` 
            }, { quoted: fakevCard });
        }

        const textToEncode = args.join(" ");
        const encodedText = Buffer.from(textToEncode).toString('base64');
        
        const layout = `*╭ׂ┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*
*│ ╌─̇─̣⊰🔑 𝐄𝐍𝐂𝐎𝐃𝐄 𝐁𝐀𝐒𝐄𝟔𝟒 ⊱┈─̇─̣╌*
*│─̇─̣┄┄┄┄┄┄┄┄┄┄┄┄┄─̇─̣*
*│* ${encodedText}
*╰┄─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*`;

        await conn.sendMessage(from, { text: layout }, { quoted: fakevCard });
    } catch (e) {
        console.error("Error in .base64 command:", e);
        await conn.sendMessage(from, { text: "❌ An error occurred during encoding." }, { quoted: fakevCard });
    }
});

cmd({
    pattern: "unbase64",
    desc: "Decode Base64 encoded text.",
    category: "utility",
    filename: __filename,
}, 
async (conn, mek, m, { from, args, reply }) => {
    try {
        if (!args.length) {
            return conn.sendMessage(from, { text: 
`*╭ׂ┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*
*│* ❌ Please provide Base64 text to decode.
*╰┄─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*` 
            }, { quoted: fakevCard });
        }

        const base64Text = args.join(" ");
        const decodedText = Buffer.from(base64Text, 'base64').toString('utf-8');
        
        const layout = `*╭ׂ┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*
*│ ╌─̇─̣⊰🔓 𝐃𝐄𝐂𝐎𝐃𝐄 𝐁𝐀𝐒𝐄𝟔𝟒 ⊱┈─̇─̣╌*
*│─̇─̣┄┄┄┄┄┄┄┄┄┄┄┄┄─̇─̣*
*│* Text: ${decodedText}
*╰┄─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*`;

        await conn.sendMessage(from, { text: layout }, { quoted: fakevCard });
    } catch (e) {
        console.error("Error in .unbase64 command:", e);
        await conn.sendMessage(from, { text: "❌ An error occurred during decoding." }, { quoted: fakevCard });
    }
});

cmd({
    pattern: "urlencode",
    desc: "Encode text into URL encoding.",
    category: "utility",
    filename: __filename,
}, 
async (conn, mek, m, { from, args, reply }) => {
    try {
        if (!args.length) {
            return conn.sendMessage(from, { text: 
`*╭ׂ┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*
*│* ❌ Please provide text to URL encode.
*╰┄─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*` 
            }, { quoted: fakevCard });
        }

        const textToEncode = args.join(" ");
        const encodedText = encodeURIComponent(textToEncode);

        const layout = `*╭ׂ┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*
*│ ╌─̇─̣⊰🔑 𝐔𝐑𝐋 𝐄𝐍𝐂𝐎𝐃𝐄 ⊱┈─̇─̣╌*
*│─̇─̣┄┄┄┄┄┄┄┄┄┄┄┄┄─̇─̣*
*│* ${encodedText}
*╰┄─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*`;

        await conn.sendMessage(from, { text: layout }, { quoted: fakevCard });
    } catch (e) {
        console.error("Error in .urlencode command:", e);
        await conn.sendMessage(from, { text: "❌ An error occurred during encoding." }, { quoted: fakevCard });
    }
});

cmd({
    pattern: "urldecode",
    desc: "Decode URL encoded text.",
    category: "utility",
    filename: __filename,
}, 
async (conn, mek, m, { from, args, reply }) => {
    try {
        if (!args.length) {
            return conn.sendMessage(from, { text: 
`*╭ׂ┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*
*│* ❌ Please provide URL encoded text to decode.
*╰┄─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*` 
            }, { quoted: fakevCard });
        }

        const encodedText = args.join(" ");
        const decodedText = decodeURIComponent(encodedText);

        const layout = `*╭ׂ┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*
*│ ╌─̇─̣⊰🔓 𝐔𝐑𝐋 𝐃𝐄𝐂𝐎𝐃𝐄 ⊱┈─̇─̣╌*
*│─̇─̣┄┄┄┄┄┄┄┄┄┄┄┄┄─̇─̣*
*│* Text: ${decodedText}
*╰┄─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*`;

        await conn.sendMessage(from, { text: layout }, { quoted: fakevCard });
    } catch (e) {
        console.error("Error in .urldecode command:", e);
        await conn.sendMessage(from, { text: "❌ An error occurred during decoding." }, { quoted: fakevCard });
    }
});

cmd({
    pattern: "roll",
    desc: "Roll a dice (1-6).",
    category: "fun",
    filename: __filename,
}, 
async (conn, mek, m, { from, reply }) => {
    try {
        const result = Math.floor(Math.random() * 6) + 1;
        
        const layout = `*╭ׂ┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*
*│ ╌─̇─̣⊰🎲 𝐃𝐈𝐂𝐄 𝐑𝐎𝐋𝐋 ⊱┈─̇─̣╌*
*│─̇─̣┄┄┄┄┄┄┄┄┄┄┄┄┄─̇─̣*
*│* 🎰 Result: *${result}*
*╰┄─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*`;

        await conn.sendMessage(from, { text: layout }, { quoted: fakevCard });
    } catch (e) {
        console.error("Error in .roll command:", e);
        await conn.sendMessage(from, { text: "❌ An error occurred while rolling." }, { quoted: fakevCard });
    }
}); 

cmd({
    pattern: "coinflip",
    desc: "Flip a coin and get Heads or Tails.",
    category: "fun",
    filename: __filename,
}, 
async (conn, mek, m, { from, reply }) => {
    try {
        const result = Math.random() < 0.5 ? "Heads" : "Tails";
        
        const layout = `*╭ׂ┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*
*│ ╌─̇─̣⊰🪙 𝐂𝐎𝐈𝐍 𝐅𝐋𝐈𝐏 ⊱┈─̇─̣╌*
*│─̇─̣┄┄┄┄┄┄┄┄┄┄┄┄┄─̇─̣*
*│* 🎰 Result: *${result}*
*╰┄─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*`;

        await conn.sendMessage(from, { text: layout }, { quoted: fakevCard });
    } catch (e) {
        console.error("Error in .coinflip command:", e);
        await conn.sendMessage(from, { text: "❌ An error occurred while flipping." }, { quoted: fakevCard });
    }
});

cmd({
    pattern: "flip",
    desc: "Flip the text you provide.",
    category: "fun",
    filename: __filename,
}, 
async (conn, mek, m, { from, args, reply }) => {
    try {
        if (!args.length) {
            return conn.sendMessage(from, { text: 
`*╭ׂ┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*
*│* ❌ Please provide text to flip.
*╰┄─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*` 
            }, { quoted: fakevCard });
        }

        const flippedText = args.join(" ").split('').reverse().join('');
        
        const layout = `*╭ׂ┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*
*│ ╌─̇─̣⊰🔄 𝐑𝐄𝐕𝐄𝐑𝐒𝐄 𝐓𝐄𝐗𝐓 ⊱┈─̇─̣╌*
*│─̇─̣┄┄┄┄┄┄┄┄┄┄┄┄┄─̇─̣*
*│* Text: ${flippedText}
*╰┄─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*`;

        await conn.sendMessage(from, { text: layout }, { quoted: fakevCard });
    } catch (e) {
        console.error("Error in .flip command:", e);
        await conn.sendMessage(from, { text: "❌ An error occurred." }, { quoted: fakevCard });
    }
});

cmd({
    pattern: "pick",
    desc: "Pick between two choices.",
    category: "fun",
    filename: __filename,
}, 
async (conn, mek, m, { from, args, reply }) => {
    try {
        if (args.length < 2) {
            return conn.sendMessage(from, { text: 
`*╭ׂ┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*
*│* ❌ Please provide choices separated by comma.
*│* 💡 Ex: .pick Option1, Option2
*╰┄─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*` 
            }, { quoted: fakevCard });
        }

        const option = args.join(" ").split(',')[Math.floor(Math.random() * 2)].trim();
        
        const layout = `*╭ׂ┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*
*│ ╌─̇─̣⊰🎉 𝐑𝐀𝐍𝐃𝐎𝐌 𝐏𝐈𝐂𝐊𝐄𝐑 ⊱┈─̇─̣╌*
*│─̇─̣┄┄┄┄┄┄┄┄┄┄┄┄┄─̇─̣*
*│* 🤖 Bot Picks: *${option}*
*╰┄─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*`;

        await conn.sendMessage(from, { text: layout }, { quoted: fakevCard });
    } catch (e) {
        console.error("Error in .pick command:", e);
        await conn.sendMessage(from, { text: "❌ An error occurred." }, { quoted: fakevCard });
    }
});

cmd({
    pattern: "timenow",
    desc: "Check the current local time.",
    category: "utility",
    filename: __filename,
}, 
async (conn, mek, m, { from, reply }) => {
    try {
        const now = new Date();
        const localTime = now.toLocaleTimeString("en-US", { 
            hour: "2-digit", 
            minute: "2-digit", 
            second: "2-digit", 
            hour12: true,
            timeZone: "Asia/Karachi"
        });
        
        const layout = `*╭ׂ┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*
*│ ╌─̇─̣⊰🕒 𝐋𝐈𝐕𝐄 𝐂𝐋𝐎𝐂𝐊 ⊱┈─̇─̣╌*
*│─̇─̣┄┄┄┄┄┄┄┄┄┄┄┄┄─̇─̣*
*│* ⏰ Time (PK): ${localTime}
*╰┄─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*`;

        await conn.sendMessage(from, { text: layout }, { quoted: fakevCard });
    } catch (e) {
        console.error("Error in .timenow command:", e);
        await conn.sendMessage(from, { text: "❌ An error occurred." }, { quoted: fakevCard });
    }
});

cmd({
    pattern: "date",
    desc: "Check the current date.",
    category: "utility",
    filename: __filename,
}, 
async (conn, mek, m, { from, reply }) => {
    try {
        const now = new Date();
        const currentDate = now.toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric"
        });
        
        const layout = `*╭ׂ┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*
*│ ╌─̇─̣⊰📅 𝐃𝐀𝐓𝐄 𝐒𝐓𝐀𝐓𝐔𝐒 ⊱┈─̇─̣╌*
*│─̇─̣┄┄┄┄┄┄┄┄┄┄┄┄┄─̇─̣*
*│* 📅 Today: ${currentDate}
*╰┄─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*`;

        await conn.sendMessage(from, { text: layout }, { quoted: fakevCard });
    } catch (e) {
        console.error("Error in .date command:", e);
        await conn.sendMessage(from, { text: "❌ An error occurred." }, { quoted: fakevCard });
    }
});

cmd({
    pattern: "shapar",
    desc: "Send shapar ASCII art with mentions.",
    category: "fun",
    filename: __filename,
}, 
async (conn, mek, m, { from, isGroup, reply }) => {
    try {
        if (!isGroup) {
            return conn.sendMessage(from, { text: 
`*╭ׂ┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*
*│* ❌ This command can only be used in groups.
*╰┄─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*` 
            }, { quoted: fakevCard });
        }

        const mentionedUser = m.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        if (!mentionedUser) {
            return conn.sendMessage(from, { text: 
`*╭ׂ┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*
*│* ❌ Please mention a user to send the Shapar art.
*╰┄─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*` 
            }, { quoted: fakevCard });
        }

        const asciiArt = `
          _______
       .-'       '-.
      /           /|
     /           / |
    /___________/  |
    |   _______ |  |
    |  |  \\ \\  ||  |
    |  |   \\ \\ ||  |
    |  |____\\ \\||  |
    |  '._  _.'||  |
    |    .' '.  ||  |
    |   '.___.' ||  |
    |___________||  |
    '------------'  |
     \\_____________\\|`;

        const layout = `*╭ׂ┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*
*│ ╌─̇─̣⊰😂 𝐒𝐇𝐀𝐏𝐀𝐑 𝐆𝐈𝐅𝐓 ⊱┈─̇─̣╌*
*│─̇─̣┄┄┄┄┄┄┄┄┄┄┄┄┄─̇─̣*
*│* 😂 @${mentionedUser.split("@")[0]}!
*│* For You:
*│* ${asciiArt}
*╰┄─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*`;

        await conn.sendMessage(from, {
            text: layout,
            mentions: [mentionedUser],
        }, { quoted: fakevCard });

    } catch (e) {
        console.error("Error in .shapar command:", e);
        await conn.sendMessage(from, { text: "❌ An error occurred." }, { quoted: fakevCard });
    }
});

cmd({
    pattern: "rate",
    desc: "Rate someone out of 10.",
    category: "fun",
    filename: __filename,
}, 
async (conn, mek, m, { from, isGroup, reply }) => {
    try {
        if (!isGroup) {
            return conn.sendMessage(from, { text: 
`*╭ׂ┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*
*│* ❌ This command can only be used in groups.
*╰┄─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*` 
            }, { quoted: fakevCard });
        }

        const mentionedUser = m.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        if (!mentionedUser) {
            return conn.sendMessage(from, { text: 
`*╭ׂ┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*
*│* ❌ Please mention someone to rate.
*╰┄─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*` 
            }, { quoted: fakevCard });
        }

        const randomRating = Math.floor(Math.random() * 10) + 1;
        
        const layout = `*╭ׂ┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*
*│ ╌─̇─̣⊰📈 𝐁𝐎𝐓 𝐑𝐀𝐓𝐈𝐍𝐆 ⊱┈─̇─̣╌*
*│─̇─̣┄┄┄┄┄┄┄┄┄┄┄┄┄─̇─̣*
*│* 👤 Target: @${mentionedUser.split("@")[0]}
*│* ⭐ Rating: *${randomRating}/10*
*╰┄─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*`;

        await conn.sendMessage(from, { text: layout, mentions: [mentionedUser] }, { quoted: fakevCard });
    } catch (e) {
        console.error("Error in .rate command:", e);
        await conn.sendMessage(from, { text: "❌ An error occurred." }, { quoted: fakevCard });
    }
});

cmd({
    pattern: "countx",
    desc: "Start a reverse countdown from the specified number to 1.",
    category: "owner",
    filename: __filename
},
async (conn, mek, m, { from, args, reply, senderNumber }) => {
    try {
        const botOwner = conn.user.id.split(":")[0];
        if (senderNumber !== botOwner) {
            return conn.sendMessage(from, { text: 
`*╭ׂ┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*
*│* ❌ Only the bot owner can use this command.
*╰┄─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*` 
            }, { quoted: fakevCard });
        }

        if (!args[0]) {
            return conn.sendMessage(from, { text: 
`*╭ׂ┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*
*│* 💡 Example: .countx 10
*╰┄─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*` 
            }, { quoted: fakevCard });
        }

        const count = parseInt(args[0].trim());
        if (isNaN(count) || count <= 0 || count > 50) {
            return conn.sendMessage(from, { text: 
`*╭ׂ┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*
*│* ❌ Please specify a valid number between 1 and 50.
*╰┄─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*` 
            }, { quoted: fakevCard });
        }

        const initialLayout = `*╭ׂ┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*
*│ ╌─̇─̣⊰⏳ 𝐂𝐎𝐔𝐍𝐓𝐃𝐎𝐖𝐍 𝐗 ⊱┈─̇─̣╌*
*│─̇─̣┄┄┄┄┄┄┄┄┄┄┄┄┄─̇─̣*
*│* ⏳ Starting reverse count from ${count}...
*╰┄─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*`;
        await conn.sendMessage(from, { text: initialLayout }, { quoted: fakevCard });

        for (let i = count; i >= 1; i--) {
            await conn.sendMessage(from, { text: `*👉 [ ${i} ]*` }, { quoted: fakevCard });
            await sleep(1000);
        }

        await conn.sendMessage(from, { text: "✅ *Countdown Completed.*" }, { quoted: fakevCard });
    } catch (e) {
        console.error(e);
        await conn.sendMessage(from, { text: "❌ An error occurred." }, { quoted: fakevCard });
    }
});

cmd({
    pattern: "count",
    desc: "Start a countdown from 1 to the specified number.",
    category: "owner",
    filename: __filename
},
async (conn, mek, m, { from, args, reply, senderNumber }) => {
    try {
        const botOwner = conn.user.id.split(":")[0];
        if (senderNumber !== botOwner) {
            return conn.sendMessage(from, { text: 
`*╭ׂ┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*
*│* ❌ Only the bot owner can use this command.
*╰┄─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*` 
            }, { quoted: fakevCard });
        }

        if (!args[0]) {
            return conn.sendMessage(from, { text: 
`*╭ׂ┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*
*│* 💡 Example: .count 10
*╰┄─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*` 
            }, { quoted: fakevCard });
        }

        const count = parseInt(args[0].trim());
        if (isNaN(count) || count <= 0 || count > 50) {
            return conn.sendMessage(from, { text: 
`*╭ׂ┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*
*│* ❌ Please specify a valid number between 1 and 50.
*╰┄─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*` 
            }, { quoted: fakevCard });
        }

        const initialLayout = `*╭ׂ┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*
*│ ╌─̇─̣⊰⏳ 𝐂𝐎𝐔𝐍𝐓𝐃𝐎𝐖𝐍 𝐔𝐏 ⊱┈─̇─̣╌*
*│─̇─̣┄┄┄┄┄┄┄┄┄┄┄┄┄─̇─̣*
*│* ⏳ Starting countdown up to ${count}...
*╰┄─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*`;
        await conn.sendMessage(from, { text: initialLayout }, { quoted: fakevCard });

        for (let i = 1; i <= count; i++) {
            await conn.sendMessage(from, { text: `*👉 [ ${i} ]*` }, { quoted: fakevCard });
            await sleep(1000);
        }

        await conn.sendMessage(from, { text: "✅ *Countdown Completed.*" }, { quoted: fakevCard });
    } catch (e) {
        console.error(e);
        await conn.sendMessage(from, { text: "❌ An error occurred." }, { quoted: fakevCard });
    }
});

cmd({
    pattern: "calculate",
    alias: ["calc"],
    desc: "Evaluate a mathematical expression.",
    category: "utilities",
    filename: __filename
},
async (conn, mek, m, { from, args, reply }) => {
    try {
        if (!args[0]) {
            return conn.sendMessage(from, { text: 
`*╭ׂ┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*
*│* 💡 Example: .calculate 5+3*2
*╰┄─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*` 
            }, { quoted: fakevCard });
        }

        const expression = args.join(" ").trim();

        if (!/^[0-9+\-*/().\s]+$/.test(expression)) {
            return conn.sendMessage(from, { text: 
`*╭ׂ┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*
*│* ❌ Invalid expression. Numbers and basic operators only.
*╰┄─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*` 
            }, { quoted: fakevCard });
        }

        let result;
        try {
            result = eval(expression);
        } catch (e) {
            return conn.sendMessage(from, { text: 
`*╭ׂ┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*
*│* ❌ Calculation Error. Check your expression.
*╰┄─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*` 
            }, { quoted: fakevCard });
        }

        const layout = `*╭ׂ┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*
*│ ╌─̇─̣⊰🧮 𝐂𝐀𝐋𝐂𝐔𝐋𝐀𝐓𝐎𝐑 ⊱┈─̇─̣╌*
*│─̇─̣┄┄┄┄┄┄┄┄┄┄┄┄┄─̇─̣*
*│* 📝 Input: \`${expression}\`
*│*
*│* ✅ Result: *${result}*
*╰┄─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*`;

        await conn.sendMessage(from, { text: layout }, { quoted: fakevCard });
    } catch (e) {
        console.error(e);
        await conn.sendMessage(from, { text: "❌ An error occurred." }, { quoted: fakevCard });
    }
});
