const { AI_MODELS } = require('../../AI/lib/constants.js');
const fs = require('fs');
const path = require('path');

const formatOutput = (oldModel, newModel, type, client, message) => `\`\`\`md
🔄 Model Change
════════════════════
Requested by: ${message.author?.username || 'Unknown User'}

📊 Change Details
════════════════════
Type: ${type === 'deep' ? 'DeepSeek AI' : 'Normal AI'}
Old Model: ${oldModel}
New Model: ${newModel}
Status: ✅ Successfully changed and saved to configuration

⚙️ Bot Details
════════════════════
Powered by: ${client.user.username}
Timestamp: ${new Date().toLocaleString()}
\`\`\``;

const formatModelList = (type = 'normal') => {
    const models = type === 'deep' 
        ? AI_MODELS.filter(model => model.startsWith('deepseek'))
        : AI_MODELS.filter(model => !model.startsWith('deepseek'));

    return `\`\`\`md
📝 Available ${type === 'deep' ? 'DeepSeek' : 'Normal'} Models
════════════════════
${models.map((model, index) => `${index + 1}. ${model}`).join('\n')}
\`\`\``;
};

const updateEnvFile = (key, value) => {
    const envPath = path.resolve(process.cwd(), '.env');
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // Create regex to match the key and any value after it
    const regex = new RegExp(`^${key}=.*$`, 'm');
    
    if (envContent.match(regex)) {
        // Update existing key
        envContent = envContent.replace(regex, `${key}=${value}`);
    } else {
        // Add new key at the end
        envContent = `${envContent}\n${key}=${value}`;
    }
    
    fs.writeFileSync(envPath, envContent);
};

module.exports = {
    name: 'changemodel',
    description: 'Change and save the AI model configuration',
    category: 'AI',
    hidden: false,
    async execute(client, message, args) {
        try {
            // Get AI Manager instance
            const aiManager = client.aiManager || global.aiManager;
            if (!aiManager) {
                return message.channel.send('❌ AI Manager not initialized!');
            }

            // Show help if no arguments
            if (!args.length) {
                return message.channel.send(`${formatModelList('normal')}
${formatModelList('deep')}
\`\`\`md
ℹ️ Usage Guide
════════════════════
Normal AI: ${process.env.PREFIX || '>'}changemodel normal <model_name>
DeepSeek AI: ${process.env.PREFIX || '>'}changemodel deep <model_name>

Current Configuration:
- Normal Model: ${process.env.DEFAULT_MODEL}
- DeepSeek Model: ${process.env.DEEPSEEK_MODEL}
\`\`\``);
            }

            const type = args[0].toLowerCase();
            if (!['normal', 'deep'].includes(type)) {
                return message.channel.send('❌ Invalid type! Use "normal" or "deep"');
            }

            if (args.length < 2) {
                return message.channel.send(`${formatModelList(type)}
\`\`\`md
ℹ️ Usage
════════════════════
${process.env.PREFIX || '>'}changemodel ${type} <model_name>

Current ${type === 'deep' ? 'DeepSeek' : 'Normal'} Model: ${type === 'deep' ? process.env.DEEPSEEK_MODEL : process.env.DEFAULT_MODEL}
\`\`\``);
            }

            const newModel = args[1].toLowerCase();
            const oldModel = type === 'deep' ? process.env.DEEPSEEK_MODEL : process.env.DEFAULT_MODEL;

            // Validate model based on type
            const isValidModel = type === 'deep' 
                ? newModel.startsWith('deepseek') && AI_MODELS.includes(newModel)
                : !newModel.startsWith('deepseek') && AI_MODELS.includes(newModel);

            if (!isValidModel) {
                return message.channel.send(`❌ Invalid ${type} model: "${newModel}"

${formatModelList(type)}
\`\`\`md
ℹ️ Current ${type === 'deep' ? 'DeepSeek' : 'Normal'} Model: ${oldModel}

Usage: ${process.env.PREFIX || '>'}changemodel ${type} <model_name>
\`\`\``);
            }

            // Update .env file
            const envKey = type === 'deep' ? 'DEEPSEEK_MODEL' : 'DEFAULT_MODEL';
            updateEnvFile(envKey, newModel);

            // Update environment variable
            process.env[envKey] = newModel;

            // Update AI Manager
            if (type !== 'deep') {
                aiManager.changeAIModel(newModel);
            }

            await message.channel.send(formatOutput(oldModel, newModel, type, client, message));

        } catch (error) {
            console.error('Error in changemodel command:', error);
            await message.channel.send(`\`\`\`md
❌ Error
════════════════════
Failed to change AI model. Please try again later.
Error details: ${error.message}
\`\`\``);
        }
    },
};