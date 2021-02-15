[Motivation](motivation.md) | [TOC](README.md) | [Configuration](configuration.md)
- - -

# Installation

__This chapter is only relevant if you want to run the Datasource on your own
server.  
If you want to use an existing Datasource on the Internet, you can skip
this chapter.__


## Contents Overview

* [Windows](#windows)
  * [libxml2](#libxml2)
  * [Node.js](#nodejs)
  * [Service](#service)   
* [Linux](#linux)
  * [libxml2](#libxml2-1)
  * [Node.js](#nodejs-1)
  * [Daemon](#daemon)
* [Container](#container)


# Windows

The setup for Windows is described here in an installation-free version.
Therefore the location in the file system is relative and can be freely chosen
and so the following directory structure is only an example.

```
+ xmex
  + data 
  + libxml2
    - libexslt-0.dll
    - libgcc_s_dw2-1.dll
    - libxml2-2.dll
    - libxslt-1.dll
    - xsltproc.exe
  + logs  
  + node
    - node.exe
    - ...
  + nssm
  - service.js
  - service.cmd 
```

## libxml2

Required components (minimum):

- libxml2 &#160; `libxml2-2.dll`
- libxslt &#160;&#160;&#160; `libexslt-0.dll`
- libxslt &#160;&#160;&#160; `libxslt-1.dll`
- libxslt &#160;&#160;&#160; `xsltproc.exe`
- mingwrt `libgcc_s_dw2-1.dll`

Download the required files here: http://xmlsoft.org/sources/win32/  
or use the [Windows Binary (zip)](TODO:latest) for Seanox XML-Micro-Exchange.

The directory must then be added to the `PATH` that Node.js and the service
will then also use. It can be the system-wide environment variable `PATH`, but
this is not required.

## Node.js

## Service

TODO:


# Linux
## libxml2
## Node.js
## Daemon

TODO:


# Container

TODO:

The service runs with the user `nobody` and is therefore not a root.
```
docker run -d -p 8000:8000/tcp --rm --name xmex seanox/xmex:latest
```

The REST API is then usable via all host and IP address allowed/supported for the container as follows.  
A direct browser request is answered with status 400.  
Please read more about the usage of the [API](api.md).
```
http://localhost:8000/xmex!
```

## Directory Structure

```
/xmex
    /conf
        - service.ini
    /data
        - <storage>.xml
        - ...
    /logs
        - <date>-<host>-access.log
        - <date>-error.log
        - <date>-output.log
        - ...
    - service.js
```
The directories `/xmex/conf`, `/xmex/data`, `/xmex/logs` can be mapped, binded to other places or be changed and overwritten in their own images.  
For the configuration of the service `/xmex/conf/service.ini` is used.  
Unlike configurations in JSON, this is more error tolerant and supports comments.

TODO:



- - -

[Motivation](motivation.md) | [TOC](README.md) | [Configuration](configuration.md)