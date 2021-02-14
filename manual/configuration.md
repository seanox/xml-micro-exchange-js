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
  * [CORS](#cors)
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

| Key       | Value                 | Description |
| :-------- | :-------------------- | :---------- |
| `ADDRESS` | `0.0.0.0`             | TODO:       |
| `PORT`    | `8000`                | TODO:       |
| `CONTEXT` | `/xmex!`              | TODO:       |
| `SECURE`  | `cert.pem key.pem`    | TODO:       |
| `SECURE`  | `cert.pfx passphrase` | TODO:       |

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

### STORAGE

In this section the datasource and storage(s) are configured.

| Key         | Value    | Description |
| :---------- | :------- | :---------- |
| `DIRECTORY` | `./data` | TODO:       |
| `SPACE`     | `256K`   | TODO:       |
| `IDLE`      | `900s`   | TODO:       |
| `QUANTITY`  | `65535`  | TODO:       |

### LOGGING

In this section the logging are configured.  
The logging configuration is dynamic and uses a syntax inspired by the Apache
Common Log Format.

| Key      | Value                                                                          | Description |
| :------- | :----------------------------------------------------------------------------- | :---------- |
| `OUTPUT` | `%X ...`                                                                       | TODO:       |
| `OUTPUT` | `%X ... > ./logs/%Y%M%D-output.log`                                            | TODO:       |
| `ERROR`  | `%X ...`                                                                       | TODO:       |
| `ERROR`  | `%X ... > ./logs/%Y%M%D-error.log`                                             | TODO:       |
| `ACCESS` | `%h %l %u [%t] "%r" %s %b "%{User-Agent}"`                                     | TODO:       |
| `ACCESS` | `%h %l %u [%t] "%r" %s %b "%{User-Agent}" > ./logs/%t:Y%t:M%t:D-%a-access.log` | TODO:       |

Description of the log format symbols for `OUTPUT` and `ERROR`.  
Simplified symbol set with focus on date and time.

| Symbol   | Description |
| :------- | :---------- |
| `%TODO:` | TODO:       |


Description of the log format symbols for `ACCESS`.  
Extended symbol set with focus on request, response, date and time.

| Symbol   | Description |
| :------- | :---------- |
| `%TODO:` | TODO:       |



- - -

[Installation](installation.md) | [TOC](README.md) | [Terms](terms.md)
