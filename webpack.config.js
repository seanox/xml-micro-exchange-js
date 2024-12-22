import path from "path"

const BUILD_PATH = "./build"

export default {
    entry: BUILD_PATH + "/service.js",
    mode: "production",
    target: "node",
    output: {
        filename: "service.js",
        path: path.resolve("build")
    },
    optimization: {
        minimize: false
    },
    module: {
        rules: [
            {
                exclude: /node_modules/
            }
        ]
    }
}
