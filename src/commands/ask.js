const AIManager = require('../../AI/AIManager.js');
const { CHARACTERS } = require('../../AI/lib/characters.js');

const CONFIG = {
  PREFIX: process.env.PREFIX || '>',
  ALLOWED_ROLES: ['admin', 'owner'],
  SUBCOMMANDS: {
    DEEP: 'deep',
    DOCTOR: 'doctor',
    CODER: 'coder',
    TEACHER: 'teacher',
    CHEF: 'chef',
    FRIENDLY: 'friendlybot',
    GITHUB: 'github'
  }
};

const defaultAI = new AIManager({
  githubToken: process.env.GITHUB_TOKEN || "",
  endpoint: process.env.AZURE_AI_ENDPOINT || "https://models.inference.ai.azure.com",
  defaultModel: process.env.DEFAULT_MODEL,
  deepseekEnabled: false
});

const deepseekAI = new AIManager({
  githubToken: process.env.GITHUB_TOKEN || "",
  deepseekEnabled: true,
  deepseekApiKey: process.env.DEEPSEEK_API_KEY,
  deepseekEndpoint: process.env.DEEPSEEK_API_ENDPOINT || "https://api.deepseek.com/v1",
  defaultModel: process.env.DEEPSEEK_MODEL
});

const formatOutput = (data, client, message) => `
\`\`\`md
💭 AI Response
════════════════════
Requested by: ${message.author?.username || 'Unknown User'}

🤖 AI Details
════════════════════
Provider: ${data.provider}
Model: ${data.model}
Character: ${data.character}
Response: ${data.response}

⚙️ Bot Details
════════════════════
Powered by: ${client.user.username}
Timestamp: ${new Date().toLocaleString()}
\`\`\`
`;

module.exports = {
  name: 'ask',
  description: 'Ask a question to the AI assistant',
  category: 'AI',
  hidden: false,
  async execute(client, message, args) {
    try {
      if (!args.length) {
        return message.channel.send('❌ Please provide a question!');
      }

      const subcommand = args[0].toLowerCase();
      let isDeepSeek = false;
      let selectedCharacter = (process.env.CHARACTER || Object.keys(CHARACTERS)[0]).toLowerCase();

      if (subcommand === CONFIG.SUBCOMMANDS.DEEP) {
        args.shift();
        if (!args.length) {
          return message.channel.send('❌ Please provide a question after the "deep" subcommand!');
        }
        isDeepSeek = true;
        if (!process.env.DEEPSEEK_API_KEY) {
          return message.channel.send('❌ DeepSeek AI is not properly configured! Please set up DEEPSEEK_API_KEY in environment variables.');
        }
      } else if (
        subcommand === CONFIG.SUBCOMMANDS.DOCTOR ||
        subcommand === CONFIG.SUBCOMMANDS.CODER ||
        subcommand === CONFIG.SUBCOMMANDS.TEACHER ||
        subcommand === CONFIG.SUBCOMMANDS.CHEF ||
        subcommand === CONFIG.SUBCOMMANDS.FRIENDLY ||
        subcommand === CONFIG.SUBCOMMANDS.GITHUB
      ) {
        args.shift();
        if (!args.length) {
          return message.channel.send(`❌ Please provide a question after the "${subcommand}" subcommand!`);
        }
        selectedCharacter = subcommand.toLowerCase();
      }

      if (!CHARACTERS[selectedCharacter]) {
        return message.channel.send(`❌ Character "${selectedCharacter}" not found!`);
      }

      const question = args.join(' ');
      const loadingMessage = await message.channel.send(
        `🤔 ${(isDeepSeek ? 'DeepSeek' : 'Normal')} AI is thinking as ${selectedCharacter}...`
      );

      const aiInstance = isDeepSeek ? deepseekAI : defaultAI;

      const response = await aiInstance.queryAI(
        question,
        message.author.username,
        selectedCharacter
      );

      const data = {
        provider: isDeepSeek ? 'DeepSeek AI' : 'Normal AI',
        model: aiInstance.getCurrentModel(),
        character: selectedCharacter,
        response: response
      };

      await loadingMessage.edit(formatOutput(data, client, message));

    } catch (error) {
      console.error('Error in ask command:', error);
      await message.channel.send(`
\`\`\`md
❌ Error
════════════════════
Failed to get AI response. Please try again later.
Error details: ${error.message}
Provider: ${error.code === 'DEEPSEEK_API_ERROR' ? 'DeepSeek AI' : 'Normal AI'}
\`\`\`
      `);
    }
  },
};