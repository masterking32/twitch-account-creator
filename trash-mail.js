const axios = require('axios');
const mail_domain = 'dcctb.com';

module.exports.getEmail = async login => {
    const email = `${login}@${mail_domain}`;
    return email;
};

module.exports.getAllMails = async username => {
    const response = await axios.get(`https://www.1secmail.com/api/v1/?action=getMessages&login=${username}&domain=${mail_domain}`, {});
    var output_array = JSON.parse(JSON.stringify(response.data));
    return response.data;
};

module.exports.waitFirstMail = name => {
    return new Promise(async resolve => {
        const check = async () => {
            const lastMail = await this.getAllMails(name);
            if(lastMail[0])
            {
                subject = lastMail[0].subject;
                const verfiy_code = subject.split('–')[0].replace(' ', '');
                resolve(verfiy_code);
            } else {
                return setTimeout(async () => await check(), 1000);
            }
        };
        await check();
    });
};
