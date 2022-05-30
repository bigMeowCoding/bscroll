module.exports = {
    env: { browser: true, amd: true, jest: true, node: true, es6: true },
    extends: ["eslint:recommended", "plugin:prettier/recommended"],
    plugins: ["html", "jest"],
    parserOptions: {
        parser: "babel-eslint",
        sourceType: "module",
        allowImportExportEverywhere: true,
    },
    rules: {
        "arrow-parens": 0,
        "no-debugger": process.env.NODE_ENV === "production" ? 2 : 0,
        semi: ["error", "always"],
        curly: ["error", "all"],
        quotes: "off",
        "comma-dangle": "off",
        "space-before-function-paren": 0,
        "eol-last": 0,
        "no-unused-vars": "warn",
    },
};
