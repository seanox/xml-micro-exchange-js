&#9665; [Configuration](configuration.md)
&nbsp;&nbsp;&nbsp;&nbsp; &#8801; [Table of Contents](README.md)
&nbsp;&nbsp;&nbsp;&nbsp; [Getting Started](getting-started.md) &#9655;
- - -

# Terms


## Contents Overview

* [Datasource](#apache-httpd)
* [Storage](#seanox-devwex)
* [Storage Identifier](#storage-identifier)
* [Element(s)](#elements)
* [Attribute(s)](#attributes)
* [XPath](#xpath)
* [XPath Axis](#xpath-axis)
* [XPath Axis Pseudo Elements](#xpath-axis-pseudo-elements)
* [XPath Function](#xpath-function)
* [Revision](#revision)
* [UID](#uid)
* [Transaction / Simultaneous Access](#transaction--simultaneous-access)


## Datasource
XML-Micro-Exchange is a data service that manages various data storages. The 
entirety of all data is the data source. Physically, this is the data directory.

## Storage
In the data directory, the data are managed as XML storage files. The file name
is based case-sensitive on the identifier of the storage and the name of the
root element.

## Storage Identifier
Each storage has an identifier. The Storage Identifier is used as filename of
the corresponding XML file and must be specified with each request so that the
datasource uses the correct storage. Optionally, the storage identifier can be
followed by the name of the root element of the XML file separated by a space.
If the root element is not specified, the default `data` is used.

__Important:__ To use a storage, the storage identifier and name of the root
element must match. The name of the storage and the name of the root element
compose the storage name in the file system and are case-sensitive. Different
spellings and names then use different storages.

## Element(s)
The content of the XML storage file provide the data as object or tree
structure. The data entries are called elements. Elements can enclose other
elements.

## Attribute(s)
Elements can also contain direct values in the form of attributes.

## XPath
XPath is a notation for accessing and navigating the XML data structure. An
XPath can be an axis or a function.

## XPath Axis
XPath axes address or select elements or attributes. The axes can have a
multidimensional effect.

## XPath Axis Pseudo 
For PUT requests it is helpful to specify a relative navigation to an XPath
axis. For example first, last, before, after. This extension of the notation is
supported for PUT requests and is added to an XPath axis separated by two colons
at the end (e.g. `/root/element::end` - means put in element as last).

## XPath Function
The XPath notation also supports functions that can be used in combination with
axes and standalone for dynamic data requests. In combination with XPath axes,
the addressing and selection of elements and attributes can be made dynamic.

## Revision
Every change in a storage is expressed as a revision. This should make it easier
for the client to determine whether data has changed, even for partial requests.
Depending on `XMEX_STORAGE_REVISION_TYPE`, the revision is an auto-incremental
integer starting with 1 or an alphanumeric timestamp.
   
Each element uses a revision in the read-only attribute `___rev`, which, as with
all parent revision attributes, is automatically update when it changes. A
change can affect the element itself or the change to its children. Because the
revision is passed up, the root element automatically always uses the current
revision. Write accesses to attribute `___rev` are accepted but has no effect.
If only the attribute is changed, the request is responded with status 304.

## UID
Each element uses a unique identifier in the form of the read-only attribute
`___uid`. The unique identifier is automatically created when an element is put
into storage and never changes. The UID based on the current revision and a
request-related auto-incremental integer. The UID is thus also sortable and
provides information about the order in which elements are created. Write
accesses to attribute `___uid` are accepted but has no effect. If only the
attribute is changed, the request is responded with status 304.
 
## Transaction and Simultaneous Access
XML-Micro-Exchange supports simultaneous access. Read accesses are executed
simultaneously. Write accesses creates a lock and avoids dirty reading.



- - -
&#9665; [Configuration](configuration.md)
&nbsp;&nbsp;&nbsp;&nbsp; &#8801; [Table of Contents](README.md)
&nbsp;&nbsp;&nbsp;&nbsp; [Getting Started](getting-started.md) &#9655;
