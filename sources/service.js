/**
 * LIZENZBEDINGUNGEN - Seanox Software Solutions ist ein Open-Source-Projekt, im
 * Folgenden Seanox Software Solutions oder kurz Seanox genannt.
 * Diese Software unterliegt der Version 2 der Apache License.
 *
 * XMEX XML-Micro-Exchange
 * Copyright (C) 2021 Seanox Software Solutions
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
 * XML-Micro-Exchange is a volatile RESTful micro datasource.
 * It is designed for easy communication and data exchange of web-applications
 * and for IoT.
 * The XML based datasource is volatile and lives through continuous use and
 * expires through inactivity. They are designed for active and near real-time
 * data exchange but not as a real-time capable long-term storage.
 * Compared to a JSON storage, this datasource supports more dynamics, partial
 * data access, data transformation, and volatile short-term storage.
 *
 *     TERMS / WORDING
 *
 *         XMEX / XML-Micro-Exchange
 * Name of the project and the corresponding abbreviation
 *
 *         Datasource
 * XML-Micro-Exchange is a data service that manages different data areas.
 * The entirety, so the service itself, is the datasource.
 * Physically this is the data directory.
 *
 *         Storage
 * The data areas managed by the XML-Micro-Exchange as a data service are
 * called storage areas. A storage area corresponds to an XML file in the data
 * directory.
 *
 *         Storage Identifier
 * Each storage has an identifier, the Storage Identifier.
 * The Storage Identifier is used as the filename of the corresponding XML file
 * and must be specified with each request so that the datasource uses the
 * correct storage.
 *
 *         Element(s)
 * The content of the XML file of a storage provide the data as object or tree
 * structure. The data entries are called elements.
 * Elements can enclose other elements.
 *
 *         Attribute(s)
 * Elements can also contain direct values in the form of attributes.
 *
 *         XPath
 * XPath is a notation for accessing and navigating the XML data structure.
 * An XPath can be an axis or a function.
 *
 *         XPath Axis
 * XPath axes address or select elements or attributes.
 * The axes can have a multidimensional effect.
 *
 *         XPath Axis Pseudo Elements
 * For PUT requests it is helpful to specify a relative navigation to an XPath
 * axis. For example first, last, before, after. This extension of the notation
 * is supported for PUT requests and is added to an XPath axis separated by two
 * colons at the end (e.g. /root/element::end - means put in element as last).
 *
 *         XPath Function
 * The XPath notation also supports functions that can be used in combination
 * with axes and standalone for dynamic data requests. In combination with
 * XPath axes, the addressing and selection of elements and attributes can be
 * made dynamic.
 *
 *        Revision
 * Every change in a storage is expressed as a revision.
 * This should make it easier for the client to determine whether data has
 * changed, even for partial requests.
 * The revision is a counter of changes per request, without any claim of
 * version management of past revisions.
 * It starts with initial revision 0 when a storage is created on the first
 * call. The first change already uses revision 1.
 *
 * Each element uses a revision in the read-only attribute ___rev, which, as
 * with all parent revision attributes, is automatically incremented when it
 * changes.
 * A change can affect the element itself or the change to its children.
 * Because the revision is passed up, the root element automatically always
 * uses the current revision.
 *
 * Changes are: PUT, PATCH, DELETE
 *
 * Write accesses to attribute ___rev are accepted with status 204, will have
 * no effect from then on and are therefore not listed in the response header
 * Storage-Effects.
 *
 *       UID
 * Each element uses a unique identifier in the form of the read-only attribute
 * ___uid. The unique identifier is automatically created when an element is
 * put into storage and never changes.
 * If elements are created or modified by a request, the created or affected
 * unique identifiers are sent to the client in the response header
 * Storage-Effects.
 *
 * The UID uses an alphanumeric format based on radix 36 which, when converted
 * into a number, gives the timestamps of the creation in milliseconds since
 * 01/01/2000.
 * The UID is thus also sortable and provides information about the order in
 * which elements are created.
 *
 * Write accesses to attribute ___uid are accepted with status 204, will have
 * no effect from then on and are therefore not listed in the response header
 * Storage-Effects.
 *
 *     REQUEST
 * The implementation works RESTfull and uses normal HTTP request.
 * For the addressing of targets XPath axes and XPath functions are used,
 * which are transmitted as part of the URI path.
 * Because XPath has a different structure than the URI, even if it uses
 * similar characters, clients and/or gateways may experience syntax problems
 * when optimizing the request.
 * For this reason different ways of transmission and escape are supported for
 * the XPath.
 *
 *        URI (not escaped)
 * e.g. /xmex!//book[last()]/chapter[last()]
 *
 *        URI + URL Encoding
 * The XPath is used URL encoding.
 * e.g. /xmex!//book%5Blast()%5D/chapter%5Blast()%5D
 * is equivalent to: /xmex!//book[last()]/chapter[last()]
 *
 *        XPath as query string and URL encoding
 * The XPath is transmitted as a query string.
 * e.g. /xmex!?//book[last()]/chapter[last()]
 *      /xmex!?//book%5Blast()%5D/chapter%5Blast()%5D
 *      /xmex?//book[last()]/chapter[last()]
 *      /xmex?//book%5Blast()%5D/chapter%5Blast()%5D
 * is equivalent to: /xmex!//book[last()]/chapter[last()]
 *
 *        XPath as hexadecimal string
 * The URI starts with 0x after the XPath separator:
 * e.g. /xmex!0x2f2f626f6f6b5b6c61737428295d2f636861707465725b6c61737428295d
 * is equivalent to: /xmex!//book[last()]/chapter[last()]
 *
 *        XPath as Base64 encoded string
 * The URI starts with Base64 after the XPath separator:
 * e.g. /xmex!Base64:Ly9ib29rW2xhc3QoKV0vY2hhcHRlcltsYXN0KCld
 * is equivalent to: /xmex!//book[last()]/chapter[last()]
 *
 *     TRANSACTION / SIMULTANEOUS ACCESS
 * XML-Micro-Exchange supports simultaneous access.
 * Read accesses are executed simultaneously.
 * Write accesses creates a lock and avoids dirty reading.
 *
 *     ERROR HANDLING
 * Errors are communicated via the server status 500 and the header 'Error'.
 * The header 'Error' contains only an error number, for security reasons no
 * details. The error number with details can be found in the log file of the
 * service.
 * In the case of status 400 and 422, XML-Micro-Exchange uses the additional
 * header Message in the response, which contains more details about the error.
 * The difference between status 400 and 422 is that status 400 always refers
 * to the request and 422 to the request body. With status 400, errors are
 * detected in the request itself, and with status 422, errors are detected in
 * the content of the request body.
 *
 *     SECURITY
 * This aspect was deliberately considered and implemented here only in a very
 * rudimentary form. Only the storage(-key) with a length of 1 - 64 characters
 * can be regarded as secret.
 * For further security the approach of Basic Authentication, Digest Access
 * Authentication and/or Server/Client certificates is followed, which is
 * configured outside of the XMDS (XML-Micro-Datasource) at the web server.
 *
 *  Service 1.1.0 20210117
 *  Copyright (C) 2021 Seanox Software Solutions
 *  All rights reserved.
 *
 *  @author  Seanox Software Solutions
 *  @version 1.1.0 20210117
 */
const http = require("http")
const fs = require("fs")
const crypto = require("crypto")

const EOL = require("os").EOL
const DOMParser = require("xmldom").DOMParser
const DOMImplementation = require("xmldom").DOMImplementation
const XPath = require("xpath")
const XMLSerializer = require("common-xml-features").XMLSerializer
const XSLT = require("xslt4node")
const Codec = require("he")

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

class Storage {

    // TODO:
    static get PORT() {
        return 8000
    }

    // TODO:
    static get CONTEXT_PATH() {
        return "/xmex!"
    }

    /** Directory of the data storage */
    static get DIRECTORY() {
        return "./data"
    }

    /** Maximum number of files in data storage */
    static get QUANTITY() {
        return 65535
    }

    /**
     * Maximum data size of files in data storage in bytes.
     * The value also limits the size of the requests(-body).
     */
    static get SPACE() {
        return 256 *1024
    }

    /** Maximum idle time of the files in seconds */
    static get TIMEOUT() {
        return 15 *60
    }

    /**
     * Optional CORS response headers as associative array.
     * For the preflight OPTIONS the following headers are added automatically:
     *     Access-Control-Allow-Methods, Access-Control-Allow-Headers
     */
    static get CORS() {
        return {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Max-Age": "86400",
            "Access-Control-Expose-Headers": "*"
        }
    }

    /**
     * Pattern for the Storage header
     *     Group 0. Full match
     *     Group 1. Storage
     *     Group 2. Name of the root element (optional)
     */
    static get PATTERN_HEADER_STORAGE() {
        return /^(\w{1,64})(?:\s+(\w+)){0,1}$/
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

    /**
     * Pattern to determine the structure of XPath axis expressions for attributes
     *     Group 0. Full match
     *     Group 1. XPath axis
     *     Group 2. Attribute
     */
    static get PATTERN_XPATH_ATTRIBUTE() {
        return /((?:^\/+)|(?:^.*?))\/{0,}(?<=\/)(?:@|attribute::)(\w+)$/i
    }

    /**
     * Pattern to determine the structure of XPath axis expressions for pseudo elements
     *     Group 0. Full match
     *     Group 1. XPath axis
     *     Group 2. Attribute
     */
    static get PATTERN_XPATH_PSEUDO() {
        return /^(.*?)(?:::(before|after|first|last)){0,1}$/i
    }

    /**
     * Pattern as indicator for XPath functions
     * Assumption for interpretation: Slash and dot are indications of an axis
     * notation, the round brackets can be ignored, the question remains, if
     * the XPath starts with an axis symbol, then it is an axis, with other
     * characters at the beginning must be a function.
     */
    static get PATTERN_XPATH_FUNCTION() {
        return /^[\(\s]*[^\/\.\s\(].*$/
    }

    /** Constants of used content types */
    static get CONTENT_TYPE_TEXT() {
        return "text/plain"
    }
    static get CONTENT_TYPE_XPATH() {
        return "text/xpath"
    }
    static get CONTENT_TYPE_HTML() {
        return "text/html"
    }
    static get CONTENT_TYPE_XML() {
        return "application/xslt+xml"
    }
    static get CONTENT_TYPE_JSON() {
        return "application/json"
    }

    static get XML() {
        return class {
            static get VERSION() {
                return "1.0"
            }
            static get ENCODING() {
                return "UTF-8"
            }
            static createDeclaration() {
                return `<?xml version=\"${Storage.XML.VERSION}\" encoding=\"${Storage.XML.ENCODING}\"?>`
            }
            static createDocument() {
                return new DOMParser().parseFromString(Storage.XML.createDeclaration());
            }
        }
    }

    /**
     * Constructor creates a new Storage object.
     * @param {object} meta {request, response, storage, root, xpath}
     */
    constructor(meta) {

        // The storage identifier is case-sensitive.
        // To ensure that this also works with Windows, Base64 encoding is used.

        this.request  = meta.request
        this.response = meta.response

        this.storage  = meta.storage || ""
        this.root     = meta.root || "data"
        this.store    = Storage.DIRECTORY + "/" + Buffer.from(this.storage, "ASCII").toString("Base64")
        this.xpath    = (meta.xpath || "").replace(Storage.PATTERN_XPATH_OPTIONS, "$1")
        this.options  = (meta.xpath || "").replace(Storage.PATTERN_XPATH_OPTIONS, "$2").toLowerCase().split(/!+/)
        this.unique   = this.uniqueId()
        this.serial   = 0
        this.revision = 0
    }

    /** Cleans up all files that have exceeded the maximum idle time. */
    static cleanUp() {

        if (!fs.existsSync(Storage.DIRECTORY)
                || !fs.lstatSync(Storage.DIRECTORY).isDirectory())
            return
        let timeout = new Date().getTime() -(Storage.TIMEOUT *1000)
        let files = fs.readdirSync(Storage.DIRECTORY)
        files.forEach((file) => {
            file = Storage.DIRECTORY + "/" + file
            let state = fs.lstatSync(file)
            if (state.isFile()
                    && state.mtimeMs < timeout)
                if (fs.existsSync(file))
                    fs.unlinkSync(file)
        })
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
            (new Storage(meta)).quit(400, "Bad Request", {"Message": "Invalid storage identifier"})

        meta.root = meta.storage.replace(Storage.PATTERN_HEADER_STORAGE, "$2")
        meta.storage = meta.storage.replace(Storage.PATTERN_HEADER_STORAGE, "$1")

        Storage.cleanUp()
        if (!fs.existsSync(Storage.DIRECTORY))
            fs.mkdirSync(Storage.DIRECTORY, {recursive:true, mode:0o755})
        let storage = new Storage(meta)

        if (storage.exists()) {
            storage.open(meta.exclusive)
            // Safe is safe, if not the default 'data' is used,
            // the name of the root element must be known.
            // Otherwise the request is quit with status 404 and terminated.
            if ((meta.root ? meta.root : "data") !== storage.xml.documentElement.nodeName)
                storage.quit(404, "Resource Not Found")
        }
        return storage
    }

    /**
     * Return a unique ID related to the request.
     * @return {string} unique ID related to the request
     */
    uniqueId() {

        // The method is based on time, network port and the assumption that a
        // port is not used more than once at the same time. On fast platforms,
        // however, the time factor is uncertain because the time from calling
        // the method is less than one millisecond. This is ignored here,
        // assuming that the port reassignment is greater than one millisecond.

        // Structure of the Unique-Id [? MICROSECONDS][4 PORT]
        let unique = this.request.connection.remotePort.toString(36)
        unique = "0000" + unique
        unique = unique.substring(unique.length -4)
        unique = new Date().getTime().toString(36) + unique
        return unique.toUpperCase()
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
     * Opens the storage for the current request.
     * The storage can optionally be opened exclusively for write access.
     * If the storage to be opened does not yet exist, it is initialized.
     * Simultaneous requests must then wait through the file lock.
     * @param {boolean} exclusive
     */
    open(exclusive = true) {

        if (Object.exists(this.share))
            return

        let now = new Date();
        if (this.exists())
            fs.utimesSync(this.store, now, now)
        else fs.closeSync(fs.openSync(this.store, "as+"))
        this.share = fs.openSync(this.store, !this.exists() || exclusive ? "rs+" : "r")

        if (fs.lstatSync(this.store).size <= 0)
            fs.writeSync(this.share, Storage.XML.createDeclaration()
                + `<${this.root} ___rev="0" ___uid="${this.getSerial()}"/>`)

        let buffer = Buffer.alloc(fs.lstatSync(this.store).size)
        fs.readSync(this.share, buffer, {position:0})
        this.xml = new DOMParser().parseFromString(buffer.toString(), Storage.CONTENT_TYPE_XML)
        this.revision = this.xml.documentElement.getAttributeNumber("___rev")
    }

    serialize(xml) {
        return new XMLSerializer().serializeToString(xml || this.xml)
    }

    /**
     * Materializes the XML document from the memory in the file system.
     * Unlike save, the file is not closed and the data can be modified without
     * another (PHP)process being able to read the data before finalizing it by
     * closing it. Materialization is only executed if there are changes in the
     * XML document, which is determined by the revision of the root element.
     * The size of the storage is limited by Storage::SPACE because it is a
     * volatile micro datasource for short-term data exchange.
     * An overrun causes the status 413.
     */
    materialize() {

        if (!Object.exists(this.share))
            return
        if (this.revision === this.xml.documentElement.getAttributeNumber("___rev"))
            return

        let output = this.serialize()
        if (output.length > Storage.SPACE)
            this.quit(413, "Payload Too Large")
        fs.ftruncateSync(this.share, 0)
        fs.writeSync(this.share, output)
    }

    /** Closes the storage for the current request. */
    close() {

        if (!Object.exists(this.share))
            return

        fs.closeSync(this.share)

        delete this.share
        delete this.xml
    }

    /**
     * Creates a unique incremental ID.
     * @return {string} unique incremental ID
     */
    getSerial() {
        return this.unique + ":" + (this.serial++)
    }

    /**
     * Determines the current size of the storage with the current data and can
     * therefore differ from the size in the file system.
     * @return {number} current size of the storage
     */
    getSize() {

        if (Object.exists(this.xml))
            return this.serialize().length
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
     * CONNECT initiates the use of a storage.
     * A storage is a volatile XML construct that is used via a datasource URL.
     * The datasource managed several independent storages.
     * Each storage has a name specified by the client, which must be sent with
     * each request. This is similar to the header host for virtual servers.
     * Optionally, the name of the root element can also be defined by the
     * client.
     *
     * Each client can create a new storage at any time.
     * Communication is established when all parties use the same name.
     * There are no rules, only the clients know the rules.
     * A storage expires with all information if it is not used (read/write).
     *
     * The response for a CONNECT always contains a Connection-Unique header.
     * The Unique is unique in the Datasource and in the Storage and can be
     * used by the client e.g. in XML as attributes to locate his data faster.
     *
     * In addition, OPTIONS can also be used as an alternative to CONNECT,
     * because CONNECT is not an HTTP standard. For this purpose OPTIONS
     * without XPath, but with context path if necessary, is used. In this case
     * OPTIONS will hand over the work to CONNECT.
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
     * Storage-Revision: Revision (number)
     * Storage-Space: Total/Used (bytes)
     * Storage-Last-Modified: Timestamp (RFC822)
     * Storage-Expiration: Timestamp (RFC822)
     * Storage-Expiration-Time: Timeout (milliseconds)
     * Connection-Unique: UID
     *
     *     Response:
     * HTTP/1.0 202 Accepted
     * Storage: 0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ
     * Storage-Revision: Revision (number)
     * Storage-Space: Total/Used (bytes)
     * Storage-Last-Modified: Timestamp (RFC822)
     * Storage-Expiration: Timestamp (RFC822)
     * Storage-Expiration-Time: Timeout (milliseconds)
     * Connection-Unique: UID
     *
     *     Response codes / behavior:
     *         HTTP/1.0 201 Resource Created
     * - Response can be status 201 if the storage was newly created
     *         HTTP/1.0 202 Accepted
     * - Response can be status 202 if the storage already exists#
     *         HTTP/1.0 400 Bad Request
     * - Storage header is invalid, 1 - 64 characters (0-9A-Z_) are expected
     * - XPath is missing or malformed
     * - XPath is used from PATH_INFO + QUERY_STRING, not the request URI
     *         HTTP/1.0 507 Insufficient Storage
     * - Response can be status 507 if the storage is full
     */
    doConnect() {

        if (this.xpath)
            this.quit(400, "Bad Request", {"Message": "Invalid XPath"})

        let response = [201, "Created"]
        if (!this.exists()) {
            let files = fs.readdirSync(Storage.DIRECTORY)
            files = files.filter(file => fs.lstatSync(Storage.DIRECTORY + "/" + file).isFile())
            if (files.length >= Storage.QUANTITY)
                this.quit(507, "Insufficient Storage")
            this.open(true)
        } else response = [202, "Accepted"]

        this.materialize()
        this.quit(response[0], response[1], {"Connection-Unique": this.unique})
    }

    /**
     * OPTIONS is used to query the allowed HTTP methods for an XPath, which is
     * responded with the Allow-header. This method distinguishes between XPath
     * axis and XPath function and uses different Allow headers. Also the
     * existence of the target on an XPath axis has an influence on the
     * response. The method will not use status 404 in relation to non-existing
     * targets, but will offer the methods CONNECT, OPTIONS, PUT via
     * Allow-Header.
     * In the case of an XPath axis, the UIDs of the targets are returned in
     * the Storage-Effects header. Unlike modifier methods like PUT, PATCH and
     * DELETE, the effect suffix (:A/:M/:D) is omitted here.
     * If the XPath is a function, it is executed and thus validated, but
     * without returning the result.
     * The XPath processing is strict and does not accept unnecessary spaces.
     * Faulty XPath will cause the status 400.
     *
     *     Request:
     * OPTIONS /<xpath> HTTP/1.0
     * Storage: 0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ (identifier)
     *
     *     Response:
     * HTTP/1.0 204 Success
     * Storage-Effects: ... (list of UIDs)
     * Storage: 0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ
     * Storage-Revision: Revision (number)
     * Storage-Space: Total/Used (bytes)
     * Storage-Last-Modified: Timestamp (RFC822)
     * Storage-Expiration: Timestamp (RFC822)
     * Storage-Expiration-Time: Timeout (milliseconds)
     *
     *     Response codes / behavior:
     *         HTTP/1.0 204 No Content
     * - Request was successfully executed
     *         HTTP/1.0 400 Bad Request
     * - Storage header is invalid, 1 - 64 characters (0-9A-Z_) are expected
     * - XPath is missing or malformed
     *         HTTP/1.0 404 Resource Not Found
     * - Storage does not exist
     *
     * In addition, OPTIONS can also be used as an alternative to CONNECT,
     * because CONNECT is not an HTTP standard. For this purpose OPTIONS
     * without XPath, but with context path if necessary, is used. In this case
     * OPTIONS will hand over the work to CONNECT.
     *
     * The response for a CONNECT always contains a Connection-Unique header.
     * The Unique is unique in the Datasource and in the Storage and can be
     * used by the client e.g. in XML as attributes to locate his data faster.
     *
     *     Request:
     * OPTIONS / HTTP/1.0
     * Storage: 0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ (identifier)
     *
     *     Request:
     * OPTIONS / HTTP/1.0
     * Storage: 0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ root (identifier)
     *
     *    Response:
     * HTTP/1.0 201 Created
     * Storage: 0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ
     * Storage-Revision: Revision (number)
     * Storage-Space: Total/Used (bytes)
     * Storage-Last-Modified: Timestamp (RFC822)
     * Storage-Expiration: Timestamp (RFC822)
     * Storage-Expiration-Time: Timeout (milliseconds)
     * Connection-Unique: UID
     *
     *     Response:
     * HTTP/1.0 202 Accepted
     * Storage: 0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ
     * Storage-Revision: Revision (number)
     * Storage-Space: Total/Used (bytes)
     * Storage-Last-Modified: Timestamp (RFC822)
     * Storage-Expiration: Timestamp (RFC822)
     * Storage-Expiration-Time: Timeout (milliseconds)
     * Connection-Unique: UID
     *
     *     Response codes / behavior:
     *         HTTP/1.0 201 Resource Created
     * - Response can be status 201 if the storage was newly created
     *         HTTP/1.0 202 Accepted
     * - Response can be status 202 if the storage already exists#
     *         HTTP/1.0 507 Insufficient Storage
     * - Response can be status 507 if the storage is full
     */
    doOptions() {

        // Without XPath (PATH_INFO) behaves like CONNECT,
        // because CONNECT is no HTTP standard.
        // The function call is executed and the request is terminated.
        if (!Object.exists(this.xpath)
                  || this.xpath === "")
            this.doConnect()

        // Without existing storage the request is not valid.
        if (!this.exists())
            this.quit(404, "Resource Not Found")

        // In any case an XPath is required for a valid request.
        if (!Object.exists(this.xpath))
            this.quit(400, "Bad Request", {"Message": "Invalid XPath"})

        let headers = {"Allow": "CONNECT, OPTIONS, GET, POST, PUT, PATCH, DELETE"}

        if (this.xpath.match(Storage.PATTERN_XPATH_FUNCTION)) {
            let result = XPath.select(this.xpath, this.xml)
            if (result instanceof Error) {
                let message = "Invalid XPath function (" + result.message + ")"
                this.quit(400, "Bad Request", {"Message": message})
            }
            headers["Allow"] = "CONNECT, OPTIONS, GET, POST"
        } else {
            let targets = XPath.select(this.xpath, this.xml)
            if (targets instanceof Error) {
                let message = "Invalid XPath axis (" + targets.message + ")"
                this.quit(400, "Bad Request", {"Message": message})
            }
            if (Object.exists(targets) && targets.length > 0) {
                let serials = []
                Array.from(targets).forEach((target) => {
                    if (target.nodeType === XML_ATTRIBUTE_NODE)
                        target = target.ownerElement
                    if (target.nodeType === XML_ELEMENT_NODE)
                        serials.push(target.getAttribute("___uid"))
                });
                if (serials.length > 0)
                    headers["Storage-Effects"] = serials.join(" ")
                headers["Allow"] = "CONNECT, OPTIONS, GET, POST, PUT, PATCH, DELETE"

            } else headers["Allow"] = "CONNECT, OPTIONS, PUT"
        }

        this.quit(204, "No Content", headers);
    }

    /**
     * GET queries data about XPath axes and functions.
     * For this, the XPath axis or function is sent with URI.
     * Depending on whether the request is an XPath axis or an XPath function,
     * different Content-Type are used for the response.
     *
     *     XPath axis
     * Content-Type: application/xslt+xml
     * When the XPath axis addresses one target, the addressed target is the
     * root element of the returned XML structure.
     * If the XPath addresses multiple targets, their XML structure is combined
     * in the root element collection.
     *
     *     XPath function
     * Content-Type: text/plain
     * The result of XPath functions is returned as plain text.
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
     * Storage-Revision: Revision (number)
     * Storage-Space: Total/Used (bytes)
     * Storage-Last-Modified: Timestamp (RFC822)
     * Storage-Expiration: Timestamp (RFC822)
     * Storage-Expiration-Time: Timeout (milliseconds)
     * Content-Length: (bytes)
     *     Response-Body:
     * The result of the XPath request
     *
     *     Response codes / behavior:
     *         HTTP/1.0 200 Success
     * - Request was successfully executed
     *         HTTP/1.0 400 Bad Request
     * - Storage header is invalid, 1 - 64 characters (0-9A-Z_) are expected
     * - XPath is missing or malformed
     *         HTTP/1.0 404 Resource Not Found
     * - Storage does not exist
     * - XPath axis finds no target
     */
    doGet() {

        // Without existing storage the request is not valid.
        if (!this.exists())
            this.quit(404, "Resource Not Found")

        // In any case an XPath is required for a valid request.
        if (!Object.exists(this.xpath))
            this.quit(400, "Bad Request", {"Message": "Invalid XPath"})

        let result = XPath.select(this.xpath, this.xml)
        if (result instanceof Error) {
            let message = "Invalid XPath"
            if (this.xpath.match(Storage.PATTERN_XPATH_FUNCTION))
                message = "Invalid XPath function";
            message += " (" + result.message + ")"
            this.quit(400, "Bad Request", {"Message": message})
        }
        if (!this.xpath.match(Storage.PATTERN_XPATH_FUNCTION)
                && (!Object.exists(result) || result.length <= 0))
            this.quit(404, "Resource Not Found");

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
                        let text = xml.createTextNode(entry.nodeValue);
                        entry = xml.createElement(entry.nodeName);
                        entry.appendChild(text);
                    }
                    collection.appendChild(entry.cloneNode(true));
                })
                xml.appendChild(collection);
                result = xml;
            } else result = ""
        } else if (typeof result === "boolean")
            result = result ? "true" : "false"

        this.quit(200, "Success", null, result);
    }

    /**
     * POST queries data about XPath axes and functions via transformation.
     * For this, an XSLT stylesheet is sent with the request-body, which is
     * then applied by the XSLT processor to the data in storage.
     * Thus the content type application/xslt+xml is always required.
     * The client defines the content type for the output with the output-tag
     * and the method-attribute.
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
     * Storage-Revision: Revision (number)
     * Storage-Space: Total/Used (bytes)
     * Storage-Last-Modified: Timestamp (RFC822)
     * Storage-Expiration: Timestamp (RFC822)
     * Storage-Expiration-Time: Timeout (milliseconds)
     * Content-Length: (bytes)
     *     Response-Body:
     * The result of the transformation
     *
     *     Response codes / behavior:
     *         HTTP/1.0 200 Success
     * - Request was successfully executed
     *         HTTP/1.0 400 Bad Request
     * - Storage header is invalid, 1 - 64 characters (0-9A-Z_) are expected
     * - XPath is missing or malformed
     * - XSLT Stylesheet is erroneous
     *         HTTP/1.0 404 Resource Not Found
     * - Storage does not exist
     * - XPath axis finds no target
     *         HTTP/1.0 415 Unsupported Media Type
     * - Attribute request without Content-Type text/plain
     *         HTTP/1.0 422 Unprocessable Entity
     * - Data in the request body cannot be processed
     */
    doPost() {

        // Without existing storage the request is not valid.
        if (!this.exists())
            this.quit(404, "Resource Not Found")

        // POST always expects an valid XSLT template for transformation.
        let media = (this.request.headers["content-type"] || "").toLowerCase()
        if (media !== Storage.CONTENT_TYPE_XML)
            this.quit(415, "Unsupported Media Type")

        if (this.xpath.match(Storage.PATTERN_XPATH_FUNCTION)) {
            let message = "Invalid XPath (Functions are not supported)"
            this.quit(400, "Bad Request", {"Message": message})
        }

        // POST always expects an valid XSLT template for transformation.
        if (!Object.exists(this.request.data)
                || this.request.data.trim().length <= 0)
            this.quit(422, "Unprocessable Entity", {"Message": "Unprocessable Entity"})

        let xml = this.xml
        if (this.xpath !== "") {
            xml = new DOMImplementation().createDocument();
            let targets = XPath.select(this.xpath, this.xml)
            if (targets instanceof Error) {
                let message = "Invalid XPath axis (" + targets.message + ")"
                this.quit(400, "Bad Request", {"Message": message})
            }
            if (!Object.exists(targets) || targets.length <= 0)
                this.quit(404, "Resource Not Found")
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

        let style = new DOMParser().parseFromString(this.request.data);
        if (!Object.exists(style)
                || style instanceof Error) {
            let message = "Invalid XSLT stylesheet"
            if (xml instanceof Error)
                message += " (" + xml.message + ")"
            this.quit(422, "Unprocessable Entity", {"Message": message})
        }

        // XML/XSLT support in node-js is not the best.
        // Incompletely implemented, difficult to integrate, on Windows libxml2
        // integration is easy but node.js integration is a disaster.
        // Therefore the indirection via Java :-|
        let output
        try {output = XSLT.transformSync({xslt: this.request.data, source: this.serialize(xml), result: Buffer})
        } catch (exception) {
            let message = "Transformation failed"
            if (Object.exists(exception.cause)) {
                let details = exception.message.split(/[\r\n]/g)[1];
                message += " (" + details.replace(/(^.*?(Exception|Error):(.*?:){0,1}\s*)|(\.+$)/g, "") + ")"
            } else message += "(" + exception.message + ")";
            this.quit(422, "Unprocessable Entity", {"Message": message})
        }
        output = output.toString(Storage.XML.ENCODING.toLowerCase())

        let header = {};
        let method = XPath.select("normalize-space(//*[local-name()='output']/@method)", style);
        if (Object.exists(output)
                && output.trim() !== "") {
            method = method.toLowerCase();
            if (method !== "text")
                output = Codec.encode(output, {allowUnsafeSymbols: true})
            if (method === "xml"
                    || method === "")
                if (this.options.includes("json"))
                    output = new DOMParser().parseFromString(output)
                else header["Content-Type"] = Storage.CONTENT_TYPE_XML
            else if (method === "html")
                header["Content-Type"] = Storage.CONTENT_TYPE_HTML
        }

        this.quit(200, "Success", header, output);
    }

    /**
     * PUT creates elements and attributes in storage and/or changes the value
     * of existing ones.
     * The position for the insert is defined via an XPath.
     * For better understanding, the method should be called PUT INTO, because
     * it is always based on an existing XPath axis as the parent target.
     * XPath uses different notations for elements and attributes.
     *
     * The notation for attributes use the following structure at the end.
     *     <XPath>/@<attribute> or <XPath>/attribute.<attribute>
     * The attribute values can be static (text) and dynamic (XPath function).
     * Values are send as request-body.
     * Whether they are used as text or XPath function is decided by the
     * Content-Type header of the request.
     *     text/plain: static text
     *     text/xpath: XPath function
     *
     * If the XPath notation does not match the attributes, elements are
     * assumed. For elements, the notation for pseudo elements is supported:
     *     <XPath>.first, <XPath>.last, <XPath>.before or <XPath>.after
     * Pseudo elements are a relative position specification to the selected
     * element.
     *
     * The value of elements can be static (text), dynamic (XPath function) or
     * be an XML structure. Also here the value is send with the request-body
     * and the type of processing is determined by the Content-Type:
     *     text/plain: static text
     *     text/xpath: XPath function
     *     application/xslt+xml: XML structure
     *
     * The PUT method works resolutely and inserts or overwrites existing data.
     * The XPath processing is strict and does not accept unnecessary spaces.
     * The attributes ___rev / ___uid used internally by the storage are
     * read-only and cannot be changed.
     *
     * In general, if no target can be reached via XPath, status 404 will
     * occur. In all other cases the PUT method informs the client about
     * changes with status 204 and the response headers Storage-Effects and
     * Storage-Revision. The header Storage-Effects contains a list of the UIDs
     * that were directly affected by the change and also contains the UIDs of
     * newly created elements. If no changes were made because the XPath cannot
     * find a writable target, the header Storage-Effects can be omitted
     * completely in the response.
     *
     * Syntactic and semantic errors in the request and/or XPath and/or value
     * can cause error status 400 and 415. If errors occur due to the
     * transmitted request body, this causes status 422.
     *
     *     Request:
     * PUT /<xpath> HTTP/1.0
     * Storage: 0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ (identifier)
     * Content-Length: (bytes)
     * Content-Type: application/xslt+xml
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
     * Storage-Effects: ... (list of UIDs)
     * Storage: 0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ
     * Storage-Revision: Revision (number)
     * Storage-Space: Total/Used (bytes)
     * Storage-Last-Modified: Timestamp (RFC822)
     * Storage-Expiration: Timestamp (RFC822)
     * Storage-Expiration-Time: Timeout (milliseconds)
     *
     *     Response codes / behavior:
     *         HTTP/1.0 204 No Content
     * - Element(s) or attribute(s) successfully created or set
     *         HTTP/1.0 400 Bad Request
     * - Storage header is invalid, 1 - 64 characters (0-9A-Z_) are expected
     * - XPath is missing or malformed
     * - XPath without addressing a target is responded with status 204
     *         HTTP/1.0 404 Resource Not Found
     * - Storage does not exist
     * - XPath axis finds no target
     *         HTTP/1.0 413 Payload Too Large
     * - Allowed size of the request(-body) and/or storage is exceeded
     *         HTTP/1.0 415 Unsupported Media Type
     * - Attribute request without Content-Type text/plain
     *         HTTP/1.0 422 Unprocessable Entity
     * - Data in the request body cannot be processed
     */
    doPut() {

        // Without existing storage the request is not valid.
        if (!this.exists())
            this.quit(404, "Resource Not Found")

        // In any case an XPath is required for a valid request.
        if (!Object.exists(this.xpath)
                || this.xpath === "")
            this.quit(400, "Bad Request", {"Message": "Invalid XPath"})

        // Storage::SPACE also limits the maximum size of writing request(-body).
        // If the limit is exceeded, the request is quit with status 413.
        if (Object.exists(this.request.data)
                && this.request.data.length > Storage.SPACE)
            this.quit(413, "Payload Too Large")

        // For all PUT requests the Content-Type is needed, because for putting
        // in XML structures and text is distinguished.
        if ((this.request.headers["content-type"] || "") === "")
            this.quit(415, "Unsupported Media Type")

        if (this.xpath.match(Storage.PATTERN_XPATH_FUNCTION)) {
            let message = "Invalid XPath (Functions are not supported)"
            this.quit(400, "Bad Request", {"Message": message})
        }

        let headers = {}

        // PUT requests can address attributes and elements via XPath.
        // Multi-axis XPaths allow multiple targets.
        // The method only supports these two possibilities, other requests are
        // responsed with an error, because this situation cannot occur because
        // the XPath is recognized as XPath for an attribute and otherwise an
        // element is assumed.
        // In this case it can only happen that the XPath does not address a
        // target, which is not an error in the true sense. It only affects the
        // Storage-Effects header.
        // Therefore there is only one decision here.

        // XPath can address elements and attributes.
        // If the XPath ends with /attribute.<attribute> or /@<attribute> an
        // attribute is expected, in all other cases a element.

        let matches = this.xpath.match(Storage.PATTERN_XPATH_ATTRIBUTE)
        if (matches) {

            // The following Content-Type is supported for attributes:
            // - text/plain for static values (text)
            // - text/xpath for dynamic values, based on XPath functions

            // For attributes only the Content-Type text/plain and text/xpath
            // are supported, for other Content-Types no conversion exists.
            let media = (this.request.headers["content-type"] || "").toLowerCase()
            if (![Storage.CONTENT_TYPE_TEXT, Storage.CONTENT_TYPE_XPATH].includes(media))
                this.quit(415, "Unsupported Media Type")

            let input = this.request.data

            // The Content-Type text/xpath is a special of the XMXE Storage.
            // It expects a plain text which is an XPath function.
            // The XPath function is first once applied to the current XML
            // document from the storage and the result is put like the
            // Content-Type text/plain. Even if the target is mutable, the
            // XPath function is executed only once and the result is put on
            // all targets.
            if (media.toLowerCase() === Storage.CONTENT_TYPE_XPATH) {
                if (!input.match(Storage.PATTERN_XPATH_FUNCTION)) {
                    let message = "Invalid XPath (Axes are not supported)"
                    this.quit(422, "Unprocessable Entity", {"Message": message})
                }
                input = XPath.select(input, this.xml)
                if (!Object.exists(input)
                        || input instanceof Error) {
                    let message = "Invalid XPath function"
                    if (input instanceof Error)
                        message += " (" + input.message + ")"
                    this.quit(422, "Unprocessable Entity", {"Message": message})
                }
            }

            // From here on it continues with a static value for the attribute.

            let xpath = matches[1]
            let attribute = matches[2]

            let targets = XPath.select(xpath, this.xml)
            if (input instanceof Error) {
                let message = "Invalid XPath axis (" + input.message + ")"
                this.quit(400, "Bad Request", {"Message": message})
            }
            if (!Object.exists(targets) || targets.length <= 0)
                this.quit(404, "Resource Not Found")

            // The attributes ___rev and ___uid are essential for the internal
            // organization and management of the data and cannot be changed.
            // PUT requests for these attributes are ignored and behave as if
            // no matching node was found. It should say request understood and
            // executed but without effect.
            if (!["___rev", "___uid"].includes(attribute)) {
                let serials = []
                targets.forEach((target) => {
                    // Only elements are supported, this prevents the
                    // addressing of the XML document by the XPath.
                    if (target.nodeType !== XML_ELEMENT_NODE)
                        return
                    serials.push(target.getAttribute("___uid") + ":M")
                    target.setAttribute(attribute, input)
                    // The revision is updated at the parent nodes, so you
                    // can later determine which nodes have changed and
                    // with which revision. Partial access allows the
                    // client to check if the data or a tree is still up to
                    // date, because he can compare the revision.
                    Storage.updateNodeRevision(target, this.revision +1)
                })

                // Only the list of serials is an indicator that data has
                // changed and whether the revision changes with it.
                // If necessary the revision must be corrected if there are
                // no data changes.
                if (serials.length > 0)
                    headers["Storage-Effects"] = serials.join(" ")
            }

            this.materialize()
            this.quit(204, "No Content", headers)
        }

        // An XPath for element(s) is then expected here.
        // If this is not the case, the request is responded with status 400.
        matches = this.xpath.match(Storage.PATTERN_XPATH_PSEUDO)
        if (!matches)
            this.quit(400, "Bad Request", {"Message": "Invalid XPath axis"})

        let xpath = matches[1]
        let pseudo = (matches[2] || "").toLowerCase()

        // The following Content-Type is supported for elements:
        // - application/xslt+xml for XML structures
        // - text/plain for static values (text)
        // - text/xpath for dynamic values, based on XPath functions

        let media = (this.request.headers["content-type"] || "").toLowerCase()
        if ([Storage.CONTENT_TYPE_TEXT, Storage.CONTENT_TYPE_XPATH].includes(media)) {

            // The combination with a pseudo element is not possible for a text
            // value. Response with status 415 (Unsupported Media Type).
            if (pseudo !== "")
                this.quit(415, "Unsupported Media Type")

            let input = this.request.data

            // The Content-Type text/xpath is a special of the XMXE Storage.
            // It expects a plain text which is an XPath function.
            // The XPath function is first once applied to the current XML
            // document from the storage and the result is put like the
            // Content-Type text/plain. Even if the target is mutable, the
            // XPath function is executed only once and the result is put on
            // all targets.
            if (media === Storage.CONTENT_TYPE_XPATH) {
                if (!input.match(Storage.PATTERN_XPATH_FUNCTION)) {
                    let message = "Invalid XPath (Axes are not supported)"
                    this.quit(422, "Unprocessable Entity", {"Message": message})
                }
                input = XPath.select(input, this.xml)
                if (!Object.exists(input)
                        || input instanceof Error) {
                    let message = "Invalid XPath function"
                    if (input instanceof Error)
                        message += " (" + input.message + ")"
                    this.quit(422, "Unprocessable Entity", {"Message": message})
                }
            }

            let serials = []
            let targets = XPath.select(xpath, this.xml)
            if (targets instanceof Error) {
                let message = "Invalid XPath axis (" + input.message + ")"
                this.quit(400, "Bad Request", {"Message": message})
            }
            if (!Object.exists(targets) || targets.length <= 0)
                this.quit(404, "Resource Not Found")

            targets.forEach((target) => {
                // Overwriting of the root element is not possible, as it
                // is an essential part of the storage, and is ignored. It
                // does not cause to an error, so the behaviour is
                // analogous to putting attributes.
                if (target.nodeType !== XML_ELEMENT_NODE)
                    return
                serials.push(target.getAttribute("___uid") + ":M")
                // A bug in common-xml-features sets the documentElement to
                // null when using replaceChild. Therefore the quick way:
                //     clone/add/replace -- is not possible.
                while (target.lastChild)
                    target.removeChild(target.lastChild)
                target.appendChild(this.xml.createTextNode(input))
                // The revision is updated at the parent nodes, so you can
                // later determine which nodes have changed and with which
                // revision. Partial access allows the client to check if
                // the data or a tree is still up to date, because he can
                // compare the revision.
                Storage.updateNodeRevision(target, this.revision +1)
            })

            // Only the list of serials is an indicator that data has changed
            // and whether the revision changes with it. If necessary the
            // revision must be corrected if there are no data changes.
            if (serials.length > 0)
                headers["Storage-Effects"] = serials.join(" ")

            this.materialize()
            this.quit(204, "No Content", headers)
        }

        // Only an XML structure can be inserted, nothing else is supported.
        // So only the Content-Type application/xslt+xml can be used.
        if (media !== Storage.CONTENT_TYPE_XML)
            this.quit(415, "Unsupported Media Type")

        // The request body must also be a valid XML structure in data
        // container, otherwise the request is quit with an error.
        let input = "<data>" + (this.request.data || "") + "</data>"

        // The XML is loaded, but what happens if an error occurs during
        // parsing? Status 400 or 422 - The decision for 422, because 400 means
        // faulty request. But this is a (semantic) error in the request body.
        let xml = new DOMParser().parseFromString(input, Storage.CONTENT_TYPE_XML, true)
        if (!Object.exists(xml)
                || input instanceof Error) {
            let message = "Invalid XML document"
            if (xml instanceof Error)
                message += " (" + xml.message + ")"
            this.quit(422, "Unprocessable Entity", {"Message": message})
        }

        // The attributes ___rev and ___uid are essential for the internal
        // organization and management of the data and cannot be changed.
        // When inserting, the attributes ___rev and ___uid are set
        // automatically. These attributes must not be  contained in the XML
        // structure to be inserted, because all XML elements without ___uid
        // attributes are determined after insertion and it is assumed that
        // they have been newly inserted. This approach was chosen to avoid a
        // recursive search/iteration in the XML structure to be inserted.
        let nodes = XPath.select("//*[@___rev|@___uid]", xml)
        nodes.forEach((node) => {
            node.removeAttribute("___rev")
            node.removeAttribute("___uid")
        })

        let serials = []
        if (xml.documentElement.hasChildNodes()) {
            let targets = XPath.select(xpath, this.xml)
            if (targets instanceof Error) {
                let message = "Invalid XPath axis (" + targets.message + ")"
                this.quit(400, "Bad Request", {"Message": message})
            }
            if (!Object.exists(targets) || targets.length <= 0)
                this.quit(404, "Resource Not Found")

            targets.forEach((target) => {

                let inserts = Array.from(xml.documentElement.childNodes)
                        .map(insert => insert.cloneNode(true))

                // Overwriting of the root element is not possible, as it
                // is an essential part of the storage, and is ignored. It
                // does not cause to an error, so the behaviour is
                // analogous to putting attributes.
                if (target.nodeType !== XML_ELEMENT_NODE)
                    return

                // Pseudo elements can be used to put in an XML
                // substructure relative to the selected element.
                if (pseudo === "") {
                    // The UIDs of the children that are removed by the
                    // replacement are determined for storage effects.
                    let childs = XPath.select(".//*[@___uid]", target)
                    childs.forEach((child) => {
                        serials.push(child.getAttribute("___uid") + ":D")
                    })
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
                        nodes = []
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
                        target.appendChild(insert)
                    })
                } else this.quit(400, "Bad Request", {"Message": "Invalid XPath axis (Unsupported pseudo syntax found)"})
            })
        }

        // The attribute ___uid of all newly inserted elements is set.
        // It is assumed that all elements without the  ___uid attribute are
        // new. The revision of all affected nodes are updated, so you can
        // later determine which nodes have changed and with which revision.
        // Partial access allows the client to check if the data or a tree is
        // still up to date, because he can compare the revision.
        nodes = XPath.select("//*[not(@___uid)]", this.xml)
        nodes.forEach((node) => {
            let serial = this.getSerial()
            serials.push(serial + ":A")
            node.setAttribute("___uid", serial)
            Storage.updateNodeRevision(node, this.revision +1)

            // Also the UID of the directly addressed element is transmitted to
            // the client in the response, because the element itself has not
            // changed, but its content has. Other parent elements are not
            // listed because they are only indirectly affected. So the
            // behaviour is analogous to putting attributes.
            if (node.parentNode.nodeType !== XML_ELEMENT_NODE)
                return
            serial = node.parentNode.getAttribute("___uid")
            if (Object.exists(serial)
                    && !serials.includes(serial + ":A", serials)
                    && !serials.includes(serial + ":M", serials))
                serials.push(serial + ":M")
        })

        // Only the list of serials is an indicator that data has changed and
        // whether the revision changes with it. If necessary the revision must
        // be corrected if there are no data changes.
        if (serials)
            headers["Storage-Effects"] = serials.join(" ")

        this.materialize()
        this.quit(204, "No Content", headers)
    }

    /**
     * PATCH changes existing elements and attributes in storage.
     * The position for the insert is defined via an XPath.
     * The method works almost like PUT, but the XPath axis of the request
     * always expects an existing target.
     * XPath uses different notations for elements and attributes.
     *
     * The notation for attributes use the following structure at the end.
     *     <XPath>/@<attribute> or <XPath>/attribute.<attribute>
     * The attribute values can be static (text) and dynamic (XPath function).
     * Values are send as request-body.
     * Whether they are used as text or XPath function is decided by the
     * Content-Type header of the request.
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
     *     text/plain: static text
     *     text/xpath: XPath function
     *     application/xslt+xml: XML structure
     *
     * The PATCH method works resolutely and  overwrites existing data.
     * The XPath processing is strict and does not accept unnecessary spaces.
     * The attributes ___rev / ___uid used internally by the storage are
     * read-only and cannot be changed.
     *
     * In general, if no target can be reached via XPath, status 404 will
     * occur. In all other cases the PATCH method informs the client about
     * changes with status 204 and the response headers Storage-Effects and
     * Storage-Revision. The header Storage-Effects contains a list of the UIDs
     * that were directly affected by the change elements. If no changes were
     * made because the XPath cannot find a writable target, the header
     * Storage-Effects can be omitted completely in the response.
     *
     * Syntactic and semantics errors in the request and/or XPath and/or value
     * can cause error status 400 and 415. If errors occur due to the
     * transmitted request body, this causes status 422.
     *
     *     Request:
     * PATCH /<xpath> HTTP/1.0
     * Storage: 0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ (identifier)
     * Content-Length: (bytes)
     * Content-Type: application/xslt+xml
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
     * Storage-Effects: ... (list of UIDs)
     * Storage: 0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ
     * Storage-Revision: Revision (number)
     * Storage-Space: Total/Used (bytes)
     * Storage-Last-Modified: Timestamp (RFC822)
     * Storage-Expiration: Timestamp (RFC822)
     * Storage-Expiration-Time: Timeout (milliseconds)
     *
     *     Response codes / behavior:
     *         HTTP/1.0 204 No Content
     * - Element(s) or attribute(s) successfully created or set
     *         HTTP/1.0 400 Bad Request
     * - Storage header is invalid, 1 - 64 characters (0-9A-Z_) are expected
     * - XPath is missing or malformed
     * - XPath without addressing a target is responded with status 204
     *         HTTP/1.0 404 Resource Not Found
     * - Storage does not exist
     * - XPath axis finds no target
     *         HTTP/1.0 413 Payload Too Large
     * - Allowed size of the request(-body) and/or storage is exceeded
     *         HTTP/1.0 415 Unsupported Media Type
     * - Attribute request without Content-Type text/plain
     *         HTTP/1.0 422 Unprocessable Entity
     * - Data in the request body cannot be processed
     */
    doPatch() {

        // PATCH is implemented like PUT.
        // There are some additional conditions and restrictions that will be
        // checked. After that the answer to the request can be passed to PUT.
        // - Pseudo elements are not supported
        // - Target must exist, particularly for attributes

        // Without existing storage the request is not valid.
        if (!this.exists())
            this.quit(404, "Resource Not Found")

        // In any case an XPath is required for a valid request.
        if (!Object.exists(this.xpath)
            || this.xpath === "")
            this.quit(400, "Bad Request", {"Message": "Invalid XPath"})

        // Storage::SPACE also limits the maximum size of writing request(-body).
        // If the limit is exceeded, the request is quit with status 413.
        if (Object.exists(this.request.data)
            && this.request.data.length > Storage.SPACE)
            this.quit(413, "Payload Too Large")

        // For all PUT requests the Content-Type is needed, because for putting
        // in XML structures and text is distinguished.
        if ((this.request.headers["content-type"] || "") === "")
            this.quit(415, "Unsupported Media Type")

        if (this.xpath.match(Storage.PATTERN_XPATH_FUNCTION)) {
            let message = "Invalid XPath (Functions are not supported)"
            this.quit(400, "Bad Request", {"Message": message})
        }

        let targets = XPath.select(this.xpath, this.xml)
        if (targets instanceof Error) {
            let message = "Invalid XPath axis (" + targets.message + ")"
            this.quit(400, "Bad Request", {"Message": message})
        }

        if (!this.xpath.match(Storage.PATTERN_XPATH_ATTRIBUTE)
                && this.xpath.match(/::((\w+)*\)*){0,1}((?:!+\w*){0,})$/)) {
            let message = "Invalid XPath axis"
            this.quit(400, "Bad Request", {"Message": message})
        }

        if (!Object.exists(targets) || targets.length <= 0)
            this.quit(404, "Resource Not Found")

        // The response to the request is delegated to PUT.
        // The function call is executed and the request is terminated.
        this.doPut();
    }

    /**
     * DELETE deletes elements and attributes in the storage.
     * The position for deletion is defined via an XPath.
     * XPath uses different notations for elements and attributes.
     *
     * The notation for attributes use the following structure at the end.
     *     <XPath>/@<attribute> or <XPath>/attribute.<attribute>
     *
     * If the XPath notation does not match the attributes, elements are
     * assumed. For elements, the notation for pseudo elements is supported:
     *     <XPath>.first, <XPath>.last, <XPath>.before or <XPath>.after
     * Pseudo elements are a relative position specification to the selected
     * element.
     *
     * The DELETE method works resolutely and deletes existing data.
     * The XPath processing is strict and does not accept unnecessary spaces.
     * The attributes ___rev / ___uid used internally by the storage are
     * read-only and cannot be changed.
     *
     * In general, if no target can be reached via XPath, status 404 will
     * occur. In all other cases the DELETE method informs the client about
     * changes with status 204 and the response headers Storage-Effects and
     * Storage-Revision. The header Storage-Effects contains a list of the UIDs
     * that were directly affected by the change and also contains the UIDs of
     * newly created elements (e.g. when the root element is deleted, a new one
     * is automatically created). If no changes were made because the XPath
     * cannot find a writable target, the header Storage-Effects can be omitted
     * completely in the response.
     *
     * Syntactic and semantic errors in the request and/or XPath can cause
     * error status 400.
     *
     *     Request:
     * DELETE /<xpath> HTTP/1.0
     * Storage: 0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ (identifier)
     *
     *     Response:
     * HTTP/1.0 204 No Content
     * Storage-Effects: ... (list of UIDs)
     * Storage: 0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ
     * Storage-Revision: Revision (number)
     * Storage-Space: Total/Used (bytes)
     * Storage-Last-Modified: Timestamp (RFC822)
     * Storage-Expiration: Timestamp (RFC822)
     * Storage-Expiration-Time: Timeout (milliseconds)
     *
     *     Response codes / behavior:
     *         HTTP/1.0 204 No Content
     * - Element(s) or attribute(s) successfully deleted
     *         HTTP/1.0 400 Bad Request
     * - Storage header is invalid, 1 - 64 characters (0-9A-Z_) are expected
     * - XPath is missing or malformed
     * - XPath without addressing a target is responded with status 204
     *         HTTP/1.0 404 Resource Not Found
     * - Storage does not exist
     * - XPath axis finds no target
     */
    doDelete() {

        // Without existing storage the request is not valid.
        if (!this.exists())
            this.quit(404, "Resource Not Found")

        // In any case an XPath is required for a valid request.
        if (!Object.exists(this.xpath)
                || this.xpath === "")
            this.quit(400, "Bad Request", {"Message": "Invalid XPath"})

        if (this.xpath.match(Storage.PATTERN_XPATH_FUNCTION)) {
            let message = "Invalid XPath (Functions are not supported)"
            this.quit(400, "Bad Request", {"Message": message})
        }

        let xpath = this.xpath
        let pseudo = ""
        if (!this.xpath.match(Storage.PATTERN_XPATH_ATTRIBUTE)) {
            // An XPath for element(s) is then expected here.
            // If this is not the case, the request is responded with status 400.
            let matches = this.xpath.match(Storage.PATTERN_XPATH_PSEUDO)
            if (!matches)
                this.quit(400, "Bad Request", {"Message": "Invalid XPath axis"})
            xpath = matches[1];
            pseudo = (matches[2] || "").toLowerCase()
        }

        let targets = XPath.select(xpath, this.xml)
        if (targets instanceof Error) {
            let message = "Invalid XPath axis (" + targets.message + ")"
            this.quit(400, "Bad Request", {"Message": message})
        }

        if (!Object.exists(targets) || targets.length <= 0)
            this.quit(404, "Resource Not Found");

        // Pseudo elements can be used to delete in an XML substructure
        // relative to the selected element.
        if (pseudo !== "") {
            if (pseudo === "before") {
                let childs = [];
                targets.forEach((target) => {
                    if (!target.previousSibling)
                        return
                    for (let previous = target.previousSibling; previous; previous = previous.previousSibling)
                        childs.push(previous)
                })
                targets = childs
            } else if (pseudo === "after") {
                let childs = [];
                targets.forEach((target) => {
                    if (!target.nextSibling)
                        return
                    for (let next = target.nextSibling; next; next = next.nextSibling)
                        childs.push(next);
                })
                targets = childs
            } else if (pseudo === "first") {
                targets = targets.map(target => target.firstChild)
                targets = targets.filter(Object.exists)
            } else if (pseudo === "last") {
                targets = targets.map(target => target.lastChild)
                targets = targets.filter(Object.exists)
            } else this.quit(400, "Bad Request", {"Message": "Invalid XPath axis (Unsupported pseudo syntax found)"});
        }

        let serials = [];
        targets.forEach((target) => {
            if (target.nodeType === XML_ATTRIBUTE_NODE) {
                if (!target.ownerElement
                        || target.ownerElement.nodeType !== XML_ELEMENT_NODE
                        || ["___rev", "___uid"].includes(target.name))
                    return
                let parent = target.ownerElement;
                parent.removeAttribute(target.name);
                serials.push(parent.getAttribute("___uid") + ":M")
                Storage.updateNodeRevision(parent, this.revision +1)
            } else if (target.nodeType !== XML_DOCUMENT_NODE) {
                let parent = target.parentNode;
                if (!Object.exists(parent)
                        || ![XML_ELEMENT_NODE, XML_DOCUMENT_NODE].includes(parent.nodeType))
                    return
                if (Object.exists(target.getAttribute)) {
                    serials.push(target.getAttribute("___uid") + ":D")
                    let nodes = XPath.select(".//*[@___uid]", target)
                    nodes.forEach((node) => {
                        serials.push(node.getAttribute("___uid") + ":D")
                    })
                }
                parent.removeChild(target)
                if (parent.nodeType === XML_DOCUMENT_NODE) {
                    target = this.xml.createElement(this.root)
                    target = this.xml.appendChild(target)
                    Storage.updateNodeRevision(target, this.revision +1)
                    let serial = this.getSerial()
                    serials.push(serial + ":A")
                    target.setAttribute("___uid", serial)
                } else {
                    serials.push(parent.getAttribute("___uid") + ":M")
                    Storage.updateNodeRevision(parent, this.revision +1)
                }
            }
        })

        let headers = {}

        // Only the list of serials is an indicator that data has changed and
        // whether the revision changes with it. If necessary the revision must
        // be corrected if there are no data changes.
        if (serials)
            headers["Storage-Effects"] = serials.join(" ")

        this.materialize();
        this.quit(204, "No Content", headers);
    }

    /**
     * Quit sends a response and ends the connection and closes the storage.
     * The behavior of the method is hard.
     * A response status and a response message are expected.
     * Optionally, additional headers and data for the response body can be
     * passed. Headers for storage and data length are set automatically. Data
     * from the response body is only sent to the client if the response status
     * is in class 2xx. This also affects the dependent headers Content-Type
     * and Content-Length.
     * @param {number} status
     * @param {string} message
     * @param {object} headers
     * @param {string} data
     */
    quit(status, message, headers = undefined, data = undefined) {

        if (this.response.headersSent) {
            // The response are already complete.
            // The storage can be closed and the requests can be terminated.
            this.close()
            throw Object.getPrototypeOf(this).quit
        }

        // This is implemented for scanning and modification of headers.
        // To remove, the headers are set before, so that standard headers like
        // Content-Type are also removed correctly.
        let fetchHeader = (headers, name, remove = false) => {
            if (!Object.exists(headers))
                return
            let result = undefined
            Object.entries(headers).forEach((entry) => {
                const [key, value] = entry
                if (key.toLowerCase() !== name.toLowerCase())
                    return
                if (remove)
                    delete headers[key]
                result = {"name":key, "value":value}
            })
            return result
        }

        if (typeof headers !== "object")
            headers = {}
        if (typeof Storage.CORS === "object")
            headers = {...headers, ...Storage.CORS}

        // Access-Control headers are received during preflight OPTIONS request
        if (this.request.method.toUpperCase() === "OPTIONS") {
            if (this.request.headers["access-control-request-method"])
                headers["Access-Control-Allow-Methods"] = "CONNECT, OPTIONS, GET, POST, PUT, PATCH, DELETE"
            if (this.request.headers["access-control-request-headers"])
                headers["Access-Control-Allow-Headers"] = this.request.headers["access-control-request-headers"]
        }

        // For status class 2xx the storage headers are added.
        // The revision is read from the current storage because it can change.
        if (status >= 200 && status < 300
                && this.storage
                && this.xml)
            headers = {...headers, ...{
                "Storage": this.storage,
                "Storage-Revision": this.xml.documentElement.getAttribute("___rev"),
                "Storage-Space": Storage.SPACE + "/" + this.getSize() + " bytes",
                "Storage-Last-Modified": new Date().toUTCString(),
                "Storage-Expiration": new Date(new Date().getTime() +(Storage.TIMEOUT *1000)).toUTCString(),
                "Storage-Expiration-Time": (Storage.TIMEOUT *1000) + " ms"
            }}

        // The response from the Storage-Effects header can be very extensive.
        // With the Request-Header Accept-Effects you can define which classes
        // of UIDs are returned to the client, comparable to a filter.
        // There are the classes case-insensitive  ADD, MODIFIED and DELETED
        // and the pseudonym NONE, which deselects all classes and ALL, which
        // selects all classes.
        // If no Accept-Effects header is specified, the default is:
        //     ADDED MODIFIED
        // Except for the DELETE method, which is the default:
        //     MODIFIED DELETED
        // Sorting of efficacy / priority (1 is highest):
        //     1:ALL 2:NONE 3:DELETED 3:MODIFIED 3:ADDED

        // Before that, the effects are minimized by removing obsolete entries.
        // Obsolete entries are caused by a relative XPath in the PUT, PATCH
        // and DELETE methods when elements are recursively modified and then
        // also deleted.

        let serials = fetchHeader(headers, "Storage-Effects", true)
        serials = serials ? serials.value : ""
        if (serials) {
            serials = serials.split(/\s+/)
            serials = [...new Set(serials)]
            serials.forEach((serial) => {
                if (serial.slice(-2) !== ":D")
                    return
                var search = serial.slice(0, -2) + ":M"
                search = serials.indexOf(search)
                if (search >= 0)
                    delete serials[search]
                var search = serial.slice(0, -2) + ":A"
                search = serials.indexOf(search)
                if (search >= 0)
                    delete serials[search];
            })
            serials = serials.join(" ")
        }

        let accepts = fetchHeader(this.request.headers, "Accept-Effects", false)
        accepts = accepts ? accepts.value.toLowerCase() : ""
        accepts = accepts ? accepts.split(/\s+/) : null
        let pattern = []
        if (this.request.method.toUpperCase() !== "DELETE") {
            if (accepts
                    && !accepts.includes("added"))
                pattern.push("A")
            if (!accepts
                    || !accepts.includes("deleted"))
                pattern.push("D")
        } else {
            if (!accepts
                    || !accepts.includes("added"))
                pattern.push("A")
            if (accepts
                    && !accepts.includes("deleted"))
                pattern.push("D")
        }
        if (accepts
                && !accepts.includes("modified"))
            pattern.push("M")
        if (accepts
                && accepts.includes("none"))
            pattern = ["A", "M", "D"]
        if (accepts
                && accepts.includes("all"))
            pattern = []
        if (pattern)
            serials = serials.replace(new RegExp("\\s*\\w+:\\w+:[" + pattern.join("|") + "]\\s*", "ig"), " ")
        serials = serials.replace(/s{2,}/g, " ").trim()
        if (serials)
            headers["Storage-Effects"] = serials

        Object.keys(headers).forEach((key) => {
            if (key.toLowerCase() === "content-length")
                delete headers[key]
        })

        let media = fetchHeader(headers, "Content-Type", true)
        media = media ? media.value : ""
        if (status === 200
                && Object.exists(data)
                && data !== "") {
            if (!media) {
                if (this.options.includes("json")) {
                    media = Storage.CONTENT_TYPE_JSON
                    data = JSON.stringify(data)
                } else {
                    if (Object.getClassName(data) === "Document") {
                        media = Storage.CONTENT_TYPE_XML
                        data = this.serialize(data)
                    } else media = Storage.CONTENT_TYPE_TEXT
                }
            }
            headers["Content-Type"] = media
        }

        data = Object.exists(data) ? String(data) : ""

        if (status >= 200 && status < 300)
            if (data !== "" || status === 200)
                headers["Content-Length"] = new Buffer(data).length

        // When responding to an error, the default Allow header is added.
        // But only if no Allow header was passed.
        // So the header does not always have to be added manually.
        if ([201, 202, 405].includes(status)
                && Object.keys(headers).filter(header => header.toLowerCase() === "allow").length <= 0)
            headers["Allow"] = "CONNECT, OPTIONS, GET, POST, PUT, PATCH, DELETE"

        headers["Execution-Time"] = (new Date().getTime() -this.request.timing) + " ms"

        {{{

            // Trace is primarily intended to simplify the validation of requests,
            // their impact on storage and responses during testing.
            // Based on hash values the correct function can be checked.
            // In the released versions the implementation is completely removed.
            // Therefore the code may use computing time or the implementation may
            // not be perfect.

            let cryptoMD5 = (text) => {
                return crypto.createHash("MD5").update(text).digest("hex")
            }

            let trace = []

            // Request-Header-Hash
            let hash = JSON.stringify({
                "Method": this.request.method.toUpperCase(),
                "URI": decodeURI(this.request.url),
                "Storage": (this.request.headers["storage"] || ""),
                "Content-Length": (this.request.headers["content-length"] || "").toUpperCase(),
                "Content-Type": (this.request.headers["content-type"] || "").toUpperCase()
            })
            headers["Trace-Request-Header-Hash"] = cryptoMD5(hash)
            trace.push(cryptoMD5(hash) + " Trace-Request-Header-Hash", hash)

            // Request-Body-Hash
            hash = Object.exists(this.request.data) ? this.request.data : ""
            hash = hash.replace(/((\r\n)|(\r\n)|\r)+/g, "\n")
            hash = hash.replace(/\t/g, " ")
            headers["Trace-Request-Body-Hash"] = cryptoMD5(hash)
            trace.push(cryptoMD5(hash) + " Trace-Request-Body-Hash")

            // Response-Header-Hash
            // Only the XMEX relevant headers are used.
            let composite = {...headers}
            Object.keys(composite).forEach((header) => {
                if (!["storage", "storage-revision", "storage-space",
                        "allow", "content-length", "content-type", "message"].includes(header.toLowerCase()))
                    delete composite[header]
            })

            // Storage-Effects are never the same with UIDs.
            // Therefore, the UIDs are normalized and the header is simplified to
            // make it comparable. To do this, it is only determined how many
            // unique's there are, in which order they are arranged and which
            // serials each unique has.
            let serials = fetchHeader(headers, "Storage-Effects", false)
            serials = serials ? serials.value : ""
            if (serials) {
                let counter = [0, 0, 0, 0]
                let effects = {}
                serials.split(/\s+/).forEach((uid) => {
                    uid = uid.split(/:/)
                    if (!Object.exists(effects[uid[0]]))
                        effects[uid[0]] = []
                    effects[uid[0]].push(uid[1])
                    if (uid.length < 3)
                        counter[3]++
                    else if (uid[2] === "A")
                        counter[0]++
                    else if (uid[2] === "M")
                        counter[1]++
                    else if (uid[2] === "D")
                        counter[2]++
                })
                let keys = [...Object.keys(effects)]
                keys.sort()
                keys.forEach((key) => {
                    let value = effects[key]
                    value.sort((v1, v2) => parseInt(v1) -parseInt(v2))
                    delete effects[key]
                    effects[key] = value.join(":")
                })
                composite["Storage-Effects"] = `${counter[0]}xA/${counter[1]}xM/${counter[2]}xD/${counter[3]}xN`
                    + " #" + Object.values(effects).join(" #")
            }

            // Connection-Unique header is unique and only checked for presence.
            Object.keys(headers).forEach((header) => {
                if (header.toLowerCase() === "connection-unique")
                    composite[header] = ""
            })

            hash = []
            Object.entries(composite).forEach((entry) => {
                const [key, value] = entry
                hash.push(Object.exists(value) && String(value).trim() !== "" ? key + ": " + value : key)
            })

            // Status Message should not be used because different hashes may be
            // calculated for tests on different web servers.
            hash.push(status)
            hash.sort()
            headers["Trace-Response-Header-Hash"] = cryptoMD5(hash.join("\n"))
            trace.push(cryptoMD5(hash.join("\n")) + " Trace-Response-Header-Hash", JSON.stringify(hash))

            // Response-Body-Hash
            hash = data.replace(/((\r\n)|(\r\n)|\r)+/g, "\n")
            hash = hash.replace(/\t/g, " ")
            // The UID is variable and must be normalized so that the hash can be
            // compared later. Therefore the uniques of the UIDs are collected in
            // an array. The index in the array is then the new unique.
            let uniques = []
            hash = hash.replace(/\b(___uid(?:(?:=)|(?:"\s*:\s*))")([A-Z\d]+)(:[A-Z\d]+")/ig, (matched, prefix, unique, serial) => {
                if (!uniques.includes(unique))
                    uniques.push(unique)
                unique = uniques.indexOf(unique);
                return prefix + unique + serial;
            })
            headers["Trace-Response-Body-Hash"] = cryptoMD5(hash)
            trace.push(cryptoMD5(hash) + " Trace-Response-Body-Hash")

            // Storage-Hash
            // Also the storage cannot be compared directly, because here the UID's
            // use a unique changeable prefix. Therefore the XML is reloaded and
            // all ___uid attributes are normalized. For this purpose, the unique
            // of the UIDs is determined, sorted and then replaced by the index
            // during sorting.
            hash = this.xml ? this.serialize() : ""
            if (hash) {
                let xml = new DOMParser().parseFromString(hash, Storage.CONTENT_TYPE_XML)
                uniques = []
                let targets = XPath.select("//*[@___uid]", xml)
                targets.forEach((target) => {
                    uniques.push(target.getAttribute("___uid"))
                })
                uniques.sort()
                uniques.forEach((uid, index) => {
                    let target = XPath.select("//*[@___uid=\"" + uid + "\"]", xml)[0]
                    target.setAttribute("___uid", uid.replace(/^.*(?=:)/, index))
                })
                hash = this.serialize(xml)
            }
            hash = hash.replace(/\s+/gs, " ")
            hash = hash.replace(/\s+(?=[<>])/gs, "")
            hash = hash.trim()
            headers["Trace-Storage-Hash"] = cryptoMD5(hash)
            trace.push(cryptoMD5(hash) + " Trace-Storage-Hash")

            headers["Trace-XPath-Hash"] = cryptoMD5(this.xpath || "")
            trace.push(cryptoMD5(this.xpath || "") + " Trace-XPath-Hash", this.xpath || "")

            hash = [
                headers["Trace-Request-Header-Hash"],
                headers["Trace-Request-Body-Hash"],
                headers["Trace-Response-Header-Hash"],
                headers["Trace-Response-Body-Hash"],
                headers["Trace-Storage-Hash"],
                headers["Trace-XPath-Hash"]
            ]
            headers["Trace-Composite-Hash"] = cryptoMD5(hash.join(" "))
            trace.push(cryptoMD5(hash.join(" ")) + " Trace-Composite-Hash")
            trace = trace.filter(entry => Object.exists(entry) && entry.trim().length > 0)

            trace = "\t" + trace.join(EOL + "\t") + EOL
            if (this.xml && this.xml.documentElement)
                trace = "\tStorage Identifier: " + this.storage + " Revision:" + this.xml.documentElement.getAttribute("___rev") + " Space:" + this.getSize() + EOL + trace
            trace = "\tResponse Status:" + status + " Length:" + (data || "").length + EOL + trace
            trace = "\tRequest Method:" + this.request.method.toUpperCase() + " XPath:" + this.xpath + " Length:" + (this.request.data || "").length + EOL + trace
            trace = cryptoMD5(hash.join(" ")) + EOL + trace

            if (fs.existsSync("trace.log")
                    && fs.statSync("trace.log").size > 0
                    && (new Date().getTime() -fs.lstatSync("trace.log").mtimeMs  > 1000))
                fs.appendFileSync("trace.log", EOL)
            fs.appendFileSync("trace.log", trace)
        }}}

        if (!this.response.headersSent) {
            this.response.writeHead(status, message, headers)
            this.response.end(data)
        }

        // The function and the response are complete.
        // The storage can be closed and the requests can be terminated.
        this.close()
        throw Object.getPrototypeOf(this).quit
    }
}

console.log("Seanox XML-Micro-Exchange [Version 0.0.0 00000000]")
console.log("Copyright (C) 0000 Seanox Software Solutions")
console.log()

// Some things of the API are adjusted.
// These are only small changes, but they greatly simplify the use.
// Curse and blessing of JavaScript :-)

try {

    // Logging: Output with timestamp
    console.log$ = console.log
    console.log = function(...variable) {
        console.log$(new Date().toTimestampString(), ...variable)
    }

    // Logging: Output with timestamp
    console.error$ = console.error
    console.error = function(...variable) {
        console.error$(new Date().toTimestampString(), ...variable)
    }

    // Date formatting to timestamp string
    Date.prototype.toTimestampString = function() {
        return this.toISOString().replace(/^(.*?)T+(.*)\.\w+$/i, "$1 $2")
    }

    // Query if something exists, it minimizes the check of undefined and null
    Object.exists = function(object) {
        return object !== undefined && object !== null
    }

    Object.getClassName = function(object) {
        if (typeof object === "object"
                && Object.getPrototypeOf(object)
                && Object.getPrototypeOf(object).constructor)
            return Object.getPrototypeOf(object).constructor.name;
        return null;
    }

    let element = new DOMImplementation().createDocument().createElement()
    prototype = Object.getPrototypeOf(element)
    prototype.getAttributeNumber = function(attribute) {
        let value = this.getAttribute(attribute)
        if ((value || "").includes("."))
            return parseFloat(value)
        return parseInt(value)
    }

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
        } catch (exception) {
            return exception
        }
    }

    // The evaluate method of the Document differs from PHP in behavior.
    // The following things have been changed to simplify migration:
    // - If an error/exception occurs, the return value is the error/exception
    XPath.evaluate$ = XPath.evaluate
    XPath.evaluate = function (...variable) {
        try {return XPath.evaluate$(...variable)
        } catch (exception) {
            return exception
        }
    }

    XPath.select$ = XPath.select
    XPath.select = function (...variable) {
        try {return XPath.select$(...variable)
        } catch (exception) {
            return exception
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
            return JSON.stringify$(JSON.stringify$xml(variable[0].documentElement))
        return JSON.stringify$(...variable)
    }
    JSON.stringify$xml = function(xml) {
        let result = {};
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
                let text = item.nodeValue.trim();
                if (text.length <= 0)
                    return
                if (buffer.text.length > 0)
                    buffer.text += "\n"
                buffer.text += text
                return;
            }
            if (item.nodeType !== XML_ELEMENT_NODE)
                return
            buffer.mixed = true;
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
} catch (exception) {
    console.error(exception)
}

// TODO: [address]:port as CLI application parameter (address optional, otherwise 0.0.0.0)
// TODO: certificate files as CLI application parameter (otherwise HTTP instead of HTTPS)
// TODO: node.js service.js [address]:port [certificate files]
// TODO: PUT/PATCH autoescape to HTML entities, so that the storage contains only ASCII

http.createServer((request, response) => {

    request.on("data", (data) => {
        if (!Object.exists(request.data))
            request.data = ""
        request.data += data
    })

    request.on("end", () => {

        try {

            // Marking the start time for request processing
            request.timing = new Date().getTime()

            // The API should always use a context path so that the separation
            // between URI and XPath is also visually recognizable.
            // Other requests will be answered with status 404.
            if (!decodeURI(request.url).startsWith(Storage.CONTEXT_PATH))
                (new Storage({request:request, response:response})).quit(404, "Resource Not Found")

            // Request method is determined
            let method = request.method.toUpperCase()

            // Access-Control headers are received during preflight OPTIONS request
            if (method.toUpperCase() === "OPTIONS"
                    && request.headers.origin
                    && !request.headers.storage)
                (new Storage({request:request, response:response})).quit(200, "Success")

            let storage
            if (request.headers.storage)
                storage = request.headers.storage
            if (!storage || !storage.match(Storage.PATTERN_HEADER_STORAGE))
                (new Storage({request:request, response:response})).quit(400, "Bad Request", {"Message": "Invalid storage identifier"})

            // The XPath is determined from REQUEST_URI.
            // The XPath starts directly after the context path. To improve visual
            // recognition, the context path should always end with a symbol.
            let xpath = decodeURI(request.url).substr(Storage.CONTEXT_PATH.length)
            if (xpath.match(/^0x([A-Fa-f0-9]{2})+$/))
                xpath = xpath.substring(2).replace(/[A-Fa-f0-9]{2}/g, (matched) => {
                    return String.fromCharCode(parseInt(matched, 16))
                })
            else if (xpath.match(/^Base64:[A-Za-z0-9+\/]+=*$/))
                xpath = new Buffer(xpath.substring(8), "base64").toString("ascii")
            else xpath = decodeURIComponent(xpath);

            // With the exception of CONNECT, OPTIONS and POST, all requests expect an
            // XPath or XPath function.
            // CONNECT and OPTIONS do not use an (X)Path to establish a storage.
            // POST uses the XPath for transformation only optionally to delimit the XML
            // data for the transformation and works also without.
            // In the other cases an empty XPath is replaced by the root slash.
            if (!xpath && !["CONNECT", "OPTIONS", "POST"].includes(method))
                xpath = "/"

            storage = Storage.share({request:request, response:response, storage:storage, xpath:xpath, exclusive:["DELETE", "PATCH", "PUT"].includes(method)})

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
                        storage.quit(405, "Method Not Allowed")
                }
            } finally {
                storage.close()
            }
        } catch (exception1) {
            if (exception1 !== Storage.prototype.quit) {
                let storage = (new Storage({request:request, response:response}))
                let unique = storage.uniqueId()
                console.error("Service", "#" + unique, exception1)
                try {storage.quit(500, "Internal Server Error", {"Error": "#" + unique})
                } catch (exception2) {
                    if (exception2 !== Storage.prototype.quit)
                        console.error("Service", "#" + unique, exception2)
                }
            }
        } finally {
            // TODO: access-log
        }
    })
}).listen(Storage.PORT, () => {
    console.log("Service", `Listening at port ${Storage.PORT}`)
})