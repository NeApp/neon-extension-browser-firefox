import {NotImplementedError} from 'neon-extension-framework/core/exceptions';
import {WebExtensionsDeclarativeContent} from 'neon-extension-browser-webextension/declarative/content';


export class FirefoxDeclarativeContent extends WebExtensionsDeclarativeContent {
    static get supported() {
        return false;
    }

    addRules(rules) {
        return Promise.reject(new NotImplementedError(
            'Firefox does not support the "declarativeContent" API'
        ));
    }

    removeRules(rules) {
        return Promise.reject(new NotImplementedError(
            'Firefox does not support the "declarativeContent" API'
        ));
    }

    getRules(rules) {
        return Promise.reject(new NotImplementedError(
            'Firefox does not support the "declarativeContent" API'
        ));
    }
}

export default new FirefoxDeclarativeContent();
