const fs = require('fs');
const axios = require('axios');
const readline = require("readline");
var config = require('./config');
const randomUseragent = require('random-useragent');

const outFilePathTokens = './results/tokens.txt';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});


let tokens = fs.readFileSync(outFilePathTokens).toString().replace(/\r/g, '').split("\n");

if(tokens.length == 0)
{
    console.log("No tokens found! Please run the token generator first! (main.js)");
    process.exit();
}

let proxies = [];

if(config.UseProxy == true)
{
    proxies = fs.readFileSync('proxy.txt').toString().replace(/\r/g, '').split("\n");
}

function getProxy()
{
    if(config.UseProxy == false || proxies.length == 0)
    {
        return {};
    }

    let proxy = proxies[Math.floor(Math.random() * proxies.length)];
    let proxy_arry = proxy.split(':');
    if(proxy_arry.length == 2)
    {
        return {
            proxy: {
                host: proxy_arry[0],
                port: proxy_arry[1]
            }
        };
    } else if(proxy_arry.length == 4) {
        return {
            proxy: {
                host: proxy_arry[0],
                port: proxy_arry[1],
                auth: {
                    username: proxy_arry[2],
                    password: proxy_arry[3]
                }
            }
        };
    } else {
        console.log("Proxy is not valid!");
        return {};
    }
}

async function StartRequest(uname) {
    try{
        await FollowAccount(uname);
    } catch(e) {
        console.log(e);
    }
}

const GetUserID = async (uname) => {
    json = {"operationName": "ChannelShell",
        "variables": {
            "login": uname
        },
        "extensions": {
            "persistedQuery": {
                "version": 1,
                "sha256Hash": "580ab410bcd0c1ad194224957ae2241e5d252b2c5173d8e0cce9d32d5bb14efe"
            }
        }
    }

    headers = {
        headers : {'Client-ID': 'kimne78kx3ncx6brgo4mv6wki5h1ko'}
    }

    response = await axios.post('https://gql.twitch.tv/gql', json, headers);
    if(response.data.data.userOrError != undefined && response.data.data.userOrError.id != undefined)
    {
        return response.data.data.userOrError.id;
    } else {
        return false;
    }
}
const integrityToken = async (accessToken, userAgent, DeviceID, options) => {
    options.headers = {
        Accept: "*/*",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "en-US",
        'Client-Id': 'kimne78kx3ncx6brgo4mv6wki5h1ko',
        Connection: "keep-alive",
        "Content-Type": "text/plain; charset=UTF-8",
        "Device-ID": DeviceID,
        Origin: "https://www.twitch.tv",
        Referer: "https://www.twitch.tv/",
        Authorization: "OAuth " + accessToken,
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-site",
        "Sec-GPC": "1",
        "User-Agent": userAgent,
    };

    return await axios.post('https://gql.twitch.tv/integrity', {}, options);
};

const FollowChannel = async (channel_ID, accessToken) => {
    console.log("Follow sent ...");
    let options = getProxy();
    const userAgent = randomUseragent.getRandom();
    const DeviceID = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    let integrity_resp = await integrityToken(accessToken, userAgent, DeviceID, options);
    if(integrity_resp.data != null && integrity_resp.data.token != null) {
        const integrity = integrity_resp.data.token;
        let proxy = options;
        await sendGQLRequest(proxy, accessToken, integrity, userAgent, DeviceID, `[{"operationName":"FollowButton_FollowUser","variables":{"input":{"disableNotifications":false,"targetID":"${channel_ID}"}},"extensions":{"persistedQuery":{"version":1,"sha256Hash":"800e7346bdf7e5278a3c1d3f21b2b56e2639928f86815677a7126b093b2fdd08"}}}]`);
    }
}

const sendGQLRequest = async (current_porxy, accessToken, integrity, userAgent, DeviceID, query) => {
    let options = current_porxy;
    options.headers = {
        'Client-Integrity': integrity,
        Accept: "*/*",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "en-US",
        'Client-Id': 'kimne78kx3ncx6brgo4mv6wki5h1ko',
        Connection: "keep-alive",
        "Content-Type": "text/plain; charset=UTF-8",
        "Device-ID": DeviceID,
        Origin: "https://www.twitch.tv",
        Referer: "https://www.twitch.tv/",
        Authorization: "OAuth " + accessToken,
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-site",
        "Sec-GPC": "1",
        "User-Agent": userAgent,
    };

    return await axios.post('https://gql.twitch.tv/gql', query, options);
};

const FollowAccount = async (uname) => {
    userID = await GetUserID(uname);
    if(userID == false)
    {   
        console.log("Username not valid.");
        GettingUsername();
        return false;
    }

    for (const token of tokens) {
        if(tokens == undefined ||tokens == null || tokens == "")
        {
            GettingUsername();
            return false;
        }
        
        await FollowChannel(userID, token);
    }

    console.log("All following done!");
    GettingUsername();
}

const GettingUsername = async () => {
    rl.question("Username?\n", function(uname) {
        StartRequest(uname);
    });
};

GettingUsername();