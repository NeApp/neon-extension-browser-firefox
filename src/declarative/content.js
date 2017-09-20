import {NotImplementedError} from 'eon.extension.framework/core/exceptions';
import {WebExtensionsDeclarativeContent} from 'eon.extension.browser.base.webextensions/declarative/content';


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
