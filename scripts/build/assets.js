import Merge from 'lodash-es/merge';
import fs from 'fs';
import glob from 'glob';
import mkdirp from 'mkdirp';
import path from 'path';

import {isDefined, listModules} from './core/helpers';


export function build(Config, options) {
    options = Merge({
        outputPath: null
    }, options || {});

    if(!isDefined((options.outputPath))) {
        throw new Error('Missing required option: unpacked');
    }

    // Retrieve enabled modules
    let modules = listModules(Config.Modules);

    // Ensure build directory exists
    mkdirp.sync(options.outputPath);

    // Build modules
    return Promise.all(Object.keys(modules).map((moduleName) => {
        return buildModule(modules[moduleName], options);
    }));
}

function buildModule(module, options) {
    let moduleAssetsPath = path.join(module.path, 'assets');

    return copy(moduleAssetsPath, options.outputPath, [
        '**/*.html',
        '**/*.png',
        '**/*.svg'
    ]);
}

function copy(base, dest, patterns) {
    return Promise.all(patterns.map((pattern) => {
        return copyGlob(pattern, base, dest);
    })).then((results) => {
        return [].concat.apply([], results);
    });
}

function copyGlob(pattern, base, dest) {
    return new Promise((resolve) => {
        glob(base + '/' + pattern, (err, files) => {
            let results = [];

            // Iterate over matched files
            files.forEach((filePath) => {
                let assetPath = path.relative(base, filePath);
                let destPath = path.join(dest, assetPath);

                // Ensure destination directory exists
                mkdirp.sync(path.dirname(destPath));

                // Copy file to build directory
                fs.createReadStream(filePath)
                    .pipe(fs.createWriteStream(destPath));

                // Append file to `results`
                results.push({
                    from: filePath,
                    to: destPath
                });
            });

            // Done
            resolve(results);
        });
    });
}

export default {
    build: build
};
