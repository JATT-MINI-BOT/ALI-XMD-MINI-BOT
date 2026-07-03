// plugins/mode.js
const events = require('../aliraza'); 
const { getUserConfigFromMongoDB, updateUserConfigInMongoDB } = require('../lib/database');
const { fakevCard } = require('../lib/fakevCard'); // Successfully Imported

events.commands.push({
    pattern: 'mode',
    alias: ['worktype', 'botmode'],
    category: 'owner',
    desc: 'Switch bot working mode between public and private.',
    use: '.mode [public/private]',
    react: '⚙️',
    function: async (conn, mek, m, { from, args, isOwner, reply, botNumber }) => {
        // 1. Authorization check
        if (!isOwner) {
            return conn.sendMessage(from, { text: "*❌ This command is restricted to the Bot Owner only.*" }, { quoted: fakevCard });
        }

        // Fixed to sync with central message handler logic using botNumber
        const targetSessionNumber = botNumber;

        // 2. Status inquiry if no argument provided
        if (!args[0]) {
            const currentConfig = await getUserConfigFromMongoDB(targetSessionNumber);
            const currentMode = currentConfig.WORK_TYPE || "public";
            
            const usageLayout = `*╭ׂ┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*
*│ ╌─̇─̣⊰💡 𝐁𝐎𝐓 𝐌𝐎𝐃𝐄 𝐒𝐓𝐀𝐓𝐔𝐒 ⊱┈─̇─̣╌*
*│─̇─̣┄┄┄┄┄┄┄┄┄┄┄┄┄─̇─̣*
*│* 🤖 Mode: ${currentMode.toUpperCase()}
*│*
*│* 📝 Cmd: .mode
*│* 💡 Use: .mode public/private
*│* 📝 Ex: .mode public
*╰┄─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*`;
            return conn.sendMessage(from, { text: usageLayout }, { quoted: fakevCard });
        }

        const targetMode = args[0].toLowerCase();

        // 3. Input validation
        if (targetMode !== 'public' && targetMode !== 'private') {
            const invalidLayout = `*╭ׂ┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*
*│ ╌─̇─̣⊰💡 𝐂𝐎𝐌𝐌𝐀𝐍𝐃 𝐔𝐒𝐀𝐆𝐄 ⊱┈─̇─̣╌*
*│─̇─̣┄┄┄┄┄┄┄┄┄┄┄┄┄─̇─̣*
*│* ❌ Status: Invalid Mode!
*│*
*│* 💡 Use: .mode public  (or)  .mode private
*╰┄─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*`;
            return conn.sendMessage(from, { text: invalidLayout }, { quoted: fakevCard });
        }

        try {
            // 4. Update the key inside user database configurations
            const currentConfig = await getUserConfigFromMongoDB(targetSessionNumber);
            currentConfig.WORK_TYPE = targetMode;

            await updateUserConfigInMongoDB(targetSessionNumber, currentConfig);

            const successLayout = `*╭ׂ┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*
*│ ╌─̇─̣⊰⚙️ 𝐌𝐎𝐃𝐄 𝐔𝐏𝐃𝐀𝐓𝐄𝐃 ⊱┈─̇─̣╌*
*│─̇─̣┄┄┄┄┄┄┄┄┄┄┄┄┄─̇─̣*
*│* ✅ Status: Success!
*│* 🔌 New Mode: ${targetMode.toUpperCase()}
*╰┄─̣┄─̇─̣┄─̇─̣┄─̇─̣┄─̇─̣─̇─̣─᛭*`;
            return conn.sendMessage(from, { text: successLayout }, { quoted: fakevCard });

        } catch (error) {
            console.error('Error changing bot mode:', error);
            return conn.sendMessage(from, { text: "*❌ Error:* Failed to update the mode in the database." }, { quoted: fakevCard });
        }
    }
});
