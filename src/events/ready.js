module.exports = async (client) => {
  // Startup timestamp for uptime tracking
  client.startTimestamp = Date.now();
  
  // Log startup information - more discreet for selfbots
  console.log(`----------------------------------------------`);
  console.log(`Selfbot initialized as ${client.user.tag}`);
  console.log(`Loaded ${client.commands.size} commands`);
  console.log(`Active in ${client.guilds.cache.size} servers`);
  console.log(`----------------------------------------------`);
  
  // Self-monitoring routine
  setInterval(() => {
    // Check RAM usage
    const memoryUsage = process.memoryUsage();
    const memoryUsageMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
    
    // Log to console if memory usage is high
    if (memoryUsageMB > 200) { // Alert if using more than 200MB
      console.warn(`High memory usage detected: ${memoryUsageMB}MB`);
    }
    
    // Calculate uptime
    const uptime = Math.floor((Date.now() - client.startTimestamp) / 1000 / 60);
    
    if (uptime % 60 === 0) { // Log every hour
      console.log(`Selfbot running for ${uptime} minutes`);
    }
  }, 60000); // Check every minute
  
  // Store original DM channels for easy access
  client.importantDMs = {};
  
  // Optional: You might want to cache important DM channels
  if (process.env.IMPORTANT_USER_IDS) {
    const importantUserIds = process.env.IMPORTANT_USER_IDS.split(',');
    for (const userId of importantUserIds) {
      try {
        const user = await client.users.fetch(userId);
        const dmChannel = await user.createDM();
        client.importantDMs[userId] = dmChannel;
      } catch (error) {
        console.error(`Failed to cache DM for user ${userId}:`, error);
      }
    }
  }
};