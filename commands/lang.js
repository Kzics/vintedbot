const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('lang')
        .setDescription('Choose your language')
        .addStringOption(option =>
            option.setName('language')
                .setDescription('Select your language')
                .setRequired(true)
                .addChoices(
                    { name: 'English', value: 'en' },
                    { name: 'Français', value: 'fr' },
                    { name: 'Italiano', value: 'it' }
                )),
    async execute(interaction, client) {
        const language = interaction.options.getString('language');
        client.usersLanguageMap.set(interaction.user.id, language);
        await interaction.reply({
            content: `New Language: ${language === 'en' ? 'English' : language === 'fr' ? 'Français' : 'Italiano'}`,
            ephemeral: true
        });
    },
};
