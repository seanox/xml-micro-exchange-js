[Terms](terms.md) | [TOC](README.md) | [API](api.md)
- - -

# Getting Started

These instructions describe exclusively the use of the REST API.  
Installation and configuration are only for your own operation of the
datasource and are described in separate chapters.


## Preamble

What is and does XML-Micro-Exchange?

It is an volatile NoSQL stateless micro datasource for the internet.  
The datasource is a gathering place for data exchange for static
web-applications and IoT or for other Internet-based modules and components.

Volatile means that the data is not stored permanently. The datasource lives
on regular use, without this its stored data will expire.

NoSQL is a hint at the feature set and support for querying and transforming
data, as well functions for the data access. Because the datasource can do
more than just write and read data.  

Stateless, as all requests are processed independently with the current state
of the data. There are no transactions and no fixed connections.

Micro, because the datasource is more of a data cell. The storage space is
recommended less than 1 MB. That sounds small but is very much for a stateless
communication.

Think of the datasource as a regulars' table in a pub in their town.  
Anyone who knows the address can come.  
They are in the public space and yet private.  
Everyone is equal. Only the participants have their rituals and rules, but not
the place.  
Everyone can say and ask what he wants and everyone can decide for himself
which data and in which form he brings in or takes out.

In the following, we will take a closer look at the regulars' table and
understand, implement and use.


## Contents Overview

* [The Regulars' Table](#the-regulars-table)
* [Place and Address](#place-and-address)
* [The First Guest](#the-first-guest)
* [More Guests are Coming](#more-guests-are-coming)
* [Small Talk](#small-talk)
* [The Innkeeper](#the-innkeeper)
* [The Sniffer and Data Artist](#the-sniffer-and-data-artist)
* [A Clean Sendoff](#a-clean-sendoff)
* [Final End](#final-end)


## The Regulars' Table

It in a simple table in a pub.
Only the presence of guests and their ritual of the regulars' table, make this
table to a regulars' table. Whether or not the table is already in the pub at
that time, or is another regular table for other guests, can be ignored.

In the context of the XML-Micro-Exchange, the regulars' table is an XML file
called Storage.  
Each storage has a 1 - 64 characters long and consists only of numbers,
upper/lower case letters and underscore. Optionally there is a name for the
root element, as default `data` is used. Which are the two secrets a regulars'
table can have.  


## Place and Address

Who wants to participate in the regulars' table needs the place and address.  
For the XML-Micro-Exchange, this is the URL of the API and a storage
identifier.

__URL:__ [https://xmex.seanox.com/xmex!](https://xmex.seanox.com/xmex!)  
The here listed datasource contains 65536 storages with max. 256 kByte per
storage. The expiration occurs after 15 minutes of inactivity.  
Do not panic when opening the URL in the browser, the service is online and the
error status is normal for requests without a storage identifier.

The storage identifier is 1 - 64 characters long and consists only of numbers,
upper/lower case letters and underscore. Any character string can be used.

For our example, we will derive the storage identifier from the following
fictitious address:

&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;Blue Bear  
&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;12 East 8th Street  
&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;New York, NY 10003  
&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;USA

__Storage Identifier:__ `US_NY_10003_123_EAST_8TH_STREET_BLUE_BEAR_T_01`

Here it is important to understand that we are in a public space and cannot
exclude that the storage identifier is already used, which can be queried. If
you need more exclusivity and privacy, you should run the XML-Micro-Exchange
yourself, which can then be secured with authorization and/or certificates.

Optionally, we can also want a name for the root element in the storage.

__Root-Element:__ `table`

Here it is important to know that all participants must know three things: URL,
Storage Identifier and Name of the root-element.


## The First Guest

There is still a simple table in the pub.  
Now comes the first guest. Opens the door to the pub, goes to the table and
thus opens the regular's table.

For XML-Micro-Exchange, this is a OPTIONS request with the familiar things:
Address, Storage Identifier and name from the root element.

Here it is important to know that the example in the use the full URL instead
of the usual URI.

```
OPTIONS https://xmex.seanox.com/xmex! HTTP/1.0
Storage: US_NY_10003_123_EAST_8TH_STREET_BLUE_BEAR_T_01 table
```

In both cases, the request is responded to with the response header
`Connection-Unique`. This unique ID can then be used by the client if it wants
to use connection- or session-specific keys in the storage.

```
HTTP/1.0 202 Accepted / 201 Resource Created
Date: Wed, 11 Nov 2020 12:00:00 GMT
Access-Control-Allow-Origin: *
Storage: US_NY_10003_123_EAST_8TH_STREET_BLUE_BEAR_T_01
Storage-Revision: 0
Storage-Space: 262144/83 bytes
Storage-Last-Modified: Wed, 11 Nov 20 12:00:00 +0000
Storage-Expiration: Wed, 11 Nov 20 12:00:00 +0000
Storage-Expiration-Time: 900000 ms
Connection-Unique: ABI0ZX99X13M
Allow: OPTIONS, GET, POST, PUT, PATCH, DELETE
Execution-Time: 6 ms
```

Everyone who knows the address and storage identifier and, as in our example,
the name of the root element can participate in the regulars' table.

Our first guest is John Doe.
John knows the rituals and rules of the regulars' table and the pub.  
___A rule from the regulars' table: Anyone joining the regulars' table must
check that it has been arranged correctly and do so when required.___  

John knows from the response status 201 that he was the first to create the
regulars' table, that there is a guest list where he signs in as a guest and
that there is also a section for the conversations. But he does not know
whether someone else has joined the regulars' table in the meantime and
followed the rule for arranging it. John's scheme could delete data that was
created in the meantime.

XML-Micro-Exchange supports simultaneous accesses, but no locking mechanism.  
The solution and also the reason why there is no locking mechanism can be found
in the XPath functions.  
We can optionally initialize the regulars' table, only if the elements to be
created do not yet exist. If the elements already exist, the request will be
responded with status 404, because the target, which means a table without
guests does not exist.

```
PUT https://xmex.seanox.com/xmex!/table[not(guests)]::last HTTP/1.0
Storage: US_NY_10003_123_EAST_8TH_STREET_BLUE_BEAR_T_01 table
Content-Type: application/xslt+xml
Content-Length: 49

<guests>
  <persons/>
  <conversation/>
</guests>
```
```
HTTP/1.0 204 No Content
Date: Wed, 11 Nov 2020 12:00:00 GMT
Access-Control-Allow-Origin: *
Storage-Effects: KHDCPS0012OS:0:A KHDCPS0012OP:0:M KHDCPS0012OS:1:A KHDCPS0012OS:2:A
Storage: US_NY_10003_123_EAST_8TH_STREET_BLUE_BEAR_T_01
Storage-Revision: 1
Storage-Space: 262144/244 bytes
Storage-Last-Modified: Wed, 11 Nov 20 12:00:00 +0000
Storage-Expiration: Wed, 11 Nov 20 12:00:00 +0000
Storage-Expiration-Time: 900000 ms
Connection-Unique: ABI0ZX99X13M
Execution-Time: 6 ms
```

Each request that causes changes in the storage is responded to with an
overview of the effects in the response header `Storage-Effects` -- more about
this later.

Now John has arranged the regulars' table.

John is now waiting for more guests and the innkeeper.  
So that all notice him, he puts his name in the guest list.

```
PUT https://xmex.seanox.com/xmex!/table/guests/persons::last HTTP/1.0
Storage: US_NY_10003_123_EAST_8TH_STREET_BLUE_BEAR_T_01 table
Content-Type: application/xslt+xml
Content-Length: 55

<person name="John Doe" mail="john.doe@example.local"/>
```

John could make sure and check beforehand if there are people with the same
name and he could delete any duplicate entries.  
We ignore that in this example.

While John waits, he uses polling and sends repeated requests to keep the
storage with the data and to get the revision from the storage.

```
OPTIONS https://xmex.seanox.com/xmex! HTTP/1.0
Storage: US_NY_10003_123_EAST_8TH_STREET_BLUE_BEAR_T_01 table
```
```
HTTP/1.0 202 Accepted
Date: Wed, 11 Nov 2020 12:00:00 GMT
Access-Control-Allow-Origin: *
Storage: US_NY_10003_123_EAST_8TH_STREET_BLUE_BEAR_T_01
Storage-Revision: 2
Storage-Space: 262144/344 bytes
Storage-Last-Modified: Wed, 11 Nov 20 12:00:00 +0000
Storage-Expiration: Wed, 11 Nov 20 12:00:00 +0000
Storage-Expiration-Time: 900000 ms
Connection-Unique: ABI0ZX99X13M
Execution-Time: 6 ms
```

The revision is a counter for changes in storage per request.  
If a request causes changes in the storage, no matter how many, the counter is
automatically incremented. The revision is managed by the storage. It is an
read only attribute named `___rev` that is automatically added to all elements.  
When changes are made in the storage, the revision is updated from the affected
element and recursively from all parent elements. This ensures that the root
element always has the latest revision. Clients can use the revision to detect
changes at the element level without monitoring the complete storage.

John also uses the revision.  
If the revision of the storage changes, he knows that the data for the
regulars' table has changed. This way he doesn't have to monitor all the data.


## More Guests are Coming

Three more guests enter the pub and go to the regulars' table.  
They are Jane Doe, Mike Ross and Dan Star.  
They are also all familiar with the rituals and rules of the regulars' table
and the pub and thus do the same as John.

They join the regulars' table with OPTIONS and are informed by the server
status 202 that the regulars' table already exists. Because they do not know
the state of the regulars' table, they arrange it in the same way as John.

```
OPTIONS https://xmex.seanox.com/xmex! HTTP/1.0
Storage: US_NY_10003_123_EAST_8TH_STREET_BLUE_BEAR_T_01 table
```
```
PUT https://xmex.seanox.com/xmex!/table[not(guests)]::last HTTP/1.0
Storage: US_NY_10003_123_EAST_8TH_STREET_BLUE_BEAR_T_01 table
Content-Type: application/xslt+xml
Content-Length: 49

<guests>
  <persons/>
  <conversation/>
</guests>
```

And they also put their names in the guest list.

```
PUT https://xmex.seanox.com/xmex!/table/guests/persons::last HTTP/1.0
Storage: US_NY_10003_123_EAST_8TH_STREET_BLUE_BEAR_T_01 table
Content-Type: application/xslt+xml
Content-Length: 55

<person name="Jane Doe" mail="jane.doe@example.local"/>
```
```
PUT https://xmex.seanox.com/xmex!/table/guests/persons::last HTTP/1.0
Storage: US_NY_10003_123_EAST_8TH_STREET_BLUE_BEAR_T_01 table
Content-Type: application/xslt+xml
Content-Length: 57

<person name="Mike Ross" mail="mike.ross@example.local"/>
```
```
PUT https://xmex.seanox.com/xmex!/table/guests/persons::last HTTP/1.0
Storage: US_NY_10003_123_EAST_8TH_STREET_BLUE_BEAR_T_01 table
Content-Type: application/xslt+xml
Content-Length: 56

<person name="Dan Star" mail="dan.star@example.local"/>
```

John notices something happening at the regulars' table.  
In the response to the OPTIONS request, which is sent periodically (polling),
the revision changed. It is time to look at the guest list and so he notices
the new guests and greets everyone.

```
GET https://xmex.seanox.com/xmex!count(/table/guests/persons/person)>1 HTTP/1.0
Storage: US_NY_10003_123_EAST_8TH_STREET_BLUE_BEAR_T_01 table
```

With the support of XPath functions, the query for new guests can be
implemented like this.  
The response is `true` or `false`.  
A Content-Type is not required for the request. Return values of an XPath
function are always of type `text/plain`.

```
PUT https://xmex.seanox.com/xmex!/table/guests/conversation::last HTTP/1.0
Storage: US_NY_10003_123_EAST_8TH_STREET_BLUE_BEAR_T_01 table
Content-Type: application/xslt+xml
Content-Length: 88

<message from="john.doe@example.local">Hello, nice to meet you all. I am John.</message>
```

The other guests also realize that they are in companionship and greet the round and introduce themselves.

```
GET https://xmex.seanox.com/xmex!count(/table/guests/persons/person)>1 HTTP/1.0
Storage: US_NY_10003_123_EAST_8TH_STREET_BLUE_BEAR_T_01 table
```
```
PUT https://xmex.seanox.com/xmex!/table/guests/conversation::last HTTP/1.0
Storage: US_NY_10003_123_EAST_8TH_STREET_BLUE_BEAR_T_01 table
Content-Type: application/xslt+xml
Content-Length: 88

<message from="jane.doe@example.local">Hello, nice to meet you all. I am Jane.</message>
```
```
PUT https://xmex.seanox.com/xmex!/table/guests/conversation::last HTTP/1.0
Storage: US_NY_10003_123_EAST_8TH_STREET_BLUE_BEAR_T_01 table
Content-Type: application/xslt+xml
Content-Length: 89

<message from="mike.ross@example.local">Hello, nice to meet you all. I am Mike.</message>
```
```
PUT https://xmex.seanox.com/xmex!/table/guests/conversation::last HTTP/1.0
Storage: US_NY_10003_123_EAST_8TH_STREET_BLUE_BEAR_T_01 table
Content-Type: application/xslt+xml
Content-Length: 88

<message from="dan.star@example.local">Hello, nice to meet you all. I am Dan.</message>
```

## Small Talk

```
PUT https://xmex.seanox.com/xmex!/table/guests/conversation::last HTTP/1.0
Storage: US_NY_10003_123_EAST_8TH_STREET_BLUE_BEAR_T_01 table
Content-Type: application/xslt+xml
Content-Length: 77

<message from="dan.star@example.local">
    Where do you come from?</message>
```
```
PUT https://xmex.seanox.com/xmex!/table/guests/conversation::last HTTP/1.0
Storage: US_NY_10003_123_EAST_8TH_STREET_BLUE_BEAR_T_01 table
Content-Type: application/xslt+xml
Content-Length: 100

<message from="john.doe@example.local">
    I'm from Hempstead and have a small bookstore.</message>
```
```
PUT https://xmex.seanox.com/xmex!/table/guests/conversation::last HTTP/1.0
Storage: US_NY_10003_123_EAST_8TH_STREET_BLUE_BEAR_T_01 table
Content-Type: application/xslt+xml
Content-Length: 102

<message from="jane.doe@example.local">
    I live in Long Island and have an antique store.</message>
```
```
PUT https://xmex.seanox.com/xmex!/table/guests/conversation::last HTTP/1.0
Storage: US_NY_10003_123_EAST_8TH_STREET_BLUE_BEAR_T_01 table
Content-Type: application/xslt+xml
Content-Length: 117

<message from="mike.ross@example.local">
    I live in Queens, work for a shipping company on a cargo ship.</message>
```
```
PUT https://xmex.seanox.com/xmex!/table/guests/conversation::last HTTP/1.0
Storage: US_NY_10003_123_EAST_8TH_STREET_BLUE_BEAR_T_01 table
Content-Type: application/xslt+xml
Content-Length: 95

<message from="dan.star@example.local">
    I work and live in Yonkers as a gardener.</message>
```
```
PUT https://xmex.seanox.com/xmex!/table/guests/conversation::last HTTP/1.0
Storage: US_NY_10003_123_EAST_8TH_STREET_BLUE_BEAR_T_01 table
Content-Type: application/xslt+xml
Content-Length: 106

<message from="dan.star@example.local">
    In this beautiful weather I arrived with my scooter.</message>
```
```
PUT https://xmex.seanox.com/xmex!/table/guests/conversation::last HTTP/1.0
Storage: US_NY_10003_123_EAST_8TH_STREET_BLUE_BEAR_T_01 table
Content-Type: application/xslt+xml
Content-Length: 8

<message from="dan.star@example.local">
    I like to look at the city.</message>
```

___A rule from the regulars' table: Maintain your conversation, but do not
store more than 5 messages.___

XML-Micro-Exchange is a place to exchange information. Active participants
should actively communicate here. However, it is not intended to be a classic
data store for archiving. The participants should have the change to read and
process the data in rest and to provide new data and no more.

A small talk or a chat quickly collects a lot of data.  
Even this flood of data can be well managed and cleaned with XPath functions
and this without transactions.

```
DELETE https://xmex.seanox.com/xmex!//conversation/message[position()<=count(//conversation/message)-5] HTTP/1.0
Storage: US_NY_10003_123_EAST_8TH_STREET_BLUE_BEAR_T_01 table
```

This request deletes all messages, except the max. last five.

Let's look at the response.
Here the effect on the storage is visible in the Storage-Effects header. This
header contains the UIDs of the elements that are directly affected by the
request. We get back the UIDs of all deleted and modified elements.

```
HTTP/1.0 204 No Content
Date: Wed, 11 Nov 2020 12:00:00 GMT
Access-Control-Allow-Origin: *
Storage-Effects: KHDCPS0014NT:0:D KHDCPS0014NI:2:M KHDCPS0014NU:0:D
Storage: US_NY_10003_123_EAST_8TH_STREET_BLUE_BEAR_T_01
Storage-Revision: 15
Storage-Space: 262144/1321 bytes
Storage-Last-Modified: Wed, 11 Nov 20 12:00:00 +0000
Storage-Expiration: Wed, 11 Nov 20 12:00:00 +0000
Storage-Expiration-Time: 900000 ms
Execution-Time: 4 ms
```

Then here is also a good place to clarify the misunderstanding of the server
status 404.  
The 404 status refers to storage and XPath (target).
Storage and XPath can be compared with HOST and URI, if one cannot be found,
the request is responded with status 404.

In our case, if the request is repeated and the XPath axis cannot address any
elements to be deleted, for example because there are less than 5 messages in
the conversation, the request is responded with status 404.


## The Innkeeper

TODO:


## The Sniffer and Data Artist

XML-Micro-Exchange works stateless. Everyone who knows the address and storage
identifier and, as in our example, the name of the root element can participate
in the regulars' table.  
At our regulars' table we are among ourselves, but in public and of course,
unwanted guests can also participate and do so unnoticed.

You can easily create your private area, but that should not be the topic here.
More interesting is the data dealer and data juggler.

We have already seen that data can be queried with GET in examples of XPath
functions. But there is more possible. Let's take a look at the data dealer's
fingers.

GET can also be used to query complete XML fragments, which are then returned
as a collection.

```
GET https://xmex.seanox.com/xmex!//message[@from='dan.star@example.local'] HTTP/1.0
Storage: US_NY_10003_123_EAST_8TH_STREET_BLUE_BEAR_T_01 table
Content-Type: application/xslt+xml
```
```xml
<?xml version="1.0"?>
<collection>
  <message from="dan.star@example.local" ___uid="KIT8H5JC1D0D:0" ___rev="12">
    I work and live in Yonkers as a gardener.
  </message>
  <message from="dan.star@example.local" ___uid="KIT8H5LQ1D0E:0" ___rev="13">
    In this beautiful weather I arrived with my scooter.
  </message>
  <message from="dan.star@example.local" ___uid="KIT8H5OA1D0F:0" ___rev="14">
    I like to look at the city.
  </message>
</collection>
```

Also, querying all mail addresses from different attributes is easy.  
If attributes are queried, matches of one attribute are returned as plain text
and matches of multiple attrubutes are returned as XML collection.

```
GET https://xmex.seanox.com/xmex!//*/@mail|//*/@from HTTP/1.0
Storage: US_NY_10003_123_EAST_8TH_STREET_BLUE_BEAR_T_01 table
Content-Type: application/xslt+xml
```
```xml
<?xml version="1.0"?>
<collection>
  <mail>john.doe@example.local</mail>
  <mail>jane.doe@example.local</mail>
  <mail>mike.ross@example.local</mail>
  <mail>dan.star@example.local</mail>
  <from>jane.doe@example.local</from>
  <from>mike.ross@example.local</from>
  <from>dan.star@example.local</from>
  <from>dan.star@example.local</from>
  <from>dan.star@example.local</from>
</collection>
```

Here we can use the XSL transformation.  
We send a stylesheet to the API and it does the transformation.

```
POST https://xmex.seanox.com/xmex! HTTP/1.0
Storage: US_NY_10003_123_EAST_8TH_STREET_BLUE_BEAR_T_01 table
Content-Type: application/xslt+xml
Content-Length: 726

<?xml version="1.0"?>
<xsl:stylesheet version="1.0"
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="text"/>
  <xsl:template match="/">
    <xsl:for-each select="//persons/person">
Mame: <xsl:value-of select="@name"/>
Mail: <xsl:value-of select="@mail"/>
Messages:
      <xsl:variable name="mail" select="@mail"/>
      <xsl:choose>
        <xsl:when test="count(//message[@from=$mail]) &gt; 0">
          <xsl:for-each select="//message[@from=$mail]">
            <xsl:value-of select="."/>
          </xsl:for-each>
    ----
        </xsl:when>
        <xsl:otherwise>
    No messages
    ----
        </xsl:otherwise>
      </xsl:choose>
    </xsl:for-each>
  </xsl:template>
</xsl:stylesheet>
```

With XSLT, the response is completely dynamic.  
Also the output type can be specified with <xsl:output method/>.

```
Mame: John Doe
Mail: john.doe@example.local
Messages:
      
    No messages
    ----
        
Mame: Jane Doe
Mail: jane.doe@example.local
Messages:
      
    I live in Long Island and have an antique store.
    ----
        
Mame: Mike Ross
Mail: mike.ross@example.local
Messages:
      
    I live in Queens, work for a shipping company on a cargo ship.
    ----
        
Mame: Dan Star
Mail: dan.star@example.local
Messages:
      
    I work and live in Yonkers as a gardener.
    In this beautiful weather I arrived with my scooter.
    I like to look at the city.
    ----
```


## A Clean Sendoff

TODO:


## Final End

The API used in our example has maximum idle time of about 15 minutes.
If no requests to the storage from the regulars' table are received for 15
minutes, the regulars' table is discarded with all its data. Deleting overdue
storages is very fast and is executed with each request.  
Also, if the first request after the expiration time addresses the storage from
the regulars' table, the existing one is deleted and a new one is created.



- - -

[Terms](terms.md) | [TOC](README.md) | [API](api.md)
