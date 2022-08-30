const fs = require('fs');
const axios = require('axios');
const readline = require("readline");
var config = require('./config');

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

const FollowChannel = async (channel_ID, token) => {
    let options = getProxy();
    options.headers  = {
        'Accept': '*/*',
        'Accept-Language': 'en-GB',
        'Authorization': 'OAuth ' + token,
        'Client-Id': 'kimne78kx3ncx6brgo4mv6wki5h1ko',
        'Connection': 'keep-alive',
        'Content-Type': 'text/plain;charset=UTF-8',
        'Origin': 'https://www.twitch.tv',
        'Referer': 'https://www.twitch.tv/',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-site',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/102.0.0.0 Safari/537.36',
        'sec-ch-ua': '" Not A;Brand";v="99", "Chromium";v="102", "Google Chrome";v="102"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
    };
    data = '{ "operationName": "FollowButton_UnfollowUser", "variables": { "input": { "targetID": "793701515" } }, "extensions": { "persistedQuery": { "version": 1, "sha256Hash": "f7dae976ebf41c755ae2d758546bfd176b4eeb856656098bb40e0a672ca0d880" } } }'
    response = await axios.post('https://gql.twitch.tv/gql', data, options);
    console.log(response)
    console.log('_________________')
}

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

    console.log("Unfollowing done!");
    GettingUsername();
}

const GettingUsername = async () => {
    rl.question("Username?\n", function(uname) {
        StartRequest(uname);
    });
};

GettingUsername();