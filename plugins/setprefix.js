// plugins/setprefix.js
const events = require('../aliraza');
const { getUserConfigFromMongoDB, updateUserConfigInMongoDB } = require('../lib/database');
const config = require('../config');
const { fakevCard } = require('../lib/fakevCard'); // Successfully Imported

events.commands.push({
    pattern: 'setprefix',
    category: 'owner',
    desc: 'Change the bot prefix or set it to blank/no prefix mode.',
    use: '.setprefix [symbol / blank]',
    react: '⚙️',
    function: async (conn, mek, m, { from, args, isOwner, reply, botNumber }) => {
        // 1. Owner Validation Check
        if (!isOwner) {
            return conn.sendMessage(from, { text: "*❌ Error:* This command is restricted to the Bot Owner only." }, { quoted: fakevCard });
        }

        const targetSessionNumber = botNumber;

        // 2. Argument Validation Check
        if (!args[0]) {
            const currentPrefix = config.PREFIX || 'None (Blank Mode)';
            const usageLayout = `*╭ׂ┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*
*│ ╌─̇─̣⊰💡 𝐁𝐎𝐓 𝐏𝐑𝐄𝐅𝐈𝐗 𝐒𝐓𝐀𝐓𝐔𝐒 ⊱┈─̇─̣╌*
*│─̇─̣┄┄┄┄┄┄┄┄┄┄┄┄┄─̇─̣*
*│* ⚙️ Current: \`${currentPrefix}\`
*│*
*│* 📝 Cmd: .setprefix
*│* 💡 Use: .setprefix [symbol / blank]
*│* 📝 Ex: .setprefix #
*│* 📝 Ex: .setprefix blank
*╰┄─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*`;
            return conn.sendMessage(from, { text: usageLayout }, { quoted: fakevCard });
        }

        let newPrefix = args[0];

        try {
            // 3. Fetch current configuration from MongoDB
            const userConfig = await getUserConfigFromMongoDB(targetSessionNumber);

            // 4. Handle Blank/No Prefix Mode
            if (newPrefix.toLowerCase() === 'blank') {
                userConfig.PREFIX = '';
                config.PREFIX = ''; 
                await updateUserConfigInMongoDB(targetSessionNumber, userConfig);

                const blankLayout = `*╭ׂ┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*
*│ ╌─̇─̣⊰⚙️ 𝐏𝐑𝐄𝐅𝐈𝐗 𝐔𝐏𝐃𝐀𝐓𝐄𝐃 ⊱┈─̇─̣╌*
*│─̇─̣┄┄┄┄┄┄┄┄┄┄┄┄┄─̇─̣*
*│* ✅ Status: Success!
*│* 🔌 Mode: BLANK MODE
*│* 💡 Note: No prefix required now.
*╰┄─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*`;
                return conn.sendMessage(from, { text: blankLayout }, { quoted: fakevCard });
            }

            // 5. Handle Custom Symbol Prefix
            userConfig.PREFIX = newPrefix;
            config.PREFIX = newPrefix; 
            await updateUserConfigInMongoDB(targetSessionNumber, userConfig);

            const successLayout = `*╭ׂ┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*
*│ ╌─̇─̣⊰⚙️ 𝐏𝐑𝐄𝐅𝐈𝐗 𝐔𝐏𝐃𝐀𝐓𝐄𝐃 ⊱┈─̇─̣╌*
*│─̇─̣┄┄┄┄┄┄┄┄┄┄┄┄┄─̇─̣*
*│* ✅ Status: Success!
*│* 🔣 New Prefix: \`${newPrefix}\`
*╰┄─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*`;
            return conn.sendMessage(from, { text: successLayout }, { quoted: fakevCard });

        } catch (error) {
            console.error('Error updating prefix configuration:', error);
            return conn.sendMessage(from, { text: "*❌ Error:* Failed to update the prefix setting in the database." }, { quoted: fakevCard });
        }
    }
});
