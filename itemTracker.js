const { fetchData, fetchItemData } = require('./httpRequests');
const { ButtonBuilder, ButtonStyle, ActionRowBuilder, EmbedBuilder } = require("discord.js");
const path = require("path");
const fs = require("fs");

const trackedItems = [
    { name: 'Objet 1', url: 'https://www.vinted.fr/api/v2/catalog/items?page=1&per_page=1&search_text=&catalog_ids=&order=newest_first&size_ids=&brand_ids=&status_ids=&color_ids=&material_ids=', channel: '1055096971662217279' },
];

let lastItemIds = {};
let activePromises = new Set();
function loadTracks(client) {
    client.on('ready', async () => {
        const filePath = path.join(__dirname, 'resources', 'tracks.json');
        try {
            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

            await Promise.all(data.map(async (obj) => {
                console.log(`Loaded ${obj.name} tracks`);
                const channel = client.channels.cache.get(obj.channel);

                if (!channel) {
                    console.error(`Le salon ${obj.name} n'a pas été trouvé.`);
                    return;
                }

                lastItemIds[obj.channel] = null;

                let isChecking = false;

                setInterval(async () => {
                    if (!isChecking) {
                        isChecking = true;
                        await checkForNewItems(channel, obj.url, obj.name);
                        isChecking = false;
                    }
                }, 5000);
            }));

        } catch (err) {
            console.error('Error reading tracks file:', err);
        }
    });
}

function toUnix(dateString) {
    const date = new Date(dateString);
    const unixTimeSeconds = Math.floor(date.getTime() / 1000);
    return unixTimeSeconds;
}
async function sendToDiscord(channel, item) {
    let additionalData = await fetchItemData(item.id);
    if (!additionalData) return;

    let { user } = additionalData.item;
    let positive = user.positive_feedback_count;
    let neutral = user.neutral_feedback_count;
    let negative = user.negative_feedback_count;

    let totalFeedback = positive + neutral + negative;
    let averageFeedback = (5 * positive + 3 * neutral) / totalFeedback;
    let starRating = Math.min(Math.round(averageFeedback), 5);
    let starRatingString = '⭐'.repeat(starRating) + '★'.repeat(5 - starRating);

    const embeds = [];
    const profileButton = new ButtonBuilder()
        .setURL(user.profile_url)
        .setLabel("🔎 Profile")
        .setStyle(ButtonStyle.Link);
    const negociateButton = new ButtonBuilder()
        .setURL(`https://www.vinted.fr/items/${item.id}/want_it/new?button_name=receiver_id=${item.id}`)
        .setLabel("🗣️ Negocier")
        .setStyle(ButtonStyle.Link);
    const buyButton = new ButtonBuilder()
        .setURL(`https://www.vinted.fr/transaction/buy/new?source_screen=item&transaction%5Bitem_id%5D=${item.id}`)
        .setLabel("💷 Acheter")
        .setStyle(ButtonStyle.Link);
    const autoBuyButton = new ButtonBuilder()
        .setCustomId(`autobuy_${item.id}_${user.id}`)
        .setLabel("🦾 Autobuy")
        .setStyle(ButtonStyle.Primary);
    const addFavorite = new ButtonBuilder()
        .setCustomId(`addfavorite_${item.id}`)
        .setLabel("⭐ Favoris")
        .setStyle(ButtonStyle.Primary);

    const comp = new ActionRowBuilder()
        .addComponents(profileButton, negociateButton, buyButton, autoBuyButton, addFavorite);

    for (let i = 0; i < 4 && i < additionalData.item.photos.length; i++) {
        const embed = new EmbedBuilder()
            .setTitle(item.title)
            .setURL(item.url)
            .setColor(16515072)
            .setImage(additionalData.item.photos[i].url)
            .addFields(
                { name: "⏲️ Publié", value: `<t:${toUnix(additionalData.item.created_at_ts)}:R>`, inline: true },
                { name: "📑 Marque", value: item.brand_title, inline: true },
                { name: "📏 Taille", value: item.size_title, inline: true },
                { name: "📋 Avis", value: `${starRatingString} (${totalFeedback} avis)`, inline: true },
                { name: "🏆 Etat", value: item.status, inline: true },
                { name: "💶 Prix", value: `${item.price} ${item.currency} | ${item.total_item_price} ${item.currency} TTC`, inline: true },
                { name: "🏳️ Pays", value: getFlag(additionalData.item.country), inline: true }
            )
            .setTimestamp();

        embeds.push(embed);
    }

    console.log("COMPLETED FOR " + count)
    await channel.send({ embeds: embeds, components: [comp] });
}


let count = 0
async function checkForNewItems(channel, url, itemName) {
    console.log(`Checking for new items... (count: ${++count})`);
    try {
        const data = await fetchData(url);
        if (data && data.items && data.items.length > 0) {
            const newestItem = data.items[0];

            if (newestItem.id !== lastItemIds[channel.id]) {
                await sendToDiscord(channel, newestItem);
                lastItemIds[channel.id] = newestItem.id;
            } else {
                console.log(`No new ${itemName} found in ${channel.name}`);
            }
        } else {
            console.log(`No items found for ${itemName}`);
        }
    } catch (error) {
        console.error(error);
    }
}
function getFlag(flag) {
    const flags = {
        france: '🇫🇷',
        francia: '🇫🇷',
        nederland: '🇳🇱',
        'pays-bas': '🇳🇱',
        netherlands: '🇳🇱',
        italie: '🇮🇹',
        italy: '🇮🇹',
        italia: '🇮🇹',
        portugal: '🇵🇹',
        espagne: '🇪🇸',
        espanha: '🇪🇸',
        spain: '🇪🇸',
        belgique: '🇧🇪',
        belgium: '🇧🇪',
        autriche: '🇦🇹',
        austria: '🇦🇹'
    };
    return flags[flag.toLowerCase()] || flag;
}

function trackItems(client) {
    client.on('ready', () => {
        console.log(`Bot connecté en tant que ${client.user.tag}!`);
        trackedItems.forEach(item => {
            const channel = client.channels.cache.get(item.channel);

            lastItemIds[channel] = null;

            if (!channel) {
                console.error(`Le salon ${item.name} n'a pas été trouvé.`);
                return;
            }
            //setInterval(() => checkForNewItems(channel, "https://www.vinted.fr/api/v2/catalog/items?page=1&per_page=96&search_text=&catalog_ids=&size_ids=&brand_ids=&status_ids=&color_ids=&material_ids=", item.name), 10 * 1000);
        });
    });
}

module.exports = { trackItems, checkForNewItems, loadTracks };
