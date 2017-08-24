import {WebExtensionsExtension} from 'eon.extension.browser.base.webextensions/extension';

import URI from 'urijs';


export class FirefoxExtension extends WebExtensionsExtension {
    get origin() {
        let baseUrl = browser.extension.getURL('');

        if(baseUrl[baseUrl.length - 1] === '/') {
            return baseUrl.substring(0, baseUrl.length - 1);
        }

        return baseUrl;
    }

    getCallbackPattern() {
        let prefix = new URI('https://extension')
            .segmentCoded([this.key])
            .toString();

        return prefix + '/*';
    }

    getCallbackUrl(path) {
        return new URI('https://extension')
            .segmentCoded([this.key])
            .segment(path)
            .toString();
    }
}

export default new FirefoxExtension();
