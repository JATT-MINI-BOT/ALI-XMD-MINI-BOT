const mongoose = require('mongoose');
const config = require('../config');

// 🔐 Secure check to identify which Heroku server cluster node is currently running
const currentServerName = process.env.SERVER_NAME || "Server 1";

const connectdb = async () => {
    try {
        mongoose.set('strictQuery', false);
        await mongoose.connect(config.MONGODB_URI, {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 8000, 
            socketTimeoutMS: 45000,
            bufferCommands: true // ✅ FIXED: Changed to true to safely queue queries before connection finishes
        });
        console.log(`✅ Database Connected Successfully on [${currentServerName}]`);
    } catch (e) {
        console.error("❌ Database Connection Failed:", e.message);
    }
};

// ==========================================
// 📁 MONGOOSE SCHEMAS (ENGLISH STANDARDS)
// ==========================================

const alirazaSessionSchema = new mongoose.Schema({
    number: { 
        type: String, 
        required: true, 
        unique: true,
        index: true 
    },
    credentials: {
        type: Object,
        required: true
    },
    assignedServer: { 
        type: String, 
        default: 'Server 1', 
        index: true 
    }, // Server isolation identifier tag
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const alirazaConfigSchema = new mongoose.Schema({
    number: { 
        type: String, 
        required: true, 
        unique: true,
        index: true 
    },
    config: {
        PREFIX: { type: String, default: '.' }, 
        WORK_TYPE: { type: String, default: 'public' }, 
        AUTO_RECORDING: { type: String, default: 'false' },
        AUTO_TYPING: { type: String, default: 'false' },
        ANTI_CALL: { type: String, default: 'false' },
        ANTI_LINK: { type: String, default: 'false' },
        // ✅ FIXED: Standard schema object wrapping with correct String type definition
        REJECT_MSG: { type: String, default: '*🔕 ʏᴏᴜʀ ᴄᴀʟʟ ᴡᴀs ᴀᴜᴛۆᴍᴀᴛɪᴄᴀʟʟʏ ʀᴇᴊᴇᴄﺘᴇᴅ..!*' },
        READ_MESSAGE: 'false',
        AUTO_REACT: 'false',
        AUTO_REPLY: 'false',
        AUTO_VIEW_STATUS: 'false',
        AUTO_LIKE_STATUS: 'false',
        AUTO_STATUS_REPLY: 'false',
        AUTO_STATUS_MSG: 'Hello from ALI RAZA 🔥',
        AUTO_LIKE_EMOJI: ['❤️', '👍', '😮', '😎'],
        ANTIDELETE: { type: String, default: 'false' },
        ANTI_BOT: { type: String, default: 'false' },
        ANTI_BAD: { type: String, default: 'false' },
        ANTI_EDIT: { type: String, default: 'false' },
        ALWAYS_ONLINE: { type: String, default: 'false' },
        USER_BOT_NAME: { type: String, default: '' },
        USER_IMAGE_PATH: { type: String, default: '' },
        USER_BOT_FOOTER: { type: String, default: '' },
        MENU_CHANNEL_JID: { type: String, default: '120363408542979632@newsletter' },
        MENU_CHANNEL_NAME: { type: String, default: '⏤.ۗۗۗۗۗۗۗۗۗ.❥≛⃝ 𝘼𝐿𝙄 Rᴀᴢᴀ🍁⃝➤ ' }
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const alirazaOtpSchema = new mongoose.Schema({
    number: { 
        type: String, 
        required: true,
        index: true 
    },
    otp: { type: String, required: true },
    config: { type: Object, required: true },
    expiresAt: { 
        type: Date, 
        default: () => new Date(Date.now() + 5 * 60000), 
        index: { expires: '5m' }
    },
    createdAt: { type: Date, default: Date.now }
});

const alirazaActiveNumberSchema = new mongoose.Schema({
    number: { 
        type: String, 
        required: true, 
        unique: true,
        index: true 
    },
    assignedServer: { 
        type: String, 
        default: 'Server 1', 
        index: true 
    }, // Server isolation configuration tag
    lastConnected: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },
    connectionInfo: {
        ip: String,
        userAgent: String,
        timestamp: Date
    }
});

const alirazaStatsSchema = new mongoose.Schema({
    number: { type: String, required: true },
    date: { type: String, required: true }, 
    commandsUsed: { type: Number, default: 0 },
    messagesReceived: { type: Number, default: 0 },
    messagesSent: { type: Number, default: 0 },
    groupsInteracted: { type: Number, default: 0 }
});

const alirazaGroupSettingsSchema = new mongoose.Schema({
    botNumber: { type: String, required: true, index: true },
    groupId: { type: String, required: true, index: true },
    antilink2: { type: Boolean, default: false }
});
alirazaGroupSettingsSchema.index({ botNumber: 1, groupId: 1 }, { unique: true });

// ==========================================
// 🗃️ CORE DATA MODELS
// ==========================================

const Session = mongoose.model('AlirazaSession', alirazaSessionSchema);
const UserConfig = mongoose.model('AlirazaConfig', alirazaConfigSchema);
const OTP = mongoose.model('AlirazaOTP', alirazaOtpSchema);
const ActiveNumber = mongoose.model('AlirazaActiveNumber', alirazaActiveNumberSchema);
const Stats = mongoose.model('AlirazaStats', alirazaStatsSchema);
const GroupSetting = mongoose.model('AlirazaGroupSetting', alirazaGroupSettingsSchema);

// ==========================================
// 🛠️ DATABASE CONTROLLER FUNCTIONS
// ==========================================

async function saveSessionToMongoDB(number, credentials) {
    try {
        const cleanNumber = number.replace(/[^0-9]/g, '');
        
        // 🔄 FIXED: Automatically forces the active server assignment on save/update
        await Session.findOneAndUpdate(
            { number: cleanNumber },
            { 
                credentials: credentials,
                assignedServer: currentServerName, 
                updatedAt: new Date()
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        console.log(`📁 [CORE DATABASE] Session tokens locked exclusively for [${currentServerName}]: ${cleanNumber}`);
        return true;
    } catch (error) {
        console.error('❌ Error saving session to MongoDB:', error);
        return false;
    }
}

async function getSessionFromMongoDB(number) {
    try {
        const cleanNumber = number.replace(/[^0-9]/g, '');
        const session = await Session.findOne({ number: cleanNumber });
        return session ? session.credentials : null;
    } catch (error) {
        console.error('❌ Error getting session from MongoDB:', error);
        return null;
    }
}

async function deleteSessionFromMongoDB(number) {
    try {
        const cleanNumber = number.replace(/[^0-9]/g, '');
        await Session.deleteOne({ number: cleanNumber });
        await ActiveNumber.deleteOne({ number: cleanNumber });
        console.log(`🗑️ Session credentials permanently flushed for: ${cleanNumber}`);
        return true;
    } catch (error) {
        console.error('❌ Error deleting session from MongoDB:', error);
        return false;
    }
}

async function getUserConfigFromMongoDB(number) {
    try {
        const cleanNumber = number.replace(/[^0-9]/g, '');
        
        const defaultConfig = {
            PREFIX: '.', 
            WORK_TYPE: 'public', 
            AUTO_RECORDING: 'false',
            AUTO_TYPING: 'false',
            ANTI_CALL: 'false',
            ANTI_LINK: 'false',
            ANTI_BOT: 'false',
            ANTI_EDIT: 'false',
            ANTI_BAD: 'false',
            REJECT_MSG: '*🔕 ʏᴏᴜʀ ᴄᴀʟʟ ᴡᴀs ᴀᴜᴛۆᴍᴀᴛɪᴄᴀʟʟʏ ʀᴇᴊᴇᴄﺘᴇᴅ..!*',
            READ_MESSAGE: 'false',
            AUTO_VIEW_STATUS: 'false',
            AUTO_LIKE_STATUS: 'false',
            AUTO_STATUS_REPLY: 'false',
            AUTO_STATUS_MSG: 'Hello from ALI RAZA 🔥',
            AUTO_LIKE_EMOJI: ['❤️', '👍', '😮', '😎'],
            AUTO_REACT: 'false',
            AUTO_REPLY: 'false',
            ANTIDELETE: 'false', 
            ALWAYS_ONLINE: 'false',
            USER_BOT_NAME: '', 
            USER_IMAGE_PATH: '', 
            USER_BOT_FOOTER: '', 
            MENU_CHANNEL_JID: '120363408542979632@newsletter',
            MENU_CHANNEL_NAME: '⏤.ۗۗۗۗۗۗۗۗۗ.❥≛⃝ 𝘼𝐿𝙄 Rᴀᴢᴀ🍁⃝➤ '
        };

        const configData = await UserConfig.findOneAndUpdate(
            { number: cleanNumber },
            { $setOnInsert: { number: cleanNumber, config: defaultConfig } },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        let updated = false;
        for (const key in defaultConfig) {
            if (configData.config[key] === undefined) {
                configData.config[key] = defaultConfig[key];
                updated = true;
            }
        }
        if (updated) {
            configData.markModified('config');
            await configData.save();
        }

        return configData.config;
    } catch (error) {
        console.error('❌ Error getting user config from MongoDB:', error);
        return {};
    }
}

async function updateUserConfigInMongoDB(number, newConfig) {
    try {
        const cleanNumber = number.replace(/[^0-9]/g, '');
        await UserConfig.findOneAndUpdate(
            { number: cleanNumber },
            { 
                config: newConfig,
                updatedAt: new Date()
            },
            { upsert: true, new: true }
        );
        console.log(`⚙️ [CONFIGURATION] Global settings updated for: ${cleanNumber}`);
        return true;
    } catch (error) {
        console.error('❌ Error updating user config in MongoDB:', error);
        return false;
    }
}

async function saveOTPToMongoDB(number, otp, config) {
    try {
        const cleanNumber = number.replace(/[^0-9]/g, '');
        await OTP.create({
            number: cleanNumber,
            otp: otp,
            config: config
        });
        console.log(`🔐 OTP security payload generated for: ${cleanNumber}`);
        return true;
    } catch (error) {
        console.error('❌ Error saving OTP to MongoDB:', error);
        return false;
    }
}

async function verifyOTPFromMongoDB(number, otp) {
    try {
        const cleanNumber = number.replace(/[^0-9]/g, '');
        const otpRecord = await OTP.findOne({ 
            number: cleanNumber, 
            otp: otp,
            expiresAt: { $gt: new Date() }
        });
        
        if (!otpRecord) {
            return { valid: false, error: 'Invalid or expired verification OTP tokens' };
        }
        
        await OTP.deleteOne({ _id: otpRecord._id });
        
        return {
            valid: true,
            config: otpRecord.config
        };
    } catch (error) {
        console.error('❌ Error verifying OTP from MongoDB:', error);
        return { valid: false, error: 'Verification error' };
    }
}

async function addNumberToMongoDB(number) {
    try {
        const cleanNumber = number.replace(/[^0-9]/g, '');
        
        // 🔄 FIXED: Always update assignedServer dynamically to fix the mismatch on active tracking
        await ActiveNumber.findOneAndUpdate(
            { number: cleanNumber },
            { 
                lastConnected: new Date(),
                isActive: true,
                assignedServer: currentServerName 
            },
            { upsert: true, new: true }
        );
        return true;
    } catch (error) {
        console.error('❌ Error adding number to MongoDB:', error);
        return false;
    }
}

async function removeNumberFromMongoDB(number) {
    try {
        const cleanNumber = number.replace(/[^0-9]/g, '');
        await ActiveNumber.deleteOne({ number: cleanNumber });
        return true;
    } catch (error) {
        console.error('❌ Error removing number from MongoDB:', error);
        return false;
    }
}

// 🔥 CRITICAL ISOLATION PATCH: Only retrieves records assigned exclusively to the current cluster server name
async function getAllNumbersFromMongoDB() {
    try {
        const activeNumbers = await ActiveNumber.find({ 
            isActive: true,
            assignedServer: currentServerName 
        });
        return activeNumbers.map(num => num.number);
    } catch (error) {
        console.error('❌ Error getting isolated cluster numbers from MongoDB:', error);
        return [];
    }
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
    } catch (error) {
        console.error('❌ Error updating metrics analytics:', error);
    }
}

async function getStatsForNumber(number) {
    try {
        const cleanNumber = number.replace(/[^0-9]/g, '');
        const stats = await Stats.find({ number: cleanNumber })
            .sort({ date: -1 })
            .limit(30);
        return stats;
    } catch (error) {
        console.error('❌ Error getting analytics stats metrics:', error);
        return [];
    }
}

async function getGroupSetting(botNumber, groupId) {
    try {
        const cleanBotNumber = botNumber.replace(/[^0-9]/g, '');
        const setting = await GroupSetting.findOne({ botNumber: cleanBotNumber, groupId: groupId });
        return setting ? setting.antilink2 : false;
    } catch (error) {
        console.error('❌ Error getting group context setting from MongoDB:', error);
        return false;
    }
}

// ==========================================
// 📤 EXPORTS CONTROLLER MANAGER
// ==========================================

module.exports = {
    connectdb,
    Session,
    UserConfig,
    OTP,
    ActiveNumber,
    Stats,
    GroupSetting,
    saveSessionToMongoDB,
    getSessionFromMongoDB,
    deleteSessionFromMongoDB,
    getUserConfigFromMongoDB,
    updateUserConfigInMongoDB,
    saveOTPToMongoDB,
    verifyOTPFromMongoDB,
    addNumberToMongoDB,
    removeNumberFromMongoDB,
    getAllNumbersFromMongoDB,
    incrementStats,
    getStatsForNumber,
    getGroupSetting,
    getUserConfig: async (number) => {
        const config = await getUserConfigFromMongoDB(number);
        return config || {};
    },
    updateUserConfig: updateUserConfigInMongoDB
};
