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
import fs from "fs"
import http from "http"
import https from "https"
import path from "path"

import Mime from "mime/lite"

// For the environment variables, constants are created so that they can be
// assigned as static values to the constants in the class!

class Runtime {
    static getEnv(variable, standard) {
        if (!process.env.hasOwnProperty(variable)
                || String.isEmpty(String(process.env[variable])))
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
const XMEX_STORAGE_SPACE = Number.parseBytes(Runtime.getEnv("XMEX_STORAGE_SPACE", "256K"))
const XMEX_STORAGE_EXPIRATION = Date.parseDuration(Runtime.getEnv("XMEX_STORAGE_EXPIRATION", "900s"))
const XMEX_STORAGE_QUANTITY = Runtime.getEnv("XMEX_STORAGE_QUANTITY", "65535")
const XMEX_STORAGE_REVISION_TYPE = Runtime.getEnv("XMEX_STORAGE_REVISION_TYPE", "timestamp")

const XMEX_LOGGING_OUTPUT = Runtime.getEnv("XMEX_LOGGING_OUTPUT", "%X ...")
const XMEX_LOGGING_ERROR = Runtime.getEnv("XMEX_LOGGING_ERROR", "%X ...")
const XMEX_LOGGING_ACCESS = Runtime.getEnv("XMEX_LOGGING_ACCESS", "off")

Date.parseDuration = function(text) {
    if (String.isEmpty(text))
        throw "Date parser error: Invalid value"
    let match = String(text).toLowerCase().match(/^\s*([\d\.\,]+)\s*(ms|s|m|h?)\s*$/i)
    if (!match || match.length < 3 || Number.isNaN(match[1]))
        throw "Date parser error: Invalid value " + String(text).trim()
    let number = Number.parseFloat(match[1])
    let factor = 1
    if (match[2] === "s")
        factor = 1000
    else if (match[2] === "m")
        factor = 1000 *60
    else if (match[2] === "h")
        factor = 1000 *60 *60
    else if (match[2] === "s")
        factor = 1
    return number *factor
}

Number.parseBytes = function(text) {
    if (String.isEmpty(text))
        throw "Number parser error: Invalid value"
    let match = String(text).toLowerCase().match(/^\s*([\d\.\,]+)\s*([kmg]?)\s*$/i)
    if (!match || match.length < 3 || Number.isNaN(match[1]))
        throw "Number parser error: Invalid value " + String(text).trim()
    let number = Number.parseFloat(match[1])
    let factor = ("kmg").indexOf(match[2]) +1
    return number *Math.pow(1024, factor)
}

String.isEmpty = function(string) {
    return !Object.exists(string)
        || string.trim() === "";
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
    static get DIRECTORY() {
        return XMEX_STORAGE_DIRECTORY
    }

    /** Maximum number of files in data storage */
    static get QUANTITY() {
        return XMEX_STORAGE_QUANTITY
    }

    /**
     * Maximum data size of files in data storage in bytes.
     * The value also limits the size of the requests(-body).
     */
    static get SPACE() {
        return XMEX_STORAGE_SPACE
    }

    /** Maximum idle time of the files in seconds */
    static get EXPIRATION() {
        return XMEX_STORAGE_EXPIRATION
    }

    /** Character or character sequence of the XPath delimiter in the URI */
    static get DELIMITER() {
        return XMEX_REQUEST_XPATH_DELIMITER
    }

    /** Activates the debug and test mode (supports on, true, 1) */
    static get DEBUG_MODE() {
        return XMEX_DEBUG_MODE
    }

    /** Activates the container mode (supports on, true, 1) */
    static get CONTAINER_MODE() {
        return XMEX_CONTAINER_MODE
    }

    /** Defines the revision type (serial, timestamp) */
    static get REVISION_TYPE() {
        return XMEX_STORAGE_REVISION_TYPE
    }

    /**
     * TODO:
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

    /** Constants of share options */
    static get STORAGE_SHARE_NONE() {
        return 0
    }
    static get STORAGE_SHARE_EXCLUSIVE(){
        return 1
    }
    static get STORAGE_SHARE_INITIAL() {
        return 2
    }

    /**
     * Pattern for the Storage header
     *     Group 0. Full match
     *     Group 1. Storage
     *     Group 2. Name of the root element (optional)
     */
    static get PATTERN_HEADER_STORAGE() {
        return /^(\w(?:[-\w]{0,62}\w)?)(?:\s+(\w{1,64}))?$/
    }

    /**
     * Pattern to determine options (optional directives) at the end of XPath
     *     Group 0. Full match
     *     Group 1. XPath
     *     Group 2. options (optional)
     */
    static get PATTERN_XPATH_OPTIONS() {
        return /^(.*?)((?:!+\w+){0,})$/
    }

    /** Pattern for detecting Base64 decoding */
    static get PATTERN_BASE64() {
        return /^\?(?:[A-Za-z0-9+\/]{4})*(?:[A-Za-z0-9+\/]{2}==|[A-Za-z0-9+\/]{3}=)?$/
    }

    /** Pattern for detecting HEX decoding */
    static get PATTERN_HEX() {
        return /^\?([A-Fa-f0-9]{2})+$/
    }

    /**
     * Constructor creates a new Storage object.
     * @param string storage
     * @param string root
     * @param string xpath
     */
    constructor(storage = null, root = null, xpath = null) {

        // The storage identifier is case-sensitive.
        // To ensure that this also works with Windows, Base64 encoding is used.

        let options = [];
        const pattern = new RegExp(Storage.PATTERN_XPATH_OPTIONS)
        if (pattern.test(xpath || "")) {
            const matches = xpath.match(pattern);
            if (matches) {
                xpath = matches[1];
                options = matches[2].toLowerCase().split("!").filter(Boolean);
            }
        }

        if (!String.isEmpty(storage))
            root = root ? root: "data";
        else root = null;
        let store = null;
        if (!String.isEmpty(storage)) {
            // The file name from the storage is case-sensitive, which is not
            // automatically supported by Windows by default. The file name must
            // therefore be formatted so that case-sensitive characteristics are
            // retained but the spelling is case-insensitive. For this purpose,
            // the lower case transitions are marked with a special character.
            // Afterwards, the file name can be used in lower case letters. The
            // idea of simply converting everything to hexadecimal was rejected
            // due to the length of the file name.
            store = `${storage}[${root}]`
            store = store.replace(/(^|[^a-z])([a-z])/, "$1'$2")
            store = store.replace(/([a-z])([^a-z]|$)/, "$1'$2")
            store = `${Storage.DIRECTORY}/${store.toLowerCase()}`
            if (Storage.DEBUG_MODE)
                store += ".xml"
        }

        this.storage  = storage
        this.root     = root
        this.store    = store
        this.xpath    = xpath
        this.options  = options
        this.serial   = 0
        this.unique   = null
        this.revision = null
    }

    /**
     * Opens a storage with a XPath for the current request. The storage can be
     * opened with various options, which are passed as a bit mask. If the
     * storage to be opened does not yet exist, it is initialized with option
     * Storage.STORAGE_SHARE_INITIAL, otherwise the request will be terminated.
     * With option Storage.STORAGE_SHARE_EXCLUSIVE, simultaneous
     * requests must wait for a file lock.
     * param  string  storage
     * param  string  xpath
     * param  number  options
     * return Storage Instance of the Storage
     */
    static share(storage, xpath, options = Storage.STORAGE_SHARE_NONE) {

        const root = storage.replace(Storage.PATTERN_HEADER_STORAGE, "$2")
        storage = storage.replace(Storage.PATTERN_HEADER_STORAGE, "$1")

        if (!fs.existsSync(Storage.DIRECTORY))
            fs.mkdirSync(Storage.DIRECTORY, {recursive:true, mode:0o755})
        storage = new Storage(storage, root, xpath)

        // The cleanup does not run permanently, so the possible expiry is
        // checked before access and the storage is deleted if necessary.
        let expiration = Date.now() -Storage.EXPIRATION
        if (fs.existsSync(storage.store))
            if (fs.lstatSync(file).mtimeMs < expiration)
                fs.unlinkSync(storage.store)

        let initial = (options & Storage.STORAGE_SHARE_INITIAL) == Storage.STORAGE_SHARE_INITIAL;
        if (!initial && !storage.exists())
            storage.exit(404, "Resource Not Found")
        initial = initial && (!fs.existsSync(storage.store) || fs.lstatSync(storage.store).size <= 0)

        const exclusive = (options & Storage.STORAGE_SHARE_EXCLUSIVE) == Storage.STORAGE_SHARE_EXCLUSIVE
        storage.share = fs.openSync(storage.store, initial ? "as+" : exclusive ? "rs+" : "r")
        const now = Date.now()
        fs.utimesSync(storage.store, now, now)

        if (Storage.REVISION_TYPE === "serial") {
            storage.unique = Date.now().toString(36).toUpperCase();
        } else storage.unique = 1;

        if (initial) {
            let files = fs.readdirSync(Storage.DIRECTORY)
                    .filter(file =>
                            fs.lstatSync(Storage.DIRECTORY + "/" + file).isFile())
            if (files.length >= Storage.QUANTITY)
                storage.exit(507, "Insufficient Storage")
            fs.writeSync(this.share,
                `<?xml version="1.0" encoding="UTF-8"?>`
                    + `<${storage.root} ___rev="${storage.unique}" ___uid="${storage.getSerial()}"/>`);
            if (strcasecmp(Storage.REVISION_TYPE, "serial") === 0)
                storage.unique = 0
        }

        const buffer = Buffer.alloc(fs.lstatSync(storage.store).size)
        fs.readSync(storage.share, buffer, {position:0})
        storage.xml = new DOMParser().parseFromString(buffer.toString(), Storage.CONTENT_TYPE_XML)
        storage.revision = storage.xml.documentElement.getAttributeNumber("___rev")
        if (Storage.REVISION_TYPE === "serial") {
            if (storage.revision.match(Storage.PATTERN_NON_NUMERICAL))
                storage.exit(503, "Resource revision conflict")
            storage.unique += storage.revision
        }

        // TODO: $storage->xml->preserveWhiteSpace = false;
        // TODO: $storage->xml->formatOutput = Storage.DEBUG_MODE;

        return storage;
    }

    /**
     * Opens a storage with a XPath for the current request.
     * The storage can optionally be opened exclusively for write access.
     * If the storage to be opened does not yet exist, it is initialized.
     * Simultaneous requests must then wait through the file lock.
     * @param  {object} meta {request, response, storage, xpath, exclusive}
     * @return Storage Instance of the Storage
     */
    static share(meta) {

        if (!(meta.storage || "").match(Storage.PATTERN_HEADER_STORAGE))
            (new Storage(meta)).exit(400, "Bad Request", {Message: "Invalid storage identifier"})

        meta.root = meta.storage.replace(Storage.PATTERN_HEADER_STORAGE, "$2")
        meta.storage = meta.storage.replace(Storage.PATTERN_HEADER_STORAGE, "$1")

        Storage.cleanUp(meta.storage)
        if (!fs.existsSync(Storage.DIRECTORY))
            fs.mkdirSync(Storage.DIRECTORY, {recursive:true, mode:0o755})
        let storage = new Storage(meta)

        if (storage.exists()) {
            storage.open(meta.exclusive)
            // Safe is safe, if not the default 'data' is used,
            // the name of the root element must be known.
            // Otherwise the request is quit with status 404 and terminated.
            if ((meta.root ? meta.root : "data") !== storage.xml.documentElement.nodeName)
                storage.exit(404, "Resource Not Found")
        }
        return storage
    }
}

class ServerFactory {

    static get CONNECTION_ADDRESS() {
        return XMEX_CONNECTION_ADDRESS
    }
    static get CONNECTION_PORT() {
        return XMEX_CONNECTION_PORT
    }
    static get CONNECTION_CONTEXT() {
        return XMEX_CONNECTION_CONTEXT
    }
    static get CONNECTION_CERTIFICATE() {
        return XMEX_CONNECTION_CERTIFICATE
    }
    static get CONNECTION_SECRET() {
        return XMEX_CONNECTION_SECRET
    }

    static get ACME_CHALLENGE() {
        return XMEX_ACME_CHALLENGE
    }
    static get ACME_TOKEN() {
        return XMEX_ACME_TOKEN
    }
    static get ACME_REDIRECT() {
        return XMEX_ACME_REDIRECT
    }

    static get STORAGE_SPACE() {
        return XMEX_STORAGE_SPACE
    }

    static get CONTENT_DIRECTORY() {
        return XMEX_CONTENT_DIRECTORY
    }
    static get CONTENT_DEFAULT() {
        return XMEX_CONTENT_DEFAULT
    }
    static get CONTENT_REDIRECT() {
        return XMEX_CONTENT_REDIRECT
    }

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
            if (state.size || 0 > 0)
                response.setHeader("Content-Length", state.size || 0)
            response.writeHead(200, "Success"/*, headers*/)
            const buffer = Buffer.alloc(65535)
            for (let size = 0; size = fs.readSync(file, buffer) > 0;)
                response.write(buffer.toString("binary"), "binary")
            response.end()
        } finally {
            fs.closeSync(file)
        }
        throw http.ServerResponse.prototype.exit
    }

    static onServiceRequest(request, response) {

        // Request method is determined
        let method = request.method.toUpperCase()

        // Access-Control headers are received during preflight OPTIONS request
        if (method.toUpperCase() === "OPTIONS"
                && request.headers.origin
                && !request.headers.storage)
            response.exit(204, "No Content")

        if (Object.exists(request.headers.storage))
            response.exit(400, "Bad Request", {Message: "Missing storage identifier"})
        let storage = request.headers.storage;
        if (!storage.match(Storage.PATTERN_HEADER_STORAGE))
            response.exit(400, "Bad Request", {Message: "Invalid storage identifier"})

        // The XPath is determined from REQUEST_URI.
        // The XPath starts directly after the context path. To improve visual
        // recognition, the context path should always end with a symbol.
        let xpath = request.url.substring(context.length)
        if (xpath.match(Storage.PATTERN_HEX))
            xpath = String.fromCharCode(parseInt(xpath.substring(1), 16)).trim()
        else if (xpath.match(Storage.PATTERN_BASE64))
            xpath = Buffer.from(xpath.substring(1), "base64").toString("ascii").trim()
        else xpath = decodeURIComponent(xpath).trim()

        // As an alternative to CONNECT, PUT without a path can be used. CONNECT
        // is not supported by XMLHttpRequest, for example. That is why there
        // are three variants. Because PUT without XPath is always valid.
        if (method == "PUT"
                && xpath.length <= 0)
            method = "CONNECT";

        // With the exception of CONNECT, OPTIONS and POST, all requests expect
        // an XPath or XPath function. CONNECT does not use an (X)Path to
        // establish a storage. POST uses the XPath for transformation only
        // optionally to delimit the XML data for the transformation and works
        // also without. In the other cases an empty XPath is replaced by the
        // root slash.
        if (xpath === ""
                && !["CONNECT", "OPTIONS", "POST"].includes(method))
            xpath = "/"
        let options = Storage.STORAGE_SHARE_NONE
        if (["CONNECT", "DELETE", "PATCH", "PUT"].includes(method))
            options |= Storage.STORAGE_SHARE_EXCLUSIVE
        if (["CONNECT"].includes(method))
            options |= Storage.STORAGE_SHARE_INITIAL
        storage = Storage.share(storage, xpath, options)

        try {
            switch (method) {
                case "OPTIONS":
                    storage.doOptions()
                case "GET":
                    storage.doGet()
                case "POST":
                    storage.doPost()
                case "PUT":
                    storage.doPut()
                case "PATCH":
                    storage.doPatch()
                case "DELETE":
                    storage.doDelete()
                default:
                    storage.exit(405, "Method Not Allowed", {Allow: "CONNECT, OPTIONS, GET, POST, PUT, PATCH, DELETE"})
            }
        } finally {
            storage.close()
        }
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
                // TODO:
                let context = !String.isEmpty(ServerFactory.CONNECTION_CONTEXT) ? ServerFactory.CONNECTION_CONTEXT : ""
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
                    request.timing = Date.now()
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

                    ServerFactory.onServiceRequest(request, response)

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

// Version number and year are set later in the build process.
// Source of knowledge is CHANGES, where else can you find such info ;-)
// CHANGES is the basis for builds, releases and README.md
console.log("Seanox XML-Micro-Exchange [Version 0.0.0 00000000]")
console.log("Copyright (C) 0000 Seanox Software Solutions")

ServerFactory.bind()
