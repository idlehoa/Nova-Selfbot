const { VALID_ACTIVITY_TYPES } = require('../config/constants');

/**
 * Set Discord Rich Presence for the client
 * @param {Client} client - Discord client instance
 * @param {Object} options - Rich Presence options
 * @param {string} options.name - Activity name
 * @param {string} options.details - Activity details
 * @param {string|null} options.larg eImage - Large image key or URL
 * @param {string|null} options.smallImage - Small image key or URL
 * @param {string} options.type - Activity type (PLAYING, STREAMING, etc.)
 * @param {string} options.status - User status (online, idle, dnd)
 * @returns {Promise<{success: boolean, message: string}>}
 */
const setRichPresence = async (client, options) => {
  try {
    const {
      name = 'Selfbot',
      details = 'Custom Presence',
      largeImage = null,
      smallImage = null,
      type = 'WATCHING',
      status = 'online',
    } = options;

    // Build the presence object
    const presence = {
      activities: [{
        name,
        type: VALID_ACTIVITY_TYPES[type],
        details,
        assets: {},
        timestamps: { start: Date.now() },
      }],
      status,
    };

    // for vaild 
    if (largeImage) presence.activities[0].assets.largeImage = largeImage;
    if (smallImage) presence.activities[0].assets.smallImage = smallImage;

    // Update the client's presence
    await client.user.setPresence(presence);
    return { success: true, message: 'Rich Presence updated successfully.' };
  } catch (error) {
    console.error('Error setting Rich Presence:', { options, error });
    return { success: false, message: error.message || 'Failed to update Rich Presence.' };
  }
};

module.exports = { setRichPresence };