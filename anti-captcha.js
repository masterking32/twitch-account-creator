const { AntiCaptcha } = require('anticaptcha');

const anticaptcha = new AntiCaptcha('YOUR API KEY');

function replaceAll(str, find, replace) {
    return str.replace(new RegExp(find, 'g'), replace);
}   
module.exports.solveFunCaptcha = async (url, key) => {
    const taskId = await anticaptcha.createTask({
        type: 'FunCaptchaTaskProxyless',
        websiteURL: url,
        websitePublicKey: key,
    });
    const response = await anticaptcha.getTaskResult(taskId, 9999, 5000);
    response.solution.token = replaceAll(response.solution.token, 'funcaptcha.com', 'client-api.arkoselabs.com');
    response.solution.token = response.solution.token.replace('|pk=','|lang=en|pk=');
    response.solution.token = replaceAll(response.solution.token, 'ap-southeast-1', 'eu-west-1');
    return response.solution.token;
};
