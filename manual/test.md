[Development](development.md) | [TOC](README.md)
- - -

# Test

For testing, the HTTP client of
[JetBrains WebStorm](https://www.jetbrains.com/webstorm/) is used.  
read more: https://www.jetbrains.com/help/webstorm/testing-restful-web-services.html

The tests are collected in scenarios.  
The scenarios are based on the supported HTTP methods and are subdivided into
advanced features where applicable.  
The corresponding HTTP files are located in the directory `./test`.  
The tests use different environments and variables, which are defined in the
file `./test/http-client.env.json`.

Each test consists of a request and a unit test.  
For the unit-test, the supported JavaScript of the HTTP client is used.  
For this purpose, the REST API creates fingerprints for each request as a hash
value for request (header and body), response (header, body), storage (content)
and XPath.  
The hash values are added to the response as additional trace headers and can
then be compared in the unit test.

```
HTTP/1.0 204 No Content
Date: Wed, 11 Nov 2020 12:00:00 GMT
Access-Control-Allow-Origin: *
Storage: 0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ
Storage-Revision: 123
Storage-Space: 262144/1363 bytes
Storage-Last-Modified: Wed, 11 Nov 20 12:00:00 +0000
Storage-Expiration: Wed, 11 Nov 20 12:00:00 +0000
Storage-Expiration-Time: 900000 ms
Execution-Time: 9 ms
Trace-Request-Header-Hash: 1779972845e8da0e4b584dbff411a96f
Trace-Request-Body-Hash: a698f9151a9bb0f9f70fa1d1373b131f
Trace-Response-Header-Hash: 2f6c846f2dc4a84597ffe87041edc711
Trace-Response-Body-Hash: 88d1c3cc7c5238e314194f699fb51bc5
Trace-Storage-Hash: 28d5dc7565be4dc0303e88fb371dc8b9
Trace-XPath-Hash: d41d8cd98f00b204e9800998ecf8427e
Trace-Composite-Hash: 662d604f9442e33cf894930c99a054a4
```

For the creation of the hash values in the service API there exist special
blocks which start with `{{{` and end with `}}}`. These blocks are only for
testing purposes and are removed from a release during the build process.

```
{{{ test code ... }}}
```

Each response contains the `Execution-Time` header, which contains the
processing time in milliseconds.  
This excludes the time for creating the hash codes.  

The used hash values have a tolerance, but are still very sensitive to changes
in the code, which is deliberate. Therefore, it happens that after changes the
behavior of unit tests is correct, but hash values need to be updated.  
For this purpose, the file `./sources/trace.log` is created in test mode, this
can then be compared in more detail with versions before and after a change.
This file then also provides the new hash values that are put into the unit
tests with the `./test/update.js` script.  
The script uses [node.js](https://nodejs.org) as runtime environment and
expects as argument the path to a trace file from which the hash values should
be used.

```
node update.js ../sources/trace.log
```

Optionally, the call can be extended with a targeted HTTP file. In this case
only the hash values in this file will be updated. The file
`./sources/trace.log` may then also contain only the test results for the
target file.

```
node update.js ../sources/trace.log options.http
```

The script `./test/cumulate.js` can be used to combine all tests into one
scenario `./test/cumulate.http`. Which simplifies the complete test.

```
node cumulate.js
```



- - -

[Development](development.md) | [TOC](README.md)