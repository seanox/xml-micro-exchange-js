[API](api.md) | [TOC](README.md) | [GET](api-get.md)
- - -

# DELETE

DELETE deletes elements and attributes in the storage.  
The position for deletion is defined via an XPath.  
XPath uses different notations for elements and attributes.

The notation for attributes use the following structure at the end.  
&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;
    `<XPath>/@<attribute>` or `<XPath>/attribute::<attribute>`  

If the XPath notation does not match the attributes, elements are assumed.  
For elements, the notation for pseudo elements is supported:  
&#160;&#160;&#160;&#160;&#160;&#160;
    `<XPath>::first`, `<XPath>::last`, `<XPath>::before` or `<XPath>::after`  
Pseudo elements are a relative position specification to the selected element.

The DELETE method works resolutely and deletes existing data.  
The XPath processing is strict and does not accept unnecessary spaces.  
The attributes `___rev` / `___uid` used internally by the storage are read-only
and cannot be changed.

In general, if no target can be reached via XPath, status 404 will occur. In
all other cases the DELETE method informs the client about changes with status
204 and the response headers `Storage-Effects` and `Storage-Revision`. The
header `Storage-Effects` contains a list of the UIDs that were directly
affected by the change and also contains the UIDs of newly created elements
(e.g. when the root element is deleted, a new one is automatically created). If
no changes were made because the XPath cannot find a writable target, the
header Storage-Effects can be omitted completely in the response.

Syntactic and semantic errors in the request and/or XPath can cause error
status 400.


## Contents Overview

* [Request](#request)
    * [Example](#example)
* [Response](#response)
    * [Example](#example-1)
* [Response codes / behavior](#response-codes--behavior)
    * [HTTP/1.0 204 No Content](#http10-204-no-content)
    * [HTTP/1.0 400 Bad Request](#http10-400-bad-request)
    * [HTTP/1.0 404 Resource Not Found](#http10-404-resource-not-found)


#### Request

```
DELETE /<xpath> HTTP/1.0
Storage: 0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ (identifier)
```


##### Example

```
DELETE /books/book[1] HTTP/1.0
Storage: 0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ books
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
HTTP/1.1 204 No Content
Date: Wed, 11 Nov 2020 12:00:00 GMT
Server: Apache/2.4.43 (Unix)
Access-Control-Allow-Origin: *
Storage-Effects: KHDCPS001E7C:9:D KHDCPS001DDS:0:M
Storage: 0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ
Storage-Revision: 123
Storage-Space: 262144/1363 bytes
Storage-Last-Modified: Wed, 11 Nov 20 12:00:00 +0000
Storage-Expiration: Wed, 11 Nov 20 12:00:00 +0000
Storage-Expiration-Time: 900000 ms
Execution-Time: 7 ms
```


## Response codes / behavior

### HTTP/1.0 204 No Content
- Element(s) or attribute(s) successfully deleted
- Write access to read-only attributes does not cause status 403, because a
  XPath can be multi-dimensional this is difficult, so the server status
  quits the success of the method and the `Storage-Effects` header the effects

### HTTP/1.0 400 Bad Request
- Storage header is invalid, 1 - 64 characters (0-9A-Z_) are expected
- XPath is missing or malformed
- XPath without addressing a target is responded with status 204

### HTTP/1.0 404 Resource Not Found
- Storage is invalid



- - -

[API](api.md) | [TOC](README.md) | [GET](api-get.md)