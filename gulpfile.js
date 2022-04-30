const gulp = require("gulp");
const webpack = require("gulp-webpack");
const replace = require("gulp-replace");
const version = require("./package.json").version;
const browserSync = require("browser-sync");
const reload = browserSync.reload;
const dest = "build";
const path = {
    js: "src/**/*.js",
};
const webpackConfig = {
    entry: "./src/bscroll.js",
    output: {
        path: __dirname + "/" + dest,
        filename: "bscroll.js",
        libraryTarget: "umd",
    },
};
gulp.task("clean", require("del").bind(null, [dest]));
gulp.task("script", function () {
    return gulp
        .src(path.js)
        .pipe(webpack(webpackConfig))
        .pipe(replace(/__VERSION__/g, "'" + version + "'"))
        .pipe(gulp.dest(dest));
});
gulp.task("compile", ["script"]);
gulp.task("default", ["clean"], () => {
    gulp.start("compile");
});
gulp.task("connect", ["compile"], function () {
    browserSync({
        notify: false,
        port: 9000,
        server: {
            baseDir: ["."],
        },
        startPath: "demo/index.html",
    });

    // watch for changes
    gulp.watch(path.js, function () {
        gulp.start("script");
        reload();
    });
});
gulp.task("serve", ["clean"], function () {
    gulp.start("connect");
});
