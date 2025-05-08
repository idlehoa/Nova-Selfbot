module.exports = {
    name: 'taixiu',
    description: 'Play a game of Tài Xỉu (Over/Under) with dice.',
    category: 'FUN',
    hidden: false,
    async execute(client, message, args) {
        // Restrict to token owner (self-bot user) and valid channel
        if (!message?.channel || message.author.id !== client.user.id) return;

        try {
            // Normalize and validate input
            const choice = args[0]?.toLowerCase().replace(/[àáãạả]/g, 'a').replace(/[ìíĩịỉ]/g, 'i');
            const validChoices = ['tai', 'tài', 'xiu', 'xỉu'];
            if (!validChoices.includes(choice)) {
                return message.channel.send(`
\`\`\`md
❌ Error
════════════════════
Please choose **tài** or **xỉu**!
Example: ${process.env.PREFIX || 'i?'}taixiu tài
\`\`\`
                `).then(m => setTimeout(() => m.delete().catch(() => {}), 3000));
            }

            // Roll three dice
            const dice = [
                Math.floor(Math.random() * 6) + 1,
                Math.floor(Math.random() * 6) + 1,
                Math.floor(Math.random() * 6) + 1
            ];
            const total = dice.reduce((a, b) => a + b, 0);
            const result = total >= 11 ? 'tài' : 'xỉu';

            // Determine win/lose
            const normalizedChoice = choice === 'tai' || choice === 'tài' ? 'tài' : 'xỉu';
            const outcome = normalizedChoice === result ? '✅ You won!' : '❌ You lost!';

            // Add slight delay to avoid rate limits
            await new Promise(resolve => setTimeout(resolve, 100));

            // Send formatted response
            await message.channel.send(`
\`\`\`md
🎲 Tài Xỉu Result
════════════════════
**Dice**: [ ${dice.join(' + ')} ] = ${total}
**Result**: ${result.toUpperCase()}
**Your Choice**: ${normalizedChoice.toUpperCase()}
**Outcome**: ${outcome}
\`\`\`
            `)

        } catch (error) {
            console.error('Error in taixiu command:', error);
            await message.channel.send(`
\`\`\`md
❌ Error
════════════════════
Failed to execute Tài Xỉu. Please try again later.
Reason: ${error.message}
\`\`\`
            `)
        }
    },
};