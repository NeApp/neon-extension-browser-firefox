import path from 'path';

export const CommonRequirements = [
    'whatwg-fetch'
];

export const Libraries = {
    Shim: {
        'lodash-amd/merge':                         path.resolve(__dirname, 'node_modules/lodash-es/merge')
    },

    Shared: {
        'eventemitter3':                            path.resolve(__dirname, 'node_modules/eventemitter3'),
        'lodash-es':                                path.resolve(__dirname, 'node_modules/lodash-es'),
        'loose-envify':                             path.resolve(__dirname, 'node_modules/loose-envify'),
        'pouchdb':                                  path.resolve(__dirname, 'node_modules/pouchdb'),
        'pouchdb-find':                             path.resolve(__dirname, 'node_modules/pouchdb-find'),
        'querystring':                              path.resolve(__dirname, 'node_modules/querystring'),
        'react':                                    path.resolve(__dirname, 'node_modules/react'),
        'react-dom':                                path.resolve(__dirname, 'node_modules/react-dom'),
        'react-router':                             path.resolve(__dirname, 'node_modules/react-router'),
        'urijs':                                    path.resolve(__dirname, 'node_modules/urijs'),
        'uuid':                                     path.resolve(__dirname, 'node_modules/uuid'),
        'whatwg-fetch':                             path.resolve(__dirname, 'node_modules/whatwg-fetch')
    }
};

export const Modules = {
    Core: {
        path: '../../',

        children: {
            'eon.extension.browser.firefox': {
                path: './Browsers/eon.extension.browser.firefox',

                alias: {
                    'eon.extension.browser': path.resolve(__dirname, 'src'),

                    ...Libraries.Shim,
                    ...Libraries.Shared
                },
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
