import {WebExtensionsExtension} from 'neon-extension-browser-webextension/extension';
import {isDefined} from 'neon-extension-framework/core/helpers';


export class FirefoxExtension extends WebExtensionsExtension {
    get origin() {
        let baseUrl = this.getURL('');

        if(baseUrl[baseUrl.length - 1] === '/') {
            return baseUrl.substring(0, baseUrl.length - 1);
        }

        return baseUrl;
    }

    getCallbackUrl(path) {
        if(!isDefined(path)) {
            path = '';
        }

        return this.getUrl(path);
    }
}

export default new FirefoxExtension();
