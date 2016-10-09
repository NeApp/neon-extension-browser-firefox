import WebExtensionsDeclarativeContent, {
    PageStateMatcher,
    RequestContentScript,
    SetIcon,
    ShowPageAction
} from 'eon.extension.browser.base.webextensions/declarative/content';

import {NotImplementedError} from 'eon.extension.framework/core/exceptions';


export {
    PageStateMatcher,
    RequestContentScript,
    SetIcon,
    ShowPageAction
};

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
