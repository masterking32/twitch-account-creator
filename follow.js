const fs = require('fs');
const axios = require('axios-https-proxy-fix');
const {getUserAgent, getProxy, MakeRandomID, TwitchClinetID} = require('./utils');
var config = require('./config');
const readline = require("readline");

const outFilePathTokens = './results/tokens.txt';
let tokens = fs.readFileSync(outFilePathTokens).toString().replace(/\r/g, '').split("\n");

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

let currennt_porxy = {};
let current_useragent = '';
let KasdaResponse = {};

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
        headers : {'Client-ID': TwitchClinetID}
    }

    response = await axios.post('https://gql.twitch.tv/gql', json, headers);
    if(response.data.data.userOrError != undefined && response.data.data.userOrError.id != undefined)
    {
        return response.data.data.userOrError.id;
    } else {
        return false;
    }
}

const KasdaResolver = async () => {
    try {

        let response = await axios.post('https://api.capsolver.com/kasada/invoke', {
            "clientKey": config.CapSolverKey,
            "appId": 'B278567A-C94E-457E-B419-F1D6A5D1AA6D',
            "task": {
                "type": "AntiKasadaTask",
                "pageURL": "https://gql.twitch.tv/", //Required
                "proxy": currennt_porxy.proxy.href, //Required
                "cd": true, //Optional
                "onlyCD": false, //Optional
                "userAgent": current_useragent //Optional
            }
        }, {headers: { 'content-type': 'text/json' }});
        if(response.data.success)
        {
            current_useragent = response.data.solution['user-agent'];
            KasdaResponse = {};
            KasdaResponse.original = response.data.solution;
            KasdaResponse.useragent = response.data.solution['user-agent'];
            KasdaResponse.kpsdkcd = response.data.solution['x-kpsdk-cd'];
            KasdaResponse.kpsdkct = response.data.solution['x-kpsdk-ct'];
        }
        return KasdaResponse;
    } catch (e) {
        // console.log(e);
    }

    return false;
};

const GetTwitchCookies = async () => {
    try {
        let options = currennt_porxy;
        // delete currennt_porxy.proxy.href;
        options.headers = { 
            'User-Agent': current_useragent,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': 1,
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': 1,
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
        };
        let response = await axios.get('https://twitch.tv', options);

        let cookies = [];
        response.headers['set-cookie'].forEach(element => {
            let p1 = element.split(';')[0];
            let p2 = p1.split('=');
            cookies[p2[0]] = p2[1];
        });
        return cookies;
    } catch (e) {
        console.log(e);
    }

    return false;
};

const PublicIntegrityGetToken = async (TwitchClinetID, XDeviceId, ClientRequestId, ClientSessionId, ClientVersion, kpsdkct, kpsdkcd, accesstoken) => {
    try {

        let options = currennt_porxy;
        options.headers = { 
            'User-Agent': current_useragent,
            Accept: 'application/json',
            'Accept-Language': 'en-US',
            'Accept-Encoding': 'identity',
            Authorization: "OAuth " + accesstoken,
            'Referer': 'https://www.twitch.tv/',
            'Client-Id': TwitchClinetID,
            'X-Device-Id': XDeviceId,
            'Client-Request-Id': ClientRequestId,
            'Client-Session-Id': ClientSessionId,
            'Client-Version': ClientVersion,
            'x-kpsdk-ct': kpsdkct,
            'x-kpsdk-cd': kpsdkcd,
            'Origin': 'https://www.twitch.tv',
            'DNT': 1,
            'Connection': 'keep-alive',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'same-site',
            'Content-Length': 0,
        };
        
        let response = await axios.post('https://gql.twitch.tv/integrity', {}, options);
        if(response.data.token) {
            cookies = '';
            response.headers['set-cookie'].forEach(element => {
                let p1 = element.split(';')[0];
                cookies = cookies + p1 + '; ';
            });

            let result = [];
            result['token'] = response.data.token;
            result['cookies'] = cookies;
            return result;
        }
    } catch (e) {
        console.log(e);
    }

    return false;
};

const FollowRequest = async (FollowUserID, ClientID, XDeviceId, ClientVersion, ClientSessionId, accessToken, ClientIntegrity) => {
    let query = `[{"operationName":"FollowButton_FollowUser","variables":{"input":{"disableNotifications":false,"targetID":"${FollowUserID}"}},"extensions":{"persistedQuery":{"version":1,"sha256Hash":"800e7346bdf7e5278a3c1d3f21b2b56e2639928f86815677a7126b093b2fdd08"}}}]`;
    try {

        let options = currennt_porxy;

        options.headers = { 
            'User-Agent': current_useragent,
            Accept: 'application/json',
            'Accept-Language': 'en-US',
            'Accept-Encoding': 'identity',
            Referer: 'https://www.twitch.tv/',
            'Client-Id': ClientID,
            'X-Device-Id': XDeviceId,
            'Client-Version': ClientVersion,
            'Client-Session': ClientSessionId,
            Authorization: "OAuth " + accessToken,
            'Client-Integrity': ClientIntegrity,
            'Content-Type': 'text/plain;charset=UTF-8',
            Origin: 'https://www.twitch.tv',
            DNT: 1,
            Connection: 'keep-alive',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'same-site'
        };
       
        let response = await axios.post('https://gql.twitch.tv/gql#origin=twilight', query, options);
        return response.data;
    } catch (e) {
        console.log(e);
        return {};
    }
};

async function FollowChannel(UserID, access_token) {
    currennt_porxy = getProxy(config.proxyType);
    current_useragent = getUserAgent();
    console.log('\x1b[33m--------------------------------------\x1b[37m');
    console.log('\x1b[33mStart Follow ...\x1b[37m');
    console.log('\x1b[33m--------------------------------------\x1b[37m');

    console.log('\x1b[37m 1) Getting Twitch cookies!');
    let cookies = await GetTwitchCookies();
    if(cookies === false) {
        console.log('\x1b[37m Unable to get twitch cookies!');
        console.log('\x1b[33m--------------------------------------\x1b[37m');
        return false;
    }

    console.log('\x1b[37m 2) Getting Kasada code ...');
    let kasada = await KasdaResolver();
    if(kasada == false)
    {
        console.log('\x1b[37m Unable to solve Kasada!');
        console.log('\x1b[33m--------------------------------------\x1b[37m');
        return false;
    }

    console.log('\x1b[37m 3) Getting public integrity token ...');
    let ClientID = TwitchClinetID;
    let ClientSessionId = MakeRandomID(16).toLowerCase();
    let XDeviceId = cookies['unique_id'];
    let ClientVersion = '3040e141-5964-4d72-b67d-e73c1cf355b5';
    let ClientRequestID = MakeRandomID(32);
    let PublicInter = await PublicIntegrityGetToken(ClientID, XDeviceId, ClientRequestID, ClientSessionId, ClientVersion, KasdaResponse.kpsdkct, KasdaResponse.kpsdkcd, access_token);
    await FollowRequest(UserID, ClientID, XDeviceId, ClientVersion, ClientSessionId, access_token, PublicInter['token']);
    console.log('\x1b[37m Done!');
    return true;
}

async function StartFollow(uname) {
    let UserID = await GetUserID(uname);
    if(UserID == undefined || UserID == null || UserID == false)
    {
        console.log('\x1b[37mTwitch account is not valid!');
        console.log('\x1b[33m--------------------------------------\x1b[37m');
        return;
    }

    for (const token of tokens) {
        if(tokens == undefined ||tokens == null || tokens == "")
        {
            console.log('\x1b[37mIt\'s done, Used all tokens!');
            console.log('\x1b[33m--------------------------------------\x1b[37m');
            return;
        }

        await FollowChannel(UserID, token);
    }
    console.log('\x1b[33m--------------------------------------\x1b[37m');
}

async function FollowAccount(uname)
{
    await StartFollow(uname);
    setTimeout(() => GettingUsername(), 2000);
}

GettingUsername = async () => {
    rl.question("Twitch Username:\n", function(uname) {
        FollowAccount(uname)
    });
};

StartProgram = async () => {
    console.log('\x1b[31m---------------------------------------\x1b[37m');
    console.log('\x1b[31m---------------------------------------\x1b[37m');
    console.log('\x1b[31m---------------------------------------\x1b[37m');
    console.log('\x1b[31m| \x1b[33mMasterkinG32 Twitch Account Creator\x1b[31m |\x1b[37m');
    console.log('\x1b[31m---------------------------------------\x1b[37m');
    console.log('\x1b[31m| ----------- \x1b[33mFOLLOW BOT\x1b[31m ------------ |\x1b[37m');
    console.log('\x1b[31m---------------------------------------\x1b[37m');
    console.log('\x1b[31m---------------------------------------\x1b[37m');
    console.log('\x1b[31m---------------------------------------\x1b[37m');
    if(config.CapSolverKey == 'YOUR CapSolver API KEY') {
        console.log('\x1b[35mYour captcha solver API token (READ DOCUMENT TO KNOW HOW TO GET IT):\x1b[37m');
        it = rl[Symbol.asyncIterator]();
        let cpsl = await it.next();
        config.CapSolverKey = cpsl.value;
    }

    console.log('\x1b[35mProxy type in proxy.txt [http/https/socks5/socks5]:\x1b[37m');
    it = rl[Symbol.asyncIterator]();
    let proxy_type = await it.next();
    let proxy_typev = proxy_type.value;
    if(proxy_typev.toLowerCase() == 'http' || proxy_typev.toLowerCase() == 'https' || proxy_typev.toLowerCase() == 'socks' || proxy_typev.toLowerCase() == 'socks5')
    {
        config.proxyType = proxy_typev.toLowerCase();
    }

    console.log('\x1b[33m---------------------------------------\x1b[37m');
    GettingUsername();
}

StartProgram();