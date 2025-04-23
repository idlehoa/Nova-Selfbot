const CONFIG = {
  PREFIX: process.env.PREFIX || 'i?',
  ALLOWED_ROLES: ['admin', 'owner'], // Vai trò được phép chạy lệnh (tùy chọn)
};

// Hàm định dạng đầu ra
const formatOutput = (data, client, message) => `
\`\`\`md
🏓 Ping Information
════════════════════
Requested by: ${message.author?.username || 'Unknown User'}

🌐 Network Latency
════════════════════
Message Latency: ${data.msgLatency}ms
WebSocket Ping: ${data.wsPing}ms

🤖 Bot Details
════════════════════
Powered by: ${client.user.username}
Timestamp: ${new Date().toLocaleString()}
\`\`\`
`;

module.exports = {
  name: 'ping',
  description: 'Displays the bot’s latency and WebSocket ping.',
  category: 'INFO',
  hidden: false,
  async execute(client, message, args) {

    try {
      // Đo latency
      const startTime = Date.now();
      const sentMessage = await message.channel.send('🏓 Pinging...');
      const msgLatency = Date.now() - startTime;
      const wsPing = client.ws.ping;

      // Gộp dữ liệu
      const data = {
        msgLatency,
        wsPing,
      };

      // Gửi kết quả trực tiếp (không cần edit)
      await sentMessage.edit(formatOutput(data, client, message));
    } catch (error) {
      console.error('Error in ping command:', error);
      await message.channel.send(`
\`\`\`md
❌ Error
════════════════════
Failed to measure ping. Please try again later.
\`\`\`
      `);
    }
  },
};