import {WebExtensionsExtension} from 'neon-extension-browser-webextension/extension';
import {isDefined} from 'neon-extension-framework/core/helpers';


export class FirefoxExtension extends WebExtensionsExtension {
    get origin() {
        let baseUrl = browser.extension.getURL('');

        if(baseUrl[baseUrl.length - 1] === '/') {
            return baseUrl.substring(0, baseUrl.length - 1);
        }

        return baseUrl;
    }

    getCallbackUrl(path) {
        if(isDefined(path) && path[0] !== '/') {
            path = '/' + path;
        } else if(!isDefined(path)) {
            path = '';
        }

        return 'https://callback.neon.skipthe.net' + path;
    }
}

export default new FirefoxExtension();
