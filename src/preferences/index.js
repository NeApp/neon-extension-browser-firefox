import WebExtensionsPreferences from 'eon.extension.browser.base.webextensions/preferences';

import FirefoxStorage from '../storage';


export class FirefoxPreferences extends WebExtensionsPreferences {
    constructor() {
        super(FirefoxStorage);
    }
}

export default new FirefoxPreferences();
