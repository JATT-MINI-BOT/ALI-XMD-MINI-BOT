const mongoose = require('mongoose');
const config = require('../config');

const connectdb = async () => {
    try {
        mongoose.set('strictQuery', false);
        await mongoose.connect(config.MONGODB_URI, {
            maxPoolSize: 15, // Expanded pool size for handling up to 50 bots parallel threads
            serverSelectionTimeoutMS: 8000, 
            socketTimeoutMS: 45000,
            bufferCommands: false 
        });
        console.log("✅ Database Connected Successfully");
    } catch (e) {
        console.error("❌ Database Connection Failed:", e.message);
    }
};

const alirazaSessionSchema = new mongoose.Schema({
    number: { type: String, required: true, unique: true, index: true },
    credentials: { type: Object, required: true },
    serverName: { type: String, default: 'server1', index: true }, 
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const alirazaConfigSchema = new mongoose.Schema({
    number: { type: String, required: true, unique: true, index: true },
    config: {
        PREFIX: { type: String, default: '.' }, 
        WORK_TYPE: { type: String, default: 'public' }, 
        AUTO_RECORDING: { type: String, default: 'false' },
        AUTO_TYPING: { type: String, default: 'false' },
        ANTI_CALL: { type: String, default: 'false' },
        ANTI_LINK: { type: String, default: 'false' },
        ANTI_EDIT: { type: String, default: 'false' }, // 👈 ایڈٹ شدہ میسج ٹریکر کے لیے شامل کیا گیا
        REJECT_MSG: { type: String, default: '*🔕 ʏۆʀ ᴄᴀʟʟ ᴡᴀs ᴀᴜᴛۆᴍᴀᴛɪᴄᴀʟʟʏ ʀᴇᴊᴇᴄﺘᴇᴅ..!*' },
        READ_MESSAGE: { type: String, default: 'false' },
        AUTO_REACT: { type: String, default: 'false' },
        AUTO_REPLY: { type: String, default: 'false' },
        AUTO_VIEW_STATUS: { type: String, default: 'false' },
        AUTO_LIKE_STATUS: { type: String, default: 'false' }, // 👈 آٹو لائک اسٹیٹس فیچر
        AUTO_STATUS_REPLY: { type: String, default: 'false' },
        AUTO_STATUS_MSG: { type: String, default: 'Hello from ALI RAZA 🔥' },
        AUTO_LIKE_EMOJI: { type: Array, default: ['❤️', '👍', '😮', '😎', '🔥', '✨'] }, // 👈 اپڈیٹڈ ایموجی لسٹ
        ANTIDELETE: { type: String, default: 'false' },
        ALWAYS_ONLINE: { type: String, default: 'false' }, // 👈 آلویز آن لائن فیلڈ
        USER_BOT_NAME: { type: String, default: '' },
        USER_IMAGE_PATH: { type: String, default: '' },
        USER_BOT_FOOTER: { type: String, default: '' },
        MENU_CHANNEL_JID: { type: String, default: '120363408542979632@newsletter' },
        MENU_CHANNEL_NAME: { type: String, default: '⏤.ۗۗۗۗۗۗۗۗۗ.❥≛⃝ 𝘼𝐿𝙓 Rᴀᴢ Raza🍁⃝➤ ' }
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const alirazaOtpSchema = new mongoose.Schema({
    number: { type: String, required: true, index: true },
    otp: { type: String, required: true },
    config: { type: Object, required: true },
    expiresAt: { type: Date, default: () => new Date(Date.now() + 5 * 60000), index: { expires: '5m' } },
    createdAt: { type: Date, default: Date.now }
});

const alirazaActiveNumberSchema = new mongoose.Schema({
    number: { type: String, required: true, unique: true, index: true },
    serverName: { type: String, default: 'server1', index: true }, 
    lastConnected: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },
    connectionInfo: { ip: String, userAgent: String, timestamp: Date }
});

const alirazaStatsSchema = new mongoose.Schema({
    number: { type: String, required: true },
    date: { type: String, required: true }, 
    commandsUsed: { type: Number, default: 0 },
    messagesReceived: { type: Number, default: 0 },
    messagesSent: { type: Number, default: 0 },
    groupsInteracted: { type: Number, default: 0 }
});

// 🎯 گروپ سپیسیفک سیٹنگز کے اسکیما کو اینٹی ڈیلیٹ 2 (antidelete2) کے لیے اپڈیٹ کیا گیا ہے
const alirazaGroupSettingsSchema = new mongoose.Schema({
    botNumber: { type: String, required: true, index: true },
    groupId: { type: String, required: true, index: true },
    antilink2: { type: Boolean, default: false },
    antidelete2: { type: Boolean, default: false } // 👈 گروپ مخصوص اینٹی ڈیلیٹ لاجک فیلڈ
});
alirazaGroupSettingsSchema.index({ botNumber: 1, groupId: 1 }, { unique: true });

const Session = mongoose.model('AlirazaSession', alirazaSessionSchema);
const UserConfig = mongoose.model('AlirazaConfig', alirazaConfigSchema);
const OTP = mongoose.model('AlirazaOTP', alirazaOtpSchema);
const ActiveNumber = mongoose.model('AlirazaActiveNumber', alirazaActiveNumberSchema);
const Stats = mongoose.model('AlirazaStats', alirazaStatsSchema);
const GroupSetting = mongoose.model('AlirazaGroupSetting', alirazaGroupSettingsSchema);

async function saveSessionToMongoDB(number, credentials) {
    try {
        const cleanNumber = number.replace(/[^0-9]/g, '');
        const currentServer = process.env.SERVER_NAME || 'server1'; 
        await Session.findOneAndUpdate(
            { number: cleanNumber },
            { 
                credentials: credentials, 
                serverName: currentServer, 
                updatedAt: new Date() 
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        return true;
    } catch (error) { return false; }
}

async function getSessionFromMongoDB(number) {
    try {
        const cleanNumber = number.replace(/[^0-9]/g, '');
        const session = await Session.findOne({ number: cleanNumber });
        return session ? { ...session.credentials, serverName: session.serverName } : null;
    } catch (error) { return null; }
}

async function deleteSessionFromMongoDB(number) {
    try {
        const cleanNumber = number.replace(/[^0-9]/g, '');
        await Session.deleteOne({ number: cleanNumber });
        await ActiveNumber.deleteOne({ number: cleanNumber });
        return true;
    } catch (error) { return false; }
}

// 🔥 کسٹمر لاگ آؤٹ ڈیپ کلین فنکشن: مکمل طور پر وائپ آؤٹ کرتا ہے تاکہ نیا فلیٹ اکاؤنٹ بن سکے
async function completelyWipeUserFromMongoDB(number) {
    try {
        const cleanNumber = number.replace(/[^0-9]/g, '');
        
        await UserConfig.deleteOne({ number: cleanNumber });
        await Session.deleteOne({ number: cleanNumber });
        await ActiveNumber.deleteOne({ number: cleanNumber });
        await Stats.deleteMany({ number: cleanNumber });
        await GroupSetting.deleteMany({ botNumber: cleanNumber });
        await OTP.deleteMany({ number: cleanNumber });
        
        return true;
    } catch (error) {
        return false;
    }
}

async function getUserConfigFromMongoDB(number) {
    try {
        const cleanNumber = number.replace(/[^0-9]/g, '');
        const defaultConfig = {
            PREFIX: '.', WORK_TYPE: 'public', AUTO_RECORDING: 'false', AUTO_TYPING: 'false',
            ANTI_CALL: 'false', ANTI_LINK: 'false', ANTI_EDIT: 'false',
            REJECT_MSG: '*🔕 ʏۆʀ ᴄᴀʟʟ ᴡᴀs ᴀᴜᴛۆᴍᴀᴛɪᴄᴀʟʟ ʀᴇᴊᴇᴄﺘᴇᴅ..!*', READ_MESSAGE: 'false',
            AUTO_VIEW_STATUS: 'false', AUTO_LIKE_STATUS: 'false', AUTO_STATUS_REPLY: 'false',
            AUTO_STATUS_MSG: 'Hello from ALI RAZA 🔥', AUTO_LIKE_EMOJI: ['❤️', '👍', '😮', '😎', '🔥', '✨'],
            AUTO_REACT: 'false', AUTO_REPLY: 'false', ANTIDELETE: 'false', ALWAYS_ONLINE: 'false',
            USER_BOT_NAME: '', USER_IMAGE_PATH: '', USER_BOT_FOOTER: '', 
            MENU_CHANNEL_JID: '120363408542979632@newsletter', MENU_CHANNEL_NAME: '⏤.ۗۗۗۗۗۗۗۗۗ.❥≛⃝ 𝘼𝐿𝙓 Rᴀᴢ Raza🍁⃝➤ '
        };

        const configData = await UserConfig.findOneAndUpdate(
            { number: cleanNumber },
            { $setOnInsert: { number: cleanNumber, config: defaultConfig } },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        return configData.config;
    } catch (error) { return {}; }
}

async function updateUserConfigInMongoDB(number, newConfig) {
    try {
        const cleanNumber = number.replace(/[^0-9]/g, '');
        await UserConfig.findOneAndUpdate(
            { number: cleanNumber },
            { config: newConfig, updatedAt: new Date() },
            { upsert: true, new: true }
        );
        return true;
    } catch (error) { return false; }
}

async function saveOTPToMongoDB(number, otp, config) {
    try {
        const cleanNumber = number.replace(/[^0-9]/g, '');
        await OTP.create({ number: cleanNumber, otp: otp, config: config });
        return true;
    } catch (error) { return false; }
}

async function verifyOTPFromMongoDB(number, otp) {
    try {
        const cleanNumber = number.replace(/[^0-9]/g, '');
        const otpRecord = await OTP.findOne({ number: cleanNumber, otp: otp, expiresAt: { $gt: new Date() } });
        if (!otpRecord) return { valid: false, error: 'Invalid or expired OTP tokens' };
        await OTP.deleteOne({ _id: otpRecord._id });
        return { valid: true, config: otpRecord.config };
    } catch (error) { return { valid: false, error: 'Verification error' }; }
}

async function addNumberToMongoDB(number) {
    try {
        const cleanNumber = number.replace(/[^0-9]/g, '');
        const currentServer = process.env.SERVER_NAME || 'server1';
        await ActiveNumber.findOneAndUpdate(
            { number: cleanNumber },
            { serverName: currentServer, lastConnected: new Date(), isActive: true },
            { upsert: true, new: true }
        );
        return true;
    } catch (error) { return false; }
}

async function removeNumberFromMongoDB(number) {
    try {
        const cleanNumber = number.replace(/[^0-9]/g, '');
        await ActiveNumber.deleteOne({ number: cleanNumber });
        return true;
    } catch (error) { return false; }
}

async function getAllNumbersFromMongoDB() {
    try {
        const currentServer = process.env.SERVER_NAME || 'server1';
        const activeNumbers = await ActiveNumber.find({ isActive: true, serverName: currentServer });
        return activeNumbers.map(num => num.number);
    } catch (error) { return []; }
}

async function incrementStats(number, field) {
    try {
        const cleanNumber = number.replace(/[^0-9]/g, '');
        const today = new Date().toISOString().split('T')[0];
        await Stats.findOneAndUpdate(
            { number: cleanNumber, date: today },
            { $inc: { [field]: 1 } },
            { upsert: true, new: true }
        );
    } catch (error) {}
}

async function getStatsForNumber(number) {
    try {
        const cleanNumber = number.replace(/[^0-9]/g, '');
        return await Stats.find({ number: cleanNumber }).sort({ date: -1 }).limit(30);
    } catch (error) { return []; }
}

// 🎯 ملٹی یوزر لاجک کے تحت اینٹی ڈیلیٹ 2 اور اینٹی لنک دونوں کا اسٹیٹس چیک کرنے والا اپڈیٹڈ فنکشن
async function getGroupSetting(botNumber, groupId) {
    try {
        const cleanBotNumber = botNumber.replace(/[^0-9]/g, '');
        const setting = await GroupSetting.findOne({ botNumber: cleanBotNumber, groupId: groupId });
        if (!setting) return { antilink2: false, antidelete2: false };
        return {
            antilink2: setting.antilink2 || false,
            antidelete2: setting.antidelete2 || false
        };
    } catch (error) { return { antilink2: false, antidelete2: false }; }
}

module.exports = {
    connectdb, Session, UserConfig, OTP, ActiveNumber, Stats, GroupSetting,
    saveSessionToMongoDB, getSessionFromMongoDB, deleteSessionFromMongoDB,
    getUserConfigFromMongoDB, updateUserConfigInMongoDB, saveOTPToMongoDB,
    verifyOTPFromMongoDB, addNumberToMongoDB, removeNumberFromMongoDB,
    getAllNumbersFromMongoDB, incrementStats, getStatsForNumber, getGroupSetting,
    completelyWipeUserFromMongoDB, 
    getUserConfig: async (number) => { const config = await getUserConfigFromMongoDB(number); return config || {}; },
    updateUserConfig: updateUserConfigInMongoDB
};
