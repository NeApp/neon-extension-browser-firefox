import del from 'del';
import fs from 'fs';
import gulp from 'gulp';
import gutil from 'gulp-util';
import gzip from 'gulp-zip';
import rename from 'gulp-rename';
import {exec} from 'child_process';

import Configuration from './config';
import Assets from './scripts/build/assets';
import Manifest from './scripts/build/manifest';
import Webpack from './scripts/build/webpack';


gulp.task('build', [
    'build:clean',

    // Build
    'build:development',
    'build:production',

    // Archive
    'build:archive:development',
    'build:archive:production',
]);

gulp.task('build:clean', () => {
    return del([
        __dirname + '/build/**/*'
    ]);
});

// region build:production

gulp.task('build:production', ['build:development'], () => {
    // Create production build
    return gulp.src('build/unpacked/development/**/*')
        .pipe(gulp.dest('build/unpacked/production'));
});

gulp.task('build:archive:production', ['build:production'], () => {
    // Read extension manifest
    let manifest = JSON.parse(fs.readFileSync(
        'build/unpacked/production/manifest.json'
    ));

    // Create archive of build
    return gulp.src('build/unpacked/production/**/*')
        .pipe(gzip('Neon-' + manifest.version + '-firefox.zip'))
        .pipe(gulp.dest('build'));
});

// endregion

});

// region build:development

gulp.task('build:development', [
    'build:development:assets',
    'build:development:manifest',
    'build:development:webpack'
]);

gulp.task('build:archive:development', ['build:development'], () => {
    // Read extension manifest
    let manifest = JSON.parse(fs.readFileSync(
        'build/unpacked/development/manifest.json'
    ));

    // Create archive of build
    return gulp.src('build/unpacked/development/**/*')
        .pipe(gzip('Neon-' + manifest.version + '-firefox-development.zip'))
        .pipe(gulp.dest('build'));
});

gulp.task('build:development:assets', ['build:clean'], (callback) => {
    Assets.build(Configuration).then(
        () => {
            callback();
        },
        callback
    );
});

gulp.task('build:development:manifest', ['build:clean'], (callback) => {
    Manifest.build(Configuration).then(
        callback,
        callback
    );
});

gulp.task('build:development:webpack', ['build:clean'], (callback) => {
    Webpack.build(Configuration).then(
        (stats) => {
            gutil.log(stats.toString('normal'));
            callback();
        },
        callback
    );
});

// endregion
