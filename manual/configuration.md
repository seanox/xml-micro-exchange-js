[Installation](installation.md) | [TOC](README.md) | [Terms](terms.md)
- - -

# Configuration

__This chapter is only relevant if you want to run the Datasource on your own
server.  
If you want to use an existing Datasource on the Internet, you can skip
this chapter.__

TODO:


## Contents Overview

* [Sections](#sections)
  * [CONNECTION](#connection)
  * [ACME](#acme)  
  * [CORS](#cors)
  * [REQUEST](#request)
  * [CONTENT](#content)  
  * [STORAGE](#storage)
  * [LOGGING](#logging)

The `service.ini` file is used to configure the service.  
Unlike configurations in JSON, this is more error tolerant and supports comments.  
The INI file uses sections with keys and values.
The sections and keys are case-insensitive.

The configuration uses runnable keys and values. Alternative default values are
not available in the implementation of the service.


## Sections

### CONNECTION

In this section the servers and HTTP are configured.

| Key       | Value                  | Description                                                                                                       |
| :-------- | :--------------------- | :---------------------------------------------------------------------------------------------------------------- |
| `ADDRESS` | `0.0.0.0`              | Host name or IP where the server is listening.                                                                    |
| `PORT`    | `8000`                 | Port where the server is listening.                                                                               |
| `CONTEXT` | `/xmex!`               | Context path der URL.<br/> It should end with a symbol to better visually distinguish the XPath from the request. |
| `SECURE`  | `cert.pem key.pem`     | Certificate files if TLS/HTTPS is to be used.<br/> Order: certificate, key                                        |
| `SECURE`  | `cert.pfx passphrase`  | Certificate files if TLS/HTTPS is to be used.<br/> Order: certificate, passphrase                                 |
| `ACME`    | `/.well-known/acme...` | Virtual path of the key for the ACME-challenge.                                                                   |

### ACME

Automated Certificate Management Environment (ACME) is used for automatic
verification of Internet domain ownership and simplified automated certificates
for TLS encryption, which allows services like Let's Encrypt to be used.

For ACME HTTP-01, the procedure is based on an ACME HTTP challenge.

In Seanox XMEX, the ACME HTTP challenge is started automatically when the key
`ACME` is enabled by a value in the section `ACME`. If a certificate is present
and the key `SECURE` is also activated in the  section `CONNECTION`, the
service also starts a monitor that checks for a new certificate about every 15
minutes. If a new certificate was provided, the active HTTPS server is
terminated and started with the new certificate.

Why 15 minutes? Not because the certificate is changed so often, but so that
there is a timely effect for initiated changes.

When using multi-domain (SAN) certificates, it may happen that ACME consists of
several challenges. This is also supported by Seanox XMEX.

With the automatism Seanox XMEX is ready for automated ACME management e.g. by
certbot.

### CORS

In this section the CORS (Cross-Origin Resource Sharing) are configured.  
Even though the keys are case-insensitive, it should be noted here because the
keys are inserted directly into the response header.

| Key                                | Value   | Description |
| :--------------------------------- | :------ | :---------- |
| `Access-Control-Allow-Origin`      | `*`     | TODO:       |
| `Access-Control-Allow-Credentials` | `true`  | TODO:       |
| `Access-Control-Max-Age`           | `86400` | TODO:       |
| `Access-Control-Expose-Headers`    | `*`     | TODO:       |

For the preflight OPTIONS the following headers are added automatically:  
`Access-Control-Allow-Methods`, `Access-Control-Allow-Headers`

### REQUEST

In this section the request are configured.

| Key                                | Value   | Description                                                                                                             |
| :--------------------------------- | :------ | :---------------------------------------------------------------------------------------------------------------------- |
| `DATA-LIMIT`                       | `1024k` | Maximum data size of the request (for all HTTP methods).<br/>An overflow is answered with status 415 Payload Too Large. |

### CONTENT

For responding to requests outside the XMEX API path, the integrated web server
can be used. The directory `./docs` is the document root. The web server
implements only the elementary HTTP methods `OPTIONS`, `HEAD` and `GET`.
Default files can be specified when calling directories. A listing of directory
contents (Directory Index) is not implemented. Requests from directories
without default are responded with status 403.  
Alternatively, static or dynamic forwarding can be configured.

The web server function is disabled by default and is configured in
`service.ini` in section `CONTENT`. Without the web server function, requests
outside the XMEX API path are responded to with status 404.

| Key         | Value                              | Description                                                                                                             |
| :---------- | :--------------------------------- | :---------------------------------------- |
| `REDIRECT`  | `https://example.local`            | Example of static redirect                |
| `REDIRECT`  | `https://example.local...`         | Example of dynamic redirect               |
| `DIRECTORY` | `./docs`                           | Root directory from web content           |
| `DEFAULT`   | `index.htm index.html index.xhtml` | Default files when requesting directories |

A `REDIRECT` has a higher priority than a content directory. The redirection is
used for all requests that do not match the API path. The redirection can be
static or dynamic if ends with `...` . Dynamic means that beginning from the
path of the requested URL is appended to the redirect.

Without `REDIRECT` or `DIRECTORY`, requests outside the URL of the API are
responded with status 404 (Not Found). With `DIRECTORY`, a rudimentary web
server implementation is used for the specified directory.

### STORAGE

In this section the datasource and storage(s) are configured.

| Key         | Value    | Description                                                                                                                                                                                                  |
| :---------- | :------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DIRECTORY` | `./data` | Maximum number of files in data storage.<br/> Exceeding the limit causes the status 507 - Insufficient Storage.                                                                                              |
| `SPACE`     | `256K`   | Maximum data size of files in data storage in bytes.<br/> The value also limits the size of the requests(-body).<br/> The symbols `k`/`m`/`g` are supported.<br/> Without symbol it is bytes.                |
| `IDLE`      | `900s`   | Maximum idle time of the files in milliseconds.<br/> If the inactivity exceeds this time for a Storage, it expires.<br/> The symbols `ms`/`s`/`m`/`h` are supported.<br/> Without symbol it is milliseconds. |
| `QUANTITY`  | `65535`  | Maximum number of files in data storage.<br/> Exceeding the limit causes the status 507 - Insufficient Storage.                                                                                              |

### LOGGING

In this section the logging are configured.  
The logging configuration is dynamic and uses a syntax inspired by the Apache
Common Log Format.

| Key      | Value                                                                          | Description |
| :------- | :----------------------------------------------------------------------------- | :---------- |
| `OUTPUT` | `%X ...`                                                                       | TODO:       |
| `OUTPUT` | `%X ... > ./logs/%Y%M%D-output.log`                                            | TODO:       |
| `OUTPUT` | `off`                                                                          | TODO:       |
| `ERROR`  | `%X ...`                                                                       | TODO:       |
| `ERROR`  | `%X ... > ./logs/%Y%M%D-error.log`                                             | TODO:       |
| `ERROR`  | `off`                                                                          | TODO:       |
| `ACCESS` | `%h %l %u [%t] "%r" %s %b "%{User-Agent}"`                                     | TODO:       |
| `ACCESS` | `%h %l %u [%t] "%r" %s %b "%{User-Agent}" > ./logs/%t:Y%t:M%t:D-%a-access.log` | TODO:       |
| `ACCESS` | `off`                                                                          | TODO:       |

Description of the log format symbols for `OUTPUT` and `ERROR`.  
Simplified symbol set with focus on date and time.    
For unknown symbols, the `%` character at the beginning is removed and the
following character is output.

| Symbol   | Format                | Description |
| :------- | :-------------------- | :---------- |
| `%X`     | `YYYY-MM-DD hh:mm:ss` | Timestamp   |
| `%x`     | `YYYY-MM-DD`          | Timestamp   | 
| `%Y`     | `YYYY`                | Year        |
| `%y`     | `YY`                  | Year        | 
| `%M`     | `MM`                  | Month       | 
| `%D`     | `DD`                  | Day         |
| `%t`     | `hh:mm:ss`            | Timestamp   |
| `%h`     | `hh`                  | Hours       |
| `%m`     | `mm`                  | Minutes     |
| `%s`     | `ss`                  | Seconds     |
| `...`    | `...`                 | Text        |

Description of the log format symbols for `ACCESS`.  
Extended symbol set with focus on request, response, date and time.    
For unknown symbols, the `%` character at the beginning is removed and the
following character is output.

| Symbol     | Format                   | Description                |
| :--------- | :----------------------- | :------------------------- |
| `%r`       | `%m %U%q %H`             | Request                    | 
| `%{...}`   | Text                     | Request Header             |
| `%a`       | Name or IP               | Local Host                 |
| `%h`       | Name or IP               | Remote Host                |
| `%l`       | `-`                      | Reserved for Authorization |
| `%u`       | `-`                      | Reserved for User          |
| `%s`       | `000`                    | Response Status Code       |
| `%b`       | `0` / `-`                | Response Content Length    |
| `%B`       | `0`                      | Response Content Length    |
| `%m`       | Text                     | Request Method             |
| `%U`       | Text                     | Request URI                |
| `%q`       | Text                     | Request Query              |
| `%H`       | Text                     | Request HTTP Version       |
| `%t`       | `DD/MMM/YYYY:hh:mm:ss Z` | Timestamp                  |
| `%t:X`     | `YYYY-MM-DD hh:mm:ss`    | Timestamp                  |
| `%t:x`     | `YYYY-MM-DD`             | Timestamp                  | 
| `%t:Y`     | `YYYY`                   | Year                       |
| `%t:y`     | `YY`                     | Year                       | 
| `%t:M`     | `MM`                     | Month                      | 
| `%t:D`     | `DD`                     | Day                        |
| `%t:t`     | `hh:mm:ss`               | Timestamp                  |
| `%t:h`     | `hh`                     | Hours                      |
| `%t:m`     | `mm`                     | Minutes                    |
| `%t:s`     | `ss`                     | Seconds                    |



- - -

[Installation](installation.md) | [TOC](README.md) | [Terms](terms.md)
