const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'avatar',
    description: 'Send user avatar links.',
    category: 'INFO', // For categorization in help command
    hidden: false, // Allow hiding from help if needed
    async execute(client, message, args) {
        if (!message?.channel) return;

        const prefix = process.env.PREFIX || 'i?'; // Fallback prefix

        try {
            // Determine the target user
            let user = message.author; // Default to self
            if (args[0]) {
                // Check for mention, ID, or tag
                const mentionedUser = message.mentions.users.first();
                const userById = client.users.cache.get(args[0].replace(/[<@!>&]/g, '')) || client.users.cache.find(u => u.tag.toLowerCase() === args[0].toLowerCase());
                user = mentionedUser || userById;
            }

            // If user not found, send error message
            if (!user) {
                const errorMessage = [
                    '```diff',
                    '- Error: User not found! -',
                    `Please provide a valid user mention, ID, or tag (e.g., ${prefix}avatar @user).`,
                    '```'
                ].join('\n');
                await message.channel.send(errorMessage);
                return;
            }

            // Get the avatar URL
            const avatarUrl = user.displayAvatarURL({ dynamic: true, size: 4096 });

            // Send formatted avatar message
            const avatarMessage = [
                '```css',
                '╔══════ ✦ User Avatar ✦ ═══════╗',
                `║    User: ${user.tag.padEnd(20)} ║`,
                '║                               ║',
                `╚════ Requested by ${message.author.username} ═══╝`,
                '```',
                `🔗 [Click Here](${avatarUrl}) to view the avatar!`,
            ].join('\n');

            await message.channel.send(avatarMessage);

        } catch (error) {
            console.error('Error in avatar command:', error);
            const errorMessage = [
                '```diff',
                '- Error: Failed to fetch avatar -',
                'Please try again later.',
                '```'
            ].join('\n');
            await message.channel.send(errorMessage);
        }
    },
};