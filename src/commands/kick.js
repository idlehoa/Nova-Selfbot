module.exports = {
    name: 'kick',
    description: 'Kick a member from the server.',
    async execute(client, message, args) {
      if (!message.member.permissions.has('KICK_MEMBERS')) {
        return message.channel.send('You do not have permission to kick members.');
      }
  
      const member = message.mentions.members.first();
      if (!member) {
        return message.channel.send('Please mention a member to kick.');
      }
  
      if (!member.kickable) {
        return message.channel.send('Cannot kick this member. They may have higher permissions or be the server owner.');
      }
  
      try {
        await member.kick();
        message.channel.send(`${member.user.tag} has been kicked.`);
      } catch (error) {
        console.error(error);
        message.channel.send('There was some error to kick this member.');
      }
    },
  };
  