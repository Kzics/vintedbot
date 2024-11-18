const { SlashCommandBuilder } = require('discord.js');
const { checkForNewItems } = require("../itemTracker")
const BrandType = {
    nike: 53,
    adidas: 14,

}
module.exports = {
    data: new SlashCommandBuilder()
        .setName('createtrack')
        .setDescription('Create track for vinted!')
        .addStringOption(option =>
            option.setName('channel')
                .setDescription('Enter the name of the channel')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('brand')
                .setDescription('Enter the brand you want to track')
                .setRequired(true))
        .addStringOption(option =>
            option.setName("catalog")
                .setDescription("Enter the catalog id")
                .setRequired(false)),
    async execute(interaction, client) {
        const channelName = interaction.options.getString('channel');
        const brand = interaction.options.getString('brand');
        let catalog = interaction.options.getString('catalog');
        if(!catalog) catalog = ''
        const data = {
            name: channelName,
            url: brand
        }
        console.log("LE TARER")

//GET
// 	https://www.vinted.fr/api/v2/catalog/items?page=1&per_page=96&search_text=&catalog_ids=34&size_ids=&brand_ids=53&status_ids=&color_ids=&material_ids=
        const url = `https://www.vinted.fr/api/v2/catalog/items?page=1&per_page=96&search_text=&catalog_ids=${catalog}&order=newest_first&size_ids=&brand_ids=${BrandType[brand.toLowerCase()]}&status_ids=&color_ids=&material_ids=`
        const channel = client.channels.cache.get(channelName);
        setInterval(() => checkForNewItems(channel, url, brand), 10 * 1000);

        await interaction.reply(`Tracking ${brand} in ${channelName}!`);
    },
};

