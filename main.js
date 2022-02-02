const fs = require('fs');
const axios = require('axios');
const {generateRandomCredentials, convertCookieForRequestHeader} = require('./utils');
const {getEmail, waitFirstMail} = require('./trash-mail');
const {solveFunCaptcha} = require('./anti-captcha');
const readline = require("readline");

const CLIENT_ID = 'kimne78kx3ncx6brgo4mv6wki5h1ko';
const funcaptchaSignupPublicKey = 'E5554D43-23CC-1982-971D-6A2262A2CA24';
const outFilePathAll = './results/results.txt';
const outFilePathUsers = './results/users.txt';
const outFilePathPass = './results/pass.txt';
const outFilePathTokens = './results/tokens.txt';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const solveArkoseCaptcha = async () => {
    try{
        return await solveFunCaptcha(
            'https://www.twitch.tv/signup',
          funcaptchaSignupPublicKey,
        );
    } catch (e) {
        return await solveArkoseCaptcha();
    }
};

const generatePayload = async ({username, password, birthday}, email, captchaToken) => {
    return {
        username,
        password,
        email,
        birthday,
        include_verification_code: true,
        client_id: CLIENT_ID,
        arkose: {token: captchaToken},
    };
};

const registerAccount = async payload => {
    try {
        const response = await axios.post('https://passport.twitch.tv/register', payload);
        const headers = response.headers;
        return headers['set-cookie'];
    } catch (e) {
        if(e.response.data.error == 'Please complete the CAPTCHA correctly.')
        {
            console.log("Invalid Captcha");
            return false;
        }
    }
};

async function StartCreate(uname) {
    const credentials = generateRandomCredentials(uname);
    console.log("Username: " + credentials.username + " Password:" + credentials.password + " BDay: " + credentials.birthday.year + "/" + + credentials.birthday.month + "/"+ credentials.birthday.day);
    console.log('Getting email');
    const email = await getEmail(credentials.username);
    console.log('Solving captcha');
    const captchaToken = await solveArkoseCaptcha();
    // console.log(captchaToken);
    console.log('Generating payload');
    const payload = await generatePayload(credentials, email, captchaToken);
    console.log('Registering account');
    const cookies = await registerAccount(payload);
    if(cookies === false)
    {
        return await StartCreate(uname);
    }
    console.log('Getting access token');
    const accessToken = await getAccessToken(cookies);
    console.log('Wait verification mail');
    const verifyCode = await waitFirstMail(credentials.username);
    console.log('Getting user id');
    const userId = await getUserId(accessToken);
    console.log(userId);
    console.log('Verify email');
    await verifyEmail(accessToken, userId, email, verifyCode);
    console.log(accessToken);
    console.log('Done');
    await saveResult(credentials.username, credentials.password, email, userId, accessToken);
}

async function CreateNewAccount(uname)
{
    await StartCreate(uname);
    setTimeout(() => GettingUsername(), 2000);
}

GettingUsername = async () => {
    rl.question("Username?\n", function(uname) {
        CreateNewAccount(uname)
    });
};

GettingUsername();

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


/*
@TODO:
Account will be created but we have some issues with verifying accounts. (I will check it later)
*/
const getAccessToken = async cookies => {
    try {
        const headerCookies = convertCookieForRequestHeader(cookies);
        const {headers} = await axios.get('https://id.twitch.tv/oauth2/authorize', {
            headers: {Cookie: headerCookies},
            params: {
                client_id: CLIENT_ID,
                lang: 'en',
                login_type: 'login',
                redirect_uri: 'https://www.twitch.tv/passport-callback',
                response_type: 'token',
                scope: ['chat_login', 'user_read', 'user_subscriptions', 'user_presence_friends_read'].join(' '),
            },
            maxRedirects: 0,
            // validateStatus: status => status === 302,
        });
        const redirectURL = headers['location'];
        return extractAccessTokenFromURL(redirectURL);
    } catch (e) {
        console.debug(e);
        await sleep(1000);
        return await getAccessToken();
    }
};


async function sleep(ms) {
	return new Promise((res) => setTimeout(res, ms));
}

const extractAccessTokenFromURL = url => url.split('=')[1].split('&')[0];

module.exports.validateAuthToken = async authToken => {
    const {status} = await axios.get('https://id.twitch.tv/oauth2/validate', {
        headers: {
            Authorization: `OAuth ${authToken}`,
        },
        validateStatus: status => status === 401,
    });
    return status === 401;
};

const verifyEmail = async (accessToken, userId, email, code) => {
    const {request,error} = await sendGQLRequest(accessToken, `
        mutation VerifyEmail {
          validateVerificationCode(input: {address: "${email}", code: "${code}", key: "${userId}"}) {
            request {
              status
            }
            error {
              code
            }
          }
        }
    `)
        .then(res => res.data)
        .then(body => body.data.validateVerificationCode);

    if (error && error.code !== 'UNKNOWN') {
        if (error.code === 'INCORRECT_CODE')
            throw new Error('Invalid email code for verify');
        if (error.code === 'TOO_MANY_FAILED_ATTEMPTS')
            throw new Error('Too many failed attempts to verify code');

        console.error(error);
        throw new Error('Failed to verify email');
    }

    if (request.status === 'PENDING')
        throw new Error('Email not verified. Status is "pending"');
    if (request.status === 'REJECTED')
        throw new Error('Verify request is rejected');
};

const getUserId = accessToken => {
    return sendGQLRequest(accessToken, `
        query GetMyId {
          currentUser {
            id
          }
        }
    `)
        .then(res => res.data)
        .then(body => body.data.currentUser.id);
};

const sendGQLRequest = (accessToken, query) => {
    return axios.post('https://gql.twitch.tv/gql',
        {query},
        {
            headers: {
                'Client-Id': CLIENT_ID,
                'Authorization': `OAuth ${accessToken}`,
            },
        });
};
