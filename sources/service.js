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
import XPath from "xpath";

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
const XMEX_STORAGE_EXPIRATION = Date.parseDuration(Runtime.getEnv("XMEX_STORAGE_EXPIRATION", "900s")) *1000
const XMEX_STORAGE_QUANTITY = Runtime.getEnv("XMEX_STORAGE_QUANTITY", "65535")
const XMEX_STORAGE_REVISION_TYPE = Runtime.getEnv("XMEX_STORAGE_REVISION_TYPE", "timestamp")

const XMEX_LOGGING_OUTPUT = Runtime.getEnv("XMEX_LOGGING_OUTPUT", "%X ...")
const XMEX_LOGGING_ERROR = Runtime.getEnv("XMEX_LOGGING_ERROR", "%X ...")
const XMEX_LOGGING_ACCESS = Runtime.getEnv("XMEX_LOGGING_ACCESS", "off")

// TODO synchronize with php (quit + exit in the one function)
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
    throw http.ServerResponse.prototype.exit
}

Date.parseDuration = function(text) {
    if (String.isEmpty(text))
        throw "Date parser error: Invalid value"
    let match = String(text).toLowerCase().match(/^\s*([\d\.\,]+)\s*(ms|s|m|h?)\s*$/i)
    if (!match || match.length < 3 || Number.isNaN(match[1]))
        throw `Date parser error: Invalid value ${String(text).trim()}`
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
        throw `Number parser error: Invalid value ${String(text).trim()}`
    let number = Number.parseFloat(match[1])
    let factor = ("kmg").indexOf(match[2]) +1
    return number *Math.pow(1024, factor)
}

// Query if something exists, it minimizes the check of undefined and null
Object.exists = function(object) {
    return object !== undefined
        && object !== null
}

String.isEmpty = function(string) {
    return !Object.exists(string)
        || string.trim() === ""
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

        let options = []
        const matches = (xpath || "").match(Storage.PATTERN_XPATH_OPTIONS)
        if (matches) {
            xpath = matches[1]
            options = matches[2].toLowerCase().split("!").filter(Boolean)
        }

        if (!String.isEmpty(storage))
            root = root ? root: "data"
        else root = null
        let store = null
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

        let initial = (options & Storage.STORAGE_SHARE_INITIAL) == Storage.STORAGE_SHARE_INITIAL
        if (!initial && !storage.exists())
            storage.exit(404, "Resource Not Found")
        initial = initial && (!fs.existsSync(storage.store) || fs.lstatSync(storage.store).size <= 0)

        const exclusive = (options & Storage.STORAGE_SHARE_EXCLUSIVE) == Storage.STORAGE_SHARE_EXCLUSIVE
        storage.share = fs.openSync(storage.store, initial ? "as+" : exclusive ? "rs+" : "r")
        const now = Date.now()
        fs.utimesSync(storage.store, now, now)

        if (Storage.REVISION_TYPE === "serial") {
            storage.unique = Date.now().toString(36).toUpperCase()
        } else storage.unique = 1

        if (initial) {
            let files = fs.readdirSync(Storage.DIRECTORY)
                    .filter(file =>
                            fs.lstatSync(`${Storage.DIRECTORY}/${file}`).isFile())
            if (files.length >= Storage.QUANTITY)
                storage.exit(507, "Insufficient Storage")
            fs.writeSync(this.share,
                `<?xml version="1.0" encoding="UTF-8"?>`
                    + `<${storage.root} ___rev="${storage.unique}" ___uid="${storage.getSerial()}"/>`)
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

        // TODO: $storage->xml->preserveWhiteSpace = false
        // TODO: $storage->xml->formatOutput = Storage.DEBUG_MODE

        return storage
    }

    /**
     * CONNECT initiates the use of a storage. A storage is a volatile XML
     * construct that is used via a datasource URL. The datasource managed
     * several independent storages. Each storage has a name specified by the
     * client, which must be sent with each request. This is similar to the
     * header host for virtual servers. Optionally, the name of the root element
     * can also be defined by the client.
     *
     * Each client can create a new storage at any time. Communication is
     * established when all parties use the same name. There are no rules, only
     * the clients know the rules. A storage expires with all information if it
     * is not used (read/write).
     *
     *     Request:
     * CONNECT / HTTP/1.0
     * Storage: 0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ (identifier)
     *
     *     Request:
     * CONNECT / HTTP/1.0
     * Storage: 0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ root (identifier / root)
     *
     *    Response:
     * HTTP/1.0 201 Created
     * Storage: 0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ
     * Storage-Revision: Revision (number/changes)
     * Storage-Space: Total/Used (bytes)
     * Storage-Last-Modified: Timestamp (RFC822)
     * Storage-Expiration: Timestamp (RFC822)
     * Storage-Expiration-Time: Expiration (milliseconds)
     *
     *     Response:
     * HTTP/1.0 204 No Content
     * Storage: 0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ
     * Storage-Revision: Revision (number/changes)
     * Storage-Space: Total/Used (bytes)
     * Storage-Last-Modified: Timestamp (RFC822)
     * Storage-Expiration: Timestamp (RFC822)
     * Storage-Expiration-Time: Expiration (milliseconds)
     *
     *     Response codes / behavior:
     *         HTTP/1.0 201 Resource Created
     * - Storage was newly created
     *         HTTP/1.0 204 No Content
     * - Storage already exists
     *         HTTP/1.0 400 Bad Request
     * - Storage header is invalid, expects 1 - 64 characters (0-9A-Z_-)
     *         HTTP/1.0 500 Internal Server Error
     * - An unexpected error has occurred
     * - Response header Error contains an unique error number as a reference to
     *   the log file with more details
     *         HTTP/1.0 507 Insufficient Storage
     * - Storage is full
     */
    doConnect() {

        // Cleaning up can run longer and delay the request. It is least
        // disruptive during the connect. Threads were deliberately omitted here
        // to keep the service simple.
        Storage.cleanUp()

        if (!String.isEmpty(this.xpath))
            this.quit(400, "Bad Request", {Message: "Unexpected XPath"})

        let response = [201, "Created"]
        if (this.revision != this.unique)
            response = [204, "No Content"]

        this.materialize()
        this.quit(response[0], response[1], {"Allow": "CONNECT, OPTIONS, GET, POST, PUT, PATCH, DELETE"})
    }

    /**
     * OPTIONS is used to query the allowed HTTP methods for an XPath, which is
     * responded with the header Allow. This method distinguishes between XPath
     * function and XPath axis and for an XPath axis the target exists or not
     * and uses different Allow headers accordingly.
     *
     * Overview of header Allow
     * - XPath function: CONNECT, OPTIONS, GET, POST
     * - XPath axis without target: CONNECT, OPTIONS, PUT
     * - XPath axis with target: CONNECT, OPTIONS, GET, POST, PUT, PATCH, DELETE
     *
     * The method always executes a transmitted XPath, but does not return the
     * result directly, but reflects the result via different header Allow. The
     * status 404 is not used in relation to the XPath, but only in relation to
     * the storage file. The XPath processing is strict and does not accept
     * unnecessary spaces. Faulty XPath will cause the status 400.
     *
     *     Request:
     * OPTIONS /<xpath> HTTP/1.0
     * Storage: 0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ (identifier)
     *
     *     Response:
     * HTTP/1.0 204 No Content
     * Storage: 0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ
     * Storage-Revision: Revision (number/changes)
     * Storage-Space: Total/Used (bytes)
     * Storage-Last-Modified: Timestamp (RFC822)
     * Storage-Expiration: Timestamp (RFC822)
     * Storage-Expiration-Time: Expiration (milliseconds)
     *
     *     Response codes / behavior:
     *         HTTP/1.0 204 No Content
     * - Request was successfully executed
     *         HTTP/1.0 400 Bad Request
     * - Storage header is invalid, 1 - 64 characters (0-9A-Z_-) are expected
     * - XPath is missing or malformed
     *         HTTP/1.0 404 Resource Not Found
     * - Storage file does not exist
     *         HTTP/1.0 500 Internal Server Error
     * - An unexpected error has occurred
     * - Response header Error contains an unique error number as a reference to
     *   the log file with more details
     */
    doOptions() {

        let allow = "CONNECT, OPTIONS, GET, POST, PUT, PATCH, DELETE";
        if (!String.isEmpty(this.xpath)) {
            const result = XPath.select(this.xpath, this.xml)
            if (this.xpath.match(Storage.PATTERN_XPATH_FUNCTION)) {
                if (result instanceof Error) {
                    const message = `Invalid XPath function (${result.message})`
                    this.quit(400, "Bad Request", {Message: message})
                }
                allow = "CONNECT, OPTIONS, GET, POST"
            } else {
                if (targets instanceof Error) {
                    const message = `Invalid XPath axis (${targets.message})`
                    this.quit(400, "Bad Request", {Message: message})
                }
                if (!Object.exists(targets)
                        || targets.length <= 0)
                    allow = "CONNECT, OPTIONS, PUT";
            }
        }

        // Without XPath, OPTIONS generally refers to the storage.
        this.quit(204, "No Content", {"Allow": allow})
    }

    /**
     * GET queries data about XPath axes and functions. For this, the XPath axis
     * or function is sent with URI. Depending on whether the request is an
     * XPath axis or an XPath function, different Content-Type are used for the
     * response.
     *
     *     application/xml
     * When the XPath axis addresses one target, the addressed target is the
     * root element of the returned XML structure. If the XPath addresses
     * multiple targets, their XML structure is combined in the root element
     * collection.
     *
     *     text/plain
     * If the XPath addresses only one attribute, the value is returned as plain
     * text. Also the result of XPath functions is returned as plain text.
     * Decimal results use float, booleans the values true and false.
     *
     * The XPath processing is strict and does not accept unnecessary spaces.
     *
     *     Request:
     * GET /<xpath> HTTP/1.0
     * Storage: 0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ (identifier)
     *
     *     Response:
     * HTTP/1.0 200 Success
     * Storage: 0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ
     * Storage-Revision: Revision (number/changes)
     * Storage-Space: Total/Used (bytes)
     * Storage-Last-Modified: Timestamp (RFC822)
     * Storage-Expiration: Timestamp (RFC822)
     * Storage-Expiration-Time: Expiration (milliseconds)
     * Content-Length: (bytes)
     *     Response-Body:
     * The result of the XPath request
     *
     *     Response codes / behavior:
     *         HTTP/1.0 200 Success
     * - Request was successfully executed, target was found in the storage
     *         HTTP/1.0 200 Success
     * - Request was successfully executed, no target was found in the storage
     *         HTTP/1.0 400 Bad Request
     * - Storage header is invalid, 1 - 64 characters (0-9A-Z_-) are expected
     * - XPath is missing or malformed
     *         HTTP/1.0 404 Resource Not Found
     * - Storage file does not exist
     *         HTTP/1.0 500 Internal Server Error
     * - An unexpected error has occurred
     * - Response header Error contains an unique error number as a reference to
     *   the log file with more details
     */
    doGet() {

        // In any case an XPath is required for a valid request.
        if (String.isEmpty(this.xpath))
            this.quit(400, "Bad Request", {Message: "Invalid XPath"})

        let result = XPath.select(this.xpath, this.xml)
        if (result instanceof Error) {
            let message = "Invalid XPath"
            if (this.xpath.match(Storage.PATTERN_XPATH_FUNCTION))
                message = "Invalid XPath function"
            message += `(${result.message})`
            this.quit(400, "Bad Request", {Message: message})
        }
        if (!this.xpath.match(Storage.PATTERN_XPATH_FUNCTION)
                && (!Object.exists(result) || result.length <= 0))
            this.quit(204, "No Content")
        if (Array.isArray(result)) {
            if (result.length === 1) {
                if (result[0].nodeType === XML_DOCUMENT_NODE)
                    result = [result[0].documentElement]
                if (result[0].nodeType === XML_ATTRIBUTE_NODE) {
                    result = result[0].value
                } else {
                    let xml = Storage.XML.createDocument()
                    xml.appendChild(result[0].cloneNode(true))
                    result = xml
                }
            } else if (result.length > 0) {
                let xml = Storage.XML.createDocument()
                let collection = xml.createElement("collection")
                result.forEach((entry) => {
                    if (entry.nodeType === XML_ATTRIBUTE_NODE) {
                        let text = xml.createTextNode(entry.nodeValue)
                        entry = xml.createElement(entry.nodeName)
                        entry.appendChild(text)
                    }
                    collection.appendChild(entry.cloneNode(true))
                })
                xml.appendChild(collection)
                result = xml
            } else result = ""
        } else if (typeof result === "boolean")
            result = result ? "true" : "false"

        this.quit(200, "Success", null, result)
    }

    /**
     * DELETE deletes elements and attributes in the storage. The position for
     * deletion is defined via an XPath. XPath uses different notations for
     * elements and attributes.
     *
     * The notation for attributes use the following structure at the end.
     *
     *     <xpath>/@<attribute> or <xpath>/attribute::<attribute>
     *
     * If the XPath notation does not match the attributes, elements are
     * assumed. For elements, the notation for pseudo elements is supported.
     *
     *     <xpath>::first, <xpath>::last, <xpath>::before or <xpath>::after
     *
     * Pseudo elements are a relative position specification to the selected
     * element.
     *
     * The DELETE method works resolutely and deletes existing data. The XPath
     * processing is strict and does not accept unnecessary spaces. The
     * attributes ___rev / ___uid used internally by the storage are read-only
     * and cannot be deleted.
     *
     * DELETE requests are usually responded with status 204. Changes at the
     * storage are indicated by the two-part response header Storage-Revision.
     * If the DELETE request has no effect on the storage, it is responded with
     * status 304. Status 404 is used only with relation to the storage file.
     *
     * Syntactic and semantic errors in the request and/or XPath can cause error
     * status 400.
     *
     *     Request:
     * DELETE /<xpath> HTTP/1.0
     * Storage: 0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ (identifier)
     *
     *     Response:
     * HTTP/1.0 204 No Content
     * Storage: 0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ
     * Storage-Revision: Revision (number/changes)
     * Storage-Space: Total/Used (bytes)
     * Storage-Last-Modified: Timestamp (RFC822)
     * Storage-Expiration: Timestamp (RFC822)
     * Storage-Expiration-Time: Expiration (milliseconds)
     *
     *     Response codes / behavior:
     *         HTTP/1.0 204 No Content
     * - Element(s) or attribute(s) successfully deleted
     *         HTTP/1.0 400 Bad Request
     * - Storage header is invalid, 1 - 64 characters (0-9A-Z_-) are expected
     * - XPath is missing or malformed
     *         HTTP/1.0 304 Not Modified
     * - XPath without addressing a target has no effect on the storage
     *         HTTP/1.0 404 Resource Not Found
     * - Storage file does not exist
     *         HTTP/1.0 500 Internal Server Error
     * - An unexpected error has occurred
     * - Response header Error contains an unique error number as a reference to
     *   the log file with more details
     */
    doDelete() {

        // In any case an XPath is required for a valid request.
        if (String.isEmpty(this.xpath))
            this.quit(400, "Bad Request", {Message: "Invalid XPath"})

        if (this.xpath.match(Storage.PATTERN_XPATH_FUNCTION)) {
            const message = "Invalid XPath (Functions are not supported)"
            this.quit(400, "Bad Request", {Message: message})
        }

        let xpath = this.xpath
        let pseudo = false
        if (!this.xpath.match(Storage.PATTERN_XPATH_ATTRIBUTE)) {
            // An XPath for element(s) is then expected here.
            // If this is not the case, the request is responded with status 400.
            let matches = this.xpath.match(Storage.PATTERN_XPATH_PSEUDO)
            if (!matches)
                this.quit(400, "Bad Request", {Message: "Invalid XPath axis"})
            xpath = matches[1]
            pseudo = (matches[2] || "").toLowerCase()
        }

        let targets = XPath.select(xpath, this.xml)
        if (targets instanceof Error) {
            const message = "Invalid XPath axis (" + targets.message + ")"
            this.quit(400, "Bad Request", {Message: message})
        }

        if (!Object.exists(targets)
                || targets.length <= 0)
            this.quit(304, "Not Modified")

        // Pseudo elements can be used to delete in an XML substructure relative
        // to the selected element.
        if (!String.isEmpty(pseudo)) {
            if (pseudo === "before") {
                const childs = []
                targets.forEach((target) => {
                    if (!target.previousSibling)
                        return
                    for (let previous = target.previousSibling; previous; previous = previous.previousSibling)
                        childs.push(previous)
                })
                targets = childs
            } else if (pseudo === "after") {
                const childs = []
                targets.forEach((target) => {
                    if (!target.nextSibling)
                        return
                    for (let next = target.nextSibling; next; next = next.nextSibling)
                        childs.push(next)
                })
                targets = childs
            } else if (pseudo === "first") {
                targets = targets.map(target => target.firstChild)
                targets = targets.filter(Object.exists)
            } else if (pseudo === "last") {
                targets = targets.map(target => target.lastChild)
                targets = targets.filter(Object.exists)
            } else this.quit(400, "Bad Request", {Message: "Invalid XPath axis (Unsupported pseudo syntax found)"})
        }

        targets.forEach((target) => {
            if (target.nodeType === XML_ATTRIBUTE_NODE) {
                if (!target.ownerElement
                        || target.ownerElement.nodeType !== XML_ELEMENT_NODE
                        || ["___rev", "___uid"].includes(target.name))
                    return
                const parent = target.ownerElement
                parent.removeAttribute(target.name)
                this.serial++
                Storage.updateNodeRevision(parent, this.unique)
            } else if (target.nodeType !== XML_DOCUMENT_NODE) {
                if (!Object.exists(target.parentNode)
                        || ![XML_ELEMENT_NODE, XML_DOCUMENT_NODE].includes(target.parentNode.nodeType))
                    return
                parent = target.parentNode
                parent.removeChild(target)
                this.serial++
                if (parent.nodeType === XML_DOCUMENT_NODE) {
                    // Special case, if the root element is deleted, then the
                    // newly created root element should have the serial (the
                    // same change number).
                    this.serial--
                    target = this.xml.createElement(this.root)
                    target = this.xml.appendChild(target)
                    Storage.updateNodeRevision(target, this.unique)
                    target.setAttribute("___uid", serial)
                } else Storage.updateNodeRevision(parent, this.unique)
            }
        })

        if (this.serial <= 0)
            this.quit(304, "Not Modified")

        this.materialize()
        this.quit(204, "No Content")
    }

    /** Cleans up all files that have exceeded the maximum idle time. */
    static cleanUp() {

        if (!fs.existsSync(Storage.DIRECTORY)
                || !fs.lstatSync(Storage.DIRECTORY).isDirectory())
            return

        // To reduce the execution time of the requests, the cleanup is only
        // carried out every minute. Parallel cleanup due to parallel requests
        // cannot be excluded, but this should not be a problem.
        const marker = `${Storage.DIRECTORY}/cleanup`
        if (fs.existsSync(marker)
                && (Date.now() -fs.statSync(marker).mtime.getTime() < 60 *1000))
            return
        fs.writeFileSync(marker, '')

        const expiration = Date.now() -Storage.EXPIRATION
        const files = fs.readdirSync(Storage.DIRECTORY)
        files.forEach((entry) => {
            if ([".", "..", "cleanup"].includes(entry))
                return
            try {
                entry = `${Storage.DIRECTORY}/${entry}`
                if (fs.existsSync(entry)
                        && (fs.statSync(entry).mtimeMs < expiration))
                    fs.unlinkSync(entry)
            } catch (error) {
            }
        })
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
        target = `${ServerFactory.CONTENT_DIRECTORY}/${target}`
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
                            && fs.existsSync(`${target}/${files[0]}`)
                            && fs.lstatSync(`${target}/${files[0]}`).isFile())
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
        let storage = request.headers.storage
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
            method = "CONNECT"

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
                case "CONNECT":
                    storage.doConnect()
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
                    console.error("Service", `#${unique}`, error)
                    if (!response.headersSent)
                        response.quit(500, "Internal Server Error", {"Error": `#${unique}`})
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
                    console.error("Service", `#${unique}`, error)
                    if (!response.headersSent)
                        response.quit(500, "Internal Server Error", {"Error": `#${unique}`})
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
