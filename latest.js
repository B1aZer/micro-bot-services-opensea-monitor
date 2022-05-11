import axios from 'axios';
import Logger from '../_utils/logger.js';
import Twitter from '../_utils/twitter.js';

//import { ethers } from "ethers";
let i = 0;
let logger = new Logger('opensea-recent-collections')

init()
async function init() {
    console.log(`parsing ${i} number of items`);
    let res = await axios.get(`https://api.opensea.io/api/v1/collections?offset=${i}&limit=300`, {
        headers: {
            "X-API-KEY": 'b9ab6f08fe5e408fb9c61f1fb4dabf60',
            "Accept": "application/json"
        }

    })
    let result = res.data.collections.filter(col => Object.keys(col.traits).length > 0)
    await parseCollections(result)
    // max by api
    if (i < 49500) {
        i += 300
        // 5 and 10
        setTimeout(init, ((Math.random() + 1) * 5) * 1000)
    }
}

async function parseCollections(colls) {
    for (let i = 0; i < colls.length; i++) {
        const element = colls[i];
        let obj = { 
            name : element.name,
            slug: `https://opensea.io/collection/${element.slug}`,
            created_date: element.created_date,
            twitter_username: element.twitter_username,
            twitter_followers: element.twitter_username ? (await Twitter.v1.user({ screen_name: element.twitter_username }))["followers_count"] : "",
            contract: element.primary_asset_contracts.length ? element.primary_asset_contracts[0].address : ""
        }
        logger.write(obj);
    }
}




