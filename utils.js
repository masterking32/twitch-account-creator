const fs = require('fs');
const UsernameGenerator = require('username-generator');
const PasswordGenerator = require('generate-password');
function randomIntFromInterval(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min)
}

module.exports.generateId = size => Math.random().toString(36).substr(2, size);
module.exports.generatePassword = () => PasswordGenerator.generate() + '_MK32';
module.exports.generateUsername = () => UsernameGenerator.generateUsername().replace(/-/g, '') + this.generateId(3);
module.exports.generateBirthday = () => ({
    day: randomIntFromInterval(1, 30),
    month: randomIntFromInterval(1, 12),
    year: randomIntFromInterval(1960, 1999),
});

const TwitchClinetID = "kimne78kx3ncx6brgo4mv6wki5h1ko";
module.exports.TwitchClinetID = TwitchClinetID;
module.exports.generateRandomRegisterData = (uname, mail) => ({
    username: uname,
    password: this.generatePassword(),
    birthday: this.generateBirthday(),
    email: mail,
    client_id: TwitchClinetID,
    integrity_token: null
});

let useragents = fs.readFileSync('useragents.txt').toString().replace(/\r/g, '').split("\n");
let proxies = fs.readFileSync('proxy.txt').toString().replace(/\r/g, '').split("\n");

module.exports.MakeRandomID = (length) => {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
      counter += 1;
    }
    return result;
}

module.exports.getProxy = (ptype) => {
    if(proxies.length == 0)
    {
        return {};
    }

    let proxy = proxies[Math.floor(Math.random() * proxies.length)];
    let proxy_arry = proxy.split(':');
    if(proxy_arry.length == 2)
    {
        return {
            timeout: null,
            maxFreeSockets: 1,
            maxSockets: 1,
            maxTotalSockets: Infinity,
            sockets: {},
            freeSockets: {},
            requests: {},
            options: {},
            secureProxy: false,
            proxy: {
                protocol: ptype + ':',
                slashes: true,
                auth: null,
                host: proxy_arry[0],
                port: proxy_arry[1],
                hostname: proxy_arry[0],
                hash: null,
                search: null,
                query: null,
                href: ptype + '://' + proxy_arry[0] + ':' + proxy_arry[1]
            }
        };
    } else if(proxy_arry.length == 4) {
        return {
            timeout: null,
            maxFreeSockets: 1,
            maxSockets: 1,
            maxTotalSockets: Infinity,
            sockets: {},
            freeSockets: {},
            requests: {},
            options: {},
            secureProxy: false,
            proxy: {
                protocol: ptype + ':',
                slashes: true,
                auth: {
                    username: proxy_arry[2],
                    password: proxy_arry[3]
                },
                host: proxy_arry[0],
                port: proxy_arry[1],
                hostname: proxy_arry[0],
                hash: null,
                search: null,
                query: null,
                href: ptype + '://' + proxy_arry[2] + ':' + proxy_arry[3] + '@' + proxy_arry[0] + ':' + proxy_arry[1]
            }
        };
    } else {
        console.log("Proxy is not valid!");
        return {};
    }
};

module.exports.getUserAgent = () => {
    if(useragents.length == 0)
    {
        return {};
    }

    let useragent = useragents[Math.floor(Math.random() * useragents.length)];
    return useragent;
};

module.exports.convertCookieForRequestHeader = cookies => cookies.map(cookies => cookies.split(';')[0]).join(';');



const avatar_lists = ["pixel-art", "thumbs", "pixel-art-neutral", "personas", "open-peeps", "notionists-neutral", "notionists", "miniavs", "micah", "lorelei-neutral", "lorelei", "fun-emoji", "croodles", "big-smile", "big-ears-neutral", "big-ears", "avataaars-neutral", "avataaars", "adventurer-neutral", "adventurer"];

module.exports.GetAvatarURL = (name) => {
    return 'https://api.dicebear.com/6.x/' + avatar_lists[Math.floor(Math.random() * avatar_lists.length)] + '/png?seed=' + name + '&size=300&backgroundColor=' + (Math.random() * 0xFFFFFF << 0).toString(16).padStart(6, '0');
}
