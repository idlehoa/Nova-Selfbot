const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'snipe',
    description: 'Shows the most recently deleted message in the channel.',
    category: 'UTILITY',
    hidden: false,
    async execute(client, message) {
        // Restrict to token owner (self-bot user)
        if (message.author.id !== client.user.id) return;

        try {
            // Define path to snipes.json
            const snipesFilePath = path.join(__dirname, 'data', 'snipes.json');
            let snipesData = {};

            // Read snipes.json with error handling
            try {
                if (fs.existsSync(snipesFilePath)) {
                    snipesData = JSON.parse(fs.readFileSync(snipesFilePath, 'utf8'));
                }
            } catch (fileError) {
                console.error('Error reading snipes.json:', fileError.message);
                return message.channel.send(`
\`\`\`md
❌ Error
════════════════════
Failed to read snipe data. Please try again later.
Reason: ${fileError.message}
\`\`\`
                `).then(m => setTimeout(() => m.delete().catch(() => {}), 3000));
            }

            // Get sniped message for the channel
            const snipedMessage = snipesData[message.channel.id];

            // Check if no sniped message exists
            if (!snipedMessage || !snipedMessage.content || !snipedMessage.author || !snipedMessage.timestamp) {
                return message.channel.send(`
\`\`\`md
❌ No Sniped Message
════════════════════
No recently deleted messages found in this channel!
\`\`\`
                `)
            }

            // Format sniped message details
            const { content, author, timestamp } = snipedMessage;
            const formattedTimestamp = new Date(timestamp).toLocaleString();

            // Add slight delay to avoid rate limits
            await new Promise(resolve => setTimeout(resolve, 100));

            // Send formatted snipe output
            await message.channel.send(`
\`\`\`md
🔍 Sniped Message
════════════════════
**Author**: ${author}
**Content**: ${content}
**Deleted At**: ${formattedTimestamp}
\`\`\`
            `)

        } catch (error) {
            console.error('Error in snipe command:', error);
            await message.channel.send(`
\`\`\`md
❌ Error
════════════════════
Failed to execute snipe command. Please try again later.
Reason: ${error.message}
\`\`\`
`)
        }
    },
};