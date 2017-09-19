import del from 'del';
import fs from 'fs';
import gulp from 'gulp';
import gutil from 'gulp-util';
import gzip from 'gulp-zip';
import path from 'path';
import rename from 'gulp-rename';
import {exec} from 'child_process';

import Configuration from './config';
import Assets from './scripts/build/assets';
import Manifest from './scripts/build/manifest';
import Webpack from './scripts/build/webpack';
import {BuildDirectory, buildDistributionName} from './scripts/build/core/helpers';


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
    // Read extension manifest
    let manifest = JSON.parse(fs.readFileSync(path.join(
        BuildDirectory.Production.Unpacked,
        'manifest.json'
    )));

    // Create archive of build
    return gulp.src(path.join(BuildDirectory.Production.Unpacked, '**/*'))
        .pipe(gzip(buildDistributionName(manifest.version)))
        .pipe(gulp.dest(BuildDirectory.Production.Root));
});

gulp.task('webextension:production:assets', ['clean:production'], (callback) => {
    Assets.build(Configuration, {
        outputPath: BuildDirectory.Production.Unpacked
    }).then(
        () => {
            callback();
        },
        callback
    );
});

gulp.task('webextension:production:manifest', ['clean:production'], (callback) => {
    Manifest.build(Configuration, {
        outputPath: BuildDirectory.Production.Unpacked
    }).then(
        callback,
        callback
    );
});

gulp.task('webextension:production:package', ['clean:production'], (callback) => {
    Webpack.build(Configuration, {
        rootPath: BuildDirectory.Production.Root,
        outputPath: BuildDirectory.Production.Unpacked,

        environment: 'production',

        uglify: {
            compress: {
                warnings: false
            }
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
    // Read extension manifest
    let manifest = JSON.parse(fs.readFileSync(path.join(
        BuildDirectory.Production.Hybrid,
        'webextension/manifest.json'
    )));

    // Create archive of build
    return gulp.src(path.join(BuildDirectory.Production.Hybrid, '**/*'))
        .pipe(gzip(buildDistributionName(manifest.version, {
            type: 'hybrid'
        })))
        .pipe(gulp.dest(BuildDirectory.Production.Root));
});

gulp.task('hybrid:production:wrapper', ['clean:production'], () => {
    // Copy wrapper files
    return gulp.src('src_hybrid/**/*')
        .pipe(gulp.dest(BuildDirectory.Production.Hybrid));
});

gulp.task('hybrid:production:webextension', ['webextension:production'], () => {
    // Copy production build
    return gulp.src(path.join(BuildDirectory.Production.Unpacked, '**/*'))
        .pipe(gulp.dest(path.join(BuildDirectory.Production.Hybrid, 'webextension')));
});

gulp.task('hybrid:production:xpi:build', ['hybrid:production:package'], (done) => {
    // Create xpi of build
    exec('jpm xpi', { cwd: BuildDirectory.Production.Hybrid }, function (err, stdout, stderr) {
        console.log(stdout);
        console.log(stderr);
        done(err);
    });
});

gulp.task('hybrid:production:xpi', ['hybrid:production:xpi:build'], () => {
    // Read extension manifest
    let manifest = JSON.parse(fs.readFileSync(path.join(
        BuildDirectory.Production.Hybrid,
        'webextension/manifest.json'
    )));

    // Copy xpi to build directory
    return gulp.src(path.join(BuildDirectory.Production.Hybrid, '*.xpi'))
        .pipe(rename(buildDistributionName(manifest.version, {
            extension: 'xpi',
            type: 'hybrid'
        })))
        .pipe(gulp.dest(BuildDirectory.Production.Root));
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
    // Read extension manifest
    let manifest = JSON.parse(fs.readFileSync(path.join(
        BuildDirectory.Development.Unpacked,
        'manifest.json'
    )));

    // Create archive of build
    return gulp.src(path.join(BuildDirectory.Development.Unpacked, '**/*'))
        .pipe(gzip(buildDistributionName(manifest.version, {
            environment: 'dev'
        })))
        .pipe(gulp.dest(BuildDirectory.Development.Root));
});

gulp.task('webextension:development:assets', ['clean:development'], (callback) => {
    Assets.build(Configuration, {
        outputPath: BuildDirectory.Development.Unpacked
    }).then(
        () => {
            callback();
        },
        callback
    );
});

gulp.task('webextension:development:manifest', ['clean:development'], (callback) => {
    Manifest.build(Configuration, {
        outputPath: BuildDirectory.Development.Unpacked
    }).then(
        callback,
        callback
    );
});

gulp.task('webextension:development:package', ['clean:development'], (callback) => {
    Webpack.build(Configuration, {
        rootPath: BuildDirectory.Development.Root,
        outputPath: BuildDirectory.Development.Unpacked,

        devtool: 'cheap-source-map'
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
    // Read extension manifest
    let manifest = JSON.parse(fs.readFileSync(path.join(
        BuildDirectory.Development.Hybrid,
        'webextension/manifest.json'
    )));

    // Create archive of build
    return gulp.src(path.join(BuildDirectory.Development.Hybrid, '**/*'))
        .pipe(gzip(buildDistributionName(manifest.version, {
            environment: 'dev',
            type: 'hybrid'
        })))
        .pipe(gulp.dest(BuildDirectory.Development.Root));
});

gulp.task('hybrid:development:wrapper', ['clean:development'], () => {
    // Copy wrapper files
    return gulp.src('src_hybrid/**/*')
        .pipe(gulp.dest(BuildDirectory.Development.Hybrid));
});

gulp.task('hybrid:development:webextension', ['webextension:development'], () => {
    // Copy development build
    return gulp.src(path.join(BuildDirectory.Development.Unpacked, '**/*'))
        .pipe(gulp.dest(path.join(BuildDirectory.Development.Hybrid, 'webextension')));
});

gulp.task('hybrid:development:xpi:build', ['hybrid:development:package'], (done) => {
    // Create xpi of build
    exec('jpm xpi', { cwd: BuildDirectory.Development.Hybrid }, function (err, stdout, stderr) {
        console.log(stdout);
        console.log(stderr);
        done(err);
    });
});

gulp.task('hybrid:development:xpi', ['hybrid:development:xpi:build'], () => {
    // Read extension manifest
    let manifest = JSON.parse(fs.readFileSync(path.join(
        BuildDirectory.Development.Hybrid,
        'webextension/manifest.json'
    )));

    // Copy xpi to build directory
    return gulp.src(path.join(BuildDirectory.Development.Hybrid, '*.xpi'))
        .pipe(rename(buildDistributionName(manifest.version, {
            environment: 'dev',
            extension: 'xpi',
            type: 'hybrid'
        })))
        .pipe(gulp.dest(BuildDirectory.Development.Root));
});

// endregion
