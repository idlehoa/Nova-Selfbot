const fs = require('fs');
const path = require('path');

module.exports = (client) => {
  const eventsPath = path.join(__dirname, '../events');
  const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

  console.log(`\nLoaded events:`);
  for (const file of eventFiles) {
    const event = require(`${eventsPath}/${file}`);
    const eventName = file.split('.')[0];
    client.on(eventName, event.bind(null, client));
    console.log(`- ${eventName}`); 
  }
};
