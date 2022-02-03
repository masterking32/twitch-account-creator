const fs = require('fs');
const axios = require('axios');
const {generateRandomCredentials} = require('./utils');
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
        let output = {};
        output.userid = response.data.userID;
        output.access_token = response.data.access_token;
        return output;
    } catch (e) {
        console.log(e.response.data.error);
        return false;
    }
};

async function StartCreate(uname) {
    const credentials = generateRandomCredentials(uname);
    console.log("Username: " + credentials.username + " Password:" + credentials.password + " BDay: " + credentials.birthday.year + "/" + + credentials.birthday.month + "/"+ credentials.birthday.day);
    console.log('Getting email');
    const email = await getEmail(credentials.username);
    console.log('Solving captcha');
    const captchaToken = await solveArkoseCaptcha();
    console.log('Generating payload');
    const payload = await generatePayload(credentials, email, captchaToken);
    console.log('Registering account');
    const registerData = await registerAccount(payload);
    if(registerData === false)
    {
        // return await StartCreate(uname);
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
