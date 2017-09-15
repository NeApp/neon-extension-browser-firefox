import fs from 'fs';
import gutil from 'gulp-util';
import merge from 'lodash-es/merge';
import mkdirp from 'mkdirp';
import path from 'path';
import util from 'util';
import webpack from 'webpack';

import {BuildDirectory, listModules, listModuleType, rootPath, projectPath} from './core/helpers';
import Base from './webpack.config';

export const StaticModules = {
    Dependencies: {},
    Externals: {}
};

export function build(Config) {
    return new Promise((resolve, reject) => {
        // Retrieve compiler for `config`
        let compiler;

        try {
            compiler = constructCompiler(Config);
        } catch(e) {
            return reject(e);
        }

        if(typeof compiler === 'undefined' || compiler === null) {
            return reject(new Error('Unable to generate compiler'));
        }

        // Run compiler
        compiler.run((err, stats) => {
            if(err) {
                reject(err);
                return;
            }

            // Write statistics to file
            let statisticsPath = path.join(BuildDirectory.Root, 'webpack.stats.json');
            let statistics = JSON.stringify(stats.toJson('verbose'));

            return fs.writeFile(statisticsPath, statistics, function(err) {
                if(err) {
                    gutil.log(gutil.colors.red(
                        'Unable to write statistics: %s'
                    ), err.stack);
                    return;
                }

                resolve(stats);
            });
        });
    });
}

export function constructCompiler(Config) {
    // Generation configuration
    let configuration;

    try {
        configuration = generateConfiguration(Config);
    } catch(e) {
        throw new Error('Unable to generate configuration: ' + e.stack);
    }

    // Ensure build directory exists
    mkdirp.sync(BuildDirectory.Root);

    // Save configuration
    fs.writeFileSync(
        path.join(BuildDirectory.Root, 'webpack.config.js'),
        util.inspect(configuration, {
            depth: null
        }),
        'utf-8'
    );

    // Construct compiler
    return webpack(configuration);
}

// region Configuration

export function generateConfiguration(Config) {
    let modules = listModules(Config.Modules);

    let esIncludes = [
        ...([].concat.apply([], Object.keys(modules)
            .map((moduleName) => {
                let module = modules[moduleName];

                return [
                    module.sourcePath,
                    ...((module.babel || {}).include || [])
                        .map((value) => {
                            let includePath = path.resolve(module.path, value);

                            if(!fs.existsSync(includePath)) {
                                gutil.log(gutil.colors.red(
                                    'Ignoring babel include "%s" for module ' +
                                    '"%s", no directory exists at: "%s"'
                                ), value, moduleName, includePath);
                                return null;
                            }

                            return includePath;
                        })
                        .filter((path) => {
                            return path !== null;
                        })
                ];
            })
            .filter((path) => {
                return path !== null;
            })
        ))
    ];

    // Build configuration
    let configuration = {
        ...Base,

        entry: {
            ...Base.entry,
            ...generateModules(Config, modules)
        },

        externals: [
            ...Base.externals,

            function(context, request, callback) {
                // Ignore relative imports
                if(request.indexOf('./') === 0 || request.indexOf('../') === 0) {
                    return callback();
                }

                // Ignore eon modules
                if(request.indexOf('eon.extension.') === 0) {
                    return callback();
                }

                // Ignore absolute paths
                if(path.isAbsolute(request)) {
                    return callback();
                }

                // Ignore modules in `resolve.alias`
                if(typeof configuration.resolve.alias[request] !== 'undefined') {
                    return callback();
                }

                // Try resolve module
                try {
                    require.resolve(request);
                } catch(e) {
                    if (context.indexOf('node_modules') !== -1) {
                        addStaticModule(StaticModules.Dependencies, request, context);
                    } else {
                        addStaticModule(StaticModules.Externals, request, context);
                    }
                }

                callback();
            }
        ],

        module: {
            ...Base.module,

            preLoaders: [
                ...Base.module.preLoaders,

                {
                    loader: 'eslint-loader',
                    test: /\.js$/,

                    include: esIncludes,
                    exclude: /(node_modules|bower_components)/
                }
            ],

            loaders: [
                ...Base.module.loaders,

                {
                    loader: 'imports?this=>window',
                    test: /\.js$/,

                    include: [
                        path.resolve(projectPath, 'eon.extension.core/bower_components/foundation-sites/js')
                    ]
                },
                {
                    loader: 'babel',
                    test: /\.js$/,

                    query: {
                        cacheDirectory: path.join(rootPath, '.babel/cache'),
                        presets: ['es2015', 'react']
                    },

                    include: [
                        path.resolve(projectPath, 'eon.extension.core/bower_components/foundation-sites/js'),

                        ...esIncludes
                    ]
                }
            ]
        },

        resolve: {
            ...Base.resolve,

            root: [
                ...Base.resolve.root,

                ...Object.keys(Config.Modules)
                    .map((moduleTypeName) => {
                        let moduleTypePath = path.resolve(rootPath, Config.Modules[moduleTypeName].path);

                        if(!fs.existsSync(moduleTypePath)) {
                            gutil.log(gutil.colors.red(
                                'Ignoring module type "%s", no source directory exists at: "%s"'
                            ), moduleTypeName, moduleTypePath);
                            return null;
                        }

                        return moduleTypePath;
                    })
                    .filter((path) => {
                        return path !== null;
                    })
            ],

            alias: {
                ...Base.resolve.alias,

                ...Object.assign(...Object.keys(modules)
                    .map((moduleName) => {
                        let module = modules[moduleName];
                        let alias = {
                            // Add extra aliases
                            ...(module.alias || {})
                        };

                        // Add module alias
                        alias[moduleName] = path.resolve(module.sourcePath);

                        return alias;
                    })
                    .filter((alias) => {
                        return alias !== null;
                    })
                )
            }
        }
    };

    return configuration;
}

function generateModules(Config, modules) {
    let destinations = listModuleType(Config.Modules.Destinations);
    let sources = listModuleType(Config.Modules.Sources);

    return {
        'background/callback/callback': [
            ...Config.CommonRequirements,
            ...getServices(modules, 'configuration'),
            'eon.extension.core/modules/background/callback'
        ],
        'background/main/main': [
            ...Config.CommonRequirements,
            ...getServices(modules, 'configuration'),
            'eon.extension.core/modules/background/main'
        ],
        'background/migrate/migrate': [
            ...Config.CommonRequirements,
            ...getServices(modules, 'configuration'),
            ...getServices(modules, 'migrate'),
            'eon.extension.core/modules/background/migrate'
        ],

        //
        // Messaging
        //

        'background/messaging/messaging': [
            ...Config.CommonRequirements,
            ...getServices(modules, 'configuration'),
            'eon.extension.core/modules/background/messaging'
        ],
        'background/messaging/services/scrobble': [
            ...Config.CommonRequirements,
            ...getServices(modules, 'configuration'),
            ...getServices(destinations, 'destination/scrobble'),
            'eon.extension.core/modules/background/messaging/services/scrobble'
        ],
        'background/messaging/services/storage': [
            ...Config.CommonRequirements,
            ...getServices(modules, 'configuration'),
            'eon.extension.core/modules/background/messaging/services/storage'
        ],

        //
        // Configuration
        //

        'configuration/configuration': [
            // Ensure CSS Dependencies are bundled first
            'eon.extension.core/modules/configuration/dependencies.scss',

            ...Config.CommonRequirements,
            ...getServices(modules, 'configuration', { includeComponents: true }),
            'eon.extension.core/modules/configuration'
        ],

        //
        // Destinations
        //

        ...Object.assign({}, ...Object.keys(destinations)
            .map((moduleName) => {
                return getModuleChildren(Config, destinations[moduleName]) || {};
            })
        ),

        //
        // Sources
        //

        ...Object.assign({}, ...Object.keys(sources)
            .map((moduleName) => {
                return {
                    ...getModule(Config, modules, sources[moduleName]),
                    ...getModuleChildren(Config, sources[moduleName])
                };
            })
        )
    };
}

function getModule(Config, modules, module) {
    let name = module.name.replace('eon.extension.', '');

    // Parse module name
    let moduleName = module.name.replace('eon.extension.', '');
    let splitAt = moduleName.indexOf('.');

    if(splitAt < 0) {
        gutil.log(gutil.colors.red(
            'Invalid value provided for the "module.name" parameter: %O'
        ), module.name);
        return null;
    }

    let type = moduleName.substring(0, splitAt);
    let plugin = moduleName.substring(splitAt + 1);

    // Build module entry
    let result = {};

    result[type + '/' + plugin + '/' + plugin] = [
        ...Config.CommonRequirements,
        ...getServices([modules['eon.extension.core']], 'configuration'),
        ...getModuleServices(module)
    ];

    return result;
}

function getModuleChildren(Config, module) {
    // Validate `module` object
    if(typeof module === 'undefined' || module === null) {
        gutil.log(gutil.colors.red(
            'Invalid value provided for the "module" parameter: %O'
        ), module);
        return null;
    }

    if(typeof module.name === 'undefined' || module.name === null) {
        gutil.log(gutil.colors.red(
            'Invalid value provided for the "module" parameter: %O'
        ), module);
        return null;
    }

    // Parse module name
    let moduleName = module.name.replace('eon.extension.', '');
    let splitAt = moduleName.indexOf('.');

    if(splitAt < 0) {
        gutil.log(gutil.colors.red(
            'Invalid value provided for the "module.name" parameter: %O'
        ), module.name);
        return null;
    }

    let type = moduleName.substring(0, splitAt);
    let plugin = moduleName.substring(splitAt + 1);

    // Build module children entries
    let result = {};

    (module.children || []).forEach((name) => {
        result[type + '/' + plugin + '/' + name + '/' + name] = [
            ...Config.CommonRequirements,
            module.name + '/modules/' + name
        ];
    });

    return result;
}

function getModuleServices(module) {
    if(typeof module === 'undefined' || module === null) {
        return null;
    }

    if(typeof module.services === 'undefined' || module.services === null) {
        return null;
    }

    // Retrieve module services
    return [].concat.apply([], module.services
        .map((type) => {
            if(type === 'migrate') {
                return null;
            }

            // Build service name
            let serviceName = type.substring(type.indexOf('/') + 1);

            // Ensure service module exists
            let servicePath = path.resolve(module.sourcePath, 'services/' + serviceName + '/index.js');

            if(!fs.existsSync(servicePath)) {
                gutil.log(gutil.colors.red(
                    'Ignoring service "%s" for module "%s", no file exists at: "%s"'
                ), serviceName, module.name, servicePath);
                return null;
            }

            // Only include the plugin configuration service
            if(type === 'configuration') {
                return [
                    servicePath
                ];
            }

            // Find matching main module
            let mainPath = path.resolve(projectPath, 'eon.extension.core/src/modules/' + type + '/index.js');

            if(!fs.existsSync(mainPath)) {
                gutil.log(gutil.colors.red(
                    'Ignoring service "%s" for module "%s", unable to find main module at: "%s"'
                ), serviceName, module.name, mainPath);
                return null;
            }

            // Found service
            return [
                servicePath,
                mainPath
            ];
        })
        .filter((name) => {
            return name !== null;
        })
    );
}

function getServices(modules, type, options) {
    options = merge({
        includeComponents: false
    }, options);

    // Find matching service `type` in modules
    return [].concat.apply([], Object.keys(modules)
        .map((moduleName) => {
            let module = modules[moduleName];

            // Ensure module has services
            if(typeof module.services === 'undefined') {
                return null;
            }

            // Ensure module has the specified service
            if(module.services.indexOf(type) === -1) {
                return null;
            }

            // Build service name
            let serviceName = type.substring(type.indexOf('/'));

            // Ensure service exists
            let servicePath = path.resolve(module.sourcePath, 'services/' + serviceName + '/index.js');

            if(!fs.existsSync(servicePath)) {
                gutil.log(gutil.colors.red(
                    'Ignoring service "%s" for module "%s", no file exists at: "%s"'
                ), serviceName, moduleName, servicePath);
                return null;
            }

            // Build list of service modules
            let items = [servicePath];

            // - Include react components (if enabled)
            if(options.includeComponents) {
                let componentsPath = path.resolve(module.sourcePath, 'services/' + serviceName + '/components/index.js');

                if(fs.existsSync(componentsPath)) {
                    items.push(componentsPath);
                }
            }

            return items;
        })
        .filter((name) => {
            return name !== null;
        }));
}

function addStaticModule(modules, name, context) {
    if(context.indexOf('eon.') === -1) {
        gutil.log(gutil.colors.red(
            'Unable to find "eon." in context: %o'
        ), context);
        return;
    }

    // Get package name
    let packageName = context.substring(context.indexOf('eon.'));
    packageName = packageName.substring(0, packageName.indexOf('\\'));

    // Ensure module object exists
    if(typeof modules[name] === 'undefined') {
        modules[name] = {};
    }

    // Ensure context object exists
    if(typeof modules[name][packageName] === 'undefined') {
        modules[name][packageName] = [];
    }

    // Add reference
    modules[name][packageName].push(context);
}

// endregion

export default {
    build: build
};
