import Filesystem from 'fs';


export function parseBuildManifest(path) {
    let data;

    // Parse manifest from path
    try {
        data = JSON.parse(Filesystem.readFileSync(path));
    } catch(e) {
        console.warn('Unable to parse build manifest:', e.stack);
        data = {};
    }

    // Parse manifest, set defaults
    let modules = data.modules || {};

    return {
        ...data,

        modules: {
            ...modules,

            browsers: [
                'eon.extension.browser.base',

                ...(modules.browsers || [])
            ],

            core: [
                'eon.extension.core',
                'eon.extension.framework',

                ...(modules.core || [])
            ]
        }
    };
}

export function parseExtensionManifest(path) {
    let data;

    // Parse manifest from path
    try {
        data = JSON.parse(Filesystem.readFileSync(path));
    } catch(e) {
        console.warn('Unable to parse extension manifest:', e.stack);
        data = {};
    }

    // Parse manifest, set defaults
    return {
        version: null,
        ...data
    };
}
