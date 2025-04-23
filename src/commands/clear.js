module.exports = {
    name: 'clear',
    description: 'Clears a specified number of your messages in the channel.',
    category: 'UTILITY',
    hidden: false,
    async execute(client, message, args) {
        if (!message?.channel) return;

        try {
            // Validate input
            const amount = parseInt(args[0]) || 10;
            if (isNaN(amount) || amount < 1 || amount > 100) {
                return message.channel.send(`
\`\`\`md
❌ Error
════════════════════
Please provide a number between 1 and 100!
Example: ${process.env.PREFIX || 'i?'}clear 50
\`\`\`
                `);
            }

            // Send progress message
            const progressMsg = await message.channel.send(`
\`\`\`md
🧹 Clearing Messages
════════════════════
Please wait while ${amount} of your messages are being deleted...
\`\`\`
            `);

            // Fetch messages
            const messages = await message.channel.messages.fetch({ limit: 100 });
            const userMessages = messages
                .filter(m => m.author.id === message.author.id)
                .first(amount);

            if (userMessages.length === 0) {
                await progressMsg.edit(`
\`\`\`md
❌ No Messages Found
════════════════════
No messages from you were found in the last 100 messages!
\`\`\`
                `);
                return setTimeout(() => progressMsg.delete().catch(() => {}), 3000);
            }

            // Try bulk delete for messages < 14 days old
            const now = Date.now();
            const twoWeeksAgo = now - 14 * 24 * 60 * 60 * 1000;
            const bulkDeletable = userMessages.filter(m => m.createdTimestamp > twoWeeksAgo);

            let deletedCount = 0;
            if (bulkDeletable.length > 1) {
                try {
                    const bulkDeleted = await message.channel.bulkDelete(bulkDeletable, true);
                    deletedCount += bulkDeleted.size;
                } catch (bulkError) {
                    console.error('Bulk delete failed:', bulkError.message);
                    // Fall back to individual deletion if bulk fails
                }
            }

            // Individually delete remaining messages
            const remainingMessages = userMessages.filter(m => !bulkDeletable.includes(m));
            for (const msg of remainingMessages) {
                try {
                    await msg.delete();
                    deletedCount++;
                    // Add delay to avoid rate limits (100ms per deletion)
                    await new Promise(resolve => setTimeout(resolve, 100));
                } catch (deleteError) {
                    console.error(`Failed to delete message ${msg.id}:`, deleteError.message);
                }
            }

            // Update progress message with success
            await progressMsg.edit(`
\`\`\`md
✅ Cleared Messages
════════════════════
Successfully deleted ${deletedCount} of your messages!
\`\`\`
            `);

            // Delete progress message after 3 seconds
            setTimeout(() => progressMsg.delete().catch(() => {}), 3000);

        } catch (error) {
            console.error('Error in clear command:', error);
            await message.channel.send(`
\`\`\`md
� example
❌ Error
════════════════════
Failed to clear messages. Please try again later.
Reason: ${error.message}
\`\`\`
            `).then(m => setTimeout(() => m.delete().catch(() => {}), 3000));
        }
    },
};