const gulp = require("gulp");
const  webpack = require("gulp-webpack");
const replace = require("gulp-replace");
const version = require("./package.json").version;

const dest = "build";
const path = {
    js: "src/js/**/*.js",
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
