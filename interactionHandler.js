const {payItem, getTransactionId, authorizedRequest, getRandomUserAgent} = require('./httpRequests')
const {EmbedBuilder, Colors} = require("discord.js");
const axios = require("axios");

async function handleInteraction(interaction, client) {
    if(interaction.isButton()){
        const userId = interaction.user.id;
        const customId = interaction.customId

        if(!client.usersMap.has(userId)) {
            await interaction.reply({
                content: "Vous n'etes pas connecté",
                ephemeral: true
            })
            return
        }

        const token = client.usersMap.get(userId)
        console.log(token)
        await interaction.deferReply({ ephemeral: true });

        if(!customId.startsWith("autobuy")){
            const itemId = customId.split("_")[1]
            await favoriteItem(customId, token)
            const embed = new EmbedBuilder()
                .setTitle("Sucessfully added to favorites")
                .setColor(Colors.Green)
            interaction.reply({
                embeds: [embed],
                ephemeral: true
            })
            return
        }

        const buttonInfo = customId.split('_');
        console.log(buttonInfo[1], buttonInfo[2])
        const transactionId = await getTransactionId(buttonInfo[1], buttonInfo[2], token)
        console.log((transactionId))
        const buyResult = await payItem(transactionId, token, "75f6c9fa-dc8e-4e52-a000-e09dd4084b3e",48.8520463, 2.295836)

        const embed = new EmbedBuilder();
        if(!buyResult){
            embed.setTitle("Verify your credit card information before retrying!")
                .setColor(Colors.Grey);
        }else if (buyResult.debit_status === 40) {
            embed.setTitle("Auto-Buy was successful!")
                .setColor(Colors.Green);
        } else if (buyResult.debit_status === 20) {
            embed.setTitle("Auto-Buy was unsuccessful! Try again on a different product")
                .setColor(Colors.Red);
        }

        await interaction.editReply({
            embeds: [embed]
        });


        return;
    }
    if (!interaction.isCommand()) return;
    const command = interaction.client.commands.get(interaction.commandName);

    await command.execute(interaction, client);
}

async function favoriteItem(customId, token) {
    if (!customId.startsWith("autobuy")) {
        const itemId = customId.split("_")[1];
        console.log("Item ID:", itemId);

        // Event 1: user.click
        const clickEventUrl = 'https://www.vinted.fr/relay/events';
        const clickEventData = [{
            "event": "user.click",
            "anon_id": "34446a9d-b4ff-4389-999d-a50d3cc5c226",
            "user_id": 204030039,
            "lang_code": "fr",
            "extra": {
                "path": `/items/${itemId}-veste-noire-legere-homme`,
                "screen": "item",
                "target": "favorite"
            },
            "time": Date.now()
        }];

        try {
            const clickEventResponse = await axios.post(clickEventUrl, clickEventData, {
                headers: {
                    'User-Agent': getRandomUserAgent(),
                    'Authorization': `Bearer ${token.token}`
                }
            });
            console.log("Click Event Response:", clickEventResponse.data);
        } catch (error) {
            console.error("Error in click event:", error);
        }

        // Event 2: Toggle favorite
        const toggleFavoriteUrl = 'https://www.vinted.fr/api/v2/user_favourites/toggle';
        const toggleFavoriteData = {
            type: "item",
            user_favourites: [itemId]
        };

        try {
            const toggleFavoriteResponse = await authorizedRequest("POST", toggleFavoriteUrl, toggleFavoriteData, token.token, "75f6c9fa-dc8e-4e52-a000-e09dd4084b3e");
            console.log("Toggle Favorite Response:", toggleFavoriteResponse);
        } catch (error) {
            console.error("Error in toggling favorite:", error);
        }

        // Event 3: user.favorite_item
        const favoriteItemEventUrl = 'https://www.vinted.fr/relay/events';
        const favoriteItemEventData = [{
            "event": "user.favorite_item",
            "anon_id": "34446a9d-b4ff-4389-999d-a50d3cc5c226",
            "user_id": 204030039,
            "lang_code": "fr",
            "extra": {
                "path": `/items/${itemId}-veste-noire-legere-homme`,
                "screen": "item",
                "item_id": itemId,
                "content_source": "user_items",
                "homepage_session_id": "29d99392-85f0-4ac0-b2e8-33506d9f49d5"
            },
            "time": Date.now()
        }];

        try {
            const favoriteItemEventResponse = await axios.post(favoriteItemEventUrl, favoriteItemEventData, {
                headers: {
                    'User-Agent': getRandomUserAgent(),
                    'Authorization': `Bearer ${token.token}`
                }
            });
            console.log("Favorite Item Event Response:", favoriteItemEventResponse.data);
        } catch (error) {
            console.error("Error in favorite item event:", error);
        }

        console.log("SUCCESS: Item added to favorites!");
    }
}
module.exports = { handleInteraction, favoriteItem };
