const { RichPresence } = require('discord.js-selfbot-v13');

module.exports = {
    name: 'rpcchanger',
    async execute(message, args, client) {
        const content = args.join(' ').trim();

        if (!content) return message.reply('Wrong rpc pls try again');

        const fields = content.split(';').map(f => f.trim());
        const rpcData = {};

        for (const field of fields) {
            const [key, ...valueParts] = field.split('=');
            if (!key || !valueParts.length) continue;
            rpcData[key.toLowerCase()] = valueParts.join('=').trim();
        }

        const rpc = new RichPresence(client);

        if (rpcData.name) rpc.setName(rpcData.name);
        if (rpcData.details) rpc.setDetails(rpcData.details);
        if (rpcData.state) rpc.setState(rpcData.state);
        if (rpcData.type) rpc.setType(rpcData.type.toUpperCase());
        if (rpcData.largeImage) rpc.setAssetsLargeImage(rpcData.largeImage);
        if (rpcData.largeText) rpc.setAssetsLargeText(rpcData.largeText);
        if (rpcData.buttontext && rpcData.buttonurl) {
            rpc.addButton(rpcData.buttontext, rpcData.buttonurl);
        }

        rpc.setStartTimestamp(Date.now());
        rpc.setPlatform('desktop');

        client.user.setActivity(rpc.toJSON());

        message.reply('RPC YESSIR');
    }
};