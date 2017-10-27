import {WebExtensionPlatform, Platforms, PlatformTypes} from 'neon-extension-browser-webextension/platform';


export {
    Platforms,
    PlatformTypes
};

export class FirefoxPlatform extends WebExtensionPlatform {
    get name() {
        return Platforms.Firefox;
    }
}

export default new FirefoxPlatform();
