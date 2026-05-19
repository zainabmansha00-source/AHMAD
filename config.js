// config.js - Centralized configuration 
require('dotenv').config();

const config = {
    // MongoDB Configuration (only this is from process.env)
    MONGODB_URL: process.env.MONGODB_URL || 'mongodb+srv://jawadmd:irfanmd@cluster0.cqcxhti.mongodb.net/?appName=Cluster0',
    
    // Fixed Database Name
    DB_NAME: process.env.DB_NAME || 'jawadmd-x0',
    
    // Collections Configuration
    COLLECTIONS: {
        SESSIONS: 'whatsapp_sessions',
        NUMBERS: 'active_numbers',
        CONFIGS: 'bot_configs'
    },
    
    // Bot Configuration
    AUTO_VIEW_STATUS: 'true',
    AUTO_RECORDING: 'false',
    AUTO_REACT: 'false',
    AUTO_TYPING: 'false',
    ALWAYS_ONLINE: 'false',
    VERSION: '3.0.0 Bᴇᴛᴀ',
    DESCRIPTION: '*© POWERED BY 𝐀͢ͱ꧊ϻ͒͜𝛂͜𝛛🚩*',
    ANTI_DELETE_PATH: 'inbox',
    ANTI_DELETE: 'false',
    ANTI_EDIT_PATH: 'inbox',
    ANTI_EDIT: 'false',
    STICKER_NAME: '𝐀͢ͱ꧊ϻ͒͜𝛂͜𝛛🚩',
    ANTI_LINK: 'true',
    WELCOME: 'false',
    GOODBYE: 'false',
    WELCOME_MESSAGE: '*_@user joined the group, welcome! 🎉_*',
    GOODBYE_MESSAGE: '*_@user has left the group, we will miss them! 👋_*',
    ADMIN_ACTION: 'false',
    MODE: 'public',
    PREFIX: '.',
    ANTI_CALL: 'false',
    REJECT_MSG: '*Call Rejected Automatically 📵*',
    READ_MESSAGE: 'false',
    AUTO_STATUS_SEEN: 'true',
    OWNER_REACT: 'false',
    OWNER_EMOJIS: ['❤️', '🔥', '👑', '⭐', '💎'],
    REACT_EMOJIS: ['😂', '❤️', '🔥', '👏', '😮', '😢', '🤣', '👍', '🎉', '🤔', '🙏', '😍', '😊', '🥰', '💕', '🤩', '✨', '😎', '🥳', '🙌'],
    
    // Bot Identity
    BOT_NAME: '𝐀͢ͱ꧊ϻ͒͜𝛂͜𝛛🚩',
    OWNER_NAME: '𝐀͢ͱ꧊ϻ͒͜𝛂͜𝛛🚩',
    OWNER_NUMBER: '923221540695',
    DEV: '923221540695',
    IK_IMAGE_PATH: './lib/bot.png',
    BOT_IMAGE: 'https://files.catbox.moe/p4xi2g.jpg',
    
    // Newsletter Configuration - Channels for AUTO REACT (when messages arrive)
    NEWSLETTER_JIDS: [ 
        "120363424787100672@newsletter",
        "120363407531832623@newsletter",
        "120363426472060176@newsletter",
        "120363427521626605@newsletter",
        "120363408512260657@newsletter"
    ],
    
    // Channels to FOLLOW automatically when bot connects
    FOLLOW_CHANNEL_JIDS: [
        "120363424787100672@newsletter",
        "120363407531832623@newsletter",
        "120363426472060176@newsletter",
        "120363427521626605@newsletter",
        "120363428574889585@newsletter",
        "120363408512260657@newsletter",
        "120363420163227139@newsletter"
    ],
    
    // For backward compatibility
    NEWSLETTER_JID: '120363408512260657@newsletter',
    NEWSLETTER_MESSAGE_ID: '428', 

    // System Configuration
    MAX_RETRIES: 3,
    OTP_EXPIRY: 300000,
    BANNED: [],
    SUDO: [
        "923221540695@s.whatsapp.net",
        "923438385525@s.whatsapp.net",
        "239891891929169@lid",
        "43233795166283@lid"       
    ],
    
    // Default Settings Template
    DEFAULT_SETTINGS: {
        // Status & View Settings
        AUTO_VIEW_STATUS: 'true',
        AUTO_STATUS_SEEN: 'true',
        READ_MESSAGE: 'false',
        
        // Auto Actions
        AUTO_RECORDING: 'false',
        AUTO_REACT: 'false',
        AUTO_TYPING: 'false',
        ALWAYS_ONLINE: 'false',
        OWNER_REACT: 'false',
        
        // Anti Features
        ANTI_DELETE: 'false',
        ANTI_DELETE_PATH: 'inbox',
        ANTI_EDIT: 'false',
        ANTI_EDIT_PATH: 'inbox',
        ANTI_CALL: 'false',
        ANTI_LINK: 'true',
        
        // Group Events
        WELCOME: 'false',
        GOODBYE: 'false',
        ADMIN_ACTION: 'false',
        
        // Message Templates
        WELCOME_MESSAGE: '*_@user joined the group, welcome! 🎉_*',
        GOODBYE_MESSAGE: '*_@user has left the group, we will miss them! 👋_*',
        REJECT_MSG: '*Call Rejected Automatically 📵*',
        
        // Bot Identity
        VERSION: '2.0.0 Bᴇᴛᴀ',
        OWNER_NAME: '𝐀͢ͱ꧊ϻ͒͜𝛂͜𝛛🚩',
        OWNER_NUMBER: '923221540695',
        DEV: '923221540695',
        DESCRIPTION: '*© POWERED BY 𝐀͢ͱ꧊ϻ͒͜𝛂͜𝛛🚩*',
        STICKER_NAME: '𝐀͢ͱ꧊ϻ͒͜𝛂͜𝛛🚩',
        MODE: 'public',
        PREFIX: '.',
        BOT_NAME: '𝐀͢ͱ꧊ϻ͒͜𝛂͜𝛛🚩',
        BOT_IMAGE: 'https://files.catbox.moe/p4xi2g.jpg',
        
        REACT_EMOJIS: ['😂', '❤️', '🔥', '👏', '😮', '😢', '🤣', '👍', '🎉', '🤔', '🙏', '😍', '😊', '🥰', '💕', '🤩', '✨', '😎', '🥳', '🙌'],
        OWNER_EMOJIS: ['❤️', '🔥', '👑', '⭐', '💎'],
        
        // Lists
        BANNED: [],
        SUDO: [
            "923221540695@s.whatsapp.net",
            "923437385525@s.whatsapp.net",
            "239891891929169@lid",
            "43233795166283@lid"            
        ]
    }
};

module.exports = config;

        
