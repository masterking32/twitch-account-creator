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

module.exports.generateRandomCredentials = (uname) => ({
    username: uname,
    password: this.generatePassword(),
    birthday: this.generateBirthday(),
});
module.exports.convertCookieForRequestHeader = cookies => cookies.map(cookies => cookies.split(';')[0]).join(';');
