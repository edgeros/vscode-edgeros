"use strict";

const fs = require("fs");
const path = require("path");
class Localize {
    private options: object = { locale: '' };
    private bundle: any = '';
    private extensionPath: string = '';

    constructor(options: object) {
        this.options = options;
    }
    /**
     * translate the key
     * @param key
     * @param args
     */
    localize(key: string, ...args: string[]) {
        const languagePack = this.bundle;
        const message = languagePack[key] || key;
        return this.format(message, args);
    }
    init(extensionPath: string) {
        this.extensionPath = extensionPath;
        this.bundle = this.resolveLanguagePack();
    }
    format(message: any, args: any[] = []) {
        let result;
        if (args.length === 0) {
            result = message;
        }
        else {
            result = message.replace(/\{(\d+)\}/g, (match: any, rest: any) => {
                const index = rest[0];
                return typeof args[index] !== "undefined" ? args[index] : match;
            });
        }
        return result;
    }
    resolveLanguagePack() {
        const defaultResolvedLanguage = ".nls.json";
        let resolvedLanguage = "";
        const rootPath = this.extensionPath || process.cwd();
        const file = path.join(rootPath, "package");
        const options: object = this.options;
        // @ts-ignore
        if (!options.locale) {
            resolvedLanguage = defaultResolvedLanguage;
        }
        else {
            // @ts-ignore
            let locale = options.locale;
            while (locale) {
                const candidate = ".nls." + locale + ".json";
                if (fs.existsSync(file + candidate)) {
                    resolvedLanguage = candidate;
                    break;
                }
                else {
                    const index = locale.lastIndexOf("-");
                    if (index > 0) {
                        locale = locale.substring(0, index);
                    }
                    else {
                        resolvedLanguage = ".nls.json";
                        locale = null;
                    }
                }
            }
        }
        let defaultLanguageBundle = {};
        // if not use default language
        // then merger the Language pack
        // just in case the resolveLanguage bundle missing the translation and fallback with default language
        if (resolvedLanguage !== defaultResolvedLanguage) {
            defaultLanguageBundle = JSON.parse(fs.readFileSync(path.join(file + defaultResolvedLanguage), "utf8"));
        }
        const languageFilePath = path.join(file + resolvedLanguage);
        const isExistResolvedLanguage = fs.existsSync(languageFilePath);
        const ResolvedLanguageBundle = isExistResolvedLanguage
            ? JSON.parse(fs.readFileSync(languageFilePath, "utf-8"))
            : {};
        // merger with default language bundle
        return Object.assign(Object.assign({}, defaultLanguageBundle), ResolvedLanguageBundle);
    }
}

let config = {
    locale: "en",
};
try {
    config = Object.assign(config, JSON.parse(process.env.VSCODE_NLS_CONFIG || ''));
}
catch (err) {
    //
}
const instance = new Localize(config);
export function init(extensionPath: string) {
    return instance.init(extensionPath);
}
exports.init = init;
export function localize(key: string, ...args: string[]) {
    return instance.localize(key, ...args);
}
