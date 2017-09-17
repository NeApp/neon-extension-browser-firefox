import fs from 'fs';
import gutil from 'gulp-util';
import path from 'path';
import vm from 'vm';


export const rootPath = path.resolve(__dirname, '../../../');
export const projectPath = path.join(rootPath, '../../');

export const BuildDirectory = {
    Root: path.join(rootPath, 'build'),

    Development: {
        Root:       path.join(rootPath, 'build', 'development'),
        Unpacked:   path.join(rootPath, 'build', 'development', 'unpacked'),
        Hybrid:     path.join(rootPath, 'build', 'development', 'hybrid')
    },

    Production: {
        Root:       path.join(rootPath, 'build', 'production'),
        Unpacked:   path.join(rootPath, 'build', 'production', 'unpacked'),
        Hybrid:     path.join(rootPath, 'build', 'production', 'hybrid')
    }
};

let moduleErrors = {};
let moduleWarnings = {};

export function isDefined(value) {
    return typeof value !== 'undefined' && value !== null;
}

export function buildDistributionName(version, options) {
    options = options || {};

    if(!isDefined(version)) {
        throw new Error('Missing required parameter: version');
    }

    // Build distribution name
    let tags = ['neon'];

    if(isDefined(options.type)) {
        tags.push(options.type);
    }

    tags.push(version);

    if(isDefined(options.environment)) {
        tags.push(options.environment);
    }

    return tags.join('-') + '.' + (options.extension || 'zip');
}

export function listModules(Modules) {
    return Object.assign(...Object.keys(Modules)
        .map((moduleTypeName) => {
            return listModuleType(Modules[moduleTypeName]);
        })
    );
}

export function listModuleType(moduleType) {
    let result = {};

    Object.keys(moduleType.children)
        .forEach((moduleName) => {
            let module = moduleType.children[moduleName];

            if(typeof module === 'string') {
                module = {
                    path: module
                };
            }

            // Ensure module hasn't already been seen
            if(typeof result[moduleName] !== 'undefined') {
                return ignoreModule(moduleName, 'Module has already been defined');
            }

            // Build module path
            let modulePath = path.resolve(rootPath, moduleType.path, module.path);

            if(!fs.existsSync(modulePath)) {
                return ignoreModule(moduleName, 'Directory does not exist');
            }

            // Build module source path
            let sourcePath = path.resolve(modulePath, 'src');

            if(!fs.existsSync(sourcePath)) {
                return ignoreModule(moduleName, 'Source directory does not exist');
            }

            // Retrieve module configuration (but ignore browser modules)
            let config = {};

            if(moduleName.indexOf('eon.extension.browser.') === -1) {
                // Build module configuration file path
                let configPath = path.resolve(modulePath, 'config.js');

                if (fs.existsSync(configPath)) {
                    // Read module configuration file
                    config = parseConfiguration(configPath);

                    if (typeof config === 'undefined' || config === null) {
                        return ignoreModule(moduleName, 'Invalid configuration file');
                    }
                } else {
                    // No module configuration file available
                    logModuleWarning(moduleName, 'Module "%s" has no configuration file', moduleName);
                }
            }

            // Add module to `modules` object
            result[moduleName] = {
                ...module,
                ...config,

                name: moduleName,

                path: modulePath,
                sourcePath: sourcePath
            };
        });

    return result;
}

function ignoreModule(moduleName, color, message) {
    if(typeof color === 'string') {
        message = color;
        color = gutil.colors.red;
    }

    return logModuleMessage(
        moduleErrors, moduleName, color,
        'Ignoring module "%s": %s', [
        moduleName,
        message
    ]);
}

export function parseConfiguration(path) {
    const sandbox = {};

    // Read configuration file
    let data;

    try {
        data = fs.readFileSync(path);
    } catch(e) {
        console.error('Unable to read configuration file:', e.stack);
        return null;
    }

    // Run configuration script
    try {
        const script = new vm.Script('var module = {}; ' + data);
        script.runInNewContext(sandbox);
    } catch(e) {
        console.error('Unable to run configuration script at %o: %s', path, e.stack);
        return null;
    }

    // Return configuration
    return sandbox.module.exports;
}

export function logModuleError(moduleName, color, message) {
    let args;

    if(typeof color === 'string') {
        message = color;
        color = gutil.colors.red;

        args = Array.from(arguments).slice(2);
    } else {
        args = Array.from(arguments).slice(3);
    }

    return logModuleMessage(moduleErrors, moduleName, color, message, args);
}

export function logModuleWarning(moduleName, color, message) {
    let args;

    if(typeof color === 'string') {
        message = color;
        color = gutil.colors.yellow;

        args = Array.from(arguments).slice(2);
    } else {
        args = Array.from(arguments).slice(3);
    }

    return logModuleMessage(moduleWarnings, moduleName, color, message, args);
}

export function logModuleMessage(collection, moduleName, color, message, args) {
    if(typeof collection[moduleName] !== 'undefined' &&
        typeof collection[moduleName][message] !== 'undefined') {
        // Already logged module warning
        return;
    }

    // Log warning
    gutil.log.apply(
        gutil.log,
        [color(message)].concat(args)
    );

    // Mark warning as logged for module
    if(typeof collection[moduleName] === 'undefined') {
        collection[moduleName] = {};
    }

    collection[moduleName][message] = true;
}