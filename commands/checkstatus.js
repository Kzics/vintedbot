const {SlashCommandBuilder} = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('checkstatus')
        .setDescription('Check your login status'),
    async execute(interaction, client) {
        const userId = interaction.user.id

        if(!client.usersMap.has(userId)){
            await interaction.reply({
                content: "Vous n'êtes pas connecté, veuillez faire /connect",
                ephemeral: true
            })
            return
        }
        const loginData = client.usersMap.get(userId)

        await interaction.reply({
            content: `You are connected with token ${loginData}`
        })
        },
};
