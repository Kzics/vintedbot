const axios = require('axios');
const { HttpsProxyAgent } = require('https-proxy-agent');
const agent = require("user-agents");

const proxyConfig = {
    host: 'p.webshare.io',
    port: 80,
    auth: {
        username: 'uhobvalu-rotate',
        password: 'begrl9n4i5fj'
    }
};

// Création de l'agent proxy
const proxyAgent = new HttpsProxyAgent(`http://${proxyConfig.auth.username}:${proxyConfig.auth.password}@${proxyConfig.host}:${proxyConfig.port}`)

function getRandomUserAgent() {
    const randomAgent = new agent();
    return randomAgent.toString();
}

let cookieCache = null;

async function fetchCookie(domain = "fr") {
    if(cookieCache) return cookieCache
    try {
        const response = await axios.get(`https://vinted.${domain}/catalog`, {
            headers: { "User-Agent": getRandomUserAgent() },
            httpsAgent: proxyAgent // Utilisation du proxy pour la requête
        });

        if (response.status !== 200) {
            console.error(`Failed to fetch cookies. Status: ${response.status}`);
            return null; // Retourne null en cas d'échec
        }

        const sessionCookies = response.headers['set-cookie'];
        if (!sessionCookies) {
            console.error("set-cookie headers not found in the response");
            return null;
        }

        return sessionCookies.map(cookie => {
            const [nameValuePair] = cookie.split(';');
            const [name] = nameValuePair.split('=');
            if (name === 'vinted_session' || name === '_vinted_fr_session') {
                cookieCache = nameValuePair
                return cookieCache;
            }
            return null;
        }).filter(Boolean).join('; ');
    } catch (error) {
        console.error(`Error fetching cookies: ${error.message}`);
        return null;
    }
}

async function fetchData(url) {
    try {
        const cookieHeader = await fetchCookie();

        if (!cookieHeader) {
            console.error('Failed to fetch cookies.');
            return null; // Retourne null en cas d'échec
        }

        console.log("L'URL EST")
        console.log(url)
        const response = await axios.get(url, {
            headers: {
                'User-Agent': getRandomUserAgent(),
                'Cookie': cookieHeader
            },
        });

        return response.data;
    } catch (error) {
        console.error('Une erreur s\'est produite lors de la requête:', error);
        return null; // Retourne null en cas d'erreur
    }
}


async function getTransactionId(itemId, seller, token){

    const url = `https://www.vinted.fr/api/v2/conversations`
    const data = {
        initiator: 'buy',
        item_id: `${itemId}`,
        opposite_user_id: `${seller}`
    }

    //console.log(token.token)
    const resp = await authorizedRequest("post", url,data,token.token, "75f6c9fa-dc8e-4e52-a000-e09dd4084b3e")

    return resp.conversation.transaction.id
}
async function authorizedRequest(method, url, data, access_token, xcsrf_token)  {
    try {
        const headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:126.0) Gecko/20100101 Firefox/126.0",
            "Content-Type": "application/json",
            "Authorization": `Bearer ${access_token}`,
            "X-CSRF-Token": xcsrf_token
        };

        const config = {
            method: method,
            url: url,
            headers: headers,
            data: data,
            withCredentials: true
        };

        console.log(`Making an authed request to ${url}`);

        const response = await axios(config);

        if (response.headers['content-type'].includes('text/html')) {
        }

        return response.data;
    } catch (error) {
        console.error(`Error making authorized request to ${url}:`, error.message);
        throw error;
    }
};

async function payItem(transactionId, token, csrfToken){
    //const url = `https://www.vinted.fr/api/v2/transactions/${transactionId}/checkout/payment`
    //const cookieHeader = await fetchCookie();

    token = token.token
    const article = await authorizedRequest("PUT", `https://www.vinted.fr/api/v2/transactions/${transactionId}/checkout`, undefined, token, csrfToken);

    const info = await getLatAndLong(article)

    const latitude = info.data.results[0].lat
    const longitude = info.data.results[0].lon

    const shipts = await authorizedRequest("GET", `https://www.vinted.fr/api/v2/transactions/${transactionId}/nearby_shipping_options?country_code=FR&latitude=${latitude}&longitude=${longitude}&should_label_nearest_points=true`, undefined, token, csrfToken);

    console.log("Get shipts succcess")

    const point_id = 0;
    let carrier_id = -1;
    for (let k = 0; k < shipts.nearby_shipping_options.length; k++) {
        if (shipts.nearby_shipping_points[point_id].point.carrier_id === shipts.nearby_shipping_options[k].carrier_id) {
            carrier_id = k;
            break;
        }
    }
    const data_shipping = {
        "transaction": {
            "shipment": {
                "package_type_id": shipts.nearby_shipping_options[carrier_id].id,
                "pickup_point_code": shipts.nearby_shipping_points[point_id].point.code,
                "point_uuid": shipts.nearby_shipping_points[point_id].point.uuid,
                "rate_uuid": shipts.nearby_shipping_options[carrier_id].rate_uuid,
                "root_rate_uuid": shipts.nearby_shipping_options[carrier_id].root_rate_uuid
            }
        }
    };

    let rep;
    try {
        rep = await authorizedRequest("PUT", `https://www.vinted.fr/api/v2/transactions/${transactionId}/checkout`, data_shipping, token, csrfToken);
        console.log("Demande de livraison success")
        console.log(rep)
    }
    catch (error) {
        console.error(`Erreur lors de la demande de livraison : ${error.response.status}`);
    }

    const data_payment = {
        "browser_attributes": {
            "color_depth": 24,
            "java_enabled": false,
            "language": "en-US",
            "screen_height": 800,
            "screen_width": 1600,
            "timezone_offset": -120
        },
        "checksum": rep.checkout.checksum
    };

    console.log('CHECKSUM');
    console.log(data_payment.checksum);
    console.log(rep.checkout.checksum);

    try {
        const buy = await authorizedRequest("post", `https://www.vinted.fr/api/v2/transactions/${transactionId}/checkout/payment`, data_payment, token, csrfToken);

        return buy;
    } catch (error) {
        console.error(error.response.data);
        console.log(data_payment.checksum)
    }
    //return await authorizedRequest("post", url, data, token.token, csrfToken)
}

async function getLatAndLong(userInfos){
    const addressName = userInfos.checkout.shipment.to_address.line1
    const addressCity = userInfos.checkout.shipment.to_address.city
    const addressCountry = userInfos.checkout.shipment.to_address.country

    const completeAddress = `${addressName}, ${addressCity}, ${addressCountry}`
    const url = `https://api.geoapify.com/v1/geocode/search?text=${completeAddress}&format=json&apiKey=18f64f03aa7f484c89da98b94b7cce72`

    return await axios.get(url)
}

async function fetchItemData(itemId) {
    try {
        const cookieHeader = await fetchCookie();

        if (!cookieHeader) {
            console.error('Failed to fetch cookies.');
            return null; // Retourne null en cas d'échec
        }

        const itemUrl = `https://www.vinted.fr/api/v2/items/${itemId}`;
        const response = await axios.get(itemUrl, {
            headers: {
                'User-Agent': getRandomUserAgent(),
                'Cookie': cookieHeader
            },
            //httpsAgent: proxyAgent
        });
        return response.data;
    } catch (error) {
        console.error('Une erreur s\'est produite lors de la requête:', error);
        return null; // Retourne null en cas d'erreur
    }
}

module.exports = { authorizedRequest, fetchData, fetchItemData, getRandomUserAgent, payItem, getTransactionId };
