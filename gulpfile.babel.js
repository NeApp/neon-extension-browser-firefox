import del from 'del';
import gulp from 'gulp';
import gutil from 'gulp-util';

import Configuration from './config';
import Assets from './scripts/build/assets';
import Manifest from './scripts/build/manifest';
import Webpack from './scripts/build/webpack';

gulp.task('build', [
    'assets:build',
    'manifest:build',
    'webpack:build'
]);

// region Assets

gulp.task('assets:clean', () => {
    return del([
        __dirname + '/build/**/*.html'
    ]);
});

gulp.task('assets:build', ['assets:clean'], (callback) => {
    Assets.build(Configuration).then(
        () => {
            callback();
        },
        callback
    );
});

// endregion

// region Manifest

gulp.task('manifest:clean', () => {
    return del([__dirname + '/build/manifest.json']);
});

gulp.task('manifest:build', ['manifest:clean'], (callback) => {
    Manifest.build(Configuration).then(
        callback,
        callback
    );
});

// endregion

// region Webpack

gulp.task('webpack:clean', () => {
    return del([
        __dirname + '/build/**/*.js',
        __dirname + '/build/**/*.css'
    ]);
});

gulp.task('webpack:build', ['webpack:clean'], (callback) => {
    Webpack.build(Configuration).then(
        (stats) => {
            gutil.log(stats.toString('normal'));
            callback();
        },
        callback
    );
});

// endregion
