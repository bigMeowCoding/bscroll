module.exports = {
  presets: ["@babel/preset-env"],
  comments: false,
  env: {
    test: {
      plugins: ["@babel/plugin-transform-modules-commonjs"],
    },
  },
};
