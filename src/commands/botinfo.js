const os = require('os');
const axios = require('axios');
const { version: discordVersion } = require('discord.js-selfbot-v13');
const { version: nodeVersion } = process;
const fs = require('fs').promises;
const NodeCache = require('node-cache'); // Thêm thư viện cache

// Khởi tạo cache với TTL 1 giờ
const cache = new NodeCache({ stdTTL: 3600 });

// Cấu hình
const CONFIG = {
  PREFIX: process.env.PREFIX || 'i?',
  API_TIMEOUT: 3000,
  ALLOWED_ROLES: ['admin', 'owner'], // Vai trò được phép chạy lệnh
};

// Hàm tiện ích chuyển đổi byte sang GB
const bytesToGB = (bytes) => (bytes / 1024 / 1024 / 1024).toFixed(2);

// Hàm định dạng uptime
const formatUptime = (seconds) => {
  const days = Math.floor(seconds / (60 * 60 * 24));
  const hours = Math.floor((seconds % (60 * 60 * 24)) / (60 * 60));
  const minutes = Math.floor((seconds % (60 * 60)) / 60);
  return `${days}d ${hours}h ${minutes}m`;
};

// Lấy thông tin hệ thống
const getSystemInfo = async () => {
  const cpuUsage = (process.cpuUsage().user / 1000000).toFixed(2);
  const totalRam = bytesToGB(os.totalmem());
  const freeRam = bytesToGB(os.freemem());
  const usedRam = (totalRam - freeRam).toFixed(2);
  const ramUsagePercent = ((usedRam / totalRam) * 100).toFixed(2);

  let diskInfo = { total: 0, free: 0, used: 0, percent: 0 };
  try {
    const path = os.platform() === 'win32' ? 'C:' : '/';
    const stats = await fs.statfs(path);
    const blockSize = stats.bsize;
    diskInfo.total = bytesToGB(stats.blocks * blockSize);
    diskInfo.free = bytesToGB(stats.bfree * blockSize);
    diskInfo.used = (diskInfo.total - diskInfo.free).toFixed(2);
    diskInfo.percent = ((diskInfo.used / diskInfo.total) * 100).toFixed(2);
  } catch (error) {
    console.error('Error fetching disk usage:', error.message);
  }

  return {
    cpuUsage,
    ram: { used: usedRam, total: totalRam, percent: ramUsagePercent },
    disk: diskInfo,
    os: {
      type: os.platform() === 'win32' ? 'Windows' : os.platform().replace('linux', 'Linux').replace('darwin', 'macOS'),
      version: os.release(),
      arch: os.arch(),
      cpuModel: os.cpus()[0].model.split(' @')[0].slice(0, 30),
      uptime: formatUptime(os.uptime()),
    },
  };
};

// Lấy thông tin vị trí (với cache)
const getLocation = async () => {
  const cacheKey = 'location';
  if (cache.has(cacheKey)) return cache.get(cacheKey);

  try {
    const ipResponse = await axios.get('https://api.ipify.org?format=json', { timeout: CONFIG.API_TIMEOUT });
    const publicIp = ipResponse.data.ip;
    const geoResponse = await axios.get(`http://ip-api.com/json/${publicIp}`, { timeout: CONFIG.API_TIMEOUT });
    const geoData = geoResponse.data;
    const location = geoData.status === 'success'
      ? `${geoData.city}, ${geoData.regionName}, ${geoData.country}`
      : 'Location unavailable';
    cache.set(cacheKey, location);
    return location;
  } catch (error) {
    console.error('Error fetching location:', error.message);
    return 'Unknown';
  }
};

// Định dạng đầu ra
const formatOutput = (data, client, message) => `
\`\`\`md
🤖 Bot Information
════════════════════
Requested by: ${message.author?.username || 'Unknown User'}

🏠 Host Information
════════════════════
Location: ${data.location}
CPU Usage: ${data.system.cpuUsage}%
RAM Usage: ${data.system.ram.used}GB / ${data.system.ram.total}GB (${data.system.ram.percent}%)
Disk Usage: ${data.system.disk.used}GB / ${data.system.disk.total}GB (${data.system.disk.percent}%)

🌐 Network
════════════════════
WebSocket Ping: ${data.wsPing}ms

💻 System Information
════════════════════
OS: ${data.system.os.type} ${data.system.os.version}
Architecture: ${data.system.os.arch}
CPU: ${data.system.os.cpuModel}
System Uptime: ${data.system.os.uptime}

🤖 Bot Details
════════════════════
Bot Uptime: ${data.botUptime}
Discord.js: v${discordVersion}
Node.js: ${nodeVersion}
Prefix: ${CONFIG.PREFIX}

Powered by ${client.user.username} • ${new Date().toLocaleString()}
\`\`\`
`;

module.exports = {
  name: 'botinfo',
  description: 'Displays detailed information about the bot, host, and system.',
  category: 'INFO',
  hidden: false,
  async execute(client, message, args) {

    try {
      // Thu thập dữ liệu
      const systemInfo = await getSystemInfo();
      const location = await getLocation();
      const wsPing = client.ws.ping;
      const botUptime = formatUptime(process.uptime());

      // Gộp dữ liệu
      const data = {
        location,
        wsPing,
        botUptime,
        system: systemInfo,
      };

      // Gửi kết quả
      await message.channel.send(formatOutput(data, client, message));
    } catch (error) {
      console.error('Error in botinfo command:', error);
      await message.channel.send(`
\`\`\`md
❌ Error
════════════════════
Failed to fetch bot information. Please try again later.
\`\`\`
      `);
    }
  },
};