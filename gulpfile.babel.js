import del from 'del';
import fs from 'fs';
import gulp from 'gulp';
import gutil from 'gulp-util';
import gzip from 'gulp-zip';

import Configuration from './config';
import Assets from './scripts/build/assets';
import Manifest from './scripts/build/manifest';
import Webpack from './scripts/build/webpack';


gulp.task('build', [
    'build:clean',
    'build:production',
    'build:archive'
]);

gulp.task('build:clean', () => {
    return del([
        __dirname + '/build/**/*'
    ]);
});

gulp.task('build:archive', ['build:development'], () => {
    // Read extension manifest
    let manifest = JSON.parse(fs.readFileSync(
        'build/unpacked/development/manifest.json'
    ));

    // Create archive of build
    return gulp.src('build/unpacked/development/**/{*.css,*.html,*.js,*.json}')
        .pipe(gzip('Eon-' + manifest.version + '-firefox.zip'))
        .pipe(gulp.dest('build'));
});

gulp.task('build:production', ['build:development'], () => {
    // Create production build
    return gulp.src('build/unpacked/development/**/{*.css,*.html,*.js,*.json}')
        .pipe(gulp.dest('build/unpacked/production'));
});

// region build:development

gulp.task('build:development', [
    'build:development:assets',
    'build:development:manifest',
    'build:development:webpack'
]);

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
