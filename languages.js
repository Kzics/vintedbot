const fs = require('fs');
const yaml = require('yaml');

const translations = {
    en: yaml.parse(fs.readFileSync('./locales/en.yml', 'utf8')),
    fr: yaml.parse(fs.readFileSync('./locales/fr.yml', 'utf8')),
    it: yaml.parse(fs.readFileSync('./locales/it.yml', 'utf8')),
};

function getTranslation(lang, key) {
    const keys = key.split('.');
    let result = translations[lang] || translations['en'];

    for (const k of keys) {
        result = result[k];
        if (!result) {
            return translations['en'][key];
        }
    }
    return result;
}

module.exports = { getTranslation };
