const path = require("path");
const fs = require("fs");

(() => {
    var testFiles = fs.readdirSync(".")
    testFiles = testFiles.filter((file) => {
        return file.match(/\.http$/)
    })
    if (!testFiles
            || !testFiles.length) {
        console.log("\tno test files found")
        return
    }
    testFiles.sort()
    if (fs.existsSync("cumulate.http"))
        fs.unlinkSync("cumulate.http")
    testFiles.forEach((file) => {
        if (file == "cumulate.http")
            return
        console.log("cumulate " + file)
        fs.appendFileSync("cumulate.http", "\r\n" + fs.readFileSync(file, "utf-8"), "utf8")
    })
    console.log("")
    console.log("Done")
})();