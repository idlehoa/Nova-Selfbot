const { MessageEmbed } = require('discord.js');
const moment = require('moment');

module.exports = {
  name: 'serverinfo',
  description: 'Display concise server information',
  category: 'UTILITY',
  hidden: false,

  async execute(client, message, args) {
    try {
      if (!message.guild) return message.reply('⛔ This command is server-only.');

      message.react('🔍').catch(() => {});
      const guild = message.guild;
      const showEmojis = args[0]?.toLowerCase() === 'emojis';

      // Fetch essential guild data
      await Promise.all([
        guild.members.fetch().catch(() => {}),
        guild.channels.fetch().catch(() => {}),
        guild.roles.fetch().catch(() => {}),
        guild.emojis.fetch().catch(() => {})
      ]);

      const owner = guild.members.cache.get(guild.ownerId);
      const createdAt = moment(guild.createdAt).format('MMM Do YYYY');
      const daysAgo = Math.floor((Date.now() - guild.createdAt) / (1000 * 60 * 60 * 24));

      // Channel counts
      const channels = guild.channels.cache;
      const channelStats = {
        text: channels.filter(c => c.type === 'GUILD_TEXT').size,
        voice: channels.filter(c => c.type === 'GUILD_VOICE').size,
        categories: channels.filter(c => c.type === 'GUILD_CATEGORY').size,
        threads: channels.filter(c => c.type.includes('THREAD')).size
      };

      // Member counts
      const members = guild.members.cache;
      const memberStats = {
        humans: members.filter(m => !m.user.bot).size,
        bots: members.filter(m => m.user.bot).size,
        online: members.filter(m => m.presence?.status === 'online').size,
        total: guild.memberCount
      };

      // Role and emoji counts
      const roleCount = guild.roles.cache.size - 1;
      const emojis = guild.emojis.cache;
      const emojiStats = {
        total: emojis.size,
        animated: emojis.filter(e => e.animated).size,
        static: emojis.size - emojis.filter(e => e.animated).size
      };

      // Verification and boost levels
      const verificationLevels = {
        NONE: 'None',
        LOW: 'Low',
        MEDIUM: 'Medium',
        HIGH: 'High',
        VERY_HIGH: 'Very High'
      };
      const premiumTiers = {
        NONE: 'Level 0',
        TIER_1: 'Level 1',
        TIER_2: 'Level 2',
        TIER_3: 'Level 3'
      };

      // Boost progress bar
      const boostBar = () => {
        const boosts = guild.premiumSubscriptionCount || 0;
        const max = 14;
        const filled = Math.floor((boosts / max) * 10);
        return `\`${'█'.repeat(filled)}${'░'.repeat(10 - filled)}\` ${boosts}/${max}`;
      };

      // Format emojis
      const formatEmojis = () => {
        if (emojiStats.total === 0) return 'No emojis';
        if (emojiStats.total > 30 && !showEmojis) return `${emojiStats.total} emojis (use \`serverinfo emojis\`)`;
        return `Animated: ${emojis.filter(e => e.animated).map(e => e.toString()).join(' ') || 'None'}\nStatic: ${emojis.filter(e => !e.animated).map(e => e.toString()).join(' ') || 'None'}`;
      };

      // Main response
      let response = `
\`\`\`fix
┌────────────────────────────┐
│      SERVER INFO      
│      ${guild.name.padEnd(14).substring(0, 14)}      
└────────────────────────────┘
\`\`\`

**📋 General**
> **ID:** \`${guild.id}\`
> **Owner:** ${owner?.user.tag || 'Unknown'}
> **Created:** ${createdAt} (${daysAgo} days ago)

**👥 Members** (${memberStats.total})
> **Humans:** ${memberStats.humans} | **Bots:** ${memberStats.bots}
> **Online:** ${memberStats.online}

**📚 Channels**
> **Text:** ${channelStats.text} | **Voice:** ${channelStats.voice}
> **Categories:** ${channelStats.categories} | **Threads:** ${channelStats.threads}

**🔧 Roles & Emojis**
> **Roles:** ${roleCount}
> **Emojis:** ${emojiStats.static} static + ${emojiStats.animated} animated

**🏆 Boost**
> **Level:** ${premiumTiers[guild.premiumTier]}
> **Progress:** ${boostBar()}

**🛡️ Security**
> **Verification:** ${verificationLevels[guild.verificationLevel]}
> **2FA Mods:** ${guild.mfaLevel ? '✅' : '❌'}`;

      // Handle emoji display
      if (showEmojis && emojiStats.total > 0) {
        await message.reply(response);
        return message.channel.send(`\`\`\`fix\nSERVER EMOJIS\n\`\`\`\n${formatEmojis()}`);
      }
      if (emojiStats.total > 0 && emojiStats.total <= 30 && !showEmojis) {
        response += `\n\n**😺 Emojis**\n${emojis.map(e => e.toString()).join(' ')}`;
      } else if (emojiStats.total > 30) {
        response += `\n\n**😺 Emojis**\n> ${emojiStats.total} emojis (use \`serverinfo emojis\`)`;
      }

      await message.reply(response);
    } catch (error) {
      console.error('Serverinfo error:', error);
      message.reply(`❌ Error: ${error.message}`).catch(() => {});
    }
  }
};