import WebExtensionsExtension from 'eon.extension.browser.base.webextensions/extension';

import URI from 'urijs';


export class FirefoxExtension extends WebExtensionsExtension {
    getCallbackPattern() {
        let prefix = new URI('https://self')
            .segmentCoded([this.id])
            .toString();

        return prefix + '/*';
    }

    getCallbackUrl(id, path) {
        return new URI('https://self')
            .segmentCoded([this.id, id])
            .segment(path)
            .toString();
    }
}

export default new FirefoxExtension();
