&#9665; [Development](development.md)
&nbsp;&nbsp;&nbsp;&nbsp; &#8801; [Table of Contents](README.md)
- - -

# Test

For testing, the HTTP client of [JetBrains IntelliJ IDEA](
    https://www.jetbrains.com/idea/) is used. You can find out more here:
https://www.jetbrains.com/help/idea/http-client-in-product-code-editor.html.  

> [!IMPORTANT]
> __For testing, the environment variable `XMEX_DEBUG_MODE` must be set to `on`
> or `true`!__

The tests are collected in scenarios. The scenarios are based on the supported
HTTP methods and are subdivided into advanced features where applicable. The
corresponding HTTP files are located in the directory `./test`. The tests use
different environments and variables, which are defined in the  file
`./test/http-client.env.json`.

Each test consists of a request and a unit test. For the unit-test, the
supported JavaScript of the HTTP client is used. For this purpose, the REST API
creates hashes as fingerprints for each request as a hash value for request,
request header, request body, response, response header, response body and the
storage and adds this as an additional response header. The hash values of these
response headers are then compared in the unit tests.

```
HTTP/1.0 204 No Content
Date: Wed, 11 Nov 2020 12:00:00 GMT
Access-Control-Allow-Origin: *
Storage: 0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ
Storage-Revision: 123/1
Storage-Space: 262144/1363 bytes
Storage-Last-Modified: Wed, 11 Nov 20 12:00:00 +0000
Storage-Expiration: Wed, 11 Nov 20 12:15:00 +0000
Storage-Expiration-Time: 900000 ms
Execution-Time: 9 ms
Trace-Request-Header-Hash: 1779972845e8da0e4b584dbff411a96f
Trace-Request-Body-Hash: a698f9151a9bb0f9f70fa1d1373b131f
Trace-Response-Header-Hash: 2f6c846f2dc4a84597ffe87041edc711
Trace-Response-Body-Hash: 88d1c3cc7c5238e314194f699fb51bc5
Trace-Storage-Hash: 28d5dc7565be4dc0303e88fb371dc8b9
```

The aim is for all tests to run without errors in all scenarios. There are
rarely small deviations between the operating system, runtime environments and
server, which are taken into account and compensated in the tests.


## HTTP Client CLI and Docker
1. Build and start the Docker image
   ```
   docker build -t seanox-xmex:latest . ^
       && docker run --rm -p 80:80 -e XMEX_DEBUG_MODE=on -t seanox-xmex:latest
   ```
2. Start the HTTP Client CLI with the tests
   ```
   ant -f development/build.xml test
   ```



- - -
&#9665; [Development](development.md)
&nbsp;&nbsp;&nbsp;&nbsp; &#8801; [Table of Contents](README.md)
