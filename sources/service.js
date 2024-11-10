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
import child from "child_process"
import fs from "fs"
import http from "http"
import https from "https"
import path from "path"

import Codec from "he"
import {EOL} from "os"
import {DOMParser} from "xmldom"
import {DOMImplementation} from "xmldom"
import Mime from "mime/lite"
import {XMLSerializer} from "xmldom"
import XPath from "xpath"

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

// A different XMLSerializer is used because the &gt; is not encoded correctly
// in the XMLSerializer of xmldom.

const XML_ELEMENT_NODE                = 1
const XML_ATTRIBUTE_NODE              = 2
const XML_TEXT_NODE                   = 3
const XML_CDATA_SECTION_NODE          = 4
const XML_ENTITY_REFERENCE_NODE       = 5
const XML_ENTITY_NODE                 = 6
const XML_PROCESSING_INSTRUCTION_NODE = 7
const XML_COMMENT_NODE                = 8
const XML_DOCUMENT_NODE               = 9
const XML_DOCUMENT_TYPE_NODE          = 10
const XML_DOCUMENT_FRAGMENT_NODE      = 11
const XML_NOTATION_NODE               = 12

/** Constants of used content types */
const CONTENT_TYPE_TEXT  = "text/plain"
const CONTENT_TYPE_XPATH = "text/xpath"
const CONTENT_TYPE_HTML  = "text/html"
const CONTENT_TYPE_XML   = "application/xml"
const CONTENT_TYPE_XSLT  = "application/xslt+xml"
const CONTENT_TYPE_JSON  = "application/json"

/**
 * Pattern for the Storage header
 *     Group 0. Full match
 *     Group 1. Storage
 *     Group 2. Name of the root element (optional)
 */
const PATTERN_HEADER_STORAGE = /^(\w(?:[-\w]{0,62}\w)?)(?:\s+(\w{1,64}))?$/

/**
 * Pattern to determine options (optional directives) at the end of XPath
 *     Group 0. Full match
 *     Group 1. XPath
 *     Group 2. options (optional)
 */
const PATTERN_XPATH_OPTIONS = /^(.*?)((?:!+\w+){0,})$/

/** Pattern for detecting Base64 decoding */
const PATTERN_BASE64 = /^\?(?:[A-Za-z0-9+\/]{4})*(?:[A-Za-z0-9+\/]{2}==|[A-Za-z0-9+\/]{3}=)?$/

/** Pattern for detecting HEX decoding */
const PATTERN_HEX = /^\?([A-Fa-f0-9]{2})+$/

/** Pattern for recognizing non-numerical values */
const PATTERN_NON_NUMERICAL = /^.*\D/

/**
 * Pattern to determine the structure of XPath axis expressions for attributes
 *     Group 0. Full match
 *     Group 1. XPath axis
 *     Group 2. Attribute
 */
const PATTERN_XPATH_ATTRIBUTE = /((?:^\/+)|(?:^.*?))\/{0,}(?<=\/)(?:@|attribute::)(\w+)$/i

/**
 * Pattern to determine the structure of XPath axis expressions for pseudo elements
 *     Group 0. Full match
 *     Group 1. XPath axis
 *     Group 2. Attribute
 */
const PATTERN_XPATH_PSEUDO = /^(.*?)(?:::(before|after|first|last)){0,1}$/i

/**
 * Pattern as indicator for XPath functions
 * Assumption for interpretation: Slash and dot are indications of an axis
 * notation, the round brackets can be ignored, the question remains, if the
 * XPath starts with an axis symbol, then it is an axis, with other
 * characters at the beginning must be a function.
 */
const PATTERN_XPATH_FUNCTION = /^[\(\s]*[^\/\.\s\(].*$/

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

class XML {

    static get VERSION() {
        return "1.0"
    }

    static get ENCODING() {
        return "UTF-8"
    }

    static createDeclaration() {
        return `<?xml version=\"${XML.VERSION}\" encoding=\"${XML.ENCODING}\"?>`
    }

    static createDocument() {
        return new DOMParser().parseFromString(XML.createDeclaration())
    }
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
     * Constructor creates a new Storage object.
     * @param request  request
     * @param response response
     * @param string   storage
     * @param string   root
     * @param string   xpath
     */
    constructor(request = null, response = null, storage = null, root = null, xpath = null) {

        this.request  = request
        this.response = response

        // The storage identifier is case-sensitive.
        // To ensure that this also works with Windows, Base64 encoding is used.

        let options = []
        const matches = (xpath || "").match(PATTERN_XPATH_OPTIONS)
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
     * param  request  request
     * param  response response
     * param  string   storage
     * param  string   xpath
     * param  number   options
     * return Storage  Instance of the Storage
     */
    static share(request, response, storage, xpath, options = Storage.STORAGE_SHARE_NONE) {

        const root = storage.replace(PATTERN_HEADER_STORAGE, "$2")
        storage = storage.replace(PATTERN_HEADER_STORAGE, "$1")

        if (!fs.existsSync(Storage.DIRECTORY))
            fs.mkdirSync(Storage.DIRECTORY, {recursive:true, mode:0o755})
        storage = new Storage(request, response, storage, root, xpath)

        // The cleanup does not run permanently, so the possible expiry is
        // checked before access and the storage is deleted if necessary.
        let expiration = Date.now() -Storage.EXPIRATION
        if (fs.existsSync(storage.store))
            if (fs.lstatSync(storage.store).mtimeMs < expiration)
                fs.unlinkSync(storage.store)

        let initial = (options & Storage.STORAGE_SHARE_INITIAL) === Storage.STORAGE_SHARE_INITIAL
        if (!initial && !storage.exists())
            storage.quit(404, "Resource Not Found")
        initial = initial && (!fs.existsSync(storage.store) || fs.lstatSync(storage.store).size <= 0)

        const exclusive = (options & Storage.STORAGE_SHARE_EXCLUSIVE) === Storage.STORAGE_SHARE_EXCLUSIVE
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
                storage.quit(507, "Insufficient Storage")
            fs.writeSync(storage.share,
                `<?xml version="1.0" encoding="UTF-8"?>`
                    + `<${storage.root} ___rev="${storage.unique}" ___uid="${storage.getSerial()}"/>`)
            if (Storage.REVISION_TYPE === "serial")
                storage.unique = 0
        }

        const buffer = Buffer.alloc(fs.lstatSync(storage.store).size)
        fs.readSync(storage.share, buffer, {position:0})
        storage.xml = new DOMParser().parseFromString(buffer.toString(), CONTENT_TYPE_XML)
        storage.revision = storage.xml.documentElement.getAttributeNumber("___rev")
        if (Storage.REVISION_TYPE === "serial") {
            if (storage.revision.match(PATTERN_NON_NUMERICAL))
                storage.quit(503, "Resource revision conflict")
            storage.unique += storage.revision
        }

        // TODO: $storage->xml->preserveWhiteSpace = false
        // TODO: $storage->xml->formatOutput = Storage.DEBUG_MODE

        return storage
    }

    /**
     * Creates a unique incremental ID.
     * @return string unique incremental ID
     */
    getSerial() {
        return this.unique + ":" + (++this.serial)
    }

    /**
     * Updates recursive the revision for an element and all parent elements.
     * @param {Element} node
     * @param {string}  revision
     */
    static updateNodeRevision(node, revision) {
        while (node && node.nodeType === XML_ELEMENT_NODE) {
            node.setAttribute("___rev", revision)
            node = node.parentNode
        }
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
     *         HTTP/1.0 304 Not Modified
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
        if (this.revision !== this.unique)
            response = [304, "Not Modified"]

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

        let allow = "CONNECT, OPTIONS, GET, POST, PUT, PATCH, DELETE"
        if (!String.isEmpty(this.xpath)) {
            const result = XPath.select(this.xpath, this.xml)
            if (this.xpath.match(PATTERN_XPATH_FUNCTION)) {
                if (result instanceof Error) {
                    const message = `Invalid XPath function (${result.message})`
                    this.quit(400, "Bad Request", {Message: message})
                }
                allow = "CONNECT, OPTIONS, GET, POST"
            } else {
                if (result instanceof Error) {
                    const message = `Invalid XPath axis (${result.message})`
                    this.quit(400, "Bad Request", {Message: message})
                }
                if (!Object.exists(result)
                        || result.length <= 0)
                    allow = "CONNECT, OPTIONS, PUT"
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
            if (this.xpath.match(PATTERN_XPATH_FUNCTION))
                message = "Invalid XPath function"
            message += `(${result.message})`
            this.quit(400, "Bad Request", {Message: message})
        }
        if (!this.xpath.match(PATTERN_XPATH_FUNCTION)
                && (!Object.exists(result) || result.length <= 0))
            this.quit(204, "No Content")
        if (Array.isArray(result)) {
            if (result.length === 1) {
                if (result[0].nodeType === XML_DOCUMENT_NODE)
                    result = [result[0].documentElement]
                if (result[0].nodeType === XML_ATTRIBUTE_NODE) {
                    result = result[0].value
                } else {
                    let xml = XML.createDocument()
                    xml.appendChild(result[0].cloneNode(true))
                    result = xml
                }
            } else if (result.length > 0) {
                let xml = XML.createDocument()
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
     * PUT creates elements and attributes in storage and/or changes the value
     * of existing ones. The position for the insert is defined via an XPath.
     * For better understanding, the method should be called PUT INTO, because
     * it is always based on an existing XPath axis as the parent target. XPath
     * uses different notations for elements and attributes.
     *
     * The notation for attributes use the following structure at the end.
     *
     *     <xpath>/@<attribute> or <xpath>/attribute::<attribute>
     *
     * The attribute values can be static (text) and dynamic (XPath function).
     * Values are send as request-body. Whether they are used as text or XPath
     * function is decided by the Content-Type header of the request:
     *
     *     text/plain: static text
     *     text/xpath: XPath function
     *
     * If the XPath notation does not match the attributes, elements are
     * assumed. For elements, the notation for pseudo elements is supported.
     *
     *     <xpath>::first, <xpath>::last, <xpath>::before or <xpath>::after
     *
     * Pseudo elements are a relative position specification to the selected
     * element.
     *
     * The value of elements can be static (text), dynamic (XPath function) or
     * be an XML structure. Also here the value is send with the request-body
     * and the type of processing is determined by the Content-Type:
     *
     *     text/plain: static text
     *     text/xpath: XPath function
     *     application/xml: XML structure
     *
     * The PUT method works resolutely and inserts or overwrites existing data.
     * The XPath processing is strict and does not accept unnecessary spaces.
     * The attributes ___rev / ___uid used internally by the storage are
     * read-only and cannot be changed.
     *
     * PUT requests are usually responded with status 204. Changes at the
     * storage are indicated by the two-part response header Storage-Revision.
     * If the PUT request has no effect on the storage, it is responded with
     * status 304. Status 404 is used only with relation to the storage file.
     *
     * Syntactic and semantic errors in the request and/or XPath and/or value
     * can cause error status 400 and 415. If errors occur due to the
     * transmitted request body, this causes status 422.
     *
     *     Request:
     * PUT /<xpath> HTTP/1.0
     * Storage: 0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ (identifier)
     * Content-Length: (bytes)
     * Content-Type: application/xml
     *     Request-Body:
     * XML structure
     *
     *     Request:
     * PUT /<xpath> HTTP/1.0
     * Storage: 0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ (identifier)
     * Content-Length: (bytes)
     *  Content-Type: text/plain
     *     Request-Body:
     * Value as plain text
     *
     *     Request:
     * PUT /<xpath> HTTP/1.0
     * Storage: 0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ (identifier)
     * Content-Length: (bytes)
     * Content-Type: text/xpath
     *     Request-Body:
     * Value as XPath function
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
     * - Element(s) or attribute(s) successfully created or set
     *         HTTP/1.0 304 Not Modified
     *  - XPath without addressing a target has no effect on the storage
     *         HTTP/1.0 400 Bad Request
     * - Storage header is invalid, 1 - 64 characters (0-9A-Z_-) are expected
     * - XPath is missing or malformed
     *         HTTP/1.0 404 Resource Not Found
     * - Storage file does not exist
     *         HTTP/1.0 413 Payload Too Large
     * - Allowed size of the request(-body) and/or storage is exceeded
     *         HTTP/1.0 415 Unsupported Media Type
     * - Attribute request without Content-Type text/plain
     *         HTTP/1.0 422 Unprocessable Entity
     * - Data in the request body cannot be processed
     *         HTTP/1.0 500 Internal Server Error
     * - An unexpected error has occurred
     * - Response header Error contains an unique error number as a reference to
     *   the log file with more details
     */
    doPut() {

        // In any case an XPath is required for a valid request.
        if (String.isEmpty(this.xpath))
            this.quit(400, "Bad Request", {Message: "Invalid XPath"})

        // Storage::SPACE also limits the maximum size of writing request(-body).
        // If the limit is exceeded, the request is quit with status 413.
        if (this.request.data.length > Storage.SPACE)
            this.quit(413, "Payload Too Large")

        // For all PUT requests the Content-Type is needed, because for putting
        // in XML structures and text is distinguished.
        if (String.isEmpty(this.request.headers["content-type"]))
            this.quit(415, "Unsupported Media Type")

        if (this.xpath.match(PATTERN_XPATH_FUNCTION)) {
            const message = "Invalid XPath (Functions are not supported)"
            this.quit(400, "Bad Request", {Message: message})
        }

        // PUT requests can address attributes and elements via XPath.
        // Multi-axis XPaths allow multiple targets. The method only supports
        // these two possibilities, other requests are responded with an error,
        // because this situation cannot occur because the XPath is recognized
        // as XPath for an attribute and otherwise an element is assumed. In
        // this case it can only happen that the XPath does not address target,
        // which is not an error in the true sense. Therefore there is only one
        // decision here.

        // XPath can address elements and attributes. If the XPath ends with
        // /attribute::<attribute> or /@<attribute> an attribute is expected,
        // in all other cases an element.

        let matches = this.xpath.match(PATTERN_XPATH_ATTRIBUTE)
        if (matches) {

            // The following Content-Type is supported for attributes:
            // - text/plain for static values (text)
            // - text/xpath for dynamic values, based on XPath functions

            // For attributes only the Content-Type text/plain and text/xpath
            // are supported, for other Content-Types no conversion exists.
            const media = (this.request.headers["content-type"] || "").toLowerCase()
            if (![CONTENT_TYPE_TEXT, CONTENT_TYPE_XPATH].includes(media))
                this.quit(415, "Unsupported Media Type")

            let input = this.request.data

            // The Content-Type text/xpath is a special of the XMEX Storage. It
            // expects a plain text which is an XPath function. The XPath
            // function is first once applied to the current XML document from
            // the storage and the result is put like the Content-Type
            // text/plain. Even if the target is mutable, the XPath function is
            // executed only once and the result is put on all targets.
            if (media === CONTENT_TYPE_XPATH) {
                if (!input.match(PATTERN_XPATH_FUNCTION)) {
                    const message = "Invalid XPath (Axes are not supported)"
                    this.quit(422, "Unprocessable Entity", {Message: message})
                }
                input = XPath.select(input, this.xml)
                if (!Object.exists(input)
                        || input instanceof Error) {
                    let message = "Invalid XPath function"
                    if (input instanceof Error)
                        message += ` (${input.message})`
                    this.quit(422, "Unprocessable Entity", {Message: message})
                }
            }

            // From here on it continues with a static value for the attribute.

            const xpath = matches[1]
            const attribute = matches[2]

            const targets = XPath.select(xpath, this.xml)
            if (targets instanceof Error) {
                const message = `Invalid XPath axis (${targets.message})`
                this.quit(400, "Bad Request", {Message: message})
            }
            if (!Object.exists(targets)
                    || targets.length <= 0)
                this.quit(304, "Not Modified")

            // The attributes ___rev and ___uid are essential for the internal
            // organization and management of the data and cannot be changed.
            // PUT requests for these attributes are ignored and behave as if no
            // matching node was found. It should say request understood and
            // executed but without effect.
            if (!["___rev", "___uid"].includes(attribute)) {
                targets.forEach((target) => {
                    // Only elements are supported, this prevents the addressing
                    // of the XML document by the XPath.
                    if (target.nodeType !== XML_ELEMENT_NODE)
                        return
                    target.setAttribute(attribute, input)
                    this.serial++
                    // The revision is updated at the parent nodes, so you can
                    // later determine which nodes have changed and with which
                    // revision. Partial access allows the client to check if
                    // the data or a tree is still up to date, because he can
                    // compare the revision.
                    Storage.updateNodeRevision(target, this.unique)
                })
            }

            if (this.serial <= 0)
                this.quit(304, "Not Modified")

            this.materialize()
            this.quit(204, "No Content")
        }

        // An XPath for element(s) is then expected here.
        // If this is not the case, the request is responded with status 400.
        matches = this.xpath.match(PATTERN_XPATH_PSEUDO)
        if (!matches)
            this.quit(400, "Bad Request", {Message: "Invalid XPath axis"})

        let xpath = matches[1]
        let pseudo = (matches[2] || "").toLowerCase()

        // The following Content-Type is supported for elements:
        // - application/xml for XML structures
        // - text/plain for static values (text)
        // - text/xpath for dynamic values, based on XPath functions

        const media = (this.request.headers["content-type"] || "").toLowerCase()
        if ([CONTENT_TYPE_TEXT, CONTENT_TYPE_XPATH].includes(media)) {

            // The combination with a pseudo element is not possible for a text
            // value. Response with status 415 (Unsupported Media Type).
            if (String.isEmpty(pseudo))
                this.quit(415, "Unsupported Media Type")

            let input = this.request.data

            // The Content-Type text/xpath is a special of the XMEX Storage. It
            // expects a plain text which is an XPath function. The XPath
            // function is first once applied to the current XML document from
            // the storage and the result is put like the Content-Type
            // text/plain. Even if the target is mutable, the XPath function is
            // executed only once and the result is put on all targets.
            if (media === CONTENT_TYPE_XPATH) {
                if (!input.match(PATTERN_XPATH_FUNCTION)) {
                    const message = "Invalid XPath (Axes are not supported)"
                    this.quit(422, "Unprocessable Entity", {Message: message})
                }
                input = XPath.select(input, this.xml)
                if (!Object.exists(input)
                        || input instanceof Error) {
                    let message = "Invalid XPath function"
                    if (input instanceof Error)
                        message += ` (${input.message})`
                    this.quit(422, "Unprocessable Entity", {Message: message})
                }
            }

            const targets = XPath.select(xpath, this.xml)
            if (targets instanceof Error) {
                const message = `Invalid XPath axis (${targets.message})`
                this.quit(400, "Bad Request", {Message: message})
            }
            if (!Object.exists(targets)
                    || targets.length <= 0)
                this.quit(304, "Not Modified")

            targets.forEach((target) => {
                // Overwriting of the root element is not possible, as it is an
                // essential part of the storage, and is ignored. It does not
                // cause to an error, so the behaviour is analogous to putting
                // attributes.
                if (target.nodeType !== XML_ATTRIBUTE_NODE)
                    return
                const replace = target.cloneNode(false)
                replace.appendChild(this.xml.createTextNode(input))
                target.parentNode.replaceChild(this.xml.importNode(replace, true), target)
                // Because text nodes have no attributes, the serial must be
                // increased manually, even if the change is then only partially
                // traceable. But without incrementing the serial, there is no
                // indicator that something has changed in the storage.
                this.serial++
                // The revision is updated at the parent nodes, so you can later
                // determine which nodes have changed and with which revision.
                // Partial access allows the client to check if the data or a
                // tree is still up to date, because he can compare the
                // revision.
                Storage.updateNodeRevision(replace, this.unique)
            })

            if (this.serial <= 0)
                this.quit(304, "Not Modified")

            this.materialize()
            this.quit(204, "No Content")
        }

        // Only an XML structure can be inserted, nothing else is supported. So
        // only the Content-Type application/xml can be used.
        if (media !== CONTENT_TYPE_XML)
            this.quit(415, "Unsupported Media Type")

        // The request body must also be a valid XML structure, otherwise the
        // request is quit with an error.
        let input = this.request.data
        input = `<?xml version="1.0" encoding="UTF-8"?><data>${input}</data>`

        // The XML is loaded, but what happens if an error occurs during
        // parsing? Status 400 or 422 - The decision for 422, because 400 means
        // faulty request. But this is a (semantic) error in the request body.
        const xml = new DOMParser().parseFromString(input, CONTENT_TYPE_XML, true)
        // TODO: $xml->preserveWhiteSpace = false
        // TODO: $xml->formatOutput = Storage::DEBUG_MODE
        if (!Object.exists(xml)
                || input instanceof Error) {
            let message = "Invalid XML document"
            if (input instanceof Error)
                message += ` (${input.message})`
            this.quit(422, "Unprocessable Entity", {Message: message})
        }

        // The attributes ___rev and ___uid are essential for the internal
        // organization and management of the data and cannot be changed. When
        // inserting, the attributes ___rev and ___uid are set automatically.
        // These attributes must not be  contained in the XML structure to be
        // inserted, because all XML elements without ___uid attributes are
        // determined after insertion and it is assumed that they have been
        // newly inserted. This approach was chosen to avoid a recursive
        // search/iteration in the XML structure to be inserted.
        let nodes = XPath.select("//*[@___rev|@___uid]", xml)
        nodes.forEach((node) => {
            node.removeAttribute("___rev")
            node.removeAttribute("___uid")
        })

        if (xml.documentElement.hasChildNodes()) {
            const targets = XPath.select(xpath, this.xml)
            if (targets instanceof Error) {
                let message = "Invalid XPath axis (" + targets.message + ")"
                this.quit(400, "Bad Request", {Message: message})
            }

            if (!Object.exists(targets)
                    || targets.length <= 0)
                this.quit(304, "Not Modified")

            targets.forEach((target) => {

                // Overwriting of the root element is not possible, as it is an
                // essential part of the storage, and is ignored. It does not
                // cause to an error, so the behaviour is analogous to putting
                // attributes.
                if (target.nodeType !== XML_ELEMENT_NODE)
                    return

                const inserts = Array.from(xml.documentElement.childNodes)
                        .map(insert => insert.cloneNode(true))

                // Pseudo elements can be used to put in an XML substructure
                // relative to the selected element.
                if (String.isEmpty(pseudo)) {
                    // A bug in common-xml-features sets the documentElement to
                    // null when using replaceChild. Therefore the quick way:
                    //     clone/add/replace -- is not possible.
                    while (target.lastChild)
                        target.removeChild(target.lastChild)
                    inserts.forEach((insert) => {
                        target.appendChild(insert)
                    })
                } else if (pseudo === "before") {
                    if (target.parentNode.nodeType === XML_ELEMENT_NODE)
                        inserts.forEach((insert) => {
                            target.parentNode.insertBefore(insert, target)
                        })
                } else if (pseudo === "after") {
                    if (target.parentNode.nodeType === XML_ELEMENT_NODE) {
                        const nodes = []
                        inserts.forEach((node) => {
                            nodes.unshift(node)
                        })
                        nodes.forEach((insert) => {
                            if (target.nextSibling)
                                target.parentNode.insertBefore(insert, target.nextSibling)
                            else target.parentNode.appendChild(insert)
                        })
                    }
                } else if (pseudo === "first") {
                    for (let index = inserts.length -1; index >= 0; index--)
                        target.insertBefore(inserts[index].cloneNode(true), target.firstChild)
                } else if (pseudo === "last") {
                    inserts.forEach((insert) => {
                        target.appendChild(insert.cloneNode(true))
                    })
                } else this.quit(400, "Bad Request", {Message: "Invalid XPath axis (Unsupported pseudo syntax found)"})
            })
        }

        // The attribute ___uid of all newly inserted elements is set. It is
        // assumed that all elements without the ___uid attribute are new. The
        // revision of all affected nodes are updated, so you can later
        // determine which nodes have changed and with which revision. Partial
        // access allows the client to check if the data or a tree is still up
        // to date, because he can compare the revision.
        nodes = XPath.select("//*[not(@___uid)]", this.xml)
        nodes.forEach((node) => {
            node.setAttribute("___uid", this.getSerial())
            Storage.updateNodeRevision(node, this.unique)
        })

        if (this.serial <= 0)
            this.quit(304, "Not Modified")

        this.materialize()
        this.quit(204, "No Content")
    }

    /**
     * PATCH changes existing elements and attributes in storage. The position
     * for the insert is defined via an XPath. The method works almost like PUT,
     * but the XPath axis of the request always expects an existing target.
     * XPath uses different notations for elements and attributes.
     *
     * The notation for attributes use the following structure at the end.
     *
     *     <xpath>/@<attribute> or <xpath>/attribute::<attribute>
     *
     * The attribute values can be static (text) and dynamic (XPath function).
     * Values are send as request-body. Whether they are used as text or XPath
     * function is decided by the Content-Type header of the request:
     *
     *     text/plain: static text
     *     text/xpath: XPath function
     *
     * If the XPath notation does not match the attributes, elements are
     * assumed. Unlike the PUT method, no pseudo elements are supported for
     * elements.
     *
     * The value of elements can be static (text), dynamic (XPath function) or
     * be an XML structure. Also here the value is send with the request-body
     * and the type of processing is determined by the Content-Type:
     *
     *     text/plain: static text
     *     text/xpath: XPath function
     *     application/xml: XML structure
     *
     * The PATCH method works resolutely and  overwrites existing data. The
     * XPath processing is strict and does not accept unnecessary spaces. The
     * attributes ___rev / ___uid used internally by the storage are read-only
     * and cannot be changed.
     *
     * PATCH requests are usually responded with status 204. Changes at the
     * storage are indicated by the two-part response header Storage-Revision.
     * If the PATCH request has no effect on the storage, it is responded with
     * status 304. Status 404 is used only with relation to the storage file.
     *
     * Syntactic and semantics errors in the request and/or XPath and/or value
     * can cause error status 400 and 415. If errors occur due to the
     * transmitted request body, this causes status 422.
     *
     *     Request:
     * PATCH /<xpath> HTTP/1.0
     * Storage: 0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ (identifier)
     * Content-Length: (bytes)
     * Content-Type: application/xml
     *     Request-Body:
     * XML structure
     *
     *     Request:
     * PATCH /<xpath> HTTP/1.0
     * Storage: 0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ (identifier)
     * Content-Length: (bytes)
     *  Content-Type: text/plain
     *     Request-Body:
     * Value as plain text
     *
     *     Request:
     * PATCH /<xpath> HTTP/1.0
     * Storage: 0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ (identifier)
     * Content-Length: (bytes)
     * Content-Type: text/xpath
     *     Request-Body:
     * Value as XPath function
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
     * - Element(s) or attribute(s) successfully created or set
     *         HTTP/1.0 304 Not Modified
     * - XPath without addressing a target has no effect on the storage
     *         HTTP/1.0 400 Bad Request
     * - Storage header is invalid, 1 - 64 characters (0-9A-Z_-) are expected
     * - XPath is missing or malformed
     *         HTTP/1.0 404 Resource Not Found
     * - Storage file does not exist
     *         HTTP/1.0 413 Payload Too Large
     * - Allowed size of the request(-body) and/or storage is exceeded
     *         HTTP/1.0 415 Unsupported Media Type
     * - Attribute request without Content-Type text/plain
     *         HTTP/1.0 422 Unprocessable Entity
     * - Data in the request body cannot be processed
     *         HTTP/1.0 500 Internal Server Error
     * - An unexpected error has occurred
     * - Response header Error contains an unique error number as a reference to
     *   the log file with more details
     */
    doPatch() {

        // PATCH is implemented like PUT. There are some additional conditions
        // and restrictions that will be checked. After that the response to the
        // request can be passed to PUT.
        // - Pseudo elements are not supported
        // - Target must exist, particularly for attributes

        // In any case an XPath is required for a valid request.
        if (String.isEmpty(this.xpath))
            this.quit(400, "Bad Request", {Message: "Invalid XPath"})

        // Storage::SPACE also limits the maximum size of writing request(-body).
        // If the limit is exceeded, the request is quit with status 413.
        if (this.request.data.length > Storage.SPACE)
            this.quit(413, "Payload Too Large")

        // For all PUT requests the Content-Type is needed, because for putting
        // in XML structures and text is distinguished.
        if (String.isEmpty(this.request.headers["content-type"]))
            this.quit(415, "Unsupported Media Type")

        if (this.xpath.match(PATTERN_XPATH_FUNCTION)) {
            let message = "Invalid XPath (Functions are not supported)"
            this.quit(400, "Bad Request", {Message: message})
        }

        let targets = XPath.select(this.xpath, this.xml)
        if (targets instanceof Error) {
            let message = `Invalid XPath axis (${targets.message})`
            this.quit(400, "Bad Request", {Message: message})
        }

        if (!Object.exists(targets)
                || targets.length <= 0)
            this.quit(304, "Not Modified")

        // The response to the request is delegated to PUT.
        // The function call is executed and the request is terminated.
        this.doPut()
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

        if (this.xpath.match(PATTERN_XPATH_FUNCTION)) {
            const message = "Invalid XPath (Functions are not supported)"
            this.quit(400, "Bad Request", {Message: message})
        }

        let xpath = this.xpath
        let pseudo = false
        if (!this.xpath.match(PATTERN_XPATH_ATTRIBUTE)) {
            // An XPath for element(s) is then expected here.
            // If this is not the case, the request is responded with status 400.
            let matches = this.xpath.match(PATTERN_XPATH_PSEUDO)
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
                    target.setAttribute("___uid", this.getSerial())
                } else Storage.updateNodeRevision(parent, this.unique)
            }
        })

        if (this.serial <= 0)
            this.quit(304, "Not Modified")

        this.materialize()
        this.quit(204, "No Content")
    }

    /**
     * Materializes the XML document from the memory in the file system. Unlike
     * save, the file is not closed and the data can be modified without another
     * (PHP)process being able to read the data before finalizing it by closing
     * it. Materialization is only executed if there are changes in the XML
     * document, which is determined by the revision of the root element. The
     * size of the storage is limited by Storage::SPACE because it is a volatile
     * micro datasource for short-term data exchange. An overrun causes the
     * status 413.
     */
    materialize() {

        if (!Object.exists(this.share))
            return
        if (this.revision === this.xml.documentElement.getAttributeNumber("___rev")
                && this.revision !== this.unique)
            return

        let output = this.serialize()
        if (output.length > Storage.SPACE)
            this.quit(413, "Payload Too Large")
        fs.ftruncateSync(this.share, 0)
        fs.writeSync(this.share, output)

        if (Storage.DEBUG_MODE) {
            const unique = this.unique.toString().padStart(3, "0")
            const target = this.store.replace(/(\.\w+$)/, `___${unique}$1`)
            fs.writeSync(target, output);
        }
    }

    quit(status, message, headers = undefined, data = undefined) {
        // TODO:
        throw Storage.prototype.quit;
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
            response.quit(204, "No Content", {Allow: "OPTIONS, HEAD, GET"})

        if (ServerFactory.CONTENT_REDIRECT) {
            let location = ServerFactory.CONTENT_REDIRECT
            if (location.match(/\.{3,}$/))
                location = location.replace(/\.{3,}$/, request.url)
            response.quit(301, "Moved Permanently", {Location: location})
        }

        if (!ServerFactory.CONTENT_DIRECTORY)
            response.quit(404, "Resource Not Found")

        let target = path.normalize(decodeURI(request.url.replace(/\?.*$/, "")).trim()).replace(/\\+/g, "/")
        target = `${ServerFactory.CONTENT_DIRECTORY}/${target}`
        target = target.replace(/\/{2,}/g, "/")
        if (!fs.existsSync(target))
            response.quit(404, "Resource Not Found")
        if (!fs.lstatSync(target).isFile()
                && !fs.lstatSync(target).isDirectory())
            response.quit(404, "Resource Not Found")

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
                    response.quit(403, "Forbidden")
                target += files[0]
            } else response.quit(403, "Forbidden")
        }

        if (!["OPTIONS", "HEAD", "GET"].includes(method))
            response.quit(405, "Method Not Allowed", {Allow: "OPTIONS, HEAD, GET"})

        target = fs.realpathSync(target)
        const state = fs.lstatSync(target)
        const headers = {
            "Content-Length": state.size,
            "Content-Type": Mime.getType(target),
            "Last-Modified": new Date(state.mtimeMs).toUTCString()
        }
        if (method === "HEAD")
            response.quit(200, "Success", headers)
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
            response.quit(204, "No Content")

        if (Object.exists(request.headers.storage))
            response.quit(400, "Bad Request", {Message: "Missing storage identifier"})
        let storage = request.headers.storage
        if (!storage.match(PATTERN_HEADER_STORAGE))
            response.quit(400, "Bad Request", {Message: "Invalid storage identifier"})

        // The XPath is determined from REQUEST_URI.
        // The XPath starts directly after the context path. To improve visual
        // recognition, the context path should always end with a symbol.
        let xpath = request.url.substring(context.length)
        if (xpath.match(PATTERN_HEX))
            xpath = String.fromCharCode(parseInt(xpath.substring(1), 16)).trim()
        else if (xpath.match(PATTERN_BASE64))
            xpath = Buffer.from(xpath.substring(1), "base64").toString("ascii").trim()
        else xpath = decodeURIComponent(xpath).trim()

        // As an alternative to CONNECT, PUT without a path can be used. CONNECT
        // is not supported by XMLHttpRequest, for example. That is why there
        // are three variants. Because PUT without XPath is always valid.
        if (method === "PUT"
                && xpath.length <= 0)
            method = "CONNECT"

        // With the exception of CONNECT, OPTIONS and POST, all requests expect
        // an XPath or XPath function. CONNECT does not use an (X)Path to
        // establish a storage. POST uses the XPath for transformation only
        // optionally to delimit the XML data for the transformation and works
        // also without. In the other cases an empty XPath is replaced by the
        // root slash.
        if (String.isEmpty(xpath)
                && !["CONNECT", "OPTIONS", "POST"].includes(method))
            xpath = "/"
        let options = Storage.STORAGE_SHARE_NONE
        if (["CONNECT", "DELETE", "PATCH", "PUT"].includes(method))
            options |= Storage.STORAGE_SHARE_EXCLUSIVE
        if (["CONNECT"].includes(method))
            options |= Storage.STORAGE_SHARE_INITIAL
        storage = Storage.share(request, response, storage, xpath, options)

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
                    storage.quit(405, "Method Not Allowed", {Allow: "CONNECT, OPTIONS, GET, POST, PUT, PATCH, DELETE"})
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
                if (!storage || !storage.match(PATTERN_HEADER_STORAGE))
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
                        response.quit(...request.error)

                    const requestUrl = decodeURI(request.url)
                    if (ServerFactory.ACME_CHALLENGE
                            && ServerFactory.ACME_TOKEN
                            && requestUrl.toLowerCase() === ServerFactory.ACME_CHALLENGE.toLowerCase())
                        response.quit(200, "Success", {"Content-Length": ServerFactory.ACME_TOKEN.length}, ServerFactory.ACME_TOKEN)

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
                        response.quit(200, "Success", {"Content-Length": ServerFactory.ACME_TOKEN.length}, ServerFactory.ACME_TOKEN)
                    if (ServerFactory.ACME_REDIRECT <= 0)
                        response.quit(404, "Resource Not Found")
                    let location = ServerFactory.ACME_REDIRECT
                    if (location.match(/\.{3,}$/))
                        location = location.replace(/\.{3,}$/, request.url)
                    response.quit(301, "Moved Permanently", {Location: location})
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
