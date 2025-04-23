const fs = require('fs');
const path = require('path');
const authHandler = require('./authHandler'); 

module.exports = (client) => {
  const commandsPath = path.join(__dirname, '../commands');
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

  console.log(`\nLoaded commands:`); 

  for (const file of commandFiles) {
    const command = require(`${commandsPath}/${file}`);
    client.commands.set(command.name, command);
    console.log(`- ${command.name}`);  
  }

  client.on('messageCreate', async message => {
    if (message.author.id !== client.user.id) return;

    const prefix = process.env.PREFIX || "!";
    if (!message.content.startsWith(prefix) || message.author.bot) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();
    const command = client.commands.get(commandName);

    if (!command) return;

    if (!authHandler.isOwner(message)) {
      return message.channel.send('');
    }

    try {
      await command.execute(client, message, args);
    } catch (error) {
      console.error(error);
      message.channel.send('There was an error executing that command.');
    }
  });
};
