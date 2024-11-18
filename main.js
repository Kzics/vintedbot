const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { loadCommands } = require('./commandManager');
const { trackItems, loadTracks} = require('./itemTracker');
const path = require("path");
const fs = require("fs");

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, client));
    } else {
        client.on(event.name, (...args) => event.execute(...args, client));
    }
}

client.commands = new Collection()
client.usersMap = new Map();
client.usersLanguageMap = new Map();

loadCommands(client);
//trackItems(client);
loadTracks(client)

client.login('');
