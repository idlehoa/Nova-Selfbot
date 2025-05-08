module.exports = {
    name: 'clear',
    description: 'Clears a specified number of your messages in the channel.',
    category: 'UTILITY',
    hidden: false,
    async execute(client, message, args) {
        // Check if the channel is valid
        if (!message.channel || !['GUILD_TEXT', 'DM'].includes(message.channel.type)) {
            return message.reply('⛔ This command can only be used in text channels or DMs.');
        }

        try {
            // Validate input
            const amount = parseInt(args[0]);
            if (isNaN(amount) || amount < 1 || amount > 100) {
                return message.channel.send(`
\`\`\`md
❌ Error
════════════════════
Please provide a number between 1 and 100!
Example: ${process.env.PREFIX || 'i?'}clear 50
\`\`\`
                `).then(m => setTimeout(() => m.delete().catch(() => {}), 3000));
            }

            // Send progress message
            const progressMsg = await message.channel.send(`
\`\`\`md
🧹 Clearing Messages
════════════════════
Please wait while up to ${amount} of your messages are being deleted...
\`\`\`
            `);

            // Fetch messages (up to 100)
            const messages = await message.channel.messages.fetch({ limit: 100 });
            const userMessages = messages
                .filter(m => m.author.id === client.user.id && m.id !== progressMsg.id) // Exclude progress message
                .first(Math.min(amount, messages.size)); // Limit to the requested amount

            if (userMessages.length === 0) {
                try {
                    await progressMsg.edit(`
\`\`\`md
❌ No Messages Found
════════════════════
No messages from you were found in the last 100 messages!
\`\`\`
                    `);
                    setTimeout(() => progressMsg.delete().catch(() => {}), 3000);
                } catch (editError) {
                    console.error('Failed to edit progress message:', editError.message);
                }
                return;
            }

            // Filter messages that can be deleted (less than 14 days old)
            const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
            const deletableMessages = userMessages.filter(m => m.createdTimestamp > twoWeeksAgo);

            let deletedCount = 0;

            // Delete messages individually (selfbot cannot use bulkDelete)
            for (const msg of deletableMessages) {
                try {
                    await msg.delete();
                    deletedCount++;
                    // Add delay to avoid rate limits (200ms for extra safety)
                    await new Promise(resolve => setTimeout(resolve, 200));
                } catch (deleteError) {
                    console.error(`Failed to delete message ${msg.id}:`, deleteError.message);
                }
            }

            // Update progress message with result
            try {
                await progressMsg.edit(`
\`\`\`md
✅ Cleared Messages
════════════════════
Successfully deleted ${deletedCount}/${userMessages.length} of your messages!
\`\`\`
                `);
            } catch (editError) {
                console.error('Failed to edit progress message:', editError.message);
                // Send a new message if editing fails
                await message.channel.send(`
\`\`\`md
✅ Cleared Messages
════════════════════
Successfully deleted ${deletedCount}/${userMessages.length} of your messages!
\`\`\`
                `)
            }

        } catch (error) {
            console.error('Error in clear command:', error);
            await message.channel.send(`
\`\`\`md
❌ Error
════════════════════
Failed to clear messages. Please try again later.
Reason: ${error.message}
\`\`\`
            `)
        }
    },
};