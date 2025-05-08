const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'addy',
    description: 'Sends LTC address.',
    category: 'UTILITY',
    hidden: false,
    async execute(client, message, args) {
        // Restrict to token owner (self-bot user) and valid channel
        if (!message?.channel || message.author.id !== client.user.id) return;

        const prefix = process.env.PREFIX || 'i?';
        const ltcAddress = 'LNknCKRK5wziX3ZF1rhCY3pxR1Q3ibeFAb';

        try {
            // Add slight delay to avoid rate limits
            await new Promise(resolve => setTimeout(resolve, 100));

            // Send formatted LTC address
            await message.channel.send(`
\`\`\`md
💸 LTC Payment Address
════════════════════
╔══════ ✦ Address Details ✦ ══════╗
║  Address: ${ltcAddress}  
║  Network: Litecoin (LTC)
╚══════ Requested by ${message.author.username} ══════╝
\`\`\`
            `)

        } catch (error) {
            console.error('Error in addy command:', error);
            await message.channel.send(`
\`\`\`md
❌ Error
════════════════════
Failed to send LTC address. Please try again later.
Reason: ${error.message}
\`\`\`
            `)
        }
    },
};