import WebExtensionsWebRequest from 'eon.extension.browser.base.webextensions/web/request';

import FirefoxWebRequestEvent from './requestEvent';


export class FirefoxWebRequest extends WebExtensionsWebRequest {
    createEvent(name) {
        return new FirefoxWebRequestEvent(name);
    }
}

export default new FirefoxWebRequest();
