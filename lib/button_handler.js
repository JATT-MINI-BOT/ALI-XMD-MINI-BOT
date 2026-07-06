// lib/button_handler.js
// یہ فائل بغیر کسی بیرونی پیکیج کے نیٹیو طریقے سے بٹن میسج تیار کرتی ہے

/**
 * انٹرایکٹو لسٹ بٹن بھیجنے کا کسٹم فنکشن
 * @param {object} conn - واٹس ایپ ساکٹ کنکشن
 * @param {string} from - گروپ یا چیٹ آئی ڈی
 * @param {string} title - ہیڈر کا ٹائٹل
 * @param {string} text - میسج کا متن
 * @param {string} footer - فوٹر ٹیکسٹ
 * @param {array} rowsArray - بٹنز کی روز (Rows)
 * @param {object} quoted - جس میسج کا رپلائی بنانا ہے
 */
async function sendInteractiveButtons(conn, from, title, text, footer, rowsArray = [], quoted = null) {
    const buttonMessage = {
        viewOnceMessage: {
            message: {
                interactiveMessage: {
                    header: { 
                        title: title, 
                        hasMediaAttachment: false 
                    },
                    body: { 
                        text: text 
                    },
                    footer: { 
                        text: footer 
                    },
                    action: {
                        buttonSubmitText: "آپشن منتخب کریں (Select Option)",
                        sections: [
                            { 
                                title: "Available Choices", 
                                rows: rowsArray 
                            }
                        ]
                    }
                }
            }
        }
    };
    return await conn.sendMessage(from, buttonMessage, { quoted });
}

module.exports = { sendInteractiveButtons };
