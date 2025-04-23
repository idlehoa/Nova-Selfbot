const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'help',
    description: 'Displays a list of available commands with descriptions.',
    async execute(client, message, args) {
        if (!message?.channel) return;

        const prefix = process.env.PREFIX || 'i?'; // Fallback prefix
        const commandList = [];
        const commandsDir = path.join(__dirname, '.');

        try {
            // Read command files
            const commandFiles = fs.readdirSync(commandsDir).filter(file => file.endsWith('.js') && file !== 'help.js');

            // Collect command details
            for (const file of commandFiles) {
                const command = require(path.join(commandsDir, file));
                if (command.name && !command.hidden) {
                    const description = command.description || 'No description available';
                    commandList.push({ name: command.name, description });
                }
            }

            // Sort commands alphabetically
            commandList.sort((a, b) => a.name.localeCompare(b.name));

            // Create formatted help message with an improved frame
            const helpMessage = [
                '```css',
                '╔═══════ ✦ Command List ✦ ═══════╗',
                `║  Prefix: ${prefix.padEnd(14)}         `,
                '║                               ',
                ...commandList.map(cmd => `║  ${prefix}${cmd.name.padEnd(15)} ${cmd.description}`),
                '║                               ',
                `╚══════ Requested by ${message.author.username} ══════╝`,
                '```',
                `💡 Tip: Use ${prefix}help <command> for more details.`
            ].join('\n');

            // Send help message
            await message.channel.send(helpMessage);

        } catch (error) {
            console.error('Error in help command:', error);
            const errorMessage = [
                '```diff',
                '- Error: Failed to generate help list -',
                'Please try again later.',
                '```'
            ].join('\n');
            await message.channel.send(errorMessage);
        }
    },
};