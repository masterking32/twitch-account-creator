var config = {};

// Get API Key from Anti-Captcha or 2Captcha
config.API_KEY_2CAPTCHA = 'YOUR 2captcha.com API KEY'; // RECOMMENDED / BETTER SOLVING
config.API_KEY_AntiCaptcha = 'YOUR anti-captcha.com API KEY';

config.RandomUsername = false; // If you want to make new accounts with random usernames, change this to true.
config.UseProxy = false; // If you have proxy list, you can use it. (Put your proxy list in the proxies.txt file)

module.exports = config;