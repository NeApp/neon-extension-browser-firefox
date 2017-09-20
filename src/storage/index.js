import FirefoxExtension from 'eon.extension.browser.firefox/extension';
import {WebExtensionsStorage} from 'eon.extension.browser.base.webextensions/storage';


export class FirefoxStorage extends WebExtensionsStorage {
    get browser() {
        return {
            extension: FirefoxExtension
        };
    }
}

export default new FirefoxStorage();
