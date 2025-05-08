const fs = require('fs');
const path = require('path');

const THEMES = {
    DEFAULT: {
        title: '🌟 Nova Commands 🌟',
        border: '•―――――――――――――――――――――――――――•',
        prefix: '│',
        suffix: '│',
        categoryPrefix: '┌',
        categorySuffix: '┐',
        commandPrefix: '├',
        commandSuffix: '┤',
        footer: '•―――――――――――――――――――――――――――•',
        color: 'yaml'
    }
};

const formatCommand = (prefix, cmd, maxNameLength, theme) => {
    const paddedName = cmd.name.padEnd(maxNameLength);
    return `${theme.commandPrefix} ${prefix}${paddedName} │ ${cmd.description} ${theme.commandSuffix}`;
};

module.exports = {
    name: 'help',
    description: 'Shows all available commands with fancy styling',
    async execute(client, message, args) {
        if (!message?.channel) return;

        const prefix = process.env.PREFIX || 'i?';
        const commandList = [];
        const commandsDir = path.join(__dirname, '.');
        const theme = THEMES.DEFAULT;

        try {
            // Read and process command files
            const commandFiles = fs.readdirSync(commandsDir)
                .filter(file => file.endsWith('.js') && file !== 'help.js');

            // Collect commands
            for (const file of commandFiles) {
                const command = require(path.join(commandsDir, file));
                if (command.name && !command.hidden) {
                    commandList.push({
                        name: command.name,
                        description: command.description || 'No description available',
                        category: command.category || 'General'
                    });
                }
            }

            // Sort commands by category and name
            commandList.sort((a, b) => {
                if (a.category === b.category) {
                    return a.name.localeCompare(b.name);
                }
                return a.category.localeCompare(b.category);
            });

            // Find the longest command name for padding
            const maxNameLength = Math.max(...commandList.map(cmd => cmd.name.length)) + 2;

            // Group commands by category
            const categories = {};
            commandList.forEach(cmd => {
                if (!categories[cmd.category]) {
                    categories[cmd.category] = [];
                }
                categories[cmd.category].push(cmd);
            });

            // Create formatted help message
            const helpLines = [
                '```' + theme.color,
                theme.border,
                `${theme.prefix} ${theme.title} ${theme.suffix}`,
                theme.border,
                `${theme.prefix} Prefix: ${prefix}${' '.repeat(maxNameLength + 20)}${theme.suffix}`,
                theme.border,
            ];

            // Add commands by category
            for (const [category, commands] of Object.entries(categories)) {
                helpLines.push(
                    `${theme.categoryPrefix}── ${category} ${'─'.repeat(maxNameLength + 20 - category.length)}${theme.categorySuffix}`
                );
                
                commands.forEach(cmd => {
                    helpLines.push(formatCommand(prefix, cmd, maxNameLength, theme));
                });
                
                helpLines.push(theme.border);
            }

            // Add footer
            const timestamp = new Date().toLocaleString();
            helpLines.push(
                `${theme.prefix} Requested by: ${message.author.username}${' '.repeat(maxNameLength + 10)}${theme.suffix}`,
                `${theme.prefix} Time: ${timestamp}${' '.repeat(maxNameLength + 15)}${theme.suffix}`,
                theme.footer,
                '```',
                `💡 Type \`${prefix}help <command>\` for detailed information about a specific command.`
            );

            // Send help message
            await message.channel.send(helpLines.join('\n'));

        } catch (error) {
            console.error('Error in help command:', error);
            const errorMessage = [
                '```diff',
                '- ⚠️ Error: Failed to Generate Help Menu ⚠️ -',
                '+ Please contact an administrator if this persists +',
                '```'
            ].join('\n');
            await message.channel.send(errorMessage);
        }
    },
};