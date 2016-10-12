import ExtractTextPlugin from 'extract-text-webpack-plugin';
import gutil from 'gulp-util';
import path from 'path';
import webpack from 'webpack';

import {projectPath, rootPath} from './core/helpers';


let bundled = {};

function getPackagePath(modulePath) {
    let result = path.relative(projectPath, modulePath);

    // Replace "node_modules" with "~"
    result = result.replace('node_modules', '~');

    // Strip module path
    let lastModulesStart = result.indexOf('~');

    if(lastModulesStart < 0) {
        return result;
    }

    let nameEnd = result.indexOf(path.sep, lastModulesStart + 2);

    if(nameEnd < 0) {
        return result;
    }

    return result.substring(0, nameEnd);
}

function logModule(color, name, modulePath, count) {
    let packagePath = getPackagePath(modulePath);

    if(typeof bundled[name] === 'undefined') {
        bundled[name] = {};
    }

    // Log included module (if not already logged)
    if(typeof bundled[name][packagePath] === 'undefined') {
        bundled[name][packagePath] = true;

        // Log module name
        gutil.log(color(
            '[%s] %s (chunks: %s)'),
            name, packagePath, count
        );
    }
}

function isVendorModule(name, module, count) {
    if(typeof module === 'undefined' || typeof module.userRequest === 'undefined') {
        return false;
    }

    if(module.userRequest.indexOf('node_modules') < 0) {
        return false;
    }

    // Log module entry
    logModule(gutil.colors.blue, name, module.userRequest, count);
    return true;
}

export default {
    debug: true,
    profile: true,

    devtool: 'cheap-source-map',

    entry: {},
    externals: [],

    output: {
        path: path.join(rootPath, 'build'),
        filename: '[name].js'
    },

    module: {
        preLoaders: [],

        loaders: [
            {
                loader: 'file',
                test: /\.css$/
            },
            {
                loader: 'json',
                test: /\.json$/
            },
            {
                test: /\.scss$/,
                loader: ExtractTextPlugin.extract('style', 'css?sourceMap!sass?sourceMap')
            }
        ]
    },

    plugins: [
        new webpack.optimize.CommonsChunkPlugin({
            name: 'background/shared',
            minChunks: (module, count) => {
                if(count < 2) {
                    return false;
                }

                if(typeof module === 'undefined' || typeof module.userRequest === 'undefined') {
                    return false;
                }

                // Log module entry
                logModule(gutil.colors.cyan, 'background/shared', module.userRequest, count);
                return true;
            },
            chunks: [
                'background/callback/callback',
                'background/relay/relay',
                'background/scrobble/scrobble',
                'background/sync/sync'
            ]
        }),
        new webpack.optimize.CommonsChunkPlugin({
            name: 'background/vendor',
            minChunks: (module, count) => {
                return isVendorModule('background/vendor', module, count);
            },
            chunks: [
                'background/shared'
            ]
        }),

        new webpack.optimize.CommonsChunkPlugin({
            name: 'shared',
            minChunks: (module, count) => {
                if(count < 5) {
                    return false;
                }

                if(typeof module === 'undefined' || typeof module.userRequest === 'undefined') {
                    return false;
                }

                // Log module entry
                logModule(gutil.colors.cyan, 'shared', module.userRequest, count);
                return true;
            },
            chunks: [
                'background/shared',
                'configuration/configuration',

                // Destinations
                'destination/lastfm/callback/callback',
                'destination/trakt/callback/callback',

                // Sources
                'source/googlemusic/googlemusic',
                'source/netflix/netflix'
            ]
        }),
        new webpack.optimize.CommonsChunkPlugin({
            name: 'vendor',
            minChunks: (module, count) => {
                return isVendorModule('vendor', module, count);
            },
            chunks: [
                'background/vendor',
                'shared'
            ]
        }),

        new ExtractTextPlugin('[name].css', {
            allChunks: true
        })
    ],

    resolve: {
        root: [],

        alias: {
            'eon.extension.browser.base': path.resolve(
                projectPath, 'Browsers/eon.extension.browser.base/src'
            ),

            'eon.extension.browser.base.webextensions': path.resolve(
                projectPath, 'Browsers/eon.extension.browser.base.webextensions/src'
            )
        }
    },

    resolveLoader: {
        fallback: path.join(rootPath, 'node_modules')
    },

    sassLoader: {
        includePaths: [
            path.resolve(projectPath, 'eon.extension.core/bower_components')
        ]
    }
};
