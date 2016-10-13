import {WebExtensionsExtension} from 'eon.extension.browser.base.webextensions/extension';

import URI from 'urijs';


export class FirefoxExtension extends WebExtensionsExtension {
    getCallbackPattern() {
        let prefix = new URI('https://extension')
            .segmentCoded([this.key])
            .toString();

        return prefix + '/*';
    }

    getCallbackUrl(path) {
        return new URI('https://extension')
            .segmentCoded([this.key])
            .segment(path)
            .toString();
    }
}

export default new FirefoxExtension();
