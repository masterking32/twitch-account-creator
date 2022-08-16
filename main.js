const fs = require('fs');
const axios = require('axios');
const {generateRandomCredentials, generateUsername} = require('./utils');
const {getEmail, waitFirstMail} = require('./trash-mail');
const readline = require("readline");
const ac = require("@antiadmin/anticaptchaofficial");
// Get API Key from Anti-Captcha.com or 2Captcha.com.
const Anti_Captcha_KEY = 'YOUR anti-captcha.com API KEY';
const Token_2CAPTCHA = 'YOUR 2captcha.com API KEY';

const CLIENT_ID = 'kimne78kx3ncx6brgo4mv6wki5h1ko';
const funcaptchaSignupPublicKey = 'E5554D43-23CC-1982-971D-6A2262A2CA24';
const outFilePathAll = './results/results.txt';
const outFilePathUsers = './results/users.txt';
const outFilePathPass = './results/pass.txt';
const outFilePathTokens = './results/tokens.txt';

const RandomUsername = false; // If you want to make new accounts with random usernames, change this to true.

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

ac.setAPIKey(Anti_Captcha_KEY);
ac.settings.funcaptchaApiJSSubdomain = 'twitch-api.arkoselabs.com';
ac.setSoftId(1034);

const API_2Captcha_Validate = async (requestID) => {
    await new Promise(r => setTimeout(r, 2000));
    let URL = "http://2captcha.com/res.php?key=" + Token_2CAPTCHA + "&action=get&id=" + requestID + "&json=1";
    response = await axios.get(URL);
    if(response.data.status == 0)
    {   
        if(response.data.request == 'ERROR_CAPTCHA_UNSOLVABLE')
        {
            console.log('ERROR_CAPTCHA_UNSOLVABLE');
            return false;
        }
        return await API_2Captcha_Validate(requestID);
    } else {
        // console.log(response.data);
        return response.data.request;
    }
};

const API_2Captcha_Request = async () => {
    let URL = "http://2captcha.com/in.php?key=" + Token_2CAPTCHA + "&method=funcaptcha&publickey=" + funcaptchaSignupPublicKey + "&surl=https://twitch-api.arkoselabs.com&pageurl=https://www.twitch.tv/signup&soft_id=3432&json=1";
    response = await axios.get(URL);
    try{
        if(response.data.status == 1) {
            console.log("Request sent to the 2captcha wait a bit, Request ID: " + response.data.request);
            console.log("Wating to reslove ... (15 - 300 sec)");
            let validate_resp = await API_2Captcha_Validate(response.data.request);
            if (validate_resp == false) {
                console.log("Starting new funcaptcha.");
                return await API_2Captcha_Request();
            } 
            return validate_resp;
        } else {
            console.log("Something is wrong with 2Captcha, Check your 2Captcha API Key.");
            return await API_2Captcha_Request();
        }
    } catch (e) {
        console.log("Something is wrong with 2Captcha, Check your 2Captcha API Key!" + e);
        return await API_2Captcha_Request();
    }
}

// function replaceAll(str, find, replace) {
//     return str.replace(new RegExp(find, 'g'), replace);
// }

const solveArkoseCaptcha = async () => {
    let captcha = null;
    ac.solveFunCaptchaProxyless('https://www.twitch.tv/signup', funcaptchaSignupPublicKey)
    .then(token => {
        // console.log('response: '+token);
        // token = replaceAll(token, 'funcaptcha.com', 'client-api.arkoselabs.com');
        // token = replaceAll(token, 'funcaptcha.com', 'twitch-api.arkoselabs.com');
        // token = token.replace('|pk=','|lang=en|pk=');
        // token = replaceAll(token, 'ap-southeast-1', 'eu-west-1');
        captcha = token;
       })
    .catch(error => {console.log('test received error '+error); captcha = false;});
   
    while(captcha == null) {
        await new Promise(r => setTimeout(r, 100));
    }

    return captcha;
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
        // console.log(payload);
        const response = await axios.post('https://passport.twitch.tv/register', payload);
        const headers = response.headers;
        let output = {};
        output.userid = response.data.userID;
        output.access_token = response.data.access_token;
        return output;
    } catch (e) {
        console.log(e.response.data.error);
        if(e.response.data.error == 'Please complete the CAPTCHA correctly.') {
            return 'captcha';
        }

        return false;
    }
};

async function CaptchaAndRegister(credentials, email) {
    console.log('Solving captcha');
    let captchaToken = '';
    if(Anti_Captcha_KEY != 'YOUR anti-captcha.com API KEY') {
        console.log('Using anti-captcha.com');
        captchaToken = await solveArkoseCaptcha();
    } else if(Token_2CAPTCHA != 'YOUR 2captcha.com API KEY') {
        console.log("Using 2Captcha.");
        captchaToken = await API_2Captcha_Request();
    } else {
        console.log("Please set your anti-captcha.com API KEY or 2Captcha API KEY.");
        return false;
    }

    console.log('Generating payload');
    const payload = await generatePayload(credentials, email, captchaToken);
    console.log('Captcha found, registering account ...');
    const registerData = await registerAccount(payload);
    if(registerData === 'captcha')
    {
        console.log("Try resolve captcha again");
        return await CaptchaAndRegister(credentials, email)
    }

    return registerData;
}
async function StartCreate(uname) {
    const credentials = generateRandomCredentials(uname);
    console.log("Username: " + credentials.username + " Password:" + credentials.password + " BDay: " + credentials.birthday.year + "/" + + credentials.birthday.month + "/"+ credentials.birthday.day);
    console.log('Getting email');
    const email = await getEmail(credentials.username);
    const registerData = await CaptchaAndRegister(credentials, email);
    if(registerData == false)
    {
        return false;
    }
    const userId = registerData.userid;
    const accessToken = registerData.access_token;
    console.log('Wait verification mail');
    const verifyCode = await waitFirstMail(credentials.username);
    console.log('Verify email, Verify Code:' + verifyCode);
    await verifyEmail(accessToken, userId, email, verifyCode);
    console.log('Done');
    await saveResult(credentials.username, credentials.password, email, userId, accessToken);
}

async function CreateNewAccount(uname)
{
    await StartCreate(uname);
    setTimeout(() => GettingUsername(), 2000);
}

GettingUsername = async () => {
    if(RandomUsername == true) {
        let uname = generateUsername();
        console.log('Username: ' + uname);
        await CreateNewAccount(uname);
    } else {
        rl.question("Username?\n", function(uname) {
            CreateNewAccount(uname)
        });
    }
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
    const response = await sendGQLRequest(accessToken, `
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
    `);
    const response_data = response.data;
    if(response_data.data.validateVerificationCode !== undefined) {
        const validateVerificationCode = response_data.data.validateVerificationCode;
        if (validateVerificationCode.request.status == 'VERIFIED') {
            console.log("Account verified");
        } else {
            console.log("Account not verified");
        }
    }
    
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
