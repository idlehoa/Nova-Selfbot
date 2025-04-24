const { RichPresence } = require('discord.js-selfbot-v13');

module.exports = {
    name: 'ready',
    once: true,
    async execute(client) {
        console.log(`${client.user.username} is ready!`);
        
        const grassRPC = new RichPresence(client)
            .setType('PLAYING')
            .setName('Touching grass 🌿')
            .setDetails('Outside... breathing real air 💨')
            .setState('Escaped the Discord basement 🕳️')
            .setStartTimestamp(Date.now())
            .setEndTimestamp(Date.now() + (69 * 60 + 420) * 1000)
            .setAssetsLargeImage('https://media.discordapp.net/attachments/1359207300555870548/1364621653304152237/215522-050-8315BB78.png')
            .setAssetsLargeText('Grass on da top')
            .setPlatform('desktop')
            .addButton('How to Touch Grass', 'https://www.wikihow.com/Touch-Grass');

        client.user.setActivity(grassRPC.toJSON());

        console.log(' Rich Presence has been set.');
    }
};