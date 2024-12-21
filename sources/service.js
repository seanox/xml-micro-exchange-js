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
import crypto from "crypto"
import fs from "fs"
import http from "http"
import https from "https"
import path from "path"

import {EOL} from "os"
import {DOMParser} from "xmldom"
import {XMLSerializer} from "xmldom"

import Mime from "mime/lite"
import Process from "child_process"
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
 * Optional CORS response headers as associative array.
 * For the preflight OPTIONS the following headers are added automatically:
 *     Access-Control-Allow-Methods, Access-Control-Allow-Headers
 */
const CORS = {
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
const PATTERN_HEADER_STORAGE = /^(\w(?:[-\w]{0,62}\w)?)(?:\s+(\w{1,64}))?$/

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

process.on("uncaughtException", (error) => {
    console.log(error);
    console.error(error.stack || error)
})

process.on("exit", () => {
    console.log("Service", "Stopped")
})

// Some things of the API are adjusted.
// These are only small changes, but they greatly simplify the use.
// Curse and blessing of JavaScript :-)

http.IncomingMessage.prototype.acceptMediaType = function(media, strict = false) {
    if (!this.headers["accept"])
        return !strict
    let accept = this.headers["accept"].toLowerCase()
    accept = accept.split(",").map(entry => entry.trim())
    return accept.includes(media.toLowerCase())
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

Object.getClassName = function(object) {
    if (typeof object === "object"
            && Object.getPrototypeOf(object)
            && Object.getPrototypeOf(object).constructor)
        return Object.getPrototypeOf(object).constructor.name
    return null
}

String.isEmpty = function(object) {
    return !Object.exists(object)
        || (typeof object === "string" && object.trim() === "")
}

// In JavaScript, the length of a UTF-8 encoded string can sometimes appear
// incorrect, especially when using characters that require more than one byte.
// Unicode characters that are outside the Basic Multilingual Plan (BMP) are
// stored as multiple bytes in UTF-8, which can lead to confusion when
// calculating the string length.
String.prototype.byteLength = function() {
    return Buffer.byteLength(this, "utf8")
}

const XMEX_DEBUG_MODE = Runtime.getEnv("XMEX_DEBUG_MODE", "off")
const XMEX_CONTAINER_MODE = Runtime.getEnv("XMEX_CONTAINER_MODE", "off")

const XMEX_CONNECTION_ADDRESS = Runtime.getEnv("XMEX_CONNECTION_ADDRESS", "0.0.0.0")
const XMEX_CONNECTION_PORT = Runtime.getEnv("XMEX_CONNECTION_PORT", 80)
const XMEX_CONNECTION_CONTEXT = Runtime.getEnv("XMEX_CONNECTION_CONTEXT", "/xmex!")
const XMEX_CONNECTION_CERTIFICATE = Runtime.getEnv("XMEX_CONNECTION_CERTIFICATE")
const XMEX_CONNECTION_SECRET = Runtime.getEnv("XMEX_CONNECTION_SECRET")

const XMEX_REQUEST_XPATH_DELIMITER = Runtime.getEnv("XMEX_REQUEST_XPATH_DELIMITER", "!")

const XMEX_CONTENT_DIRECTORY = Runtime.getEnv("XMEX_CONTENT_DIRECTORY", "./content")
const XMEX_CONTENT_DEFAULT = Runtime.getEnv("XMEX_CONTENT_DEFAULT", "index.html openAPI.html")
const XMEX_CONTENT_REDIRECT = Runtime.getEnv("XMEX_CONTENT_REDIRECT")

const XMEX_STORAGE_DIRECTORY = Runtime.getEnv("XMEX_STORAGE_DIRECTORY", "./data")
const XMEX_STORAGE_SPACE = Number.parseBytes(Runtime.getEnv("XMEX_STORAGE_SPACE", "256K"))
const XMEX_STORAGE_EXPIRATION = Date.parseDuration(Runtime.getEnv("XMEX_STORAGE_EXPIRATION", "900s"))
const XMEX_STORAGE_QUANTITY = Runtime.getEnv("XMEX_STORAGE_QUANTITY", "65535")
const XMEX_STORAGE_REVISION_TYPE = (XMEX_DEBUG_MODE || Runtime.getEnv("XMEX_STORAGE_REVISION_TYPE", "").toLowerCase() === "serial") ? "serial" : "timestamp";

const XMEX_LOGGING_OUTPUT = Runtime.getEnv("XMEX_LOGGING_OUTPUT", "%X ...")
const XMEX_LOGGING_ERROR = Runtime.getEnv("XMEX_LOGGING_ERROR", "%X ...")
const XMEX_LOGGING_ACCESS = Runtime.getEnv("XMEX_LOGGING_ACCESS", "off")

const XMEX_LIBXML_DIRECTORY = Runtime.getEnv("XMEX_LIBXML_DIRECTORY", "./libxml")
const XMEX_LIBXML_XSLTPROC = (XMEX_LIBXML_DIRECTORY.trim() || ".")
        .replace(/\\/g, "/")
        .replace(/\/+$/, "") + "/xsltproc"

// The evaluate method of the Document differs from PHP in behavior.
// The following things have been changed to simplify migration:
// - Additional third parameter
//   true catches errors as return value without throwing an exception
DOMParser.prototype.parseFromString$ = DOMParser.prototype.parseFromString
DOMParser.prototype.parseFromString = function(...variable) {
    if (variable.length < 3)
        return this.parseFromString$(...variable)
    else if (!variable[2])
        return this.parseFromString$(...variable.slice(0, 2))
    try {return this.parseFromString$(...variable.slice(0, 2))
    } catch (error) {
        return error
    }
}

XMLSerializer.prototype.serializeToString$ = XMLSerializer.prototype.serializeToString
XMLSerializer.prototype.serializeToString = function(node, isHtml, nodeFilter) {
    const output = this.serializeToString$(node, isHtml, nodeFilter)
    if (!XMEX_DEBUG_MODE)
        return output
    return (xml => {
        let formatted = ""
        let pad = 0
        let space = "  "
        xml = xml.replace(/(>)\s*(<)/g, "$1\n$2")
        xml = xml.replace(/(>)\s*([^\s\<])/g, "$1\n$2")
        xml = xml.replace(/([^\>\s])\s*(<)/g, "$1\n$2")
        xml.split(/[\r\n]+/).forEach(node => {
            let indent = 0
            if (node.match(/.+<\/\w[^>]*>$/)) {
                indent = 0
            } else if (node.match(/^<\/\w/)) {
                if (pad !== 0)
                    pad -= 1
            } else if (node.match(/^<\w[^>]*[^\/]>.*$/)) {
                indent = 1
            }
            const padding = space.repeat(pad)
            formatted += padding + node + "\n"
            pad += indent;
        });
        return formatted;
    })(output);
}

XPath.select$ = XPath.select
XPath.select = function(...variable) {
    try {return XPath.select$(...variable)
    } catch (error) {
        return error
    }
}

// DOM serialization is implemented very differently.
// So that the result is the same and all rules are known, the
// serialization itself was implemented.
// - Considered are: DOCUMENT_NODE, ELEMENT_NODE, ATTRIBUTE_NODE, CDATA_SECTION_NODE
// - Non-existing values (undefined / null) are used as null
// - DOCUMENT_NODE uses as starting point document element
// - Attributes are hold only for elements in the sub-object @attributes
// - CDATA_SECTION_NODE are used as text elements
// - Empty text elements (no printable characters) are ignored
// - If an element contains only text elements as children,
//   these are combined as one value, separated by a simple line break \n,
//   also here empty text elements (no printable characters) will be ignored
// - if an element contains text elements mixed with other elements,
//   the contents of the text elements are combined in the sub-object #text,
//   separated by a simple line break \n,
//   also here empty text elements (no printable characters) will be ignored
JSON.stringify$ = JSON.stringify
JSON.stringify = function(...variable) {
    if (variable.length > 0
            && Object.getClassName(variable[0]) === "Document")
        return String(JSON.stringify$(JSON.stringify$xml(variable[0].documentElement)))
    return String(JSON.stringify$(...variable))
}
JSON.stringify$xml = function(xml) {
    let result = {}
    if (!Object.exists(xml))
        return null
    if (xml.nodeType === XML_TEXT_NODE
            || xml.nodeType === XML_CDATA_SECTION_NODE)
        return xml.nodeValue.trim()
    if (xml.nodeType === XML_DOCUMENT_NODE)
        xml = xml.documentElement
    if (xml.nodeType !== XML_ELEMENT_NODE)
        return null
    if (xml.attributes.length > 0) {
        result["@attributes"] = {}
        Array.from(xml.attributes).forEach((attribute) => {
            result["@attributes"][attribute.nodeName] = attribute.nodeValue
        })
    }
    let buffer = {text:"", mixed:Object.exists(result["@attributes"])}
    Array.from(xml.childNodes).forEach((item) => {
        if (item.nodeType === XML_TEXT_NODE
                || item.nodeType === XML_CDATA_SECTION_NODE) {
            let text = item.nodeValue.trim()
            if (text.length <= 0)
                return
            if (buffer.text.length > 0)
                buffer.text += "\n"
            buffer.text += text
            return
        }
        if (item.nodeType !== XML_ELEMENT_NODE)
            return
        buffer.mixed = true
        let nodeName = item.nodeName
        if (result[nodeName] === undefined) {
            result[nodeName] = JSON.stringify$xml(item)
            return
        }
        if (!Array.isArray(result[nodeName]))
            result[nodeName] = [result[nodeName]]
        result[nodeName].push(JSON.stringify$xml(item))
    })
    if (!buffer.mixed)
        return buffer.text
    if (buffer.text.length > 0)
        result["#text"] = buffer.text
    return result
}

class XML {

    static get VERSION() {
        return "1.0"
    }

    static get ENCODING() {
        return "UTF-8"
    }

    static createDeclaration() {
        return `<?xml version="${XML.VERSION}" encoding="${XML.ENCODING}"?>`
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
            store = store.replace(/(^|[^a-z])([a-z])/g, "$1'$2");
            store = store.replace(/([a-z])([^a-z]|$)/g, "$1'$2");
            store = `${Storage.DIRECTORY}/${store.toLowerCase()}`
            if (Storage.DEBUG_MODE)
                store += ".xml"
        }

        this.storage  = storage
        this.root     = root
        this.store    = store
        this.xpath    = xpath
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
        initial = initial && (!fs.existsSync(storage.store) || fs.statSync(storage.store).size <= 0)

        let now = new Date()
        if (storage.exists())
            fs.utimesSync(storage.store, now, now)
        else fs.closeSync(fs.openSync(storage.store, "as+"))
        const exclusive = (options & Storage.STORAGE_SHARE_EXCLUSIVE) === Storage.STORAGE_SHARE_EXCLUSIVE
        storage.share = fs.openSync(storage.store, initial || exclusive ? "rs+" : "r")

        if (Storage.REVISION_TYPE !== "serial") {
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
                + `${Storage.DEBUG_MODE ? "\n" : ""}`
                + `<${storage.root} ___rev="${storage.unique}" ___uid="${storage.getSerial()}"/>`)
            if (Storage.REVISION_TYPE === "serial")
                storage.unique = 0
        }

        const buffer = Buffer.alloc(fs.lstatSync(storage.store).size)
        fs.readSync(storage.share, buffer, {position:0})
        const storageContent = Storage.DEBUG_MODE
                ? buffer.toString().replace(/\s*([<>])\s*/g, "$1")
                : buffer.toString();
        storage.xml = new DOMParser().parseFromString(storageContent, CONTENT_TYPE_XML)
        storage.revision = storage.xml.documentElement.getAttribute("___rev")
        if (Storage.REVISION_TYPE === "serial") {
            if (storage.revision.match(PATTERN_NON_NUMERICAL))
                storage.quit(503, "Resource revision conflict")
            storage.unique = String(storage.unique + Number(storage.revision))
        }

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
     * Determines the current size of the storage with the current data and can
     * therefore differ from the size in the file system.
     * @return {number} current size of the storage
     */
    getSize() {
        if (Object.exists(this.xml))
            return new XMLSerializer().serializeToString(this.xml).byteLength()
        if (Object.exists(this.share))
            return fs.fstatSync(this.share).size
        if (Object.exists(this.store)
                && fs.existsSync(this.store))
            return fs.lstatSync(this.store).size
        return 0
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
     * POST queries data about XPath axes and functions via transformation. For
     * this, an XSLT stylesheet is sent with the request-body, which is then
     * applied by the XSLT processor to the data in storage. Thus the content
     * type application/xslt+xml is always required. The client defines the
     * content type for the output with the output-tag and the method-attribute.
     * The XPath is optional for this method and is used to limit and preselect
     * the data. The processing is strict and does not accept unnecessary
     * spaces.
     *
     *     Request:
     * POST /<xpath> HTTP/1.0
     * Storage: 0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ (identifier)
     * Content-Length: (bytes)
     * Content-Type: application/xslt+xml
     *     Request-Body:
     * XSLT stylesheet
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
     * The result of the transformation
     *
     *     Response codes / behavior:
     *         HTTP/1.0 200 Success
     * - Request was successfully executed
     *         HTTP/1.0 204 Success
     * - Request was successfully, but without content
     *         HTTP/1.0 400 Bad Request
     * - Storage header is invalid, 1 - 64 characters (0-9A-Z_-) are expected
     * - XPath is missing or malformed
     * - XSLT Stylesheet is erroneous
     *         HTTP/1.0 404 Resource Not Found
     * - Storage file does not exist
     *         HTTP/1.0 415 Unsupported Media Type
     * - Attribute request without Content-Type text/plain
     *         HTTP/1.0 422 Unprocessable Entity
     * - Data in the request body cannot be processed
     *         HTTP/1.0 500 Internal Server Error
     * - An unexpected error has occurred
     * - Response header Error contains an unique error number as a reference to
     *   the log file with more details
     */
    doPost() {

        // POST always expects an valid XSLT template for transformation.
        const media = (this.request.headers["content-type"] || "").toLowerCase()
        if (![CONTENT_TYPE_XSLT].includes(media))
            this.quit(415, "Unsupported Media Type")

        if (this.xpath.match(PATTERN_XPATH_FUNCTION)) {
            const message = "Invalid XPath (Functions are not supported)"
            this.quit(400, "Bad Request", {Message: message})
        }

        // POST always expects a valid XSLT template for transformation.
        if (this.request.data.trim().length <= 0)
            this.quit(422, "Unprocessable Entity", {Message: "Unprocessable Entity"})

        let xml = this.xml
        if (this.xpath !== "") {
            xml = XML.createDocument()
            let targets = XPath.select(this.xpath, this.xml)
            if (targets instanceof Error) {
                let message = `Invalid XPath axis (${targets.message})`
                this.quit(400, "Bad Request", {Message: message})
            }
            if (!Object.exists(targets)
                    || targets.length <= 0)
                this.quit(204, "No Content")
            if (targets.length === 1) {
                let target = targets[0]
                if (target.nodeType === XML_ATTRIBUTE_NODE)
                    target = xml.createElement(target.name, target.value)
                xml.appendChild(target.cloneNode(true))
            } else {
                let collection = xml.createElement("collection")
                targets.forEach((target) => {
                    if (target.nodeType === XML_ATTRIBUTE_NODE)
                        target = xml.createElement(target.name, target.value)
                    collection.appendChild(target.cloneNode(true))
                })
                xml.appendChild(collection)
            }
        }

        // xsltproc supports XML with embedded XSLT (stylesheet). With this
        // approach, all data relevant for the transformation can be sent to
        // xsltproc via the STD_IN and the annoying detour via temp files is
        // avoided.

        // Adaptations and manipulations of the XSLT
        // - If necessary, remove the Prolog statement <?xml...>
        // - Iif necessary, remove the ID attribute in the XSLT stylesheet element
        // - Set attribute ID of the first XSLT stylesheet element to ___<unique>

        const stylesheetData = (this.request.data ?? "")
            .replace(/(<xsl:stylesheet[^>]*?)\s+id\s*=\s*(["']).*?\2/gi, "$1")
        const stylesheet = new DOMParser().parseFromString(stylesheetData)
        if (!Object.exists(stylesheet)
                || stylesheet instanceof Error) {
            let message = "Invalid XSLT stylesheet"
            if (stylesheet instanceof Error)
                message += ` (${stylesheet.message})`
            this.quit(422, "Unprocessable Entity", {Message: message})
        }
        const stylesheetElement = XPath.select1("//*[local-name()='stylesheet']", stylesheet);
        if (!stylesheetElement
                || stylesheetElement instanceof Error)
            this.quit(422, "Unprocessable Entity", {Message: "XSLT stylesheet element was not found"})
        stylesheetElement.setAttribute("id", `___${this.unique}`)
        const stylesheetText = stylesheet.toString()
            .replace(/<\?xml\b.*?\?>/ig, "")
            .trim()

        // Adaptations and manipulations of the XML
        // - Remove the Prolog statement <?xml...> if necessary
        // - Insert <?xml-stylesheet type=“text/xml” href=“#___<unique>”?>
        // - Insert <!DOCTYPE ANY [<!ATTLIST xsl:stylesheet id ID #REQUIRED>]>.
        // - Insert XSLT before the last closing tag, which should be the root element

        let embedding = xml.toString()
            .replace(/<\?xml\b.*?\?>/ig, "")
            .replace(/\x00+/ig, " ")
        const SELF_CLOSING_ELEMENT_AT_THE_END = /<(\w+)([^>]*)\/>\s*$/
        if (SELF_CLOSING_ELEMENT_AT_THE_END.test(embedding))
            embedding = embedding.replace(SELF_CLOSING_ELEMENT_AT_THE_END, `<$1$2></$1>`)
        const CLOSING_ELEMENT_AT_THE_END = /(<\/\w+[^>]*>)\s*$/
        embedding = embedding.replace(CLOSING_ELEMENT_AT_THE_END, `${EOL}\x00${EOL}$1`)
        embedding = `<!DOCTYPE ANY [<!ATTLIST xsl:stylesheet id ID #REQUIRED>]>${EOL}${embedding}`
        embedding = `<?xml-stylesheet type="text/xml" href="#___${this.unique}"?>${EOL}${embedding}`
        embedding = embedding.replace("\x00", stylesheetText)

        let output = Process.spawnSync(XMEX_LIBXML_XSLTPROC, ['-'], {
            input: embedding,
            encoding: XML.ENCODING
        })
        if (output.stderr) {
            let message = output.stderr.split(/\s*[\r\n]+\s*/).slice(0, 2).join(' / ')
            message = message.replace(/(?<=:)\s+file[\s-]+line\s+\d+/ig, "").trim()
            message = message.replace(/\s+(:)\s+/ig, "$1 ").trim()
            message = `xsltproc failed (${message.trim()})`
            this.quit(422, "Unprocessable Entity", {Message: message})
        } else output = output.stdout

        let method = (XPath.select("normalize-space(//*[local-name()='output']/@method)", stylesheet) ?? "").toLowerCase().trim()
        if (!["", "xml", "html", "text"].includes(method))
            this.quit(415, "Unsupported Media Type");
        if (!Object.exists(output)
                || output.trim() === "") {
            if (!["", "xml"].includes(method))
                this.quit(204, "No Content")
            output = XML.createDocument()
        }

        let header = {"Content-Type": CONTENT_TYPE_XML}
        if (method === "text")
            header = {"Content-Type": CONTENT_TYPE_TEXT}
        else if (method === "html")
            header = {"Content-Type": CONTENT_TYPE_HTML}
        else if (this.request.acceptMediaType(CONTENT_TYPE_JSON, true))
            output = new DOMParser().parseFromString(output, "application/xml")

        let encoding = (XPath.select("normalize-space(//*[local-name()='output']/@encoding-)", stylesheet) ?? "").trim()

        this.quit(200, "Success", header, output, encoding)
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
            if (!String.isEmpty(pseudo))
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
                if (target.nodeType !== XML_ELEMENT_NODE)
                    return
                let replace = target.cloneNode(false)
                replace.appendChild(this.xml.createTextNode(input))
                replace = this.xml.importNode(replace, true)
                if (this.xml.documentElement === target) {
                    this.xml.removeChild(target);
                    this.xml.appendChild(replace);
                } else target.parentNode.replaceChild(replace, target)
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
                let message = `Invalid XPath axis (${targets.message})`
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
            const message = `Invalid XPath axis (${targets.message})`
            this.quit(400, "Bad Request", {Message: message})
        }

        if (!Object.exists(targets)
                || targets.length <= 0)
            this.quit(304, "Not Modified")

        // Pseudo elements can be used to delete in an XML substructure relative
        // to the selected element.
        if (pseudo) {
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
            // Ignore the initial PROCESSING_INSTRUCTION_NODE <?xml..
            if (target.nodeType === XML_PROCESSING_INSTRUCTION_NODE
                   && target.tagName.toLowerCase() === "xml")
                return
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
                const parent = target.parentNode
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
     * Return TRUE if the storage already exists.
     * @return {boolean} TRUE if the storage already exists
     */
    exists() {
        return fs.existsSync(this.store)
            && fs.lstatSync(this.store).size > 0
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
        if (this.revision === this.xml.documentElement.getAttribute("___rev")
                && this.revision !== this.unique)
            return

        let output = new XMLSerializer().serializeToString(this.xml)
        if (output.byteLength() > Storage.SPACE)
            this.quit(413, "Payload Too Large")
        fs.ftruncateSync(this.share, 0)
        fs.writeSync(this.share, output, 0, output.length, 0)

        if (Storage.DEBUG_MODE) {
            const unique = this.unique.padStart(3, "0")
            const target = this.store.replace(/(\.\w+$)/, `___${unique}$1`)
            fs.writeFileSync(target, output)
        }
    }

    /**
     * Quit sends a response and ends the connection and closes the storage. The
     * behavior of the method is hard. A response status and a response message
     * are expected. Optionally, additional headers and data for the response
     * body can be passed. Headers for storage and data length are set
     * automatically. Data from the response body is only sent to the client if
     * the response status is in class 2xx. This also affects the dependent
     * headers Content-Type and Content-Length.
     * @param int    status
     * @param string message
     * @param array  headers
     * @param string data
     * @param string encoding
     *
     */
    quit(status, message, headers = undefined, data = undefined, encoding = undefined) {

        if (this.response.headersSent) {
            // The response are already complete.
            // The storage can be closed and the requests can be terminated.
            this.close()
            throw Storage.prototype.quit
        }

        // Not relevant default headers are removed.
        ["X-Powered-By", "Content-Type", "Content-Length"].forEach(header => {
            this.response.removeHeader(header)
        })

        for (const key in CORS)
            this.response.setHeader(key, CORS[key])

        // Access-Control headers are received during preflight OPTIONS request
        if (this.request.method.toUpperCase() === "OPTIONS") {
            if (this.request.headers["access-control-request-method"])
                this.response.setHeader("Access-Control-Allow-Methods",
                    "CONNECT, OPTIONS, GET, POST, PUT, PATCH, DELETE")
            if (this.request.headers["access-control-request-headers"])
                this.response.setHeader("Access-Control-Allow-Headers",
                    this.request.headers["access-control-request-headers"])
        }

        if (!Object.exists(headers))
            headers = []

        // For status class 2xx + 304 the storage headers are added.
        // The revision is read from the current storage because it can change.
        if (((status >= 200 && status < 300) || status === 304)
                && this.storage
                && this.xml) {
            headers = {...headers, ...{
                "Storage": this.storage,
                "Storage-Revision": this.xml.documentElement.getAttribute("___rev") + "/" + this.serial,
                "Storage-Space": Storage.SPACE + "/" + this.getSize() + " bytes",
                "Storage-Last-Modified": new Date().toUTCString(),
                "Storage-Expiration": new Date(Date.now() +Storage.EXPIRATION).toUTCString(),
                "Storage-Expiration-Time": Storage.EXPIRATION + " ms"
            }}

            if (status !== 200)
                data = null
            if (typeof data === "string"
                    && String.isEmpty(data))
                data = null

            if (Object.exists(data)) {
                if (this.request.acceptMediaType(CONTENT_TYPE_JSON, true)) {
                    headers["Content-Type"] = CONTENT_TYPE_JSON
                    data = JSON.stringify(data)
                } else {
                    if (!headers.hasOwnProperty("Content-Type"))
                        headers["Content-Type"] = Object.getClassName(data) === "Document"
                            ? CONTENT_TYPE_XML
                            : CONTENT_TYPE_TEXT
                    if (Object.getClassName(data) === "Document")
                        data = new XMLSerializer().serializeToString(data)
                    if (typeof data !== "string")
                        data = String(data)
                }
                headers["Content-Length"] = data.byteLength()
                if ((encoding ?? "").trim() !== "")
                    headers["Content-Type"] += `; charset=${encoding}`;
            }
        } else data = null

        for (let [key, value] of Object.entries(headers)) {
            value = String(value).replace(/[\r\n]+/g, " ").trim()
            if (value.length > 0)
                this.response.setHeader(key, value)
            else this.response.removeHeader(key)
        }

        if (Storage.DEBUG_MODE) {
            const hash = string => crypto
                .createHash("md5")
                .update(string)
                .digest("hex")

            // Nullish works differently in Node.js than in PHP with regard to
            // empty strings. Therefore the customized function.
            const nullish = (object, value = undefined) =>
                Object.exists(object) && object !== "" ? object : value !== undefined ? value: ""

            const request = `${this.request.method} ${this.request.url} HTTP/${this.request.httpVersion}`
            this.response.setHeader("Trace-Request-Hash", hash(request))
            let header = [
                nullish(this.request.headers["storage"], "null"),
                nullish(this.request.headers["content-type"], "null"),
                nullish(this.request.headers["content-length"], "null")].join("\t")
            this.response.setHeader("Trace-Request-Header-Hash", hash(header))
            this.response.setHeader("Trace-Request-Data-Hash", hash(this.request.data ?? ""))
            this.response.setHeader("Trace-Response-Hash", hash(`${status} ${message}`))
            header = [
                nullish(headers["Storage"], "null"),
                nullish(headers["Storage-Revision"], "null"),
                nullish(headers["Storage-Space"], "null"),
                nullish(headers["Error"], "null"),
                nullish(headers["Message"],"null"),
                nullish(headers["Content-Type"], "null"),
                nullish(headers["Content-Length"], "null")].join("\t")
            this.response.setHeader("Trace-Response-Header-Hash", hash(header))
            this.response.setHeader("Trace-Response-Data-Hash", hash(String(data ?? "")))
            header = this.storage && this.xml
                ? nullish(new XMLSerializer().serializeToString(this.xml), "") : ""
            this.response.setHeader("Trace-Storage-Hash", hash(header))
        }

        this.response.setHeader("Execution-Time", `${Date.now() -this.request.timing} ms`)

        this.response
            .writeHead(status, message)
            .end(data)

        // The function and the response are complete.
        // The storage can be closed and the requests can be terminated.
        this.close()

        throw Storage.prototype.quit
    }

    /** Closes the storage for the current request. */
    close() {

        if (!Object.exists(this.share))
            return

        fs.closeSync(this.share)

        delete this.share
        delete this.xml
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
        fs.writeFileSync(marker, "")

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

http.ServerResponse.prototype.quit = function(status, message, headers = undefined, data = undefined) {

    if (this.headersSent)
        return

    // Directly set headers (e.g. for CORS) are read
    // Names are converted to camel case, pure cosmetics -- Node.js uses only lower case
    if (typeof headers !== "object")
        headers = {}

    // Not relevant default headers are removed.
    const defaults = ["X-Powered-By", "Content-Type", "Content-Length"]
    for (const header in defaults)
        this.removeHeader(defaults[header]);

    for (const [header, value] of Object.entries(this.getHeaders()))
        headers[header.replace(/\b[a-z]/g, match =>
            match.toUpperCase())] = value

    this.writeHead(status, message, headers)
    if (Object.exists(data))
        this.contentLength = data.length
    this.end(data)
    throw http.ServerResponse.prototype.quit
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
            for (let size = 0; (size = fs.readSync(file, buffer)) > 0;)
                response.write(buffer.toString("binary"), "binary")
            response.end()
        } finally {
            fs.closeSync(file)
        }
        throw http.ServerResponse.prototype.quit
    }

    static onServiceRequest(request, response) {

        // Request method is determined
        let method = request.method.toUpperCase()

        // Access-Control headers are received during preflight OPTIONS request
        if (method.toUpperCase() === "OPTIONS"
                && request.headers.origin
                && !request.headers.storage)
            (new Storage(request, response)).quit(204, "No Content")

        if (!Object.exists(request.headers.storage))
            (new Storage(request, response)).quit(400, "Bad Request", {Message: "Missing storage identifier"})
        let storage = request.headers.storage || ""
        if (!storage.match(PATTERN_HEADER_STORAGE))
            (new Storage(request, response)).quit(400, "Bad Request", {Message: "Invalid storage identifier"})

        // The XPath is determined from REQUEST_URI.
        // The XPath starts directly after the context path. To improve visual
        // recognition, the context path should always end with a symbol.
        let xpath = request.url.substring(ServerFactory.CONNECTION_CONTEXT.length)
        if (xpath.match(PATTERN_HEX))
            xpath = Buffer.from(xpath.substring(1), "hex").toString("ascii").trim()
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
                if (!["PATCH", "POST", "PUT"].includes(method)) {
                    if (XMEX_DEBUG_MODE)
                        request.data = (request.data ?? "") + data
                    return
                }

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
                    request.error = [413, "Payload Too Large"]
                } else request.data = (request.data ?? "") + data
            })

            request.on("end", () => {

                try {

                    // Marking the start time for request processing
                    request.timing = Date.now()
                    request.data = Object.exists(request.data) ? request.data : ""

                    const REQUEST_TYPE_SERVICE = 0
                    const REQUEST_TYPE_CONTENT = 1

                    const requestUrl = decodeURI(request.url)
                    const requestType = ((requestUrl) => {
                        if (!requestUrl.startsWith(ServerFactory.CONNECTION_CONTEXT))
                            return REQUEST_TYPE_CONTENT
                        return REQUEST_TYPE_SERVICE
                    })(requestUrl)

                    if (Object.exists(request.error)) {
                        if (requestType === REQUEST_TYPE_SERVICE)
                            (new Storage(request, response)).quit(...request.error)
                        else response.quit(...request.error)
                    }

                    // The API should always use a context path so that the
                    // separation between URI and XPath is also visually
                    // recognizable. For all requests outside of the API path
                    // are alternatively considered as a request to web content.
                    // If content has been configured, it will be used like a
                    // normal HTTP server. Otherwise the requests are answered
                    // with status 404.

                    if (requestType === REQUEST_TYPE_CONTENT)
                        ServerFactory.onContentRequest(request, response)

                    ServerFactory.onServiceRequest(request, response)

                } catch (error) {
                    if (error === Storage.prototype.quit
                            || error === http.ServerResponse.prototype.quit)
                        return
                    const unique = Date.now().toString(36).toUpperCase()
                    console.error("Service", `#${unique}`, error)
                    if (!response.headersSent)
                        response.quit(500, "Internal Server Error", {"Error": `#${unique}`})
                } finally {
                    // TODO
                }
            })
        })

        // Internal redirect without network, because the CONNECT method in
        // Node.js is not intended for this purpose.
        server.on("connect", (request, socket, head) => {

            const redirect = new http.IncomingMessage(socket)
            redirect.method = request.method
            redirect.url = request.url
            redirect.httpVersion = request.httpVersion
            redirect.headers = request.headers
            redirect.socket = request.socket

            const response = new http.ServerResponse(redirect)
            response.assignSocket(socket)
            server.emit("request", redirect, response)
            response.on("finish", () => {
                socket.end()
            })
            redirect.emit("data", head)
            redirect.emit("end")
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
            console.log("Service", `Listening at ${this.address().address}:${this.address().port}${options.length > 0 ? " (" + options.join(" + ") + ")" : ""}`)
        })

        return server
    }

    static bind() {
        ServerFactory.serverInstancesXmex = ServerFactory.newInstance()
    }
}

// Version number and year are set later in the build process.
// Source of knowledge is CHANGES, where else can you find such info ;-)
// CHANGES is the basis for builds, releases and README.md
console.log("Seanox XML-Micro-Exchange [Version 0.0.0 00000000]")
console.log("Copyright (C) 0000 Seanox Software Solutions")

ServerFactory.bind()
