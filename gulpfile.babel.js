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
    'build:clean',

    // Development
    'build:development',
    'build:development:hybrid',
    'build:development:hybrid:xpi',

    'build:archive:development',
    'build:archive:development:hybrid',

    // Production
    'build:production',
    'build:production:hybrid',
    'build:production:hybrid:xpi',

    'build:archive:production',
    'build:archive:production:hybrid',
]);

gulp.task('build:clean', () => {
    return del([
        __dirname + '/build/**/*'
    ]);
});

// region build:production

gulp.task('build:production', [
    'build:production:assets',
    'build:production:manifest',
    'build:production:webpack'
]);

gulp.task('build:archive:production', ['build:production'], () => {
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

gulp.task('build:production:assets', ['build:clean'], (callback) => {
    Assets.build(Configuration, {
        outputPath: BuildDirectory.Production.Unpacked
    }).then(
        () => {
            callback();
        },
        callback
    );
});

gulp.task('build:production:manifest', ['build:clean'], (callback) => {
    Manifest.build(Configuration, {
        outputPath: BuildDirectory.Production.Unpacked
    }).then(
        callback,
        callback
    );
});

gulp.task('build:production:webpack', ['build:clean'], (callback) => {
    Webpack.build(Configuration, {
        rootPath: BuildDirectory.Production.Root,
        outputPath: BuildDirectory.Production.Unpacked,

        environment: 'production',
        uglify: true
    }).then(
        (stats) => {
            gutil.log(stats.toString('normal'));
            callback();
        },
        callback
    );
});

gulp.task('build:production:hybrid', [
    'build:production:hybrid:wrapper',
    'build:production:hybrid:webextension'
]);

gulp.task('build:archive:production:hybrid', ['build:production:hybrid'], () => {
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

gulp.task('build:production:hybrid:xpi:package', ['build:production:hybrid'], (done) => {
    // Create xpi of build
    exec('jpm xpi', { cwd: BuildDirectory.Production.Hybrid }, function (err, stdout, stderr) {
        console.log(stdout);
        console.log(stderr);
        done(err);
    });
});

gulp.task('build:production:hybrid:xpi', ['build:production:hybrid:xpi:package'], () => {
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

gulp.task('build:production:hybrid:wrapper', ['build:clean'], () => {
    // Copy wrapper files
    return gulp.src('src_hybrid/**/*')
        .pipe(gulp.dest(BuildDirectory.Production.Hybrid));
});

gulp.task('build:production:hybrid:webextension', ['build:production'], () => {
    // Copy production build
    return gulp.src(path.join(BuildDirectory.Production.Unpacked, '**/*'))
        .pipe(gulp.dest(path.join(BuildDirectory.Production.Hybrid, 'webextension')));
});

// endregion

// region build:development

gulp.task('build:development', [
    'build:development:assets',
    'build:development:manifest',
    'build:development:webpack'
]);

gulp.task('build:archive:development', ['build:development'], () => {
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

gulp.task('build:development:assets', ['build:clean'], (callback) => {
    Assets.build(Configuration, {
        outputPath: BuildDirectory.Development.Unpacked
    }).then(
        () => {
            callback();
        },
        callback
    );
});

gulp.task('build:development:manifest', ['build:clean'], (callback) => {
    Manifest.build(Configuration, {
        outputPath: BuildDirectory.Development.Unpacked
    }).then(
        callback,
        callback
    );
});

gulp.task('build:development:webpack', ['build:clean'], (callback) => {
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

gulp.task('build:development:hybrid', [
    'build:development:hybrid:wrapper',
    'build:development:hybrid:webextension'
]);

gulp.task('build:archive:development:hybrid', ['build:development:hybrid'], () => {
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

gulp.task('build:development:hybrid:xpi:package', ['build:development:hybrid'], (done) => {
    // Create xpi of build
    exec('jpm xpi', { cwd: BuildDirectory.Development.Hybrid }, function (err, stdout, stderr) {
        console.log(stdout);
        console.log(stderr);
        done(err);
    });
});

gulp.task('build:development:hybrid:xpi', ['build:development:hybrid:xpi:package'], () => {
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

gulp.task('build:development:hybrid:wrapper', ['build:clean'], () => {
    // Copy wrapper files
    return gulp.src('src_hybrid/**/*')
        .pipe(gulp.dest(BuildDirectory.Development.Hybrid));
});

gulp.task('build:development:hybrid:webextension', ['build:development'], () => {
    // Copy development build
    return gulp.src(path.join(BuildDirectory.Development.Unpacked, '**/*'))
        .pipe(gulp.dest(path.join(BuildDirectory.Development.Hybrid, 'webextension')));
});

// endregion
