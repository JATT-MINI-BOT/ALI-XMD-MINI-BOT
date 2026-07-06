// lib/button_handler.js
// یہ فائل "travatiger/BestBaileys" پیکیج کے تحت بٹنز کو فل سپورٹ کرتی ہے

/**
 * کسٹم انٹرایکٹو لسٹ بٹن بھیجنے کا فکسڈ فنکشن
 */
async function sendInteractiveButtons(conn, from, title, text, footer, rowsArray = [], quoted = null) {
    // روز (Rows) کو اس لائبریری کے مطلوبہ فارمیٹ میں سیٹ کرنا
    const formattedButtons = rowsArray.map(row => ({
        buttonId: row.rowId,
        buttonText: {
            displayText: row.title
        },
        type: 1
    }));

    // بٹن میسج کا اسٹرکچر جو BestBaileys پر 100٪ رینڈر ہوتا ہے
    const buttonMessage = {
        text: text,
        footer: footer,
        buttons: formattedButtons,
        headerType: 1
    };

    return await conn.sendMessage(from, buttonMessage, { quoted });
}

module.exports = { sendInteractiveButtons };
