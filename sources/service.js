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
 *  Service 1.1.0 20210102
 *  Copyright (C) 2021 Seanox Software Solutions
 *  All rights reserved.
 *
 *  @author  Seanox Software Solutions
 *  @version 1.1.0 20210102
 */
const http = require("http");
const fs = require("fs");
const xml = require("common-xml-features");
const crypto = require("crypto");

class Storage {

    // TODO:
    static get PORT() {
        return 8000;
    };

    // TODO:
    static get CONTEXT_PATH() {
        return "/xmex!";
    };

    /** Directory of the data storage */
    static get DIRECTORY() {
        return "./data";
    };

    /** Maximum number of files in data storage */
    static get QUANTITY() {
        return 65535;
    };

    /**
     * Maximum data size of files in data storage in bytes.
     * The value also limits the size of the requests(-body).
     */
    static get SPACE() {
        return 256 *1024;
    };

    /** Maximum idle time of the files in seconds */
    static get TIMEOUT() {
        return 15 *60;
    };

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
    };

    /**
     * Pattern for the Storage header
     *     Group 0. Full match
     *     Group 1. Storage
     *     Group 2. Name of the root element (optional)
     */
    static get PATTERN_HEADER_STORAGE() {
        return /^(\w{1,64})(?:\s+(\w+)){0,1}$/;
    };

    /**
     * Pattern to determine options (optional directives) at the end of XPath
     *     Group 0. Full match
     *     Group 1. XPath
     *     Group 2. options (optional)
     */
    static get PATTERN_XPATH_OPTIONS() {
        return /^(.*?)((?:!+\w+){0,})$/;
    };

    /**
     * Pattern to determine the structure of XPath axis expressions for attributes
     *     Group 0. Full match
     *     Group 1. XPath axis
     *     Group 2. Attribute
     */
    static get PATTERN_XPATH_ATTRIBUTE() {
        return /((?:^\/+)|(?:^.*?))\/{0,}(?<=\/)(?:@|attribute::)(\w+)$/i;
    };

    /**
     * Pattern to determine the structure of XPath axis expressions for pseudo elements
     *     Group 0. Full match
     *     Group 1. XPath axis
     *     Group 2. Attribute
     */
    static get PATTERN_XPATH_PSEUDO() {
        return /^(.*?)(?:::(before|after|first|last)){0,1}$/i;
    };

    /**
     * Pattern as indicator for XPath functions
     * Assumption for interpretation: Slash and dot are indications of an axis
     * notation, the round brackets can be ignored, the question remains, if
     * the XPath starts with an axis symbol, then it is an axis, with other
     * characters at the beginning must be a function.
     */
    static get PATTERN_XPATH_FUNCTION() {
        return /^[\(\s]*[^\/\.\s\(].*$/;
    };

    /** Constants of used content types */
    static get CONTENT_TYPE_TEXT() {
        return "text/plain";
    };
    static get CONTENT_TYPE_XPATH() {
        return "text/xpath";
    };
    static get CONTENT_TYPE_HTML() {
        return "text/html";
    };
    static get CONTENT_TYPE_XML() {
        return "application/xslt+xml";
    };
    static get CONTENT_TYPE_JSON() {
        return "application/json";
    };

    /**
     * Constructor creates a new Storage object.
     * @param {object} meta {request, response, storage, root, xpath}
     */
    constructor(meta) {

        // The storage identifier is case-sensitive.
        // To ensure that this also works with Windows, Base64 encoding is used.

        this.request  = meta.request;
        this.response = meta.response;

        this.storage  = meta.storage || "";
        this.root     = meta.root || "data";
        this.store    = Storage.DIRECTORY + "/" + Buffer.from(this.storage, "ASCII").toString("Base64");
        this.xpath    = (meta.xpath || "").replace(Storage.PATTERN_XPATH_OPTIONS, "$1");
        this.options  = (meta.xpath || "").replace(Storage.PATTERN_XPATH_OPTIONS, "$2");
        this.change   = false;
        this.unique   = this.uniqueId();
        this.serial   = 0;
        this.revision = 0;
    };

    /** Cleans up all files that have exceeded the maximum idle time. */
    static cleanUp() {

        if (!fs.existsSync(this.store)
                || !fs.lstatSync(Storage.DIRECTORY).isDirectory())
            return;
        var timeout = new Date().getTime() -(Storage.TIMEOUT *1000);
        var files = fs.readdirSync(Storage.DIRECTORY);
        files.forEach((file) => {
            file = Storage.DIRECTORY + "/" + file;
            var state = fs.lstatSync(file);
            if (state.isFile()
                    && state.mtimeMs < timeout)
                if (fs.existsSync(file))
                    fs.unlinkSync(file);
        });
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
            (new Storage(meta)).quit(400, "Bad Request", {"Message": "Invalid storage identifier"});

        meta.root = meta.storage.replace(Storage.PATTERN_HEADER_STORAGE, "$2");
        meta.storage = meta.storage.replace(Storage.PATTERN_HEADER_STORAGE, "$1");

        Storage.cleanUp();
        if (!fs.existsSync(Storage.DIRECTORY))
            fs.mkdirSync(Storage.DIRECTORY, {recursive:true, mode:0o755});
        var storage = new Storage(meta);

        if (storage.exists()) {
            storage.open(meta.exclusive);
            // Safe is safe, if not the default 'data' is used,
            // the name of the root element must be known.
            // Otherwise the request is quit with status 404 and terminated.
            if ((meta.root ? meta.root : "data") != storage.xml.documentElement.nodeName)
                storage.quit(404, "Resource Not Found");
        }
        return storage;
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
        var unique = this.request.connection.remotePort.toString(36);
        unique = "0000" + unique;
        unique = unique.substring(unique.length -4);
        unique = new Date().getTime().toString(36) + unique;
        return unique.toUpperCase();
    };

    /**
     * Return TRUE if the storage already exists.
     * @return {boolean} TRUE if the storage already exists
     */
    exists() {
        return fs.existsSync(this.store)
            && fs.lstatSync(this.store).size > 0;
    }

    /**
     * Opens the storage for the current request.
     * The storage can optionally be opened exclusively for write access.
     * If the storage to be opened does not yet exist, it is initialized.
     * Simultaneous requests must then wait through the file lock.
     * @param {boolean} exclusive
     */
    open(exclusive = true) {

        if (this.share !== undefined)
            return;

        if (this.exists())
            fs.closeSync(fs.openSync(this.store, "as+"));
        this.share = fs.openSync(this.store, !this.exists() || exclusive ? "as+" : "r");

        if (fs.lstatSync(this.store).size <= 0)
            fs.writeSync(this.share, `<?xml version="1.0" encoding="UTF-8"?>`
                + `<${this.root} ___rev="0" ___uid="${this.getSerial()}"/>`);

        var buffer = Buffer.alloc(fs.lstatSync(this.store).size);
        fs.readSync(this.share, buffer, {position:0});
        this.xml = new xml.DOMParser().parseFromString(buffer.toString());
        this.revision = this.xml.documentElement.getAttribute("___rev");
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

        if (this.share === undefined)
            return;
        if (this.revision === this.xml.documentElement.getAttribute("___rev"))
            return;

        var output = new xml.XMLSerializer().serializeToString(this.xml);
        if (output.length > Storage.SPACE)
            this.quit(413, "Payload Too Large");
        fs.ftruncateSync(this.share, 0);
        fs.writeSync(this.share, output);
    }

    /** Closes the storage for the current request. */
    close() {

        if (this.share === undefined)
            return;

        fs.closeSync(this.share);

        delete this.share;
        delete this.xml;
    }

    /**
     * Creates a unique incremental ID.
     * @return {string} unique incremental ID
     */
    getSerial() {
        return this.unique + ":" + (this.serial++);
    }

    /**
     * Determines the current size of the storage with the current data and can
     * therefore differ from the size in the file system.
     * @return {number} current size of the storage
     */
    getSize() {

        if (this.xml !== undefined)
            return new xml.XMLSerializer().serializeToString(this.xml).length;
        if (this.share !== undefined)
            return fs.fstatSync(this.share).size;
        if (this.store !== undefined
                && fs.existsSync(this.store))
            return fs.lstatSync(this.store).size;
        return 0;
    }

    /**
     * TODO:
     * Updates recursive the revision for an element and all parent elements.
     * param DOMElement node
     * param string     revision
     */
    static updateNodeRevision(node, revision) {

        // TODO:
        while (node && node.nodeType === XML_ELEMENT_NODE) {
            node.setAttribute("___rev", revision);
            node = node.parentNode;
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
            this.quit(400, "Bad Request", {"Message": "Invalid XPath"});

        var response = [201, "Created"];
        if (!this.exists()) {
            var files = fs.readdirSync(Storage.DIRECTORY);
            files = files.filter(file => fs.lstatSync(Storage.DIRECTORY + "/" + file).isFile());
            if (files.length >= Storage.QUANTITY)
                this.quit(507, "Insufficient Storage");
            this.open(true);
        } else response = [202, "Accepted"];

        this.materialize();
        this.quit(response[0], response[1], {"Connection-Unique": this.unique});
    };

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
            this.doConnect();

        // Without existing storage the request is not valid.
        if (!this.exists())
            this.quit(404, "Resource Not Found");

        // In any case an XPath is required for a valid request.
        if (!Object.exists(this.xpath))
            this.quit(400, "Bad Request", {"Message": "Invalid XPath"});

        // TODO:
    };

    doGet() {
        // TODO:
        storage.quit(501, "Not Implemented");
    };

    doPost() {
        // TODO:
        storage.quit(501, "Not Implemented");
    };

    doPut() {
        // TODO:
        storage.quit(501, "Not Implemented");
    };

    doPatch() {
        // TODO:
        storage.quit(501, "Not Implemented");
    };

    doDelete() {
        // TODO:
        storage.quit(501, "Not Implemented");
    };

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
    quit(status, message, headers, data) {

        if (this.response.headersSent) {
            // The response are already complete.
            // The storage can be closed and the requests can be terminated.
            this.close();
            throw Object.getPrototypeOf(this).quit;
        }

        // This is implemented for scanning and modification of headers.
        // To remove, the headers are set before, so that standard headers like
        // Content-Type are also removed correctly.
        var fetchHeader = (response, name, remove = false) => {
            if (response === undefined
                    || response.headers === undefined)
                return;
            var result = undefined;
            Object.entries(response.headers || {}).forEach((entry) => {
                const [name, value] = entry;
                if (name.toLowerCase() !== name.toLowerCase())
                    return;
                if (remove)
                    response.removeHeader(name);
                result = {"name":name, "value":value};
            });
            return result;
        };

        if (typeof headers !== "object")
            headers = {};
        if (typeof Storage.CORS === "object")
            headers = {...headers, ...Storage.CORS};

        // Access-Control headers are received during preflight OPTIONS request
        if (this.request.method.toUpperCase() === "OPTIONS") {
            if (this.request.headers["access-control-request-method"])
                headers["Access-Control-Allow-Methods"] = "CONNECT, OPTIONS, GET, POST, PUT, PATCH, DELETE";
            if (this.request.headers["access-control-request-headers"])
                headers["Access-Control-Allow-Headers"] = this.request.headers["access-control-request-headers"];
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
                    "Storage-Expiration": new Date(new Date().getTime() +Storage.TIMEOUT).toUTCString(),
                    "Storage-Expiration-Time": (Storage.TIMEOUT *1000) + " ms"
            }};

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

        var serials = fetchHeader(this.response, "Storage-Effects", true);
        serials = serials ? serials.value : "";
        if (serials) {
            serials = serials.split(/\s+/);
            serials = [...new Set(serials)];
            serials.forEach((serial) => {
                if (substr(serial, -2) !== ":D")
                    return;
                var search = serial.slice(0, -2) + ":M";
                if (serials.includes(search))
                    delete serials[search];
                var search = serial.slice(0, -2) + ":A";
                if (serials.includes(search))
                    delete serials[search];
            });
            serials = serials.join(" ");
        }

        var accepts = (this.request.headers["accept-effects"] || "").toLowerCase();
        accepts = !accepts ? accepts.split(/\s+/) : [];
        var pattern = [];
        if (this.request.method.toUpperCase() !== "DELETE") {
            if (accepts
                    && !accepts.includes("added"))
                pattern.push("A");
            if (!accepts
                    || !accepts.includes("deleted"))
                pattern.push("D");
        } else {
            if (!accepts
                    || !accepts.includes("added"))
                pattern.push("A");
            if (accepts
                    && !accepts.includes("deleted"))
                pattern.push("D");
        }
        if (accepts
                && !accepts.includes("modified"))
            pattern.push("M");
        if (accepts
                && accepts.includes("none"))
            pattern = ["A", "M", "D"];
        if (accepts
                && accepts.includes("all"))
            pattern = [];
        if (pattern)
            serials = serials.replace(/\s*\w+:\w+:[" + pattern.join("|") + "]\s*/ig, " ");
        serials = serials.replace(/s{2,}/g, " ").trim();
        if (serials)
            headers["Storage-Effects"] = serials;

        Object.keys(headers).forEach((key) => {
            if (key.toLowerCase() === "content-length")
                delete headers[key];
        })

        var media = fetchHeader(this.response, "Content-Type", true);
        if (status == 200
                && data !== undefined
                && data !== ""
                && data !== null) {
            if (!media) {
                if (this.options.includes("json")) {
                    /* TODO:
                    media = Storage.CONTENT_TYPE_JSON;
                    if (data instanceof DOMDocument
                            || data instanceof SimpleXMLElement)
                        data = simplexml_import_dom(data);
                    data = json_encode(data);
                    */
                } else {
                    /* TODO:
                    if (data instanceof DOMDocument
                            || data instanceof SimpleXMLElement) {
                        media = Storage.CONTENT_TYPE_XML;
                        data = data.saveXML();
                    } else media = Storage.CONTENT_TYPE_TEXT;
                    */
                }
            } else media = media.value;
            header["Content-Type"] = media;
        }

        if (status >= 200 && status < 300)
            if ((data !== "" && data !== null)
                    || status == 200)
                headers["Content-Length"] = (data || "").length;

        // When responding to an error, the default Allow header is added.
        // But only if no Allow header was passed.
        // So the header does not always have to be added manually.
        if ([201, 202, 405].includes(status)
                && Object.keys(headers).filter(header => header.toLowerCase() === "allow").length > 0)
            headers["Allow"] = "CONNECT, OPTIONS, GET, POST, PUT, PATCH, DELETE";

        headers["Execution-Time"] = (new Date().getTime() -this.request.timing) + " ms";

        {{{

            // Trace is primarily intended to simplify the validation of requests,
            // their impact on storage and responses during testing.
            // Based on hash values the correct function can be checked.
            // In the released versions the implementation is completely removed.
            // Therefore the code may use computing time or the implementation may
            // not be perfect.
            // For JSON output, the slash is escaped for compatibility with PHP.
            // Thus, the tests can be used in both implementations.

            var cryptoMD5 = (text) => {
                return crypto.createHash("MD5").update(text).digest("HEX");
            };

            var trace = [];

            // Request-Header-Hash
            var hash = JSON.stringify({
                "Method": this.request.method.toUpperCase(),
                "URI": decodeURI(this.request.url),
                "Storage": (this.request.headers["storage"] || ""),
                "Content-Length": (this.request.headers["content-length"] || "").toUpperCase(),
                "Content-Type": (this.request.headers["content-type"] || "").toUpperCase()
            }).replace(/\//g, "\\/");
            headers["Trace-Request-Header-Hash"] = cryptoMD5(hash);
            trace.push(cryptoMD5(hash) + " Trace-Request-Header-Hash", hash);

            // Request-Body-Hash
            hash = this.request.data || "";
            hash = hash.replace(/((\r\n)|(\r\n)|\r)+/g, "\n");
            hash = hash.replace(/\t/g, " ");
            headers["Trace-Request-Body-Hash"] = cryptoMD5(hash);
            trace.push(cryptoMD5(hash) + " Trace-Request-Body-Hash");

            // Response-Header-Hash
            // Only the XMEX relevant headers are used.
            var composite = {...headers};
            Object.keys(composite).forEach((header) => {
                if (!["storage", "storage-revision", "storage-space",
                        "allow", "content-length", "message"].includes(header.toLowerCase()))
                    delete composite[header];
            })

            // Storage-Effects are never the same with UIDs.
            // Therefore, the UIDs are normalized and the header is simplified to
            // make it comparable. To do this, it is only determined how many
            // unique's there are, in which order they are arranged and which
            // serials each unique has.
            var header = Object.keys(composite).filter(key => key.toLowerCase() === "storage-effects");
            if (header) {
                header = composite[header];
                if (header) {
                    var effects = {};
                    header.split(/s+/).forEach((uid) => {
                        uid = uid.split(/:/);
                        if (!Object.exists(effects[uid[0]]))
                            effects[uid[0]] = [];
                        effects[uid[0]].push(uid[1]);
                    });
                    var keys = [...Object.keys(effects)];
                    keys.sort();
                    keys.forEach((key) => {
                        var value = effects[key];
                        value.sort();
                        delete effects[key];
                        effects[key] = value.join(":");
                    });
                    composite["Storage-Effects"] = Object.values(effects).join("\t");
                }
            }

            // Connection-Unique header is unique and only checked for presence.
            Object.keys(composite).forEach((header) => {
                if (header.toLowerCase() === "connection-unique")
                    composite[header] = "";
            })

            hash = [];
            Object.entries(composite).forEach((entry) => {
                const [key, value] = entry;
                hash.push(key + ": " + value);
            });

            // Status Message should not be used because different hashes may be
            // calculated for tests on different web servers.
            hash.push(status);
            headers["Trace-Response-Header-Hash"] = cryptoMD5(hash.join("\n"));
            trace.push(cryptoMD5(hash.join("\n")) + " Trace-Response-Header-Hash", JSON.stringify(hash));
        }}}

        if (!this.response.headersSent) {
            this.response.writeHead(status, message, headers);
            this.response.end(data);
        }

        // The function and the response are complete.
        // The storage can be closed and the requests can be terminated.
        this.close();
        throw Object.getPrototypeOf(this).quit;
    };
};

Date.prototype.toTimestampString = function () {
    return this.toISOString().replace(/^(.*?)T+(.*)\.\w+$/i, "$1 $2");
};

Object.exists = function (object) {
    return object !== undefined && object !== null;
}

console.log("Seanox XML-Micro-Exchange [Version 0.0.0 00000000]");
console.log("Copyright (C) 0000 Seanox Software Solutions");
console.log();

console.log$ = console.log;
console.log = function(...variable) {
    console.log$(new Date().toTimestampString(), ...variable);
}
console.error$ = console.error;
console.error = function(...variable) {
    console.error$(new Date().toTimestampString(), ...variable);
}

http.createServer((request, response) => {

    request.on("data", (data) => {
        if (request.data === undefined)
            request.data = "";
        request.data += data;
    });

    request.on("end", () => {

        try {

            // Marking the start time for request processing
            request.timing = new Date().getTime();

            // The API should always use a context path so that the separation
            // between URI and XPath is also visually recognizable.
            // Other requests will be answered with status 404.
            if (!decodeURI(request.url).startsWith(Storage.CONTEXT_PATH))
                (new Storage({request:request, response:response})).quit(404, "Resource Not Found");

            // Request method is determined
            var method = request.method.toUpperCase();

            // Access-Control headers are received during preflight OPTIONS request
            if (method.toUpperCase() === "OPTIONS"
                && request.headers.origin
                && !request.headers.storage)
                (new Storage({request:request, response:response})).quit(200, "Success");

            var storage;
            if (request.headers.storage)
                storage = request.headers.storage;
            if (!storage || !storage.match(Storage.PATTERN_HEADER_STORAGE))
                (new Storage({request:request, response:response})).quit(400, "Bad Request", {"Message": "Invalid storage identifier"});

            // The XPath is determined from REQUEST_URI.
            // The XPath starts directly after the context path. To improve visual
            // recognition, the context path should always end with a symbol.
            var xpath = decodeURI(request.url).substr(Storage.CONTEXT_PATH.length);
            if (xpath.match(/^0x([A-Fa-f0-9]{2})+$/))
                xpath = xpath.substring(2).replace(/[A-Fa-f0-9]{2}/g, (matched, index, original) => {
                    return String.fromCharCode(parseInt(matched, 16));
                });
            else if (xpath.match(/^Base64:[A-Za-z0-9\+\/]+=*$/))
                xpath = new Buffer(xpath.substring(8), "Base64").toString("ASCII");

            // With the exception of CONNECT, OPTIONS and POST, all requests expect an
            // XPath or XPath function.
            // CONNECT and OPTIONS do not use an (X)Path to establish a storage.
            // POST uses the XPath for transformation only optionally to delimit the XML
            // data for the transformation and works also without.
            // In the other cases an empty XPath is replaced by the root slash.
            if (!xpath && !["CONNECT", "OPTIONS", "POST"].includes(method))
                xpath = "/";

            storage = Storage.share({request:request, response:response, storage:storage, xpath:xpath, exclusive:["DELETE", "PATCH", "PUT", "POST"].includes(method)});

            try {
                switch (method) {
                    case "CONNECT":
                        storage.doConnect();
                    case "OPTIONS":
                        storage.doOptions();
                    case "GET":
                        storage.doGet();
                    case "POST":
                        storage.doPost();
                    case "PUT":
                        storage.doPut();
                    case "PATCH":
                        storage.doPatch();
                    case "DELETE":
                        storage.doDelete();
                    default:
                        storage.quit(405, "Method Not Allowed");
                }
            } finally {
                storage.close();
            }
        } catch (exception) {
            if (exception !== Storage.prototype.quit) {
                var storage = (new Storage({request:request, response:response}));
                var unique = storage.uniqueId();
                console.error("Service", "#" + unique, exception);
                storage.quit(500, "Internal Server Error", {"Error": "#" + unique});
            }
        } finally {
            // TODO: access-log
        }
    });
}).listen(Storage.PORT, () => {
    console.log("Service", `Listening at port ${Storage.PORT}`);
});