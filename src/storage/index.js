import FirefoxExtension from 'neon-extension-browser-firefox/extension';
import {WebExtensionsStorage} from 'neon-extension-browser-webextension/storage';


export class FirefoxStorage extends WebExtensionsStorage {
    get browser() {
        return {
            extension: FirefoxExtension
        };
    }
}

export default new FirefoxStorage();
