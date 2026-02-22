/**
 * ╔════╗─────────────╔╗───────────────╔╗──────╔════╗╔═══╗╔═══╗╔═╗─╔╗╔═══╗──╔═══╗╔═══╗╔═══╗
 * ║╔╗╔╗║─────────────║║───────────────║║──────║╔╗╔╗║║╔═╗║║╔═╗║║║╚╗║║║╔═╗║──║╔═╗║║╔═╗║║╔═╗║
 * ╚╝║║╚╝╔╗─╔╗╔══╗╔══╗║║───╔══╗╔══╗╔══╗║╚═╦╗─╔╗╚╝║║╚╝║╚═╝║║║─║║║╔╗╚╝║║║─╚╝──║╚═╝║║╚═╝║║║─║║
 * ──║║──║║─║║║╔╗║║║═╣║║─╔╗║║═╣║══╣║══╣║╔╗║║─║║──║║──║╔╗╔╝║║─║║║║╚╗║║║║╔═╗──║╔══╝║╔╗╔╝║║─║║
 * ──║║──║╚═╝║║╚╝║║║═╣║╚═╝║║║═╣╠══║╠══║║╚╝║╚═╝║──║║──║║║╚╗║╚═╝║║║─║║║║╚╩═║╔╗║║───║║║╚╗║╚═╝║
 * ──╚╝──╚═╗╔╝║╔═╝╚══╝╚═══╝╚══╝╚══╝╚══╝╚══╩═╗╔╝──╚╝──╚╝╚═╝╚═══╝╚╝─╚═╝╚═══╝╚╝╚╝───╚╝╚═╝╚═══╝
 * ──────╔═╝║─║║──────────────────────────╔═╝║
 * ──────╚══╝─╚╝──────────────────────────╚══╝
 * 
 * TypeLess - Auto Form Filler
 * v1.0.2 by TRONG.PRO
 */

const fs = require('fs');

// Read the i18n.js file
const i18nContent = fs.readFileSync('i18n.js', 'utf8');

// extract the object
// This is a bit hacky but avoids needing to module.exports the i18n object if it's not set up for Node
// We'll wrap it in a primitive emulation environment
const navigator = { language: 'en-US', userLanguage: 'en-US' };
const window = {};
const chrome = { storage: { local: { get: () => { }, set: () => { } } }, runtime: { getURL: (path) => path } };

// Eval the code to get the i18n object
eval(i18nContent);

const i18n = window.i18n || i18n; // It might be local var or attached to window

const languages = ['vi', 'zh-CN', 'zh-TW', 'ko', 'ja'];
const enKeys = Object.keys(i18n.translations['en']);
const missingReport = {};

languages.forEach(lang => {
    const langKeys = Object.keys(i18n.translations[lang] || {});
    const missing = enKeys.filter(key => !langKeys.includes(key));
    if (missing.length > 0) {
        missingReport[lang] = missing;
    }
});

if (Object.keys(missingReport).length > 0) {
    console.log('Missing keys found:', JSON.stringify(missingReport, null, 2));
} else {
    console.log('All languages have complete translation keys!');
}

/**
 * End of validate_i18n.js
* ╔══╗─────────╔╗────╔═╗╔═╗╔╗───╔══╗╔═╗╔═╗╔═╦╗╔══╗──╔═╗╔═╗╔═╗
* ╚╗╔╝╔╦╗╔═╗╔═╗║║─╔═╗║═╣║═╣║╚╦╦╗╚╗╔╝║╬║║║║║║║║║╔═╣──║╬║║╬║║║║
* ─║║─║║║║╬║║╩╣║╚╗║╩╣╠═║╠═║║╬║║║─║║─║╗╣║║║║║║║║╚╗║╔╗║╔╝║╗╣║║║
* ─╚╝─╠╗║║╔╝╚═╝╚═╝╚═╝╚═╝╚═╝╚═╬╗║─╚╝─╚╩╝╚═╝╚╩═╝╚══╝╚╝╚╝─╚╩╝╚═╝
* ────╚═╝╚╝──────────────────╚═╝
 */
