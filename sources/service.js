/**
 * LIZENZBEDINGUNGEN - Seanox Software Solutions ist ein Open-Source-Projekt, im
 * Folgenden Seanox Software Solutions oder kurz Seanox genannt.
 * Diese Software unterliegt der Version 2 der Apache License.
 *
 * XMEX XML-Micro-Exchange
 * Copyright (C) 2024 Seanox Software Solutions
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 *
 *     DESCRIPTION
 *
 * XML-Micro-Exchange is a volatile RESTful micro datasource. It is designed for
 * easy communication and data exchange of web-applications and for IoT. The XML
 * based datasource is volatile and lives through continuous use and expires
 * through inactivity. They are designed for active and near real-time data
 * exchange but not as a real-time capable long-term storage. Compared to a JSON
 * storage, this datasource supports more dynamics, partial data access, data
 * transformation, and volatile short-term storage.
 *
 *     TERMS / WORDING
 * TODO:
 */
import http from "http"
import https from "https"
import fs from "fs"
import path from "path"

import Mime from "mime/lite"

// For the environment variables, constants are created so that they can be
// assigned as static values to the constants in the class!

class Runtime {
    static getEnv(variable, standard) {
        if (!process.env.hasOwnProperty(variable)
                || String(process.env[variable]).trim().length <= 0)
            return standard
        return String(process.env[variable]).trim()
    }
}

const XMEX_DEBUG_MODE = Runtime.getEnv("XMEX_DEBUG_MODE", "off")
const XMEX_CONTAINER_MODE = Runtime.getEnv("XMEX_CONTAINER_MODE", "off")

const XMEX_CONNECTION_ADDRESS = Runtime.getEnv("XMEX_CONNECTION_ADDRESS", "0.0.0.0")
const XMEX_CONNECTION_PORT = Runtime.getEnv("XMEX_CONNECTION_PORT", 80)
const XMEX_CONNECTION_CONTEXT = Runtime.getEnv("XMEX_CONNECTION_CONTEXT", "/xmex!")
const XMEX_CONNECTION_CERTIFICATE = Runtime.getEnv("XMEX_CONNECTION_CERTIFICATE")
const XMEX_CONNECTION_SECRET = Runtime.getEnv("XMEX_CONNECTION_SECRET")

const XMEX_ACME_CHALLENGE = Runtime.getEnv("XMEX_ACME_CHALLENGE")
const XMEX_ACME_TOKEN = Runtime.getEnv("XMEX_ACME_TOKEN")
const XMEX_ACME_REDIRECT = Runtime.getEnv("XMEX_ACME_REDIRECT", "https://...")

const XMEX_REQUEST_XPATH_DELIMITER = Runtime.getEnv("XMEX_REQUEST_XPATH_DELIMITER", "!")

const XMEX_CONTENT_DIRECTORY = Runtime.getEnv("XMEX_CONTENT_DIRECTORY", "./content")
const XMEX_CONTENT_DEFAULT = Runtime.getEnv("XMEX_CONTENT_DEFAULT", "index.html openAPI.html")
const XMEX_CONTENT_REDIRECT = Runtime.getEnv("XMEX_CONTENT_REDIRECT")

const XMEX_STORAGE_DIRECTORY = Runtime.getEnv("XMEX_STORAGE_DIRECTORY", "./data")
const XMEX_STORAGE_SPACE = Runtime.getEnv("XMEX_STORAGE_SPACE", "256K")
const XMEX_STORAGE_EXPIRATION = Runtime.getEnv("XMEX_STORAGE_EXPIRATION", "900s")
const XMEX_STORAGE_QUANTITY = Runtime.getEnv("XMEX_STORAGE_QUANTITY", "65535")
const XMEX_STORAGE_REVISION_TYPE = Runtime.getEnv("XMEX_STORAGE_REVISION_TYPE", "timestamp")

const XMEX_LOGGING_OUTPUT = Runtime.getEnv("XMEX_LOGGING_OUTPUT", "%X ...")
const XMEX_LOGGING_ERROR = Runtime.getEnv("XMEX_LOGGING_ERROR", "%X ...")
const XMEX_LOGGING_ACCESS = Runtime.getEnv("XMEX_LOGGING_ACCESS", "off")

Number.parseBytes = function(text) {
    if (!Object.exists(text)
            || String(text).trim().length <= 0)
        throw "Number parser error: Invalid value"
    let match = String(text).toLowerCase().match(/^\s*([\d\.\,]+)\s*([kmg]?)\s*$/i)
    if (!match || match.length < 3 || Number.isNaN(match[1]))
        throw "Number parser error: Invalid value " + String(text).trim()
    let number = Number.parseFloat(match[1])
    let factor = ("kmg").indexOf(match[2]) +1
    return number *Math.pow(1024, factor)
}

// Query if something exists, it minimizes the check of undefined and null
Object.exists = function(object) {
    return object !== undefined && object !== null
}

http.ServerResponse.prototype.quit = function(status, message, headers = undefined, data = undefined) {

    if (this.headersSent)
        return

    // Directly set headers (e.g. for CORS) are read
    // Names are converted to camel case, pure cosmetics -- Node.js uses only lower case
    if (typeof headers !== "object")
        headers = {}

    for (const [header, value] of Object.entries(this.getHeaders()))
        headers[header.replace(/\b[a-z]/g, match =>
            match.toUpperCase())] = value

    this.writeHead(status, message, headers)
    if (Object.exists(data))
        this.contentLength = data.length
    this.end(data)
}

http.ServerResponse.prototype.exit = function(status, message, headers = undefined, data = undefined) {
    this.quit(status, message, headers, data)
    throw http.ServerResponse.prototype.exit
}

class Storage {

    /** Directory of the data storage */
    static DIRECTORY = XMEX_STORAGE_DIRECTORY

    /** Maximum number of files in data storage */
    static QUANTITY = XMEX_STORAGE_QUANTITY

    /**
     * Maximum data size of files in data storage in bytes.
     * The value also limits the size of the requests(-body).
     */
    static SPACE = XMEX_STORAGE_SPACE

    /** Maximum idle time of the files in seconds */
    static EXPIRATION = XMEX_STORAGE_EXPIRATION

    /** Character or character sequence of the XPath delimiter in the URI */
    static DELIMITER = XMEX_REQUEST_XPATH_DELIMITER

    /** Activates the debug and test mode (supports on, true, 1) */
    static DEBUG_MODE = XMEX_DEBUG_MODE

    /** Activates the container mode (supports on, true, 1) */
    static CONTAINER_MODE = XMEX_CONTAINER_MODE

    /** Defines the revision type (serial, timestamp) */
    static REVISION_TYPE = XMEX_STORAGE_REVISION_TYPE

    /**
     * Optional CORS response headers as associative array.
     * For the preflight OPTIONS the following headers are added automatically:
     *     Access-Control-Allow-Methods, Access-Control-Allow-Headers
     */
    static CORS = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Max-Age": "86400",
        "Access-Control-Expose-Headers": "*"
    }

    /**
     * Pattern for the Storage header
     *     Group 0. Full match
     *     Group 1. Storage
     *     Group 2. Name of the root element (optional)
     */
    static PATTERN_HEADER_STORAGE = /^(\w(?:[-\w]{0,62}\w)?)(?:\s+(\w{1,64}))?$/
}

class ServerFactory {

    static CONNECTION_ADDRESS = XMEX_CONNECTION_ADDRESS
    static CONNECTION_PORT = XMEX_CONNECTION_PORT
    static CONNECTION_CONTEXT = XMEX_CONNECTION_CONTEXT
    static CONNECTION_CERTIFICATE = XMEX_CONNECTION_CERTIFICATE
    static CONNECTION_SECRET = XMEX_CONNECTION_SECRET

    static ACME_CHALLENGE = XMEX_ACME_CHALLENGE
    static ACME_TOKEN = XMEX_ACME_TOKEN
    static ACME_REDIRECT = XMEX_ACME_REDIRECT

    static STORAGE_SPACE = Number.parseBytes(XMEX_STORAGE_SPACE)

    static CONTENT_DIRECTORY = XMEX_CONTENT_DIRECTORY
    static CONTENT_DEFAULT = XMEX_CONTENT_DEFAULT
    static CONTENT_REDIRECT = XMEX_CONTENT_REDIRECT

    static serverInstancesAcme = undefined
    static serverInstancesXmex = undefined

    static onContentRequest(request, response) {

        // Very simple/rudimentary implemented web server. Supported are the
        // methods OPTIONS/HEAD/GET. This way, content can be provided outside
        // the URL of the API, e.g. for documentation.

        const method = request.method.toUpperCase()
        if (method === "OPTIONS")
            response.exit(204, "No Content", {Allow: "OPTIONS, HEAD, GET"})

        if (ServerFactory.CONTENT_REDIRECT) {
            let location = ServerFactory.CONTENT_REDIRECT
            if (location.match(/\.{3,}$/))
                location = location.replace(/\.{3,}$/, request.url)
            response.exit(301, "Moved Permanently", {Location: location})
        }

        if (!ServerFactory.CONTENT_DIRECTORY)
            response.exit(404, "Resource Not Found")

        let target = path.normalize(decodeURI(request.url.replace(/\?.*$/, "")).trim()).replace(/\\+/g, "/")
        target = ServerFactory.CONTENT_DIRECTORY + "/" + target
        target = target.replace(/\/{2,}/g, "/")
        if (!fs.existsSync(target))
            response.exit(404, "Resource Not Found")
        if (!fs.lstatSync(target).isFile()
                && !fs.lstatSync(target).isDirectory())
            response.exit(404, "Resource Not Found")

        if (fs.lstatSync(target).isDirectory()) {
            if (ServerFactory.CONTENT_DEFAULT) {
                let files = ServerFactory.CONTENT_DEFAULT.split(/\s+/)
                while (files.length > 0) {
                    if (!files[0].includes("/")
                            && !files[0].includes("\\")
                            && fs.existsSync(target + "/" + files[0])
                            && fs.lstatSync(target + "/" + files[0]).isFile())
                        break
                    files.shift()
                }
                if (files.length <= 0)
                    response.exit(403, "Forbidden")
                target += files[0]
            } else response.exit(403, "Forbidden")
        }

        if (!["OPTIONS", "HEAD", "GET"].includes(method))
            response.exit(405, "Method Not Allowed", {Allow: "OPTIONS, HEAD, GET"})

        target = fs.realpathSync(target)
        const state = fs.lstatSync(target)
        const headers = {
            "Content-Length": state.size,
            "Content-Type": Mime.getType(target),
            "Last-Modified": new Date(state.mtimeMs).toUTCString()
        }
        if (method === "HEAD")
            response.exit(200, "Success", headers)
        let file = fs.openSync(target, "r")
        try {
            response.writeHead(200, "Success"/*, headers*/)
            response.contentLength = state.size || 0
            const buffer = Buffer.alloc(65535)
            for (let size = 0; size = fs.readSync(file, buffer) > 0;)
                response.write(buffer.toString("binary"), "binary")
            response.end()
        } finally {
            fs.closeSync(file)
        }
        throw http.ServerResponse.prototype.exit
    }

    static newInstance() {

        const secure = ServerFactory.CONNECTION_CERTIFICATE && ServerFactory.CONNECTION_SECRET
        const context = secure ? https : http
        const options = secure ? (() => {
            if (fs.existsSync(ServerFactory.CONNECTION_CERTIFICATE)) {
                if (ServerFactory.CONNECTION_CERTIFICATE.match(/\.pfx$/)) {
                    return {
                        pfx: fs.readFileSync(ServerFactory.CONNECTION_CERTIFICATE),
                        passphrase: ServerFactory.CONNECTION_SECRET
                    }
                } else {
                    return {
                        cert: fs.readFileSync(ServerFactory.CONNECTION_CERTIFICATE),
                        key: fs.readFileSync(ServerFactory.CONNECTION_SECRET)
                    }
                }
            }
            console.warn("Service", `Certificate file ${ServerFactory.CONNECTION_CERTIFICATE} not found, ignore secure connection`)
        })() : undefined

        const server = context.createServer(options, (request, response) => {

            request.on("data", (data) => {

                // Loading RequestBody is limited to the methods PATH/PUT/POST.
                // It does not cause HTTP error status, the data is ignored.
                let method = request.method.toUpperCase()
                if (!["PATCH", "POST", "PUT"].includes(method))
                    return

                // It must be a valid storage, existence will be checked later.
                // It does not cause HTTP error status, the data is ignored.
                let storage
                if (request.headers.storage)
                    storage = request.headers.storage
                if (!storage || !storage.match(Storage.PATTERN_HEADER_STORAGE))
                    return

                // Loading RequestBody is limited to the API only.
                // It does not cause HTTP error status, the data is ignored.
                let context = Object.exists(module.connection.context) ? module.connection.context : ""
                if (!decodeURI(request.url).startsWith(context))
                    return

                if (!Object.exists(request.data))
                    request.data = ""
                if (Object.exists(request.error))
                    return
                if (request.data.length +data.length > ServerFactory.STORAGE_SPACE) {
                    request.data = ""
                    request.error = [415, "Payload Too Large"]
                } else request.data += data
            })

            request.on("end", () => {

                try {

                    // Marking the start time for request processing
                    request.timing = new Date().getTime()
                    request.data = Object.exists(request.data) ? request.data : ""

                    if (Object.exists(request.error))
                        response.exit(...request.error)

                    const requestUrl = decodeURI(request.url)
                    if (ServerFactory.ACME_CHALLENGE
                            && ServerFactory.ACME_TOKEN
                            && requestUrl.toLowerCase() === ServerFactory.ACME_CHALLENGE.toLowerCase())
                        response.exit(200, "Success", {"Content-Length": ServerFactory.ACME_TOKEN.length}, ServerFactory.ACME_TOKEN)

                    // The API should always use a context path so that the
                    // separation between URI and XPath is also visually
                    // recognizable. For all requests outside of the API path
                    // are alternatively considered as a request to web content.
                    // If content has been configured, it will be used like a
                    // normal HTTP server. Otherwise the requests are answered
                    // with status 404.

                    if (!decodeURI(request.url).startsWith(ServerFactory.CONNECTION_CONTEXT))
                        ServerFactory.onContentRequest(request, response)

                } catch (error) {
                    if (error === Storage.prototype.exit
                            || error === http.ServerResponse.prototype.exit)
                        return
                    const unique = Date.now().toString(36).toUpperCase()
                    console.error("Service", "#" + unique, error)
                    if (!response.headersSent)
                        response.quit(500, "Internal Server Error", {"Error": "#" + unique})
                } finally {

                }
            })
        })

        server.on("error", (error) => {
            console.error(error.stack || error)
            process.exit(1)
        })

        server.listen(ServerFactory.CONNECTION_PORT, ServerFactory.CONNECTION_ADDRESS, function() {
            let options = []
            if (ServerFactory.CONNECTION_CERTIFICATE
                    && ServerFactory.CONNECTION_SECRET)
                options.push("secure")
            if (ServerFactory.CONNECTION_PORT === "80"
                    && ServerFactory.ACME_CHALLENGE
                    && ServerFactory.ACME_TOKEN)
                options.push("ACME")
            console.log("Service", `Listening at ${this.address().address}:${this.address().port}${options.length > 0 ? ' (' + options.join(" + ") + ')' : ''}`)
        })

        return server
    }

    static bind() {

        ServerFactory.serverInstancesXmex = ServerFactory.newInstance()

        if (ServerFactory.CONNECTION_PORT !== "80"
                && ServerFactory.ACME_CHALLENGE
                && ServerFactory.ACME_TOKEN) {
            ServerFactory.serverInstancesAcme = http.createServer((request, response) => {
                try {
                    const requestUrl = decodeURI(request.url)
                    if (requestUrl.toLowerCase() === ServerFactory.ACME_CHALLENGE.toLowerCase())
                        response.exit(200, "Success", {"Content-Length": ServerFactory.ACME_TOKEN.length}, ServerFactory.ACME_TOKEN)
                    if (ServerFactory.ACME_REDIRECT <= 0)
                        response.exit(404, "Resource Not Found")
                    let location = ServerFactory.ACME_REDIRECT
                    if (location.match(/\.{3,}$/))
                        location = location.replace(/\.{3,}$/, request.url)
                    response.exit(301, "Moved Permanently", {Location: location})
                } catch (error) {
                    if (error === http.ServerResponse.prototype.exit)
                        return
                    const unique = Date.now().toString(36).toUpperCase()
                    console.error("Service", "#" + unique, error)
                    if (!response.headersSent)
                        response.quit(500, "Internal Server Error", {"Error": "#" + unique})
                }
            })

            ServerFactory.serverInstancesAcme.on("error", (error) => {
                console.error(error.stack || error)
                process.exit(1)
            })

            ServerFactory.serverInstancesAcme.listen(80, ServerFactory.CONNECTION_ADDRESS, function() {
                console.log("Service", `Listening at ${this.address().address}:${this.address().port} (ACME)`)
            })
        }
    }
}

ServerFactory.bind()
