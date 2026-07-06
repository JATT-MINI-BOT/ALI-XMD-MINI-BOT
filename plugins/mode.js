// plugins/mode.js
const events = require('../aliraza'); 
const { getUserConfigFromMongoDB, updateUserConfigInMongoDB } = require('../lib/database');
const { fakevCard } = require('../lib/fakevCard'); 
const { sendInteractiveButtons } = require('../lib/button_handler'); // لِب فولڈر سے لوڈنگ

events.commands.push({
    pattern: 'mode',
    alias: ['worktype', 'botmode'],
    category: 'owner',
    desc: 'Switch bot working mode between public and private.',
    use: '.mode [public/private]',
    react: '⚙️',
    function: async (conn, mek, m, { from, args, isOwner, reply, botNumber }) => {
        // 1. اونر چیک
        if (!isOwner) {
            return conn.sendMessage(from, { text: "*❌ This command is restricted to the Bot Owner only.*" }, { quoted: fakevCard });
        }

        const targetSessionNumber = botNumber;

        // 2. اگر خالی ڈاٹ موڈ (.mode) لکھا جائے تو خوبصورت بٹنز بھیجیں
        if (!args[0]) {
            const currentConfig = await getUserConfigFromMongoDB(targetSessionNumber);
            const currentMode = currentConfig.WORK_TYPE || "public";
            
            // بٹن کی روز (Rows) کی لسٹ
            const modeButtons = [
                { 
                    title: "📢 Public Mode", 
                    rowId: "setmode_public", 
                    description: "بوٹ کو سب کے لیے اوپن کریں" 
                },
                { 
                    title: "🔒 Private Mode", 
                    rowId: "setmode_private", 
                    description: "بوٹ کو صرف اپنے لیے مخصوص کریں" 
                }
            ];

            // لِب فولڈر والے فنکشن کے ذریعے کسٹم بٹن سینڈ کرنا
            await sendInteractiveButtons(
                conn, 
                from, 
                "⚙️ BOT MODE CONTROLLER", 
                `🤖 *Current Mode:* ${currentMode.toUpperCase()}\n\nنیچے دیے گئے بٹن پر کلک کر کے موڈ تبدیل کریں:`, 
                "Ali Reza XMD", 
                modeButtons, 
                fakevCard
            );
            return;
        }

        const targetMode = args[0].toLowerCase();

        // 3. اگر ڈائریکٹ ٹیکسٹ لکھا ہو تو پرانا لاجک چلے گا
        if (targetMode !== 'public' && targetMode !== 'private') {
            const invalidLayout = `❌ Status: Invalid Mode!\n💡 Use: .mode public (or) .mode private`;
            return conn.sendMessage(from, { text: invalidLayout }, { quoted: fakevCard });
        }

        try {
            const currentConfig = await getUserConfigFromMongoDB(targetSessionNumber);
            currentConfig.WORK_TYPE = targetMode;
            await updateUserConfigInMongoDB(targetSessionNumber, currentConfig);

            const successLayout = `✅ Status: Success!\n🔌 New Mode: ${targetMode.toUpperCase()}`;
            return conn.sendMessage(from, { text: successLayout }, { quoted: fakevCard });

        } catch (error) {
            console.error('Error changing bot mode:', error);
            return conn.sendMessage(from, { text: "*❌ Error:* Failed to update the mode in the database." }, { quoted: fakevCard });
        }
    }
});
