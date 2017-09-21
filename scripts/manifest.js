import Filesystem from 'fs';
import GulpUtil from 'gulp-util';
import Merge from 'lodash-es/merge';
import Mkdirp from 'mkdirp';
import Path from 'path';

import Constants from './core/constants';
import Log from './core/log';
import Module from './core/module';
import {isDefined} from './core/helpers';


export function build(Build, options) {
    options = Merge({
        outputPath: null
    }, options || {});

    if(!isDefined((options.outputPath))) {
        throw new Error('Missing required option: unpacked');
    }

    // Retrieve enabled modules
    let modules = Module.list(Build.modules);

    return new Promise((resolve, reject) => {
        // Ensure browser manifest exists
        let manifestPath = Path.join(Constants.RootDirectory, 'manifest.json');

        if(!Filesystem.existsSync(manifestPath)) {
            GulpUtil.log(GulpUtil.colors.red(
                'Browser has no manifest'
            ));
            return;
        }

        // Read browser manifest
        let manifest = Merge({
            content_scripts: [],
            permissions: [],
            optional_permissions: [],
            web_accessible_resources: []
        }, JSON.parse(Filesystem.readFileSync(manifestPath)));

        // Merge module manifests
        Object.keys(modules).forEach((moduleName) => {
            if(moduleName.indexOf('eon.extension.browser.') === 0) {
                return;
            }

            manifest = mergeModuleManifest(manifest, modules[moduleName]);
        });

        // Ensure build directory exists
        Mkdirp.sync(options.outputPath);

        // Save manifest to build directory
        let destPath = Path.join(options.outputPath, 'manifest.json');

        Filesystem.writeFile(destPath, JSON.stringify(manifest, null, 2), (err) => {
            if(err) {
                return reject(err);
            }

            return resolve();
        });
    });
}

function mergeModuleManifest(manifest, module) {
    // Ensure module manifest exists
    let manifestPath = Path.join(module.path, 'manifest.json');

    if(!Filesystem.existsSync(manifestPath)) {
        Log.moduleWarning(module.name,
            'Module "%s" has no manifest', module.name
        );
        return manifest;
    }

    // Read module manifest
    let moduleManifest = Merge({
        content_scripts: [],
        web_accessible_resources: [],

        origins: [],
        permissions: []
    }, JSON.parse(Filesystem.readFileSync(manifestPath)));

    // Return manifest merged with module properties
    return {
        ...manifest,

        'content_scripts': [
            ...manifest['content_scripts'],

            ...moduleManifest['content_scripts']
                .map((contentScript) => createContentScript(contentScript))
                .filter((contentScript) => contentScript !== null)
        ],

        'permissions': [
            ...manifest['permissions'],
            ...moduleManifest['origins'],
            ...moduleManifest['permissions']
        ],

        'web_accessible_resources': [
            ...manifest['web_accessible_resources'],
            ...moduleManifest['web_accessible_resources']
        ],
    };
}

export function createContentScript(contentScript) {
    if(!isDefined(contentScript) || !isDefined(contentScript.conditions)) {
        console.warn('Invalid content script definition:', contentScript);
        return null;
    }

    return {
        matches: contentScript.conditions
            .map((condition) => {
                if(!isDefined(condition) || !isDefined(condition.pattern)) {
                    console.warn('Invalid content script condition:', condition);
                    return null;
                }

                return condition.pattern;
            })
            .filter((pattern) => pattern !== null),

        css: contentScript.css || [],
        js: contentScript.js || []
    };
}

export default {
    build: build
};
