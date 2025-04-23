module.exports = async (client) => {
    console.log(`Logged in as ${client.user.tag}!`);
  
    const totalCommands = client.commands.size;
  
    const logChannel = client.channels.cache.get(process.env.LOG_CHANNEL_ID);
    if (logChannel) {
      logChannel.send(`Bot Start Success. Loaded ${totalCommands} commands.`);
    }
  };
  