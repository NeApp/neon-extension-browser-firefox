import Filesystem from 'fs';
import GulpUtil from 'gulp-util';
import Path from 'path';
import Vm from 'vm';

import Constants from './constants';
import Log from './log';


export function listModules(Modules) {
    return Object.assign(...Object.keys(Modules)
        .map((type) => {
            return listModuleType(type, Modules[type]);
        })
    );
}

export function listModuleType(type, names) {
    let result = {};

    names.forEach((moduleName) => {
        // Ensure module hasn't already been seen
        if(typeof result[moduleName] !== 'undefined') {
            return ignoreModule(moduleName, 'Module has already been defined');
        }

        // Build module path
        let modulePath = Path.resolve(Constants.ProjectDirectory, getModuleTypeDirectoryName(type), moduleName);

        if(!Filesystem.existsSync(modulePath)) {
            return ignoreModule(moduleName, 'Directory does not exist');
        }

        // Build module source path
        let sourcePath = Path.resolve(modulePath, 'src');

        if(!Filesystem.existsSync(sourcePath)) {
            return ignoreModule(moduleName, 'Source directory does not exist');
        }

        // Retrieve module configuration (but ignore browser modules)
        let config = {};

        if(moduleName.indexOf('eon.extension.browser.') === -1) {
            // Build module configuration file path
            let configPath = Path.resolve(modulePath, 'config.js');

            if (Filesystem.existsSync(configPath)) {
                // Read module configuration file
                config = parseConfiguration(configPath);

                if (typeof config === 'undefined' || config === null) {
                    return ignoreModule(moduleName, 'Invalid configuration file');
                }
            } else {
                // No module configuration file available
                Log.moduleWarning(moduleName, 'Module "%s" has no configuration file', moduleName);
            }
        }

        // Add module to `modules` object
        result[moduleName] = {
            ...config,

            name: moduleName,

            path: modulePath,
            sourcePath: sourcePath
        };
    });

    return result;
}

export function getModuleTypeDirectoryName(type) {
    if(type === 'browsers') {
        return './Browsers';
    }

    if(type === 'destinations') {
        return './Destinations';
    }

    if(type === 'sources') {
        return './Sources';
    }

    if(type === 'core') {
        return './';
    }

    throw new Error('Unknown module type: ' + type);
}

function ignoreModule(moduleName, color, message) {
    if(typeof color === 'string') {
        message = color;
        color = GulpUtil.colors.red;
    }

    return Log.moduleError(moduleName, color, 'Ignoring module "%s": %s', [
        moduleName,
        message
    ]);
}

export function parseConfiguration(path) {
    const sandbox = {};

    // Read configuration file
    let data;

    try {
        data = Filesystem.readFileSync(path);
    } catch(e) {
        console.error('Unable to read configuration file:', e.stack);
        return null;
    }

    // Run configuration script
    try {
        const script = new Vm.Script('var module = {}; ' + data);
        script.runInNewContext(sandbox);
    } catch(e) {
        console.error('Unable to run configuration script at %o: %s', path, e.stack);
        return null;
    }

    // Return configuration
    return sandbox.module.exports;
}

export default {
    getTypeDirectoryName: getModuleTypeDirectoryName,

    list: listModules,
    listDestinations: listModuleType.bind(null, 'destinations'),
    listSources: listModuleType.bind(null, 'sources'),
    listType: listModuleType
};
