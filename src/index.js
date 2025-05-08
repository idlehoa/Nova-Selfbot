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

const { default: AIManager } = require('../AI/AIManager.js');

const aiManager = new AIManager(
  process.env.GITHUB_TOKEN || "",
  process.env.AZURE_AI_ENDPOINT || "https://models.inference.ai.azure.com",
  process.env.DEFAULT_MODEL || "gpt-4o"
);

global.aiManager = aiManager; 
client.aiManager = aiManager; 

client.login(process.env.TOKEN);

