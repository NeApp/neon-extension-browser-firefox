import Filesystem from 'fs';
import Glob from 'glob';
import Merge from 'lodash-es/merge';
import Mkdirp from 'mkdirp';
import Path from 'path';

import Module from './core/module';
import {isDefined} from './core/helpers';


export function build(Build, options) {
    options = Merge({
        outputPath: null
    }, options || {});

    if(!isDefined((options.outputPath))) {
        throw new Error('Missing required option: unpacked');
    }

    // Retrieve modules
    let modules = Module.list(Build.modules);

    // Ensure build directory exists
    Mkdirp.sync(options.outputPath);

    // Build modules
    return Promise.all(Object.keys(modules).map((moduleName) => {
        return buildModule(modules[moduleName], options);
    }));
}

function buildModule(module, options) {
    let moduleAssetsPath = Path.join(module.path, 'assets');

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
        Glob(base + '/' + pattern, (err, files) => {
            let results = [];

            // Iterate over matched files
            files.forEach((filePath) => {
                let assetPath = Path.relative(base, filePath);
                let destPath = Path.join(dest, assetPath);

                // Ensure destination directory exists
                Mkdirp.sync(Path.dirname(destPath));

                // Copy file to build directory
                Filesystem.createReadStream(filePath)
                    .pipe(Filesystem.createWriteStream(destPath));

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
