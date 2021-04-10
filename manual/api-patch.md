[OPTIONS](api-options.md) | [TOC](README.md) | [POST](api-post.md)
- - -

# PATCH

PATCH changes existing elements and attributes in storage.  
The position for the insert is defined via an XPath.  
The method works almost like PUT, but the XPath axis of the request always
expects an existing target.  
XPath uses different notations for elements and attributes.

The notation for attributes use the following structure at the end.  
&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;
`<XPath>/@<attribute>` or `<XPath>/attribute::<attribute>`  
The attribute values can be static (text) and dynamic (XPath function).  
Values are send as request-body.
Whether they are used as text or XPath function is decided by the
Content-Type header of the request:
- `text/plain`: static text
- `text/xpath`: XPath function

If the XPath notation does not match the attributes, elements are assumed.
Unlike the PUT method, no pseudo elements are supported for elements.

The value of elements can be static (text), dynamic (XPath function) or be an
XML structure. Also here the value is send with the request-body  and the type
of processing is determined by the Content-Type:
- `text/plain`: static text
- `text/xpath`: XPath function
- `application/xslt+xml`: XML structure

The PATCH method works resolutely and  overwrites existing data.
The XPath processing is strict and does not accept unnecessary spaces.
The attributes `___rev` / `___uid` used internally by the storage are
read-only and cannot be changed.

In general, PATCH requests are responded to with status 204. Status 404 is used
only with relation to the storage. In all other cases the PATCH method informs
the client about changes with status 204 and the response headers
`Storage-Effects` and `Storage-Revision`. The header `Storage-Effects` contains
a list of the UIDs that were directly affected by the change elements. If no
changes were made because the XPath cannot find a writable target, the header
`Storage-Effects` can be omitted completely in the response.

Syntactic and semantic errors in the request and/or XPath and/or value can cause
error status 400 and 415. If errors occur due to the transmitted request body,
this causes status 422.


## Contents Overview

* [Request](#request)
  * [Example](#example)
* [Response](#response)
  * [Example](#example-1)
* [Response codes / behavior](#response-codes--behavior)  
  * [HTTP/1.0 204 No Content](#http10-204-no-content)
  * [HTTP/1.0 400 Bad Request](#http10-400-bad-request)
  * [HTTP/1.0 404 Resource Not Found](#http10-404-resource-not-found)
  * [HTTP/1.0 413 Payload Too Large](#http10-413-payload-too-large)  
  * [HTTP/1.0 415 Unsupported Media Type](#http10-415-unsupported-media-type)
  * [HTTP/1.0 422 Unprocessable Entity](#http10-422-unprocessable-entity)
  

#### Request

```
PATCH /<xpath> HTTP/1.0
Storage: 0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ (identifier)
Content-Length: (bytes)
Content-Type: application/xslt+xml
     Request-Body:
XML structure
```
```
PATCH /<xpath> HTTP/1.0
Storage: 0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ (identifier)
Content-Length: (bytes)
Content-Type: text/plain
    Request-Body:
Value as plain text
```
```
PATCH /<xpath> HTTP/1.0
Storage: 0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ (identifier)
Content-Length: (bytes)
Content-Type: text/xpath
    Request-Body:
Value as XPath function 
```

##### Example

```
PATCH /xmex!/books/attribute::attrA HTTP/1.0
Storage: 0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ books
Content-Type: text/plain
Content-Length: 5

Value
```
```
PATCH /xmex!/books/@attrA HTTP/1.0
Storage: 0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ books
Content-Type: text/xpath
Content-Length: 25

concat(name(/*), "-Test")
```
```
PATCH /xmex!/books HTTP/1.0
Storage: 0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ books
Content-Type: application/xslt+xml
Content-Length: 70

<book title="Book A"/>
<book title="Book B"/>
<book title="Book C"/>
```


## Response

```
HTTP/1.0 204 No Content
Storage-Effects: ... (list of UIDs)
Storage: 0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ
Storage-Revision: Revision (number)   
Storage-Space: Total/Used (bytes)
Storage-Last-Modified: Timestamp (RFC822)
Storage-Expiration: Timestamp (RFC822)
Storage-Expiration-Time: Timeout (milliseconds)
```

### Example

```
HTTP/1.0 204 No Content
Date: Wed, 11 Nov 2020 12:00:00 GMT
Storage-Effects: KHDCPS0018U4:0 KHDCPS0018U2:0 KHDCPS0018U4:1 KHDCPS0018U4:2
Access-Control-Allow-Origin: *
Storage: 0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ
Storage-Revision: 123
Storage-Space: 262144/1363 bytes
Storage-Last-Modified: Wed, 11 Nov 20 12:00:00 +0000
Storage-Expiration: Wed, 11 Nov 20 12:00:00 +0000
Storage-Expiration-Time: 900000 ms
Execution-Time: 3 ms
```


## Response codes / behavior

### HTTP/1.0 204 No Content
- Attributes successfully created or set
- Write access to read-only attributes does not cause status 403, because a
  XPath can be multi-dimensional this is difficult, so the server status
  quits the success of the method and the `Storage-Effects` header the effects

### HTTP/1.0 400 Bad Request
- Storage header is invalid, 1 - 64 characters (0-9A-Z_) are expected
- XPath is missing or malformed
- XPath without addressing a target is responded with status 204

### HTTP/1.0 404 Resource Not Found
- Storage does not exist

### HTTP/1.0 413 Payload Too Large
- Allowed size of the request(-body) and/or storage is exceeded

### HTTP/1.0 415 Unsupported Media Type
- Attribute request without Content-Type text/plain

### HTTP/1.0 422 Unprocessable Entity
- Data in the request body cannot be processed



- - -

[OPTIONS](api-options.md) | [TOC](README.md) | [POST](api-post.md)