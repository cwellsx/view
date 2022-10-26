const path = require("path");

module.exports = {
  entry: "./src/App.tsx",
  devtool: "source-map",
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: [
          {
            loader: "ts-loader",
            options: {
              configFile: "tsconfig.ssr.json",
            },
          },
        ],
        exclude: /node_modules/,
      },
      {
        test: [/\.css$/, /pagedown-editor/],
        use: "ignore-loader",
      },
      {
        test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/],
        use: "url-loader",
      },
      {
        test: /\.svg$/,
        use: ["@svgr/webpack"],
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
  output: {
    filename: "index.js",
    path: path.resolve(__dirname, "build.ssr"),
  },
};
