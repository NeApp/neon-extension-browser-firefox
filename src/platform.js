import {WebExtensionsPlatform, Platforms, PlatformTypes} from 'eon.extension.browser.base.webextensions/platform';


export {
    Platforms,
    PlatformTypes
};

export class FirefoxPlatform extends WebExtensionsPlatform {
    get name() {
        return Platforms.Firefox;
    }
}

export default new FirefoxPlatform();
