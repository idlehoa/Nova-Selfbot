module.exports = {
    name: 'ban',
    description: 'Ban a member from the server.',
    async execute(client, message, args) {
      if (!message.member.permissions.has('BAN_MEMBERS')) {
        return message.channel.send('You do not have permission to ban members.');
      }
  
      const member = message.mentions.members.first();
      if (!member) {
        return message.channel.send('Please mention a member to ban.');
      }
  
      if (!member.bannable) {
        return message.channel.send('Cannot ban this member. They may have higher permissions or be the server owner.');
      }
  
      try {
        await member.ban();
        message.channel.send(`${member.user.tag} has been banned.`);
      } catch (error) {
        console.error(error);
        message.channel.send('There was some error to kick this member.');
      }
    },
  };
  