import {WebExtensionsMessaging} from 'eon.extension.browser.base.webextensions/messaging';

import {FirefoxPort} from './port';


export class FirefoxMessaging extends WebExtensionsMessaging {
    get supportsExternalMessaging() {
        return false;
    }

    createPortWrapper(port) {
        return new FirefoxPort(port);
    }
}

export default new FirefoxMessaging();
