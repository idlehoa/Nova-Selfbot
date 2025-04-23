const RPCHandler = require('../handlers/RPCHandler');
const { VALID_ACTIVITY_TYPES, VALID_STATUSES } = require('../config/constants');

// Use built-in fetch (Node.js 18+) or node-fetch
let fetch;
try {
  fetch = global.fetch || require('node-fetch');
} catch {
  console.warn('node-fetch is not installed. Run `npm install node-fetch` or use Node.js 18+.');
}

// Function to format output
const formatOutput = (data, client, message) => `
\`\`\`md
🎮 Rich Presence Changer
════════════════════
Requested by: ${message.author?.username || 'Unknown User'}

${data.message}

🤖 Bot Details
════════════════════
Powered by: ${client.user.username}
Timestamp: ${new Date().toLocaleString()}
\`\`\`
`;

// Function to parse arguments, supporting quoted strings
const parseArgs = (args) => {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let arg of args) {
    if (inQuotes) {
      if (arg.endsWith('"')) {
        inQuotes = false;
        current += ` ${arg.slice(0, -1)}`;
        result.push(current.trim());
        current = '';
      } else {
        current += ` ${arg}`;
      }
    } else if (arg.startsWith('"')) {
      inQuotes = true;
      current = arg.slice(1);
    } else {
      result.push(arg);
    }
  }

  if (current) result.push(current.trim());
  return result.filter(arg => arg !== '');
};

// Function to validate image URL
const validateImageUrl = async (url, field) => {
  if (!url) return true;
  if (!fetch) throw new Error('Fetch is not available. Install node-fetch or use Node.js 18+.');

  try {
    const response = await fetch(url, { method: 'HEAD', redirect: 'follow' });
    const contentType = response.headers.get('content-type');
    const contentLength = response.headers.get('content-length');

    if (!contentType || !contentType.startsWith('image/')) {
      throw new Error(`URL does not point to an image (Content-Type: ${contentType || 'unknown'}). Use a Discord CDN URL or asset key.`);
    }

    if (contentLength && parseInt(contentLength) < 1000) {
      throw new Error(`URL likely points to a non-image resource (size: ${contentLength} bytes).`);
    }

    // Warn if not a Discord CDN
    if (!url.includes('cdn.discordapp.com')) {
      console.warn(`Warning: ${field} URL (${url}) may not be supported by Discord API. Prefer Discord CDN URLs or asset keys.`);
    }

    return true;
  } catch (error) {
    throw new Error(`${error.message}`);
  }
};

// Function to validate asset key
const validateAssetKey = (key) => {
  return key && /^[a-zA-Z0-9_-]+$/.test(key);
};

module.exports = {
  name: 'rpc',
  description: 'Change the Discord Rich Presence for the selfbot.',
  category: 'UTILITY',
  hidden: false,
  /**
   * Execute the RPC command to update Rich Presence
   * @param {Client} client - Discord client instance
   * @param {Message} message - Discord message object
   * @param {string[]} args - Command arguments
   */
  async execute(client, message, args) {
    try {
      // Parse arguments
      const parsedArgs = parseArgs(args);

      // Validate input
      if (parsedArgs.length < 2) {
        return message.channel.send(`
\`\`\`md
🎮 RPC Changer Usage
════════════════════
Usage: ${process.env.PREFIX || '!'}rpc changer <name> "<details>" [largeImage] [smallImage] [type] [status]
Valid types: ${Object.keys(VALID_ACTIVITY_TYPES).join(', ')}
Valid statuses: ${VALID_STATUSES.join(', ')}
Notes:
- For largeImage/smallImage, use asset keys from Discord Developer Portal or Discord CDN URLs (e.g., https://cdn.discordapp.com/...).
- Imgur URLs (e.g., https://i.imgur.com/AXIchiQ.jpeg) may not be supported by Discord API.
- Supported image formats: .jpg, .jpeg, .png, .gif, .webp, .bmp, .tiff, .svg, etc.
- Enclose details in quotes if it contains spaces.
Examples:
- ${process.env.PREFIX}rpc changer Chrome "Browsing the web" chrome_icon google_icon PLAYING online
- ${process.env.PREFIX}rpc changer Clara "ChitClara on Twitch" clara_image clara_small WATCHING dnd
\`\`\`
        `);
      }

      const [subcommand, name, details, largeImage, smallImage, type = 'WATCHING', status = 'online'] = parsedArgs;

      if (subcommand.toLowerCase() !== 'changer') {
        return message.channel.send('❌ Invalid subcommand. Use "changer".');
      }

      // Normalize and validate type
      const normalizedType = type.toUpperCase();
      if (!VALID_ACTIVITY_TYPES[normalizedType]) {
        return message.channel.send(`❌ Invalid activity type: ${type}. Valid types are: ${Object.keys(VALID_ACTIVITY_TYPES).join(', ')}`);
      }

      // Validate status
      const normalizedStatus = status.toLowerCase();
      if (!VALID_STATUSES.includes(normalizedStatus)) {
        return message.channel.send(`❌ Invalid status: ${status}. Valid statuses are: ${VALID_STATUSES.join(', ')}`);
      }

      // Validate largeImage and smallImage
      const validateImage = async (image, field) => {
        if (!image || image === '') return true;
        if (image.startsWith('https://')) {
          await validateImageUrl(image, field);
          if (!image.includes('cdn.discordapp.com')) {
            return message.channel.send(`❌ Invalid ${field}. Discord API may not support external URLs like Imgur. Use a Discord CDN URL or asset key from Developer Portal.`);
          }
          return true;
        }
        if (!validateAssetKey(image)) {
          throw new Error(`Invalid ${field}. Asset key must contain only letters, numbers, underscores, or hyphens.`);
        }
        return true;
      };

      await validateImage(largeImage, 'largeImage');
      await validateImage(smallImage, 'smallImage');

      // Call handler to set RPC
      const result = await RPCHandler.setRichPresence(client, {
        name: name.slice(0, 128),
        details: details.slice(0, 128),
        largeImage: largeImage && largeImage !== '' ? largeImage : null,
        smallImage: smallImage && smallImage !== '' ? smallImage : null,
        type: normalizedType,
        status: normalizedStatus,
      });

      return message.channel.send(formatOutput(result, client, message));
    } catch (error) {
      console.error('Error in rpc command:', { args, error });
      return message.channel.send(`❌ Failed to process RPC command: ${error.message || 'Unknown error.'}`);
    }
  },
};