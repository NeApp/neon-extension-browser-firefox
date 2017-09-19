import path from 'path';

export const CommonRequirements = [
    'whatwg-fetch'
];

export const Modules = {
    Core: {
        path: '../../',

        children: {
            'eon.extension.browser.firefox': {
                path: './Browsers/eon.extension.browser.firefox',

                babel: {
                    include: [
                        'node_modules/lodash-es'
                    ]
                }
            },

            'eon.extension.browser.base':               './Browsers/eon.extension.browser.base',
            'eon.extension.browser.base.webextensions': './Browsers/eon.extension.browser.base.webextensions',

            'eon.extension.core':                       './eon.extension.core',
            'eon.extension.framework':                  './eon.extension.framework'
        }
    },
    Destinations: {
        path: '../../Destinations',

        children: {
            // 'eon.extension.destination.googledrive':    './eon.extension.destination.googledrive',
            'eon.extension.destination.lastfm':         './eon.extension.destination.lastfm',
            // 'eon.extension.destination.trakt':          './eon.extension.destination.trakt',
        }
    },
    Sources: {
        path: '../../Sources',

        children: {
            // 'eon.extension.source.amazonvideo':         './eon.extension.source.amazonvideo',
            'eon.extension.source.googlemusic':         './eon.extension.source.googlemusic',
            // 'eon.extension.source.netflix':             './eon.extension.source.netflix'
        }
    }
};

export default {
    CommonRequirements: CommonRequirements,
    Modules: Modules
};
