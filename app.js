// OPTIMIZE:
// Swap keys
import dotenv from 'dotenv';
dotenv.config();
import { OpenSeaStreamClient } from '@opensea/stream-js';
import WebSocket, { WebSocketServer } from 'ws';
import axios from 'axios';
import { ethers } from "ethers";
import { headersGenerator } from '../_utils/opensea.js';
import pkg from '../_utils/index.js';
const { pickRandom, removeAndReturnRandom } = pkg;

// ERROR Processing
import { transporter, mailOptions } from '../_utils/mail.js';
// TODO: THIS LINE prevents process exit
//process.on("unhandledRejection", error => console.error("Promise rejection:", error));
process.on('uncaughtException', err => {
    console.log('There was an uncaught error', err);
    // send mail with defined transport object
    mailOptions.subject = '✖ OS Monitor Has Crashed ✖';
    mailOptions.text = JSON.stringify(err);
    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            return console.log(error);
        }
        console.log('Message sent: ' + info.response);
        process.exit(1); // mandatory (as per the Node.js docs)
    });
});

const queue = [];
const generator = headersGenerator();
const limitOfretries = 10;
let retries = 0;

const client = new OpenSeaStreamClient({
    token: 'b9ab6f08fe5e408fb9c61f1fb4dabf60',
    connectOptions: {
        transport: WebSocket
    }
});

let wsClient = null;
const wss = new WebSocketServer({ port: 3080 });
wss.on('connection', function connection(ws) {
    console.log('client connected');
    wsClient = ws;
});

wss.on('close', function close() {
    console.log('client disconnected');
    wsClient = null;
});

//setInterval(processQueue, 1000);
processQueue();

client.onItemListed('*', (event) => {
    if (event.payload.item.chain.name === 'ethereum') {
        if (event.payload.collection.slug !== 'ens') {
            // remove wash listings
            //if (event.payload.listing_type === 'dutch' && event.payload.payment_token.eth_price === '1.000000000000000') return;
            //console.log(event.payload);
            if (queue.length > 100) queue.length = 100;
            queue.unshift({
                collection: event.payload.collection.slug,
                permalink: event.payload.item.permalink,
                eth_price: event.payload.base_price,
                image: event.payload.item.metadata.image_url,
                usd_price: event.payload.payment_token.usd_price,
                listing_type: event.payload.listing_type,
            });
            //console.log(queue.length);
        }

    };

});

async function processQueue() {
    if (queue.length) {
        let item = queue.pop();
        console.log(`working on ${item.collection} from ${queue.length}`);
        try {
            let randomKey = generator.next().value;
            console.log(`sent requestfor ${JSON.stringify(randomKey)}`);
            let res = await axios.get(`https://api.opensea.io/api/v1/collection/${item.collection}`, randomKey)
            let base_price = ethers.BigNumber.from(item.eth_price)
            let floor_price = ethers.utils.parseEther(res.data.collection.stats.floor_price.toString())
            console.log(res.data.collection.stats.floor_price.toString());
            //console.log(`${item.collection}: Listed ${item.permalink} for ${item.eth_price}, floor is ${res.data.collection.stats.floor_price}`);
            if (base_price.lte(floor_price)) {
                item.floor_price = res.data.collection.stats.floor_price;
                item.eth_price = ethers.utils.formatEther(item.eth_price)
                item.below = base_price.lt(floor_price) ? true : false;
                item.usd_price = (+item.eth_price * +item.usd_price).toFixed(2);
                // log
                console.log(`send to ws: ${item.collection}`);
                // ws post
                wsClient && wsClient.send(JSON.stringify(item));
                // twitter repost
                if (item.below) {
                    const osHashes = ['#opensea', '#NFTs', '#NFT', '#Solana', '#Ethereum', '#NFTProject', '#SolanaNFT', ``];
                    const lines = [`ETH Listing Price: ${item.eth_price}`, `ETH Collection Floor Price: ${item.floor_price}`, `USD Price: ${item.usd_price}`];
                    // do not await
                    axios.post(`${process.env.TWITTER_URL}/post`, {
                        username: process.env.TWITTER_USERNAME,
                        text: `${item.collection}
                    
${removeAndReturnRandom(lines, Math.random())}
${removeAndReturnRandom(lines, Math.random())}
${removeAndReturnRandom(lines, Math.random())}
                    
${pickRandom(osHashes, Math.random())}
                    
${item.permalink}
`
                    })//.catch((err) => console.log(`[ERROR]: err`));
                }
            }
        } catch (err) {
            // TODO: circle if 2 in queue
            //queue.unshift(item);
            //console.error(`[ERROR]: pushing ${item.collection} back to queue`)
            console.log(`[ERROR]: error in request ${err}`);
        }
    } else {
        // queue empty
        retries += 1;
        if (retries > limitOfretries) {
            throw new Error(`Queue was emtpy for more than ${limitOfretries} times.`)
        }
    }
    //let randomRetry1and2s = (Math.random() * (max - min + 1) + min) * 1000
    let randomRetry1and4s = (Math.random() * (3 - 1 + 1) + 1) * 1000
    //let randomRetry5and6s = (Math.random() + 5) * 1000
    //let randomRetry1and10 = ((Math.random() * 10) + 1) * 1000
    console.log(`retry in ${randomRetry1and4s}`);
    setTimeout(processQueue, randomRetry1and4s);
}
