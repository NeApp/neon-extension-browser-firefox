import {WebExtensionsMessaging} from 'neon-extension-browser-webextension/messaging';

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
