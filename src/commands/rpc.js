const Discord = require('discord.js-selfbot-v13');
const { EmbedBuilder } = Discord;
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const CONFIG = require('../lib/rpc/constants.js');

/**
 * Utility Classes
 */
class DateTimeUtil {
    static getCurrentTimestamp() {
        const now = new Date();
        return now.toISOString().replace('T', ' ').replace(/\.\d+Z$/, '');
    }

    static formatDuration(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    static parseTime(timeStr) {
        if (timeStr.toLowerCase() === 'now') return Date.now();
        const match = timeStr.match(/^(\d{1,2}):(\d{1,2}):(\d{1,2})$/);
        if (!match) return null;

        const [, hours, minutes, seconds] = match.map(Number);
        if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59 && seconds >= 0 && seconds <= 59) {
            return Date.now() - (hours * 3600 + minutes * 60 + seconds) * 1000;
        }
        return null;
    }
}

class FormatUtil {
    static box(title, content, type = 'info') {
        const colors = {
            success: '[2;32m', // Green
            error: '[2;31m',   // Red
            info: '[2;36m',    // Cyan
            warning: '[2;33m'  // Yellow
        };

        const color = colors[type] || colors.info;
        const border = '═'.repeat(50);
        const timestamp = DateTimeUtil.getCurrentTimestamp();

        return `\`\`\`ansi
${color}${border}
${title}
${border}
${content}
${border}
[Time: ${timestamp}]
\`\`\``;
    }

    static error(message, details = '') {
        return this.box(
            '[ Error ]',
            `${message}${details ? `\n\nDetails: ${details}` : ''}`,
            'error'
        );
    }

    static success(message) {
        return this.box('[ Success ]', message, 'success');
    }

    static info(message) {
        return this.box('[ Info ]', message, 'info');
    }

    static warning(message) {
        return this.box('[ Warning ]', message, 'warning');
    }

    static debug(message, details = '') {
        return this.box(
            '[ Debug ]',
            `${message}${details ? `\n\nDetails: ${details}` : ''}`,
            'info'
        );
    }
}

/**
 * Storage System
 */
class StorageManager {
    static async ensureDirectories() {
        for (const dir of Object.values(CONFIG.STORAGE)) {
            if (typeof dir === 'string' && dir.endsWith('.json')) {
                await fs.mkdir(path.dirname(dir), { recursive: true });
            }
        }
    }

    static async readJson(filePath, defaultValue = null) {
        try {
            const data = await fs.readFile(filePath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            if (error.code === 'ENOENT') return defaultValue;
            throw error;
        }
    }

    static async writeJson(filePath, data) {
        await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    }
}

/**
 * Image Management System
 */
class ImageManager {
    constructor() {
        this.cache = new Map();
        this.initialized = false;
    }

    async init() {
        if (this.initialized) return;
        await StorageManager.ensureDirectories();
        const data = await StorageManager.readJson(CONFIG.STORAGE.IMAGES_FILE, {});
        this.cache = new Map(Object.entries(data));
        this.initialized = true;
    }

    async save() {
        await StorageManager.writeJson(
            CONFIG.STORAGE.IMAGES_FILE,
            Object.fromEntries(this.cache)
        );
    }

    validateImageSource(source) {
        if (!source) return { valid: false, reason: 'Empty source' };

        try {
            const url = new URL(source);
            if (CONFIG.IMAGE_PATTERNS.BASIC_URL.test(source)) {
                return {
                    valid: true,
                    type: 'url',
                    url: source,
                    metadata: { format: source.split('.').pop().toLowerCase() }
                };
            }
        } catch (error) {
            return { valid: false, reason: 'Invalid URL format' };
        }

        return { valid: false, reason: 'Unsupported image format' };
    }

    async addImage(name, source, type = 'both') {
        await this.init();

        const validation = this.validateImageSource(source);
        if (!validation.valid) {
            throw new Error(`Invalid image source: ${validation.reason}`);
        }

        const imageData = {
            url: validation.url,
            type,
            source: validation.type,
            metadata: validation.metadata,
            addedAt: DateTimeUtil.getCurrentTimestamp(),
            addedBy: CONFIG.USER.NAME
        };

        this.cache.set(name.toLowerCase(), imageData);
        await this.save();
        return imageData;
    }

    async getImage(name) {
        await this.init();
        return this.cache.get(name.toLowerCase());
    }

    async listImages() {
        await this.init();
        return Array.from(this.cache.entries()).map(([name, data]) => ({
            name,
            ...data
        }));
    }

    async removeImage(name) {
        await this.init();
        const deleted = this.cache.delete(name.toLowerCase());
        if (deleted) await this.save();
        return deleted;
    }
}

/**
 * RPC Management System
 */
class RPCManager {
    constructor() {
        this.history = [];
        this.maxHistory = 5;
        this.initialized = false;
    }

    async init() {
        if (this.initialized) return;
        const data = await StorageManager.readJson(CONFIG.STORAGE.RPC_FILE, { history: [] });
        this.history = data.history || [];
        this.initialized = true;
    }

    async save() {
        await StorageManager.writeJson(CONFIG.STORAGE.RPC_FILE, {
            history: this.history,
            lastUpdated: DateTimeUtil.getCurrentTimestamp()
        });
    }

    async saveCurrentRPC(rpcData) {
        await this.init();

        const entry = {
            ...rpcData,
            savedAt: DateTimeUtil.getCurrentTimestamp(),
            savedBy: CONFIG.USER.NAME
        };

        this.history.unshift(entry);
        this.history = this.history.slice(0, this.maxHistory);
        await this.save();
        return entry;
    }

    async getLastRPC() {
        await this.init();
        return this.history[0] || null;
    }

    async getHistory() {
        await this.init();
        return this.history;
    }
}

// Create manager instances
const imageManager = new ImageManager();
const rpcManager = new RPCManager();

/**
 * Command Module
 */
module.exports = {
    name: 'rpc',
    aliases: ['rpc', 'setrpc', 'presence'],
    description: `Advanced RPC Manager v${CONFIG.VERSION}`,
    category: 'UTILITY',
    usage: [
        '**Basic Usage:**',
        '`rpcchanger name=Game Name` - Set a basic RPC with the specified game name.',
        '`rpcchanger name=Game; details=Details; state=State` - Set RPC with details and state.',
        '`rpcchanger name=Game; type=LISTENING; state=Relaxing` - Listening status with a state.',
        '',
        '**Images:**',
        '`rpcchanger addimage name=imagename url=https://example.com/image.png` - Add an image.',
        '`rpcchanger name=Game; image=imagename` - Use a stored image for your RPC.',
        '`rpcchanger removeimage imagename` - Remove a stored image.',
        '`rpcchanger listimages` - List all stored images.',
        '',
        '**History:**',
        '`rpcchanger savecurrent` - Save the current RPC configuration.',
        '`rpcchanger loadlast` - Load the most recently saved RPC configuration.',
        '`rpcchanger history` - View the history of saved RPC configurations.',
        '',
        '**Stop RPC:**',
        '`rpcchanger stop` - Stop the current RPC and reset presence to online.',
        '',
        '**Examples:**',
        '- `rpcchanger name=Playing Cool Game`',
        '- `rpcchanger name=Streaming Live; type=STREAMING; buttontext=Join Now; buttonurl=https://example.com`',
        '- `rpcchanger addimage name=myimage url=https://example.com/image.png`',
        '',
        '**Pro Tips:** Use semicolons (;) to separate fields when setting RPC configurations.'
    ].join('\n'),

    async execute(client, message, args) {
        try {
            if (!args.length) {
                return message.channel.send(FormatUtil.info(this.usage))
                    .then(msg => setTimeout(() => msg.delete().catch(() => {}), CONFIG.AUTO_DELETE_DELAYS.HELP));
            }

            const fullInput = args.join(' ').trim();

            switch (args[0].toLowerCase()) {
                case 'help':
                    return message.channel.send(FormatUtil.info(this.usage))
                        .then(msg => setTimeout(() => msg.delete().catch(() => {}), CONFIG.AUTO_DELETE_DELAYS.HELP));
                case 'stop':
                    await client.user.setPresence({ activities: [], status: 'online' });
                    return message.channel.send(FormatUtil.success('RPC stopped.'));
                case 'savecurrent':
                    const currentActivity = client.user.presence?.activities[0];
                    if (!currentActivity) throw new Error('No active RPC to save.');
                    const saved = await rpcManager.saveCurrentRPC(currentActivity);
                    return message.channel.send(FormatUtil.success(`Saved RPC: ${saved.name}`));
                case 'loadlast':
                    const lastRPC = await rpcManager.getLastRPC();
                    if (!lastRPC) throw new Error('No saved RPC found.');
                    await client.user.setActivity(lastRPC);
                    return message.channel.send(FormatUtil.success(`Loaded RPC: ${lastRPC.name}`));
                case 'history':
                    const history = await rpcManager.getHistory();
                    return message.channel.send(FormatUtil.info(
                        history.map((rpc, i) => `${i + 1}. ${rpc.name} (${rpc.savedAt})`).join('\n') || 'No history available.'
                    ));
                case 'addimage':
                    const [, name, url] = args;
                    if (!name || !url) throw new Error('Usage: addimage <name> <url>');
                    const added = await imageManager.addImage(name, url);
                    return message.channel.send(FormatUtil.success(`Added image: ${added.url}`));
                case 'removeimage':
                    const [, imageName] = args;
                    if (!imageName) throw new Error('Usage: removeimage <name>');
                    const removed = await imageManager.removeImage(imageName);
                    return message.channel.send(
                        removed ? FormatUtil.success(`Removed image: ${imageName}`) : FormatUtil.error(`Image not found: ${imageName}`)
                    );
                default:
                    const rpcData = {};
                    fullInput.split(';').forEach(field => {
                        const [key, value] = field.split('=').map(x => x.trim());
                        if (key && value) rpcData[key.toLowerCase()] = value;
                    });

                    const activityType = rpcData.type?.toUpperCase() || 'PLAYING';
                    const activity = { name: rpcData.name || 'Custom RPC', type: activityType };

                    if (rpcData.details) activity.details = rpcData.details;
                    if (rpcData.state) activity.state = rpcData.state;

                    await client.user.setActivity(activity);
                    return message.channel.send(FormatUtil.success(`RPC set: ${activity.name}`));
            }
        } catch (error) {
            console.error('Error in executing RPC changer:', error);
            return message.channel.send(FormatUtil.error('An error occurred while processing your request.', error.message))
                .then(msg => setTimeout(() => msg.delete().catch(() => {}), CONFIG.AUTO_DELETE_DELAYS.ERROR));
        }
    }
};