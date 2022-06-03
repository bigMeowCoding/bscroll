var path = require("path");
var webpack = require("webpack");
var version = require("./package.json").version;
const mode = process.env.NODE_ENV === "prod" ? "production" : "development";
module.exports = {
    mode,
    entry: "./src/index",

    resolve: {
        extensions: [".ts", ".tsx", ".js", ".json"],
    },
    module: {
        rules: [
            {
                test: /\.(js|jsx)$/,
                exclude: /node_modules/,
                loader: "babel-loader",
            },
        ],
    },
    target: ["web"],
    devServer: {
        static: {
            directory: path.join(__dirname, "docs/slider"),
        },
        compress: true,
        port: 9000,
    },
    plugins: [
        new webpack.DefinePlugin({
            __VERSION__: JSON.stringify(version),
        }),
    ],
    output: {
        path: path.resolve(__dirname, "build"),
        filename: "bscroll.js",
        library: {
            name: "BScroll",
            type: "umd",
            export: "default",
        },
        publicPath: "/assets/",
    },
};
