import fs from 'fs';
import glob from 'glob';
import mkdirp from 'mkdirp';
import path from 'path';

import {BuildDirectory, listModules} from './core/helpers';

export function build(Config) {
    let modules = listModules(Config.Modules);

    // Ensure build directory exists
    mkdirp.sync(BuildDirectory.Unpacked.Development);

    // Build modules
    return Promise.all(Object.keys(modules).map((moduleName) => {
        return buildModule(modules[moduleName]);
    }));
}

function buildModule(module) {
    let moduleAssetsPath = path.join(module.path, 'assets');

    return copy(moduleAssetsPath, BuildDirectory.Unpacked.Development, [
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
