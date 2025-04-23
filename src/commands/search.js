module.exports = {
    name: 'search',
    description: 'Search anything on Google.',
    category: 'UTILITY',
    hidden: false,
    async execute(client, message, args) {
        // Restrict to token owner (self-bot user) and valid channel
        if (!message?.channel || message.author.id !== client.user.id) return;

        try {
            // Validate input
            if (!args.length) {
                return message.channel.send(`
\`\`\`md
❌ Error
════════════════════
Please provide a search query!
Example: ${process.env.PREFIX || 'i?'}search discord bot
\`\`\`
                `);
            }

            // Construct search query
            const query = args.join(' ');
            const encodedQuery = encodeURIComponent(query);
            const url = `https://www.google.com/search?q=${encodedQuery}`;

            // Add slight delay to avoid rate limits
            await new Promise(resolve => setTimeout(resolve, 100));

            // Send formatted response
            await message.channel.send(`
\`\`\`md
🔎 Google Search
════════════════════
**Query**: ${query}
**Link**: ${url}
\`\`\`
            `);

        } catch (error) {
            console.error('Error in search command:', error);
            await message.channel.send(`
\`\`\`md
❌ Error
════════════════════
Failed to execute search. Please try again later.
Reason: ${error.message}
\`\`\`
            `);
        }
    },
};