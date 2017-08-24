import {WebExtensionsStorage} from 'eon.extension.browser.base.webextensions/storage';

import FirefoxExtension from 'eon.extension.browser.firefox/extension';


export class FirefoxStorage extends WebExtensionsStorage {
    get browser() {
        return {
            extension: FirefoxExtension
        };
    }
}

export default new FirefoxStorage();
