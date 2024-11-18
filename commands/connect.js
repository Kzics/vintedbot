const { SlashCommandBuilder, ActionRowBuilder, TextInputStyle, TextInputBuilder, ModalBuilder, EmbedBuilder, Colors} = require('discord.js');
const {getTranslation} = require("../languages")
const axios = require("axios");
const {getRandomUserAgent} = require("../httpRequests");
//const axios = require("axios");
//const { getRandomUserAgent, authorizedRequest } = require('../httpRequests');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('connect')
        .setDescription('Connect to Vinted'),
    async execute(interaction, client) {
        const userId = interaction.user.id
        const userLanguage = client.usersLanguageMap.get(userId)
        if(client.usersMap.has(userId)){
            const embed = new EmbedBuilder()
                .setColor(Colors.Red)
                .setTitle(getTranslation(userLanguage,'connect.already-connected'))
            return
        }
        try {
            const modal = new ModalBuilder()
                .setCustomId('connectModal')
                .setTitle(getTranslation(client.usersLanguageMap.get(userId),'connect.title'));

            const tokenInput = new TextInputBuilder()
                .setCustomId('tokenInput')
                .setLabel(getTranslation(client.usersLanguageMap.get(userId), 'connect.token_label'))
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const refreshTokenInput = new TextInputBuilder()
                .setCustomId('refreshTokenInput')
                .setLabel(getTranslation(client.usersLanguageMap.get(userId), 'connect.refresh_token_label'))
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const xcsrfInput = new TextInputBuilder()
                .setCustomId('xcsrfInput')
                .setLabel(getTranslation(client.usersLanguageMap.get(userId), 'connect.xcsrf_token_label'))
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const firstActionRow = new ActionRowBuilder().addComponents(tokenInput);
            const secondActionRow = new ActionRowBuilder().addComponents(refreshTokenInput);
            const thirdActionRow = new ActionRowBuilder().addComponents(xcsrfInput);

            modal.addComponents(firstActionRow, secondActionRow, thirdActionRow);

            await interaction.showModal(modal);
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'There was an error displaying the modal.', ephemeral: true });
        }
    },
};


