import {WebExtensionsExtension} from 'eon.extension.browser.base.webextensions/extension';


export class FirefoxExtension extends WebExtensionsExtension {
    get origin() {
        let baseUrl = browser.extension.getURL('');

        if(baseUrl[baseUrl.length - 1] === '/') {
            return baseUrl.substring(0, baseUrl.length - 1);
        }

        return baseUrl;
    }
}

export default new FirefoxExtension();
