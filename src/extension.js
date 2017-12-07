import IsNil from 'lodash-es/isNil';

import {WebExtensionsExtension} from 'neon-extension-browser-webextension/extension';


export class FirefoxExtension extends WebExtensionsExtension {
    get origin() {
        let baseUrl = this.getURL('');

        if(baseUrl[baseUrl.length - 1] === '/') {
            return baseUrl.substring(0, baseUrl.length - 1);
        }

        return baseUrl;
    }

    getCallbackUrl(path) {
        if(IsNil(path)) {
            path = '';
        }

        return this.getUrl(path);
    }
}

export default new FirefoxExtension();
