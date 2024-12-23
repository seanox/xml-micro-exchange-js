&#9665; [Installation](installation.md)
&nbsp;&nbsp;&nbsp;&nbsp; &#8801; [Table of Contents](README.md)
&nbsp;&nbsp;&nbsp;&nbsp; [Terms](terms.md) &#9655;
- - -

# Configuration

> [!NOTE]
> __This chapter is only relevant if you want to run the Datasource on your own
> server. If you want to use an existing Datasource on the Internet, you can
> skip this chapter.__


## Contents Overview

* [Environment Variables](#environment-variables)
  * [XMEX_DEBUG_MODE](#xmex_debug_mode)
  * [XMEX_CONNECTION_ADDRESS](#xmex_connection_address)
  * [XMEX_CONNECTION_PORT](#xmex_connection_port)
  * [XMEX_CONNECTION_CONTEXT](#xmex_connection_context)
  * [XMEX_CONNECTION_CERTIFICATE](#xmex_connection_certificate)
  * [XMEX_CONNECTION_SECRET](#xmex_connection_secret)
  * [XMEX_CONTENT_DIRECTORY](#xmex_content_directory)
  * [XMEX_CONTENT_DEFAULT](#xmex_content_default)
  * [XMEX_CONTENT_REDIRECT](#xmex_content_redirect)
  * [XMEX_STORAGE_DIRECTORY](#xmex_storage_directory)
  * [XMEX_STORAGE_SPACE](#xmex_storage_space)
  * [XMEX_STORAGE_EXPIRATION](#xmex_storage_expiration)
  * [XMEX_STORAGE_QUANTITY](#xmex_storage_quantity)
  * [XMEX_STORAGE_REVISION_TYPE](#xmex_storage_revision_type)
  * [XMEX_LIBXML_DIRECTORY](#xmex_libxml_directory)
* [Docker Image](#docker-image) 


## Environment Variables

XML-Micro-Exchange is configured via environment variables. The existing default
values are suitable for productive use.

### XMEX_DEBUG_MODE
Activates optimizations for debugging and testing.

- Enforces the serial revision type
- Extends the response with additional trace headers
- Uses the file extension xml for the XML storage files
- Beautifies the XML storage files (indentation and line breaks)
- Saves each revision in consecutive XML files

Supported values: `on`, `true`, `1`.
 
Default: `off`

### XMEX_CONNECTION_ADDRESS
Host name or IP where the server is listening.

Default: `0.0.0.0` (listens on all available IPv4 addresses)

### XMEX_CONNECTION_PORT
Port where the server is listening.

Default: `80`

### XMEX_CONNECTION_CONTEXT
Context path of the URI from XMEX service. Other URIs are responded to as
requests for static content from the content directory.

Default: `/xmex!`

### XMEX_CONNECTION_CERTIFICATE
Path to the server certificate in PEM, DER or PFX format for HTTPS.

### XMEX_CONNECTION_SECRET
Key or passphrase of the server certificate for HTTPS.

### XMEX_CONTENT_DIRECTORY
Path of static content.

Default: `./content`

### XMEX_CONTENT_DEFAULT
List of standard files separated by spaces when requesting directories in the
static content.

Default: `index.html openAPI.html`

### XMEX_CONTENT_REDIRECT
Optional permanent redirection for static content requests.

### XMEX_STORAGE_EXPIRATION
Maximum time of inactivity of the storage files in seconds. Without file access
during this time, the storage files are deleted.

Default: `900` (15 min, 15 x 60 sec)

### XMEX_LIBXML_DIRECTORY
Path of the libxml installation.

Default: `./libxml`

### XMEX_STORAGE_DIRECTORY
Directory of the data storage, which is configured with the required permissions
by the script at runtime.

Default: `./data`

### XMEX_STORAGE_QUANTITY
Maximum number of files in data storage. Exceeding the limit causes the status
507 - Insufficient Storage.

Default: `65535`

### XMEX_STORAGE_REVISION_TYPE
Defines the revision type. Supported values: `serial` (starting with 1),
`timestamp` (alphanumeric).

Default: `timestamp`

### XMEX_STORAGE_SPACE
Maximum data size of files in data storage in bytes. The value also limits the
size of the requests(-body).

Default: `262144` (256 kB, 256 x 1024 kB)

### XMEX_URI_XPATH_DELIMITER
Character or character sequence of the XPath delimiter in the URI. Changing this
value often also requires changes to the web server configuration.

Default: `!`


## Docker Image

__Application relevant directories:__
- `/usr/local/xmex`
- `/usr/local/xmex/content`
- `/usr/local/xmex/data`

__Node.js relevant locations:__
- `/usr/local/bin/node`

__libxml relevant locations:__
- `/usr/bin/xsltproc`



- - -
&#9665; [Installation](installation.md)
&nbsp;&nbsp;&nbsp;&nbsp; &#8801; [Table of Contents](README.md)
&nbsp;&nbsp;&nbsp;&nbsp; [Terms](terms.md) &#9655;
