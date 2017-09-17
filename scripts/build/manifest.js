import Merge from 'lodash-es/merge';
import fs from 'fs';
import gutil from 'gulp-util';
import mkdirp from 'mkdirp';
import path from 'path';

import {isDefined, listModules, logModuleWarning, rootPath} from './core/helpers';


export function build(Config, options) {
    options = Merge({
        outputPath: null
    }, options || {});

    if(!isDefined((options.outputPath))) {
        throw new Error('Missing required option: unpacked');
    }

    // Retrieve enabled modules
    let modules = listModules(Config.Modules);

    return new Promise((resolve, reject) => {
        // Ensure browser manifest exists
        let manifestPath = path.join(rootPath, 'manifest.json');

        if(!fs.existsSync(manifestPath)) {
            gutil.log(gutil.colors.red(
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
        }, JSON.parse(fs.readFileSync(manifestPath)));

        // Merge module manifests
        Object.keys(modules).forEach((moduleName) => {
            if(moduleName === 'eon.extension.browser.firefox') {
                return;
            }

            manifest = mergeModuleManifest(manifest, modules[moduleName]);
        });

        // Ensure build directory exists
        mkdirp.sync(options.outputPath);

        // Save manifest to build directory
        let destPath = path.join(options.outputPath, 'manifest.json');

        fs.writeFile(destPath, JSON.stringify(manifest, null, 2), (err) => {
            if(err) {
                return reject(err);
            }

            return resolve();
        });
    });
}

function mergeModuleManifest(manifest, module) {
    // Ensure module manifest exists
    let manifestPath = path.join(module.path, 'manifest.json');

    if(!fs.existsSync(manifestPath)) {
        logModuleWarning(module.name,
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
    }, JSON.parse(fs.readFileSync(manifestPath)));

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
