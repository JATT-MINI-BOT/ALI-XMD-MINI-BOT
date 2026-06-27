const { cmd } = require("../aliraza");

// Delay function to pause execution for 1 second
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Expanded Emoji sets with more emojis added for longer animations
const arrays = {
    cry: ['😢', '😭', '😪', '😥', '😭', '🥺', '😭', '💧', '💔', '😭'],
    cuddle: ['🤗', '🫂', '🧸', '🥰', '❤️', '💖', '🤗', '💝', '💗', '🥰'],
    bully: ['😈', '😤', '😡', '🤬', '👊', '👿', '😈', '🖕', '💥', '😈'],
    hug: ['🤗', '🫂', '❤️', '🥰', '💖', '✨', '🫂', '💝', '💗', '🫂'],
    awoo: ['🐺', '🦊', '🌙', '🐾', '🐺', '🐾', '🐺', '🌕', '🐾', '🐺'],
    lick: ['👅', '😋', '😜', '🤪', '🍭', '👅', '😋', '🍦', '😜', '👅'],
    pat: ['🫂', '🤝', '👋', '😊', '✨', '🫂', '😌', '👋', '🌸', '😊'],
    smug: ['😏', '😎', '😜', '😏', '😈', '😏', '😏', '👑', '😎', '😏'],
    bonk: ['🔨', '💥', '🤕', '🤕', '🔨', '💥', '🚑', '🤕', '🔨'],
    yeet: ['💨', '🏃', '✈️', '🚀', '💨', '☄️', '🌌', '💥', '💨'],
    blush: ['😊', '😳', '🥰', '😚', '💖', '😊', '🙈', '🌸', '🌹', '😳'],
    handhold: ['🤝', '👭', '👫', '🧑‍🤝‍🧑', '❤️', '🤝', '💝', '💍', '👫', '🤝'],
    highfive: ['✋', '🙌', '👏', '⚡', '✋', '🔥', '🙌', '✨', '✋'],
    nom: ['🍽️', '😋', '🍔', '🍕', '🍰', '🍽️', '🍩', '🍿', '😋', '🍽️'],
    wave: ['👋', '🙋', '✨', '👋', '☀️', '🌸', '🙋', '👋'],
    smile: ['😁', '😄', '😀', '🌟', '😁', '✨', '🎈', '☀️', '😄', '😁'],
    wink: ['😉', '😜', '✨', '😉', '💫', '😏', '😜', '😉'],
    happy: ['😊', '🥳', '🎉', '💖', '🌟', '😊', '🎈', '🎁', '🤩', '🥳'],
    glomp: ['🤗', '🫂', '🚀', '❤️', '🤗', '✨', '💥', '💖', '🫂', '🤗'],
    bite: ['🦷', '😬', '🍎', '🦷', '🥩', '💥', '😬', '🦷'],
    cringe: ['😬', '😰', '🤦', '🙄', '😬', '🤮', '🤦‍♂️', '🤷', '🙄', '😬'],
    dance: ['💃', '🕺', '🎶', '🎵', '💃', '🕺', '🕴️', '🎸', '🎹', '💃'],
    kill: ['🔪', '🩸', '💀', '☠️', '🔪', '⚰️', '🥀', '💀', '🔪'],
    slap: ['✊', '💥', '🤕', '🖐️', '✊', '💥', '👋', '🥊', '🤕', '🖐️'],
    kiss: ['😘', '💋', '❤️', '💖', '🥰', '🌹', '💋', '💝', '💌', '😘']
};

// Helper function to build animated commands
function createAnimatedCmd(pattern, desc, react, category = "fun") {
    cmd(
        {
            pattern: pattern,
            desc: desc,
            category: category,
            react: react,
            filename: __filename,
            use: "@tag (optional)"
        },
        async (conn, mek, m, { from }) => {
            try {
                let mentionedUser = m.mentionedJid?.[0] || (mek.quoted && mek.quoted.sender);

                // Create custom text prefix based on tags
                let actionText = "";
                if (mentionedUser) {
                    actionText = `@${mentionedUser.split("@")[0]} `;
                }

                const emojiList = arrays[pattern] || ['✨'];

                // Send initial message as standard text
                let initialMessage = await conn.sendMessage(from, {
                    text: `${actionText}${emojiList[0]}`,
                    mentions: mentionedUser ? [mentionedUser] : []
                }, { quoted: mek });

                // Loop and edit message every 1 second with expanded emoji list
                for (let i = 1; i < emojiList.length; i++) {
                    await delay(1000);

                    await conn.sendMessage(from, {
                        text: `${actionText}${emojiList[i]}`,
                        edit: initialMessage.key,
                        mentions: mentionedUser ? [mentionedUser] : []
                    });
                }
            } catch (error) {
                console.error(`❌ Error in .${pattern} command:`, error);
            }
        }
    );
}

// Automatically register all commands with animation logic
createAnimatedCmd("cry", "Send a crying reaction animation.", "😢");
createAnimatedCmd("cuddle", "Send a cuddle reaction animation.", "🤗");
createAnimatedCmd("bully", "Send a bully reaction animation.", "😈");
createAnimatedCmd("hug", "Send a hug reaction animation.", "🤗");
createAnimatedCmd("awoo", "Send an awoo reaction animation.", "🐺");
createAnimatedCmd("lick", "Send a lick reaction animation.", "👅");
createAnimatedCmd("pat", "Send a pat reaction animation.", "🫂");
createAnimatedCmd("smug", "Send a smug reaction animation.", "😏");
createAnimatedCmd("bonk", "Send a bonk reaction animation.", "🔨");
createAnimatedCmd("yeet", "Send a yeet reaction animation.", "💨");
createAnimatedCmd("blush", "Send a blush reaction animation.", "😊");
createAnimatedCmd("handhold", "Send a hand-holding reaction animation.", "🤝");
createAnimatedCmd("highfive", "Send a high-five reaction animation.", "✋");
createAnimatedCmd("nom", "Send a nom reaction animation.", "🍽️");
createAnimatedCmd("wave", "Send a wave reaction animation.", "👋");
createAnimatedCmd("smile", "Send a smile reaction animation.", "😁");
createAnimatedCmd("wink", "Send a wink reaction animation.", "😉");
createAnimatedCmd("happy", "Send a happy reaction animation.", "😊");
createAnimatedCmd("glomp", "Send a glomp reaction animation.", "🤗");
createAnimatedCmd("bite", "Send a bite reaction animation.", "🦷");
createAnimatedCmd("cringe", "Send a cringe reaction animation.", "😬");
createAnimatedCmd("dance", "Send a dance reaction animation.", "💃");
createAnimatedCmd("kill", "Send a kill reaction animation.", "🔪");
createAnimatedCmd("slap", "Send a slap reaction animation.", "✊");
createAnimatedCmd("kiss", "Send a kiss reaction animation.", "💋");
