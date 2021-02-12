<p>
  <a href="https://github.com/seanox/xml-micro-exchange-js/pulls">
    <img src="https://img.shields.io/badge/development-active-green?style=for-the-badge">
  </a>
  <a href="https://github.com/seanox/xml-micro-exchange-js/issues">
    <img src="https://img.shields.io/badge/maintenance-active-green?style=for-the-badge">
  </a>
  <a href="http://seanox.de/contact">
    <img src="https://img.shields.io/badge/support-active-green?style=for-the-badge">
  </a>
</p>


# Description
The origin of the project is the desire for an easily accessible place for data
exchange on the Internet.  
Inspired by JSON-Storages the idea of a feature-rich equivalent based on XML,
XPath and XSLT was born.  
The focus should be on a public, volatile and short-term data exchange for
(static) web-applications and IoT.

__Just exchange data without an own server landscape.__  
__Just exchange data without knowing and managing all clients.__

XML-Micro-Exchange is a volatile NoSQL stateless micro datasource for the
Internet. It is designed for easy communication and data exchange of
web-applications and for IoT or for other Internet-based modules and
components.  
The XML based datasource is volatile and lives through continuous use and
expires through inactivity. They are designed for active and near real-time data
exchange but not as a real-time capable long-term storage.  
Compared to a JSON storage, this datasource supports more dynamics, partial data
access, data transformation, and volatile short-term storage. 

__Why all this?__

Static web-applications on different clients want to communicate with each
other, e.g. for games, chats and collaboration.

Smart sensors want to share their data and smart devices want to access this
data and also exchange data with each other.

Clients can establish dynamically volatile networks.

__In this communication are all participants.__  
__No one is a server or master, all are equal and no one has to know the other.__  
__All meet without obligation.__


# Features

## RESTful
The REST API supports the HTTP methods CONNECT, OPTIONS, GET, POST, PUT, PATCH,
DELETE.  
The CONNECT method is not a standard and the function can be used
alternatively via OPTIONS.  

## XPath
XPath axes and functions are used for access, navigation and addressing of
targets in the data source and it is an integral part of the URI with dynamic
and functional effects.

## Multible axes and targets
An XPath axis can address several elements and attributes simultaneously, which
can be changed with one call.

## XPath Functions
PUT and PATCH support XML structures and static values (text), as well as XPath
functions that allow dynamic values. 

## Data Query
Data can be queried in the form of XML structure or substructure if the XPath
notation represents an axis, otherwise the XPath is interpreted as an XPath
function and responded with the result as text. 
Thus XPath provides a dynamic syntax for queries.

## Data Transformation
The POST method supports data transformation via XSLT.  
Similar to GET, data can be queried and then transformed with an XSLT template
transmitted via POST.

## Security
This aspect was deliberately considered and implemented here only in a very
rudimentary form. The storage(-key) with a length of 1 - 64 characters and the
individual root element can be regarded as secret.  
In addition, HTTPS is supported but without client certificate authorization.   

## Containerization
XML-Micro-Exchange is also available as a container image on Docker Hub:
https://hub.docker.com/repository/docker/seanox/xmex

## Differences to the PHP version
- XPath as query string is not supported
- HTTP method CONNECT is not supported
- Processing of XPath may differ in detail due to the use of different libraries
- Transformation (XSLT) may differ in detail due to the use of different libraries


# Licence Agreement
LIZENZBEDINGUNGEN - Seanox Software Solutions ist ein Open-Source-Projekt, im
Folgenden Seanox Software Solutions oder kurz Seanox genannt.
 
Diese Software unterliegt der Version 2 der Apache License.

Copyright (C) 2021 Seanox Software Solutions

Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed
under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
CONDITIONS OF ANY KIND, either express or implied. See the License for the
specific language governing permissions and limitations under the License.


# System Requirement
TODO:


# Downloads
TODO:


# Docker Image
TODO:


# Free XML-Micro-Exchange 
TODO:


# Manual
* [Table Of Contents](https://github.com/seanox/xml-micro-exchange-js/blob/master/manual/README.md#manual)
* [Motivation](https://github.com/seanox/xml-micro-exchange-js/blob/master/manual/motivation.md)
* [Installation](https://github.com/seanox/xml-micro-exchange-js/blob/master/manual/installation.md)
* [Configuration](https://github.com/seanox/xml-micro-exchange-js/blob/master/manual/configuration.md)
    * [Web Server](https://github.com/seanox/xml-micro-exchange-js/blob/master/manual/configuration.md#web-server)
    * [Parameters](https://github.com/seanox/xml-micro-exchange-js/blob/master/manual/configuration.md#parameters)
* [Terms](https://github.com/seanox/xml-micro-exchange-js/blob/master/manual/terms.md)
* [Getting Started](https://github.com/seanox/xml-micro-exchange-js/blob/master/manual/getting-started.md)
* [API](https://github.com/seanox/xml-micro-exchange-js/blob/master/manual/api.md)
    * [DELETE](https://github.com/seanox/xml-micro-exchange-js/blob/master/manual/api-delete.md)
    * [GET](https://github.com/seanox/xml-micro-exchange-js/blob/master/manual/api-get.md)
    * [OPTIONS](https://github.com/seanox/xml-micro-exchange-js/blob/master/manual/api-options.md)
    * [PATCH](https://github.com/seanox/xml-micro-exchange-js/blob/master/manual/api-patch.md)
    * [POST](https://github.com/seanox/xml-micro-exchange-js/blob/master/manual/api-post.md)
    * [PUT](https://github.com/seanox/xml-micro-exchange-js/blob/master/manual/api-put.md)
* [Error Handling](https://github.com/seanox/xml-micro-exchange-js/blob/master/manual/error-handling.md)
* [Development](https://github.com/seanox/xml-micro-exchange-js/blob/master/manual/development.md)
* [Test](https://github.com/seanox/xml-micro-exchange-js/blob/master/manual/test.md)


# Changes (Change Log)
TODO:

[Read more](https://raw.githubusercontent.com/seanox/xml-micro-exchange-js/master/CHANGES)


# Contact
[Issues](https://github.com/seanox/xml-online-storage/issues)  
[Requests](https://github.com/seanox/xml-online-storage/pulls)  
[Mail](http://seanox.de/contact)  


# Thanks!
<img src="https://raw.githubusercontent.com/seanox/seanox/master/sources/resources/images/thanks.png">

[JetBrains](https://www.jetbrains.com/?from=seanox)  
Sven Lorenz  
Andreas Mitterhofer  
[novaObjects GmbH](https://www.novaobjects.de)  
Leo Pelillo  
Gunter Pfannm&uuml;ller  
Annette und Steffen Pokel  
Edgar R&ouml;stle  
Michael S&auml;mann  
Markus Schlosneck  
[T-Systems International GmbH](https://www.t-systems.com)
