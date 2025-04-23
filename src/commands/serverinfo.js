module.exports = {
    name: 'serverinfo',
    description: 'Show guild info.',
    async execute(message) {
        if (!message.guild) return message.channel.send('This command only works in servers!');
        const guild = message.guild;
        const response = "```ini\n" +
            "[Server Info]\n" +
            `Name = ${guild.name}\n` +
            `ID = ${guild.id}\n` +
            `Members = ${guild.memberCount}\n` +
            `Owner = ${guild.ownerId}\n` +
            `Created = ${guild.createdAt.toLocaleDateString()}\n` +
            "```";
        await message.channel.send(response);
    }
};