import del from 'del';
import fs from 'fs';
import gulp from 'gulp';
import gutil from 'gulp-util';
import gzip from 'gulp-zip';
import path from 'path';
import rename from 'gulp-rename';
import {exec} from 'child_process';

import Assets from './scripts/assets';
import Constants from './scripts/core/constants';
import Manifest from './scripts/manifest';
import Webpack from './scripts/webpack';
import {generateDistributionName} from './scripts/core/distribution';
import {parseBuildManifest, parseExtensionManifest} from './scripts/core/manifest';


gulp.task('build', [
    'build:development',
    'build:production'
]);

// region build:production

gulp.task('build:production', [
    'clean:production',

    'webextension:production',
    'hybrid:production'
]);

gulp.task('clean:production', () => {
    return del([
        __dirname + '/build/production/**/*'
    ]);
});

gulp.task('webextension:production', [
    'clean:production',
    'webextension:production:assets',
    'webextension:production:manifest',
    'webextension:production:package'
], () => {
    // Parse extension manifest
    let extension = parseExtensionManifest(path.join(
        Constants.BuildDirectory.Production.Unpacked,
        'manifest.json'
    ));

    // Create archive of build
    return gulp.src(path.join(Constants.BuildDirectory.Production.Unpacked, '**/*'))
        .pipe(gzip(generateDistributionName(extension.version)))
        .pipe(gulp.dest(Constants.BuildDirectory.Production.Root));
});

gulp.task('webextension:production:assets', ['clean:production'], (callback) => {
    // Parse build manifest
    let build = parseBuildManifest(path.join(Constants.RootDirectory, 'build.json'));

    // Build assets
    Assets.build(build, {
        outputPath: Constants.BuildDirectory.Production.Unpacked
    }).then(
        () => {
            callback();
        },
        callback
    );
});

gulp.task('webextension:production:manifest', ['clean:production'], (callback) => {
    // Parse build manifest
    let build = parseBuildManifest(path.join(Constants.RootDirectory, 'build.json'));

    // Build extension manifest
    Manifest.build(build, {
        outputPath: Constants.BuildDirectory.Production.Unpacked
    }).then(
        callback,
        callback
    );
});

gulp.task('webextension:production:package', ['clean:production'], (callback) => {
    // Parse build manifest
    let build = parseBuildManifest(path.join(Constants.RootDirectory, 'build.json'));

    // Build extension package
    Webpack.build(build, {
        rootPath: Constants.BuildDirectory.Production.Root,
        outputPath: Constants.BuildDirectory.Production.Unpacked,

        environment: 'production',
        devtool: 'hidden-source-map',

        loaders: {
            minimize: true
        },
        uglify: {
            sourceMap: true
        }
    }).then(
        (stats) => {
            gutil.log(stats.toString('normal'));
            callback();
        },
        callback
    );
});

gulp.task('hybrid:production', [
    'clean:production',
    'hybrid:production:package',
    'hybrid:production:xpi'
]);

gulp.task('hybrid:production:package', [
    'clean:production',
    'hybrid:production:wrapper',
    'hybrid:production:webextension'
], () => {
    // Parse extension manifest
    let extension = parseExtensionManifest(path.join(
        Constants.BuildDirectory.Production.Hybrid,
        'webextension/manifest.json'
    ));

    // Create archive of build
    return gulp.src(path.join(Constants.BuildDirectory.Production.Hybrid, '**/*'))
        .pipe(gzip(generateDistributionName(extension.version, {
            type: 'hybrid'
        })))
        .pipe(gulp.dest(Constants.BuildDirectory.Production.Root));
});

gulp.task('hybrid:production:wrapper', ['clean:production'], () => {
    // Copy wrapper files
    return gulp.src('src_hybrid/**/*')
        .pipe(gulp.dest(Constants.BuildDirectory.Production.Hybrid));
});

gulp.task('hybrid:production:webextension', ['webextension:production'], () => {
    // Copy production build
    return gulp.src(path.join(Constants.BuildDirectory.Production.Unpacked, '**/!(*.map)'))
        .pipe(gulp.dest(path.join(Constants.BuildDirectory.Production.Hybrid, 'webextension')));
});

gulp.task('hybrid:production:xpi:build', ['hybrid:production:package'], (done) => {
    // Create xpi of build
    exec('jpm xpi', { cwd: Constants.BuildDirectory.Production.Hybrid }, function (err, stdout, stderr) {
        console.log(stdout);
        console.log(stderr);
        done(err);
    });
});

gulp.task('hybrid:production:xpi', ['hybrid:production:xpi:build'], () => {
    // Read extension manifest
    let manifest = JSON.parse(fs.readFileSync(path.join(
        Constants.BuildDirectory.Production.Hybrid,
        'webextension/manifest.json'
    )));

    // Copy xpi to build directory
    return gulp.src(path.join(Constants.BuildDirectory.Production.Hybrid, '*.xpi'))
        .pipe(rename(generateDistributionName(manifest.version, {
            extension: 'xpi',
            type: 'hybrid'
        })))
        .pipe(gulp.dest(Constants.BuildDirectory.Production.Root));
});

// endregion

// region build:development

gulp.task('build:development', [
    'clean:development',

    'webextension:development',
    'hybrid:development'
]);

gulp.task('clean:development', () => {
    return del([
        __dirname + '/build/development/**/*'
    ]);
});

gulp.task('webextension:development', [
    'clean:development',
    'webextension:development:assets',
    'webextension:development:manifest',
    'webextension:development:package'
], () => {
    // Parse extension manifest
    let extension = parseExtensionManifest(path.join(
        Constants.BuildDirectory.Development.Unpacked,
        'manifest.json'
    ));

    // Create archive of build
    return gulp.src(path.join(Constants.BuildDirectory.Development.Unpacked, '**/*'))
        .pipe(gzip(generateDistributionName(extension.version, {
            environment: 'dev'
        })))
        .pipe(gulp.dest(Constants.BuildDirectory.Development.Root));
});

gulp.task('webextension:development:assets', ['clean:development'], (callback) => {
    // Parse build manifest
    let build = parseBuildManifest(path.join(Constants.RootDirectory, 'build.json'));

    // Build assets
    Assets.build(build, {
        outputPath: Constants.BuildDirectory.Development.Unpacked
    }).then(
        () => {
            callback();
        },
        callback
    );
});

gulp.task('webextension:development:manifest', ['clean:development'], (callback) => {
    // Parse build manifest
    let build = parseBuildManifest(path.join(Constants.RootDirectory, 'build.json'));

    // Build extension manifest
    Manifest.build(build, {
        outputPath: Constants.BuildDirectory.Development.Unpacked
    }).then(
        callback,
        callback
    );
});

gulp.task('webextension:development:package', ['clean:development'], (callback) => {
    // Parse build manifest
    let build = parseBuildManifest(path.join(Constants.RootDirectory, 'build.json'));

    // Build extension package
    Webpack.build(build, {
        rootPath: Constants.BuildDirectory.Development.Root,
        outputPath: Constants.BuildDirectory.Development.Unpacked,

        devtool: 'cheap-module-source-map',

        loaders: {
            debug: true
        }
    }).then(
        (stats) => {
            gutil.log(stats.toString('normal'));
            callback();
        },
        callback
    );
});

gulp.task('hybrid:development', [
    'clean:development',
    'hybrid:development:package',
    'hybrid:development:xpi'
]);

gulp.task('hybrid:development:package', [
    'clean:development',
    'hybrid:development:wrapper',
    'hybrid:development:webextension'
], () => {
    // Parse extension manifest
    let extension = parseExtensionManifest(path.join(
        Constants.BuildDirectory.Development.Hybrid,
        'webextension/manifest.json'
    ));

    // Create archive of build
    return gulp.src(path.join(Constants.BuildDirectory.Development.Hybrid, '**/*'))
        .pipe(gzip(generateDistributionName(extension.version, {
            environment: 'dev',
            type: 'hybrid'
        })))
        .pipe(gulp.dest(Constants.BuildDirectory.Development.Root));
});

gulp.task('hybrid:development:wrapper', ['clean:development'], () => {
    // Copy wrapper files
    return gulp.src('src_hybrid/**/*')
        .pipe(gulp.dest(Constants.BuildDirectory.Development.Hybrid));
});

gulp.task('hybrid:development:webextension', ['webextension:development'], () => {
    // Copy development build
    return gulp.src(path.join(Constants.BuildDirectory.Development.Unpacked, '**/*'))
        .pipe(gulp.dest(path.join(Constants.BuildDirectory.Development.Hybrid, 'webextension')));
});

gulp.task('hybrid:development:xpi:build', ['hybrid:development:package'], (done) => {
    // Create xpi of build
    exec('jpm xpi', { cwd: Constants.BuildDirectory.Development.Hybrid }, function (err, stdout, stderr) {
        console.log(stdout);
        console.log(stderr);
        done(err);
    });
});

gulp.task('hybrid:development:xpi', ['hybrid:development:xpi:build'], () => {
    // Read extension manifest
    let manifest = JSON.parse(fs.readFileSync(path.join(
        Constants.BuildDirectory.Development.Hybrid,
        'webextension/manifest.json'
    )));

    // Copy xpi to build directory
    return gulp.src(path.join(Constants.BuildDirectory.Development.Hybrid, '*.xpi'))
        .pipe(rename(generateDistributionName(manifest.version, {
            environment: 'dev',
            extension: 'xpi',
            type: 'hybrid'
        })))
        .pipe(gulp.dest(Constants.BuildDirectory.Development.Root));
});

// endregion
