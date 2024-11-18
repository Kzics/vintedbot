const path = require("path");
const fs = require("fs");
const { REST, Routes } = require('discord.js');

const commandsPath = path.join(__dirname, 'commands');

c = []
function loadCommands(client) {
    const commandFiles = fs.readdirSync(commandsPath, { withFileTypes: true })
        .flatMap(dirent => dirent.isDirectory()
            ? fs.readdirSync(path.join(commandsPath, dirent.name)).map(file => path.join(dirent.name, file))
            : dirent.name);

    for (const file of commandFiles) {
        if (file.endsWith('.js')) {
            const filePath = path.join(commandsPath, file);
            const command = require(filePath);
            if ('data' in command && 'execute' in command && 'name' in command.data) {
                client.commands.set(command.data.name, command);
                c.push(command.data.toJSON())
            } else {
                console.log(`[WARNING] The command at ${filePath} is missing a required "data", "execute" or "name" property.`);
            }
        }
    }

    const rest = new REST().setToken('MTE2Nzk0ODg2ODEzNTE3MDIwOA.Gqv4wE.bG9gNXtZY1QbW8UM0PpvPME6-awDYZ7LqxitnU');

    (async () => {
        try {
            console.log(`Started refreshing ${client.commands.length} application (/) commands.`);

            console.log(c)
            // The put method is used to fully refresh all commands in the guild with the current set
            const data = await rest.put(
                Routes.applicationCommands('1167948868135170208'),
                { body: c },
            );


            console.log(`Successfully reloaded ${data.length} application (/) commands.`);
        } catch (error) {
            // And of course, make sure you catch and log any errors!
            console.error(error);
        }
    })();
}


module.exports = { loadCommands };
