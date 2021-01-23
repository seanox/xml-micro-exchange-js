[DELETE](api-delete.md) | [TOC](README.md) | [OPTIONS](api-options.md)
- - -

# GET

GET queries data about XPath axes and functions.  
For this, the XPath axis or function is sent with URI.  
Depending on whether the request is an XPath axis or an XPath function,
different Content-Type are used for the response.


## Contents Overview

* [XPath axis](#xpath-axis)
* [XPath function](#xpath-function)
* [Request](#request)
  * [Example](#example)
* [Response](#response)
  * [Example](#example-1)
* [Response codes / behavior](#response-codes--behavior)  
  * [HTTP/1.0 200 Success](#http10-202-success)
  * [HTTP/1.0 400 Bad Request](#http10-400-bad-request)
  * [HTTP/1.0 404 Resource Not Found](#http10-404-resource-not-found)


## XPath axis

Content-Type: `application/xslt+xml`  
When the XPath axis addresses one target, the addressed target is the root
element of the returned XML structure.  
If the XPath addresses multiple targets, their XML structure is combined in the
root element collection.

Content-Type: `text/plain`  
If the XPath addresses only one attribute, the value is returned as plain text.


## XPath function

Content-Type: `text/plain`  
The result of XPath functions is returned as plain text.  
Decimal results use float, booleans the values true and false.

The XPath processing is strict and does not accept unnecessary spaces.


## Request

```
GET /<xpath> HTTP/1.0
Storage: 0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ (identifier)
```

### Example

```
GET /xmex!/books/attribute::attrA HTTP/1.0
Storage: 0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ books
```
```
GET /xmex!/books/@attrA HTTP/1.0
Storage: 0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ books
```
```
GET /xmex!count(/books/book) HTTP/1.0
Storage: 0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ books
```


## Response

```
HTTP/1.0 200 Success
Storage: 0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ
Storage-Revision: Revision (number)   
Storage-Space: Total/Used (bytes)
Storage-Last-Modified: Timestamp (RFC822)
Storage-Expiration: Timestamp (RFC822)
Storage-Expiration-Time: Timeout (milliseconds)
Content-Length: (bytes)
    Response-Body:
The result of the XPath request
```

### Example

```
HTTP/1.0 200 Success
Date: Wed, 11 Nov 2020 12:00:00 GMT
Access-Control-Allow-Origin: *
Storage: 0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ
Storage-Revision: 123
Storage-Space: 262144/1363 bytes
Storage-Last-Modified: Wed, 11 Nov 20 12:00:00 +0000
Storage-Expiration: Wed, 11 Nov 20 12:00:00 +0000
Storage-Expiration-Time: 900000 ms
Content-Length: 26
Content-Type: application/xslt+xml
Execution-Time: 4 ms

<?xml version="1.0"?>
...
```
```
HTTP/1.0 200 Success
Date: Wed, 11 Nov 2020 12:00:00 GMT
Access-Control-Allow-Origin: *
Storage: 0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ
Storage-Revision: 123
Storage-Space: 262144/1363 bytes
Storage-Last-Modified: Wed, 11 Nov 20 12:00:00 +0000
Storage-Expiration: Wed, 11 Nov 20 12:00:00 +0000
Storage-Expiration-Time: 900000 ms
Content-Length: 26
Content-Type: text/plain
Execution-Time: 4 ms

...
```


## Response codes / behavior:

### HTTP/1.0 200 Success
- Request was successfully executed

### HTTP/1.0 400 Bad Request
- Storage header is invalid, 1 - 64 characters (0-9A-Z_) are expected
- XPath is missing or malformed

### HTTP/1.0 404 Resource Not Found
- Storage does not exist
- XPath axis finds no target



- - -

[DELETE](api-delete.md) | [TOC](README.md) | [OPTIONS](api-options.md)