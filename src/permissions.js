import {WebExtensionsPermissions} from 'eon.extension.browser.base.webextensions/permissions';

import {NotImplementedError} from 'eon.extension.framework/core/exceptions';


export class FirefoxPermissions extends WebExtensionsPermissions {
    static get supported() {
        return false;
    }

    all() {
        return Promise.reject(new NotImplementedError(
            'Firefox does not support the "permissions" API'
        ));
    }

    contains(options) {
        return Promise.reject(new NotImplementedError(
            'Firefox does not support the "permissions" API'
        ));
    }

    request(options) {
        return Promise.reject(new NotImplementedError(
            'Firefox does not support the "permissions" API'
        ));
    }

    remove(options) {
        return Promise.reject(new NotImplementedError(
            'Firefox does not support the "permissions" API'
        ));
    }
}

export default new FirefoxPermissions();
