const { Events, EmbedBuilder, Colors} = require('discord.js');
const { favoriteItem } = require('../interactionHandler');
const { getTransactionId, payItem, getRandomUserAgent} = require('../httpRequests');
const { getTranslation } = require('../languages');
const axios = require("axios");

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {
        const userLanguage = client.usersLanguageMap.get(interaction.user.id) || 'en';

        if (interaction.isButton()) {
            const userId = interaction.user.id;
            const customId = interaction.customId;

            if (!client.usersMap.has(userId)) {
                const embed = new EmbedBuilder()
                    .setTitle(getTranslation(userLanguage, 'error.not_connected'))
                    .setColor(Colors.Red)

                await interaction.reply({
                    embeds: [embed],
                    ephemeral: true
                }).then((msg)=> setTimeout(() =>msg.delete(),5000));
                return;
            }

            const token = client.usersMap.get(userId);
            console.log(token);
            await interaction.deferReply({ ephemeral: true });

            if (!customId.startsWith("autobuy")) {
                await favoriteItem(customId, token);
                const embed = new EmbedBuilder()
                    .setTitle(getTranslation(userLanguage, 'success.added_favorites'))
                    .setColor(Colors.Green);
                await interaction.editReply({
                    embeds: [embed],
                    ephemeral: true
                });
                return;
            }
            const buttonInfo = customId.split('_');

            const transactionId = await getTransactionId(buttonInfo[1], buttonInfo[2], token);
            const buyResult = await payItem(transactionId, token, "75f6c9fa-dc8e-4e52-a000-e09dd4084b3e", 48.8520463, 2.295836);

            const embed = new EmbedBuilder();
            if (!buyResult) {
                embed.setTitle(getTranslation(userLanguage, 'error.verify_card'))
                    .setColor(Colors.Grey);
            } else if (buyResult.debit_status === 40) {
                embed.setTitle(getTranslation(userLanguage, 'success.autobuy_successful'))
                    .setColor(Colors.Green);
            } else if (buyResult.debit_status === 20) {
                embed.setTitle(getTranslation(userLanguage, 'error.autobuy_unsuccessful'))
                    .setColor(Colors.Red);
            }

            await interaction.editReply({
                embeds: [embed]
            });

            return;
        }

        if (interaction.isModalSubmit()) {
            const userId = interaction.user.id;
            const token = interaction.fields.getTextInputValue('tokenInput');
            const refreshToken = interaction.fields.getTextInputValue('refreshTokenInput');
            const xcsrfToken = interaction.fields.getTextInputValue('xcsrfInput');

            try {
                await testLogin(token)

                client.usersMap.set(userId, { token, refreshToken, xcsrfToken });

                const embed = new EmbedBuilder()
                    .setTitle(getTranslation(client.usersLanguageMap.get(userId),'connect.success'))
                    .setColor(Colors.Green)
                await interaction.reply({
                    embeds: [embed],
                    ephemeral: true
                });

            }catch (error){
                const embed = new EmbedBuilder()
                    .setTitle(getTranslation(client.usersLanguageMap.get(userId),'connect.failed'))
                    .setColor(Colors.Green)
                await interaction.reply({
                    embeds: [embed],
                    ephemeral: true
                });
            }
            return;
        }

        if (!interaction.isCommand()) return;

        const command = interaction.client.commands.get(interaction.commandName);

        await command.execute(interaction, client);
    },
};

async function testLogin(token) {
    const url = 'https://www.vinted.fr/api/v2/users/current';

    const headers = {
        'User-Agent': getRandomUserAgent(),
        'Authorization': `Bearer ${token}`
    };

    try {
        const response = await axios.get(url, { headers });
        console.log('Response:', response.status);
        return response.data;
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}
