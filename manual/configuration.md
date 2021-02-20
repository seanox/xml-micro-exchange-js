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

| Key       | Value                 | Description                                                                                                       |
| :-------- | :-------------------- | :---------------------------------------------------------------------------------------------------------------- |
| `ADDRESS` | `0.0.0.0`             | Host name or IP where the server is listening.                                                                    |
| `PORT`    | `8000`                | Port where the server is listening.                                                                               |
| `CONTEXT` | `/xmex!`              | Context path der URL.<br/> It should end with a symbol to better visually distinguish the XPath from the request. |
| `SECURE`  | `cert.pem key.pem`    | Certificate files if TLS/HTTPS is to be used.<br/> Order: certificate, key                                        |
| `SECURE`  | `cert.pfx passphrase` | Certificate files if TLS/HTTPS is to be used.<br/> Order: certificate, passphrase                                 |

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
| `ERROR`  | `%X ...`                                                                       | TODO:       |
| `ERROR`  | `%X ... > ./logs/%Y%M%D-error.log`                                             | TODO:       |
| `ACCESS` | `%h %l %u [%t] "%r" %s %b "%{User-Agent}"`                                     | TODO:       |
| `ACCESS` | `%h %l %u [%t] "%r" %s %b "%{User-Agent}" > ./logs/%t:Y%t:M%t:D-%a-access.log` | TODO:       |

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
| `%r`       | TODO:                    | TODO                       | 
| `%{...}`   | TODO:                    | TODO                       |
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
