const { AntiCaptcha } = require('anticaptcha');

const anticaptcha = new AntiCaptcha('YOU API KEY');

module.exports.solveFunCaptcha = async (url, key) => {
    const taskId = await anticaptcha.createTask({
        type: 'FunCaptchaTaskProxyless',
        websiteURL: url,
        websitePublicKey: key,
    });
    const response = await anticaptcha.getTaskResult(taskId, 9999, 5000);
    return response.solution.token;
};
