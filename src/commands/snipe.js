// commands/snipe.js

module.exports = {
    name: 'snipe',
    description: 'Shows the most recently deleted message in the channel (from cache).',
    category: 'UTILITY',
    hidden: false,
    aliases: ['s'],
    cooldown: 3,

    async execute(client, message, args) {

        // --- Permission Check ---
        if (message.author.id !== client.user.id) {
            return;
        }

        try {
            // --- Access Snipe Cache ---
            if (typeof client.snipesCache === 'undefined') {
                console.error("[Snipe Command Error] client.snipesCache is undefined. Check index.js 'ready' event.");
                return message.reply({
                    content: "❌ **Error:** Snipe cache is not initialized.",
                    allowedMentions: { repliedUser: false }
                }).catch(console.error);
            }

            const snipesCache = client.snipesCache;
            const snipedMessageData = snipesCache[message.channel.id];

            // --- Check if a Valid Snipe Exists in Cache ---
            if (!snipedMessageData || !snipedMessageData.content || !snipedMessageData.author || !snipedMessageData.timestamp) {
                return message.reply({
                    content: "❓ No recently deleted messages found in cache for this channel.",
                    allowedMentions: { repliedUser: false }
                }).catch(console.error);
            }

            // --- Extract data ---
            const { content, author, authorId, timestamp, channelName, guildName } = snipedMessageData;

            // --- *** LOG TO CONSOLE (CMD) *** ---
            const readableStoredTime = new Date(timestamp).toISOString(); // Human-readable UTC time
            console.log(`\n--- Snipe Command Execution (Channel: ${message.channel.id}) ---`);
            console.log(`[CMD LOG] Retrieved Author: ${author} (${authorId})`);
            console.log(`[CMD LOG] Retrieved Timestamp: ${timestamp} (${readableStoredTime})`); // Log raw and readable time
            console.log(`[CMD LOG] Retrieved Content: "${content}"`); // Log the content
            console.log(`-----------------------------------------------------`);
            // --- *** END LOG TO CONSOLE *** ---

// --- Format and Send the Snipe Information using Markdown Box ---
            const timestampSeconds = Math.floor(timestamp / 1000);

            // *** THIS IS THE LINE WE ADDED - CHECK FOR TYPOS HERE ***
            console.log(`[CMD LOG] Calculated timestampSeconds for <t:...>: ${timestampSeconds}`);
            // *** ENSURE THE LINE ABOVE IS EXACTLY AS SHOWN ***

            const relativeTimestamp = `<t:${timestampSeconds}:R>`;
            const fullTimestamp = `<t:${timestampSeconds}:F>`;

            const outputContent = `
\`\`\`ini
[ Sniped Message ]
Guild   = ${guildName || 'Direct Message'}
Channel = #${channelName || message.channel.name || 'Unknown Channel'}
Author  = ${author} (${authorId})
Deleted = ${fullTimestamp} (${relativeTimestamp})

[ Content ]
${content}
\`\`\`
            `;

            // Reply to the original command message
            await message.reply({
                content: outputContent,
                allowedMentions: { repliedUser: false }
            }).catch(err => {
                console.error("Failed to reply with snipe message:", err);
                message.channel.send({ // Fallback send
                    content: outputContent,
                    allowedMentions: { repliedUser: false }
                 }).catch(console.error);
            });

        } catch (error) { // <--- Make sure this catch block is still correct
            console.error('Error occurred during the snipe command execution:', error);
            try {
                await message.reply({
                    content: `❌ An unexpected error occurred: ${error.message}`,
                    allowedMentions: { repliedUser: false }
                }).catch(console.error);
            } catch { /* Ignore fallback error */ }
        }
    },
};
