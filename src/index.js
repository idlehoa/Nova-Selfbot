require('dotenv').config();
const { Client, Collection } = require('discord.js-selfbot-v13');
const fs = require('fs');
const path = require('path');
const client = new Client();

client.commands = new Collection();

const handlersPath = path.join(__dirname, 'handlers');
['commandHandler', 'eventHandler'].forEach(handler => {
  require(`${handlersPath}/${handler}`)(client);
});


client.login(process.env.TOKEN);

