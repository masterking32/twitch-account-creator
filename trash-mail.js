const axios = require('axios');

module.exports.getEmail = async login => {
    const email = `${login}@yoggm.com`;
    return email;
};

module.exports.getAllMails = async username => {
    const response = await axios.get(`https://www.1secmail.com/api/v1/?action=getMessages&login=${username}&domain=yoggm.com`, {});
    var output_array = JSON.parse(JSON.stringify(response.data));
    return response.data;
};

module.exports.getMailHTMLContent = async (login, mailId) => {
    const {body} = await axios.get('https://tm.in-ulm.de/mail.php', {
        params: {search: login, nr: mailId},
    });
    return body;
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
