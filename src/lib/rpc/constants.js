const path = require('path');

/**
 * Core Configuration
 */
const CONFIG = {
    VERSION: '6.0.0',
    ACTIVITY_TYPES: {
        PLAYING: '🎮',
        STREAMING: '🎥',
        LISTENING: '🎧',
        WATCHING: '👀',
        COMPETING: '🏆',
        CUSTOM: '💭'
    },
    VALID_TYPES: ['playing', 'streaming', 'listening', 'watching', 'competing', 'custom'],
    BUTTONS: {
        MAX_LENGTH: 32,
        MAX_COUNT: 2
    },
    IMAGE_PATTERNS: {
        BASIC_URL: /^https?:\/\/.*\.(png|jpg|jpeg|gif|webp)$/i,
        DISCORD_CDN: {
            ATTACHMENT: /^https?:\/\/cdn\.discordapp\.com\/attachments\/(\d+)\/(\d+)\/[^?]+(\?.*)?$/,
            EMOJI: /^https?:\/\/cdn\.discordapp\.com\/emojis\/(\d+)\.(png|gif)(\?.*)?$/,
            AVATAR: /^https?:\/\/cdn\.discordapp\.com\/(avatars|icons)\/(\d+)\/([a-zA-Z0-9_-]+)\.(png|gif|webp)(\?.*)?$/,
        },
        DISCORD_MEDIA: /^https?:\/\/media\.discordapp\.net\/attachments\/[^?]+(\?.*)?$/,
        EMOJI_FORMAT: /<?(a)?:?(\w{2,32}):(\d{17,19})>?/
    },
    STORAGE: {
        BASE_DIR: path.join(process.cwd(), 'data', 'rpc'),
        get IMAGES_FILE() { return path.join(this.BASE_DIR, 'images.json'); },
        get RPC_FILE() { return path.join(this.BASE_DIR, 'rpcData.json'); },
        get PRESETS_FILE() { return path.join(this.BASE_DIR, 'presets.json'); }
    },
    AUTO_DELETE_DELAYS: {
        ERROR: 7000,
        SUCCESS: 5000,
        INFO: 10000,
        HELP: 15000
    },
    USER: {
        NAME: 'idlehoa',
        TIMEZONE: 'UTC'
    }
};

module.exports = CONFIG;