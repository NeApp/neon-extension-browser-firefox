import {WebExtensionsPlatform, Platforms, PlatformTypes} from 'neon-extension-browser-webextension/platform';


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
