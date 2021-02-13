const path = require("path")

const SOURCE_PATH = "./sources"

module.exports = {
    entry: SOURCE_PATH + "/service.js",
    target: "node",
    mode: "production",
    output: {
        filename: "service-build.js",
        path: path.resolve(__dirname, SOURCE_PATH)
    },
    optimization: {
        minimize: false
    }
}