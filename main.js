const fs = require('fs');
const axios = require('axios-https-proxy-fix');
const {generateRandomRegisterData, generateUsername, getUserAgent, getProxy, MakeRandomID, TwitchClinetID, GetAvatarURL} = require('./utils');
const {getEmail, waitFirstMail} = require('./trash-mail');
var config = require('./config');
const readline = require("readline");

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const outFilePathAll = './results/results.txt';
const outFilePathUsers = './results/users.txt';
const outFilePathPass = './results/pass.txt';
const outFilePathTokens = './results/tokens.txt';

let currennt_porxy = {};
let current_useragent = '';
let KasdaResponse = {};

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

    console.log("Unable to get Kasada, Try again ...")
    return await KasdaResolver();
};

const integrityGetToken = async (kpsdkcd, kpsdkct, cookies) => {
    try {
        let response = await axios.post('https://passport.twitch.tv/integrity', {}, {
            proxy: currennt_porxy.proxy,
            headers: { 
                'User-Agent': current_useragent,
                'Accept': '*/*',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate, br',
                'Referer': 'https://www.twitch.tv/',
                'x-kpsdk-ct': kpsdkct,
                'x-kpsdk-cd': kpsdkcd,
                'Origin': 'https://www.twitch.tv',
                'DNT': 1,
                'Connection': 'keep-alive',
                'Sec-Fetch-Dest': 'empty',
                'Sec-Fetch-Mode': 'cors',
                'Sec-Fetch-Site': 'same-site',
                'Content-Length': 0,
            }
        });
        if(response.data.token)
        {
            response.headers['set-cookie'].forEach(element => {
                let p1 = element.split(';')[0];
                let p2 = p1.split('=');
                cookies[p2[0]] = p2[1];
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

const RegisterFinal = async (cookies, PostParams) => {
    try {

        let options = currennt_porxy;
        let cookies_string = '';
        for (var key in cookies) {
            cookies_string = cookies_string + key + "=" + cookies[key] + "; ";
        }

        options.headers = { 
            'User-Agent': current_useragent,
            'Accept': '*/*',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate, br',
            'Referer': 'https://www.twitch.tv/',
            'Content-Type': 'text/plain;charset=UTF-8',
            'Origin': 'https://www.twitch.tv',
            'DNT': 1,
            'Connection': 'keep-alive',
            'Cookie': cookies_string,
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'same-site'
        };

        let response = await axios.post('https://passport.twitch.tv/protected_register',  PostParams, options);

        return response.data;
    } catch (e) {
        return e.response.data;
    }
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

const verifyEmail = async (ClientID, XDeviceId, ClientVersion, ClientSessionId, accessToken, ClientIntegrity, code, userId, email) => {
    let query = `[{"operationName":"ValidateVerificationCode","variables":{"input":{"code":"${code}","key":"${userId}","address":"${email}"}},"extensions":{"persistedQuery":{"version":1,"sha256Hash":"05eba55c37ee4eff4dae260850dd6703d99cfde8b8ec99bc97a67e584ae9ec31"}}}]`;
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

const FollowGames = async (ClientID, XDeviceId, ClientVersion, ClientSessionId, accessToken, ClientIntegrity) => {
    let query = `[{"operationName":"OnboardingFollowGame","variables":{"id":"509658"},"extensions":{"persistedQuery":{"version":1,"sha256Hash":"4cbe32f65d5272a46515f0eb05b257d99d03fef995a526cde1c88ff72337e94f"}}},{"operationName":"OnboardingFollowGame","variables":{"id":"21779"},"extensions":{"persistedQuery":{"version":1,"sha256Hash":"4cbe32f65d5272a46515f0eb05b257d99d03fef995a526cde1c88ff72337e94f"}}},{"operationName":"OnboardingFollowGame","variables":{"id":"27471"},"extensions":{"persistedQuery":{"version":1,"sha256Hash":"4cbe32f65d5272a46515f0eb05b257d99d03fef995a526cde1c88ff72337e94f"}}},{"operationName":"OnboardingFollowGame","variables":{"id":"516575"},"extensions":{"persistedQuery":{"version":1,"sha256Hash":"4cbe32f65d5272a46515f0eb05b257d99d03fef995a526cde1c88ff72337e94f"}}},{"operationName":"OnboardingFollowUser","variables":{"id":"814157119"},"extensions":{"persistedQuery":{"version":1,"sha256Hash":"539461eda09076f0493d22d92f9684be6d0a7d5a7d450a76d3a4a3bac173fec7"}}},{"operationName":"OnboardingFollowUser","variables":{"id":"31545223"},"extensions":{"persistedQuery":{"version":1,"sha256Hash":"539461eda09076f0493d22d92f9684be6d0a7d5a7d450a76d3a4a3bac173fec7"}}},{"operationName":"OnboardingFollowUser","variables":{"id":"169623064"},"extensions":{"persistedQuery":{"version":1,"sha256Hash":"539461eda09076f0493d22d92f9684be6d0a7d5a7d450a76d3a4a3bac173fec7"}}}]`;
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

const IntegrityOption = async () => {
    try {

        let options = currennt_porxy;
        options.headers = { 
            'User-Agent': current_useragent,
            'Accept': '*/*',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate, br',
            'Access-Control-Request-Method': 'POST',
            'Access-Control-Request-Headers': 'x-kpsdk-cd,x-kpsdk-ct',
            'Referer': 'https://www.twitch.tv/',
            'Origin': 'https://www.twitch.tv',
            'DNT': 1,
            'Connection': 'keep-alive',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'same-site'
        };

        await axios.options('https://passport.twitch.tv/integrity',  options);
        return true;
    } catch (e) {
        return false;
    }
};

const GetAvatar = async (uname) => {
    try {

        
        let AvatarURL = GetAvatarURL(uname);
        let response = await axios.get(AvatarURL);
        return response.data;
    } catch (e) {
        // console.log(e);
    }
    return false;
};


const RequestUpdateAvatar = async (ClientID, XDeviceId, ClientVersion, ClientSessionId, accessToken, ClientIntegrity, UserID) => {
    let query = `[{"operationName":"EditProfile_CreateProfileImageUploadURL","variables":{"input":{"userID":"` +  UserID + `","format":"PNG"}},"extensions":{"persistedQuery":{"version":1,"sha256Hash":"e1b65d20f16065b982873da89e56d9b181f56ba6047d2f0e458579c4033fba01"}}}]`;
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



const RequestUpdateProfile = async (ClientID, XDeviceId, ClientVersion, ClientSessionId, accessToken, ClientIntegrity, username) => {
    let query = `[{"operationName":"UserProfileEditor","variables":{"login":"` + username + `"},"extensions":{"persistedQuery":{"version":1,"sha256Hash":"fd61d6ac5129730d614571a926d0334683ce70ce4e93aa82412e3a5a8c360bc1"}}}]`;
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

const UploadFileOptions = async (UploadURL) => {
    try {
        let options = currennt_porxy;
        options.headers = { 
            'User-Agent': current_useragent,
            Accept: '*/*',
            'Accept-Language': ' en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate, br',
            Referer: 'https://www.twitch.tv/',
            Origin: 'https://www.twitch.tv',
            DNT: 1,
            Connection: 'keep-alive',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'same-site'
        };
       
        let response = await axios.options(UploadURL, options);
        return response.data;
    } catch (e) {
        console.log(e);
        return {};
    }
};

const UploadFile = async (UploadURL, Image) => {
    try {
        let options = currennt_porxy;
        options.headers = { 
            'User-Agent': current_useragent,
            Accept: '*/*',
            'Accept-Language': ' en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate, br',
            Referer: 'https://www.twitch.tv/',
            Origin: 'https://www.twitch.tv',
            DNT: 1,
            Connection: 'keep-alive',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'same-site'
        };
       
        let response = await axios.put(UploadURL, Image, options);
        console.log(response);
        return response.data;
    } catch (e) {
        console.log(e);
        return {};
    }
};

async function StartCreate(uname) {
    currennt_porxy = getProxy(config.proxyType);
    current_useragent = getUserAgent();
    const email = await getEmail(uname);
    let register_post_data = generateRandomRegisterData(uname, email);
    console.log('\x1b[32m--------------------------------------\x1b[37m');
    console.log('\x1b[32m------------ Account Info ------------\x1b[37m');
    console.log('\x1b[32m--------------------------------------\x1b[37m');
    console.log("\x1b[32mUsername: " + register_post_data.username + "\x1b[37m");
    console.log("\x1b[32mPassword: " + register_post_data.password + "\x1b[37m");
    console.log("\x1b[32memail: " + email);
    console.log("\x1b[32mBirthday: " + register_post_data.birthday.year + "/" + register_post_data.birthday.month + "/" + register_post_data.birthday.day) + "\x1b[37m";
    console.log('\x1b[33m--------------------------------------\x1b[37m');
    console.log('\x1b[33m------- Start creating account -------\x1b[37m');
    console.log('\x1b[33m--------------------------------------\x1b[37m');
    console.log('\x1b[37m 1) Getting Twitch cookies!');
    let cookies = await GetTwitchCookies();
    if(cookies === false) {
        console.log('\x1b[37m Unable to get twitch cookies!');
        console.log('\x1b[33m--------------------------------------\x1b[37m');
        return;
    }
    console.log('\x1b[37m 2) Getting Kasada code ...');
    let kasada = await KasdaResolver();
    if(kasada == false)
    {
        console.log('\x1b[37m Unable to solve Kasada!');
        console.log('\x1b[33m--------------------------------------\x1b[37m');
        return;
    }
    console.log('\x1b[37m 3) Getting local integrity token ...');
    await IntegrityOption();
    let integrityData = await integrityGetToken(KasdaResponse.kpsdkcd, KasdaResponse.kpsdkct, cookies);
    if(integrityData['token'] == false)
    {
        console.log('\x1b[37m Unable to get register token!');
        console.log('\x1b[33m--------------------------------------\x1b[37m');
        return;
    }
    
    console.log('\x1b[37m 4) Creating account ...');
    register_post_data.integrity_token = integrityData['token'];
    let protected_register = await RegisterFinal(integrityData['cookies'], register_post_data);
    if("error" in protected_register)
    {
        console.log('\x1b[31m ' + protected_register.error);
        console.log('\x1b[33m--------------------------------------\x1b[37m');
        return;
    }

    if(!("access_token" in protected_register && "userID" in protected_register)){
        
        console.log('\x1b[31m Something is wrong!!!');
        console.log('\x1b[33m--------------------------------------\x1b[37m');
    }

    let userID = protected_register.userID;
    let access_token = protected_register.access_token;
    console.log("\x1b[32mAccount Created!\x1b[37m");
    console.log('\x1b[32mUserID: ' + userID + ' AccessToken: ' + access_token + "\x1b[37m");

    console.log('\x1b[37m 5) Waiting for verification email ...');
    const verifyCode = await waitFirstMail(register_post_data.username);
    console.log('Verify Code:' + verifyCode);
    
    console.log('\x1b[37m 6) Getting Kasada code ...');
    let kasada2 = await KasdaResolver();
    if(kasada2 == false)
    {
        console.log('\x1b[37m Unable to solve Kasada!');
        console.log('\x1b[33m--------------------------------------\x1b[37m');
        return;
    }

    let ClientID = TwitchClinetID;
    let ClientSessionId = MakeRandomID(16).toLowerCase();
    let XDeviceId = cookies['unique_id'];
    let ClientVersion = '3040e141-5964-4d72-b67d-e73c1cf355b5';
    let ClientRequestID = MakeRandomID(32);
    
    console.log('\x1b[37m 7) Getting public integrity token ...');
    let PublicInter = await PublicIntegrityGetToken(ClientID, XDeviceId, ClientRequestID, ClientSessionId, ClientVersion, KasdaResponse.kpsdkct, KasdaResponse.kpsdkcd, access_token)

    console.log('\x1b[37m 8) Try to verify the account ...');
    let verifyEmailResponse = await verifyEmail(ClientID, XDeviceId, ClientVersion, ClientSessionId, access_token, PublicInter['token'], verifyCode, userID, email) 
    
    console.log('\x1b[33m--------------------------------------\x1b[37m');
    if(verifyEmailResponse[0].data.validateVerificationCode.request.status == 'VERIFIED')
    {
        await saveResult(register_post_data.username, register_post_data.password, register_post_data.email, userID, access_token);
        console.log("\x1b[32mAccount verified and saved!\x1b[37m");
    }
    console.log('\x1b[33m--------------------------------------\x1b[37m');
    console.log('\x1b[33m 9) Following Games...');
    ClientRequestID = MakeRandomID(32);

    console.log('\x1b[37m 9.1) Getting Kasada code ...');
    let kasada3 = await KasdaResolver();
    if(kasada3 == false)
    {
        console.log('\x1b[37m Unable to solve Kasada!');
        console.log('\x1b[33m--------------------------------------\x1b[37m');
        return;
    }

    console.log('\x1b[37m 9.2) Getting public integrity token ...');
    let PublicInter2 = await PublicIntegrityGetToken(ClientID, XDeviceId, ClientRequestID, ClientSessionId, ClientVersion, KasdaResponse.kpsdkct, KasdaResponse.kpsdkcd, access_token);
    await FollowGames(ClientID, XDeviceId, ClientVersion, ClientSessionId, access_token, PublicInter2['token']);

    
    // console.log('\x1b[37m 9.3) Getting a Avatar ...');
    // let avatar = await GetAvatar(uname);
    // if(avatar != false)
    // {
    //     console.log('\x1b[37m 9.4) Getting Kasada code ...');
    //     let kasada4 = await KasdaResolver();
    //     if(kasada4 != false)
    //     {
    //         console.log('\x1b[37m 9.5) Getting public integrity token ...');
    //         let PublicInter3 = await PublicIntegrityGetToken(ClientID, XDeviceId, ClientRequestID, ClientSessionId, ClientVersion, KasdaResponse.kpsdkct, KasdaResponse.kpsdkcd, access_token);
    //         let UploadDATA = await RequestUpdateAvatar(ClientID, XDeviceId, ClientVersion, ClientSessionId, access_token, PublicInter2['token'], userID);
            
    //         const dataObj = UploadDATA.find(obj => obj.data.createProfileImageUploadURL);

    //         if (dataObj) {
    //             const createProfileImageUploadURL = dataObj.data.createProfileImageUploadURL;
    //             let UploadingFileOptions = await UploadFileOptions(createProfileImageUploadURL.uploadURL);
    //             let UploadingFile = await UploadFile(createProfileImageUploadURL.uploadURL, avatar);
    //             let UpdateProfile = await RequestUpdateProfile(ClientID, XDeviceId, ClientVersion, ClientSessionId, access_token, PublicInter3['token'], uname);
    //         } else {
    //             console.log('\x1b[37m Unable find upload URL!');
    //         }
    //     } else {
    //         console.log('\x1b[37m Unable to solve Kasada!');
    //         console.log('\x1b[33m--------------------------------------\x1b[37m');
    //     }
    // } else {
    //     console.log('\x1b[37m 9.4) Unable to download avatar!');
    // }

    console.log('\x1b[33m--------------------------------------\x1b[37m');
    console.log('\x1b[33m Account is ready!\x1b[37m');
    console.log('\x1b[33m--------------------------------------\x1b[37m');
}

async function CreateNewAccount(uname)
{
    await StartCreate(uname);
    setTimeout(() => GettingUsername(), 2000);
}

GettingUsername = async () => {
    if(config.RandomUsername == true) {
        let uname = generateUsername();
        console.log('Random username: ' + uname);
        await CreateNewAccount(uname);
    } else {
        rl.question("Please choose a username:\n", function(uname) {
            CreateNewAccount(uname)
        });
    }
};

StartProgram = async () => {
    console.log('\x1b[31m---------------------------------------\x1b[37m');
    console.log('\x1b[31m---------------------------------------\x1b[37m');
    console.log('\x1b[31m---------------------------------------\x1b[37m');
    console.log('\x1b[31m| \x1b[33mMasterkinG32 Twitch Account Creator\x1b[31m |\x1b[37m');
    console.log('\x1b[31m---------------------------------------\x1b[37m');
    console.log('\x1b[31m---------------------------------------\x1b[37m');
    console.log('\x1b[31m---------------------------------------\x1b[37m');
    if(config.CapSolverKey == 'YOUR CapSolver API KEY') {
        console.log('\x1b[35mYour captcha solver API token (READ DOCUMENT TO KNOW HOW TO GET IT):\x1b[37m');
        it = rl[Symbol.asyncIterator]();
        let cpsl = await it.next();
        config.CapSolverKey = cpsl.value;
    }

    console.log('\x1b[35mCreate accounts with random Username[y/yes]:\x1b[37m');
    it = rl[Symbol.asyncIterator]();
    let rdu = await it.next();
    let rdus = rdu.value;
    if(rdus.toLowerCase() == 'y' || rdus.toLowerCase() == 'yes')
    {
        config.RandomUsername = true;
    } else {
        config.RandomUsername = false;
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

async function saveResult(username, password, email, userid, token) {
    if (!fs.existsSync(outFilePathAll))
        fs.writeFileSync(outFilePathAll, '');

    if (!fs.existsSync(outFilePathUsers))
        fs.writeFileSync(outFilePathUsers, '');

    if (!fs.existsSync(outFilePathPass))
        fs.writeFileSync(outFilePathPass, '');

    if (!fs.existsSync(outFilePathTokens))
        fs.writeFileSync(outFilePathTokens, '');
    
    var data_all = username + " " + password + " " + email + " " + userid + " " + token + '\n';
    fs.appendFile(outFilePathAll, data_all, 'utf8',
        function(err) {     
            if (err) throw err;
    });
    
    var accounts = username + " " + token + '\n';
    fs.appendFile(outFilePathUsers, accounts, 'utf8',
        function(err) {     
            if (err) throw err;
    });

    var accountsPass = username + ":" + password + '\n';
    fs.appendFile(outFilePathPass, accountsPass, 'utf8',
        function(err) {     
            if (err) throw err;
    });

    var accountstoken = token + '\n';
    fs.appendFile(outFilePathTokens, accountstoken, 'utf8',
        function(err) {     
            if (err) throw err;
            console.log("Data Saved.");
    });
};
