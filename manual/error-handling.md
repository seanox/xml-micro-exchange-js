[PUT](api-put.md) | [TOC](README.md) | [Development](development.md)
- - -

# Error Handling

The error return is not always so easy with REST services.  
Also with XML-Micro-Exchange, the recommendation to use server status 400, 422
as well as 500 is often not helpful for the client or developer.

In the case of status 400 and 422, XML-Micro-Exchange uses the additional
header Message in the response, which contains more details about the error.  
The difference between status 400 and 422 is that status 400 always refers to
the request and 422 to the request body. With status 400, errors are detected
in the request itself, and with status 422, errors are detected in the content
of the request body.

```
HTTP/1.0 400 Bad Request
Date: Wed, 11 Nov 2020 12:00:00 GMT
Access-Control-Allow-Origin: *
Message: Invalid expression
Execution-Time: 3 ms
```
```
HTTP/1.0 422 Unprocessable Entity
Date: Wed, 11 Nov 2020 12:00:00 GMT
Access-Control-Allow-Origin: *
Message: Invalid XSLT stylesheet (Opening and ending tag mismatch in line 8)
Execution-Time: 6 ms
```

In case of status 500, the additional header Error is used in the response,
which contains a unique error number.  
More details about the error or the number can then be found in the log file.  
Internal errors generally do not contain details in the response, this prevents
the publication of internal details.

```
HTTP/1.0 500 Internal Server Error
Date: Wed, 11 Nov 2020 12:00:00 GMT
Access-Control-Allow-Origin: *
Error: #KHF8KO9715S2
Execution-Time: 16 ms
```



- - -

[PUT](api-put.md) | [TOC](README.md) | [Development](development.md)