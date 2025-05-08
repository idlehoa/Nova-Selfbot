const { default: AIManager } = require('../../AI/AIManager.js');
const { CHARACTERS } = require('../../AI/lib/characters.js');

const CONFIG = {
  PREFIX: process.env.PREFIX || '>',
  ALLOWED_ROLES: ['admin', 'owner'],
  SUBCOMMANDS: {
    DEEP: 'deep'
  }
};

// Create instances of AIManager for different providers
const defaultAI = new AIManager({
  githubToken: process.env.GITHUB_TOKEN || "",
  endpoint: process.env.AZURE_AI_ENDPOINT || "https://models.inference.ai.azure.com",
  defaultModel: process.env.DEFAULT_MODEL ,
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
      // Check if there's a question
      if (!args.length) {
        return message.channel.send('❌ Please provide a question!');
      }

      // Check if using DeepSeek subcommand
      const isDeepSeek = args[0].toLowerCase() === CONFIG.SUBCOMMANDS.DEEP;
      
      // Remove subcommand if present
      let question;
      if (isDeepSeek) {
        // Remove 'deep' subcommand and check remaining args
        args.shift();
        if (!args.length) {
          return message.channel.send('❌ Please provide a question after the "deep" subcommand!');
        }
        question = args.join(' ');

        // Check if DeepSeek is properly configured
        if (!process.env.DEEPSEEK_API_KEY) {
          return message.channel.send('❌ DeepSeek AI is not properly configured! Please set up DEEPSEEK_API_KEY in environment variables.');
        }
      } else {
        // Use all args as question for normal mode
        question = args.join(' ');
      }

      // Send initial response
      const loadingMessage = await message.channel.send(
        `🤔 ${isDeepSeek ? 'DeepSeek' : 'Normal'} AI is thinking...`
      );

      // Get default character or use the first available one
      const CHARACTER = process.env.CHARACTER || Object.keys(CHARACTERS)[0];

      // Select AI instance based on mode
      const aiInstance = isDeepSeek ? deepseekAI : defaultAI;

      // Query the AI
      const response = await aiInstance.queryAI(
        question,
        message.author.username,
        CHARACTER
      );

      // Prepare response data
      const data = {
        provider: isDeepSeek ? 'DeepSeek AI' : 'Normal AI',
        model: aiInstance.getCurrentModel(),
        character: CHARACTER,
        response: response
      };

      // Edit message with formatted response
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