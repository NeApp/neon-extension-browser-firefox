import {WebExtensionsPreferences} from 'eon.extension.browser.base.webextensions/preferences';

import {FirefoxPreferencesContext} from './context';
import FirefoxStorage from '../storage';


export class FirefoxPreferences extends WebExtensionsPreferences {
    constructor() {
        super(FirefoxStorage);
    }

    context(name) {
        return new FirefoxPreferencesContext(this, name);
    }
}

export default new FirefoxPreferences();
