import Filesystem from 'fs';
import GulpUtil from 'gulp-util';
import IsPlainObject from 'lodash-es/isPlainObject';
import Merge from 'lodash-es/merge';
import Mkdirp from 'mkdirp';
import Path from 'path';
import Util from 'util';
import Webpack from 'webpack';

import Base from './webpack.config';
import Constants from './core/constants';
import Module from './core/module';
import {isDefined} from './core/helpers';


export const StaticModules = {
    Dependencies: {},
    Externals: {}
};

export function build(Build, options) {
    options = Merge({
        rootPath: null,
        outputPath: null
    }, options || {});

    if(!isDefined((options.rootPath))) {
        throw new Error('Missing required option: rootPath');
    }

    if(!isDefined((options.outputPath))) {
        throw new Error('Missing required option: outputPath');
    }

    return new Promise((resolve, reject) => {
        // Retrieve compiler for `config`
        let compiler;

        try {
            compiler = constructCompiler(Build, options);
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
            let statisticsPath = Path.join(options.rootPath, 'webpack.stats.json');
            let statistics = JSON.stringify(stats.toJson('verbose'));

            return Filesystem.writeFile(statisticsPath, statistics, function(err) {
                if(err) {
                    GulpUtil.log(GulpUtil.colors.red(
                        'Unable to write statistics: %s'
                    ), err.stack);
                    return;
                }

                resolve(stats);
            });
        });
    });
}

export function constructCompiler(Build, options) {
    // Generation configuration
    let configuration;

    try {
        configuration = generateConfiguration(Build, options);
    } catch(e) {
        throw new Error('Unable to generate configuration: ' + e.stack);
    }

    // Ensure build directory exists
    Mkdirp.sync(options.rootPath);

    // Save configuration
    Filesystem.writeFileSync(
        Path.join(options.rootPath, 'webpack.config.js'),
        Util.inspect(configuration, {
            depth: null
        }),
        'utf-8'
    );

    // Construct compiler
    return Webpack(configuration);
}

// region Configuration

export function generateConfiguration(Build, options) {
    options = Merge({
        devtool: false,
        environment: 'development',
        uglify: false
    }, options || {});

    // Retrieve enabled modules
    let modules = Module.list(Build.modules);

    // Build ES6 Includes List
    let esIncludes = [
        ...([].concat.apply([], Object.keys(modules)
            .map((moduleName) => {
                let module = modules[moduleName];

                return [
                    module.sourcePath,
                    ...((module.babel || {}).include || [])
                        .map((value) => {
                            let includePath = Path.resolve(module.path, value);

                            if(!Filesystem.existsSync(includePath)) {
                                GulpUtil.log(GulpUtil.colors.red(
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

        devtool: options.devtool,

        entry: {
            ...Base.entry,
            ...generateModules(Build, modules)
        },

        output: {
            ...Base.output,

            path: options.outputPath
        },

        externals: [
            ...Base.externals,

            function(context, request, callback) {
                // Ignore relative imports
                if(request.indexOf('./') === 0 || request.indexOf('../') === 0) {
                    return callback();
                }

                // Ignore neon modules
                if(request.indexOf('neon-extension-') === 0) {
                    return callback();
                }

                // Ignore absolute paths
                if(Path.isAbsolute(request)) {
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

            rules: [
                ...Base.module.rules,

                {
                    test: /\.js$/,
                    include: esIncludes,
                    exclude: /(node_modules)/,

                    enforce: 'pre',
                    use: [
                        'eslint-loader'
                    ]
                },

                {
                    test: /\.js$/,
                    include: [
                        Path.resolve(Constants.ProjectDirectory, 'Browsers/neon-extension-browser-base/node_modules/foundation-sites')
                    ],

                    use: [
                        'imports-loader?this=>window'
                    ]
                },
                {
                    test: /\.js$/,
                    include: [
                        Path.resolve(Constants.ProjectDirectory, 'Browsers/neon-extension-browser-base/node_modules/foundation-sites'),
                        Path.resolve(Constants.ProjectDirectory, 'Browsers/neon-extension-browser-base/node_modules/lodash-es'),

                        ...esIncludes
                    ],

                    use: [
                        {
                            loader: 'babel-loader',
                            options: {
                                cacheDirectory: Path.join(Constants.RootDirectory, '.babel/cache'),
                                presets: ['es2015', 'react']
                            },
                        }
                    ]
                }
            ]
        },

        plugins: [
            ...Base.plugins,

            new Webpack.DefinePlugin({
                'process.env': {
                    'NODE_ENV': JSON.stringify(options.environment)
                }
            }),

            ...(options.uglify ? [
                new Webpack.optimize.UglifyJsPlugin(
                    IsPlainObject(options.uglify) ? options.uglify : {}
                )
            ] : []),

            ...(options.loaders ? [
                new Webpack.LoaderOptionsPlugin(options.loaders)
            ] : [])
        ],

        resolve: {
            ...Base.resolve,

            modules: [
                // Shared modules
                Path.resolve(Constants.ProjectDirectory, 'Browsers/neon-extension-browser-base/node_modules'),

                // Plugin modules
                ...Object.keys(modules)
                    .map((moduleName) => {
                        if(moduleName === 'neon-extension-browser-base') {
                            return null;
                        }

                        return Path.join(modules[moduleName].path, 'node_modules');
                    })
                    .filter((path) => {
                        return path !== null;
                    }),

                // Fallback to local modules
                ...Base.resolve.modules
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
                        alias[moduleName] = Path.resolve(module.sourcePath);

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

function generateModules(Build, modules) {
    // Retrieve destinations
    let destinations = Module.listDestinations(Build.modules.destinations);

    if(Object.keys(destinations).length < 1) {
        throw new Error('At least one destination is required');
    }

    // Retrieve sources
    let sources = Module.listSources(Build.modules.sources);

    if(Object.keys(sources).length < 1) {
        throw new Error('At least one source is required');
    }

    // Build modules list
    return {
        'background/callback/callback': [
            ...Constants.CommonRequirements,
            ...getServices(modules, 'configuration'),
            'neon-extension-core/modules/background/callback'
        ],
        'background/main/main': [
            ...Constants.CommonRequirements,
            ...getServices(modules, 'configuration'),
            'neon-extension-core/modules/background/main'
        ],
        'background/migrate/migrate': [
            ...Constants.CommonRequirements,
            ...getServices(modules, 'configuration'),
            ...getServices(modules, 'migrate'),
            'neon-extension-core/modules/background/migrate'
        ],

        //
        // Messaging
        //

        'background/messaging/messaging': [
            ...Constants.CommonRequirements,
            ...getServices(modules, 'configuration'),
            'neon-extension-core/modules/background/messaging'
        ],
        'background/messaging/services/scrobble': [
            ...Constants.CommonRequirements,
            ...getServices(modules, 'configuration'),
            ...getServices(destinations, 'destination/scrobble'),
            'neon-extension-core/modules/background/messaging/services/scrobble'
        ],
        'background/messaging/services/storage': [
            ...Constants.CommonRequirements,
            ...getServices(modules, 'configuration'),
            'neon-extension-core/modules/background/messaging/services/storage'
        ],

        //
        // Configuration
        //

        'configuration/configuration': [
            // Ensure CSS Dependencies are bundled first
            'neon-extension-core/modules/configuration/dependencies.scss',

            ...Constants.CommonRequirements,
            ...getServices(modules, 'configuration', { includeComponents: true }),
            'neon-extension-core/modules/configuration'
        ],

        //
        // Destinations
        //

        ...Object.assign({}, ...Object.keys(destinations)
            .map((moduleName) => {
                return getModuleChildren(destinations[moduleName]) || {};
            })
        ),

        //
        // Sources
        //

        ...Object.assign({}, ...Object.keys(sources)
            .map((moduleName) => {
                return {
                    ...getModule(modules, sources[moduleName]),
                    ...getModuleChildren(sources[moduleName])
                };
            })
        )
    };
}

function getModule(modules, module) {
    // Parse module name
    let moduleName = module.name.replace('neon-extension-', '');
    let splitAt = moduleName.indexOf('-');

    if(splitAt < 0) {
        GulpUtil.log(GulpUtil.colors.red(
            'Invalid value provided for the "module.name" parameter: %O'
        ), module.name);
        return null;
    }

    let type = moduleName.substring(0, splitAt);
    let plugin = moduleName.substring(splitAt + 1);

    // Build module entry
    let result = {};

    result[type + '/' + plugin + '/' + plugin] = [
        ...Constants.CommonRequirements,
        ...getServices([modules['neon-extension-core']], 'configuration'),
        ...getModuleServices(module)
    ];

    return result;
}

function getModuleChildren(module) {
    // Validate `module` object
    if(typeof module === 'undefined' || module === null) {
        GulpUtil.log(GulpUtil.colors.red(
            'Invalid value provided for the "module" parameter: %O'
        ), module);
        return null;
    }

    if(typeof module.name === 'undefined' || module.name === null) {
        GulpUtil.log(GulpUtil.colors.red(
            'Invalid value provided for the "module" parameter: %O'
        ), module);
        return null;
    }

    // Parse module name
    let moduleName = module.name.replace('neon-extension-', '');
    let splitAt = moduleName.indexOf('-');

    if(splitAt < 0) {
        GulpUtil.log(GulpUtil.colors.red(
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
            ...Constants.CommonRequirements,
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
            let servicePath = Path.resolve(module.sourcePath, 'services/' + serviceName + '/index.js');

            if(!Filesystem.existsSync(servicePath)) {
                GulpUtil.log(GulpUtil.colors.red(
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
            let mainPath = Path.resolve(Constants.ProjectDirectory, 'neon-extension-core/src/modules/' + type + '/index.js');

            if(!Filesystem.existsSync(mainPath)) {
                GulpUtil.log(GulpUtil.colors.red(
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
    options = Merge({
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
            let servicePath = Path.resolve(module.sourcePath, 'services/' + serviceName + '/index.js');

            if(!Filesystem.existsSync(servicePath)) {
                GulpUtil.log(GulpUtil.colors.red(
                    'Ignoring service "%s" for module "%s", no file exists at: "%s"'
                ), serviceName, moduleName, servicePath);
                return null;
            }

            // Build list of service modules
            let items = [servicePath];

            // - Include react components (if enabled)
            if(options.includeComponents) {
                let componentsPath = Path.resolve(module.sourcePath, 'services/' + serviceName + '/components/index.js');

                if(Filesystem.existsSync(componentsPath)) {
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
    if(context.indexOf('neon-') === -1) {
        GulpUtil.log(GulpUtil.colors.red(
            'Unable to find "neon-" in context: %o'
        ), context);
        return;
    }

    // Get package name
    let packageName = context.substring(context.indexOf('neon-'));
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
