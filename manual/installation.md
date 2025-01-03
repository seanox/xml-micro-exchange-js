&#9665; [Motivation](motivation.md)
&nbsp;&nbsp;&nbsp;&nbsp; &#8801; [Table of Contents](README.md)
&nbsp;&nbsp;&nbsp;&nbsp; [Configuration](configuration.md) &#9655;
- - -

# Installation

> [!NOTE]
> __This chapter is only relevant if you want to run the Datasource on your own
> server. If you want to use an existing Datasource on the Internet, you can
> skip this chapter.__


## Contents Overview

* [libxml2](#libxml2)
* [Node.js](#nodejs)
* [Service](#service)
* [Web Server](#web-server)
* [Windows Distribution](#windows-distribution)
* [Linux](#linux)
    * [libxml2](#libxml2-1)
    * [Node.js](#nodejs-1)
    * [Daemon](#daemon)
    * [Web Server](#web-server-1)
* [Container](#container)


# Windows

The setup for Windows is described here in an installation-free version.
Therefore the location in the file system is relative and can be freely chosen
and so the following directory structure is only an example.

```
+ xmex
  + content
  + data 
  + libxml
    - libxml2-2.dll
    - libxslt-1.dll
    - xsltproc.exe
    - ...
  + node
    - node.exe
    - ...
  + nssm
    - nssm.exe
    - ...
  - service.js
  - service.cmd 
```

The most convenient way -- use the [Windows Distribution](#windows-distribution)
or Docker and the [Docker image of Seanox XMEX](https://hub.docker.com/repository/docker/seanox/xmex).

In the following you will find the steps for manual installation.

## libxml2

Node.js does not have its own XSLT processor and the existing implementations
for Node.js did not meet the functional expectation, so there was a decision to
go with a more powerful native solution -- libxml2 and xsltproc.

Download the library here: http://xmlsoft.org/sources/win32/ or use the
[Windows Binary (zip)](https://github.com/seanox/xml-micro-exchange-js/raw/main/development/libxml2_2.9.3_win_x64.zip)
for Seanox XML-Micro-Exchange.

After unpacking, the library path must be added to the `PATH` environment
variable, or the library will be unpacked to `./libxml` or `./libxml2` in the
application directory of Seanox XMEX and is then automatically found by the
service at runtime.

## Node.js

Node.js is the runtime environment used by Seanox XMEX.

Download the runtime environment here: https://nodejs.org/en/download/

After unpacking, the runtime environment path must be added to the `PATH`
environment variable, or the runtime environment will be unpacked to `./node`
in the application directory of Seanox XMEX.

After this step, Seanox XMEX can be started manually in the application
directory as follows.

```
./node/node service.js 
```


## Service

Using Seanox XMEX as a Windows service is completely optional. Here the use of
[NSSM - the Non-Sucking Service Manager](https://nssm.cc) is described. For installation,
follow the instructions on the manufacturer's page.

Easier is use of the [Windows Distribution](#windows-distribution).

## Web Server

For responding to requests outside the XMEX API path, the integrated web server
can be used. The directory `./content` is the document root. The web server
implements only the elementary HTTP methods `OPTIONS`, `HEAD` and `GET`. Default
files can be specified when calling directories. A listing of directory contents
(Directory Index) is not implemented. Requests from directories without default
are responded with status 403. Alternatively, static or dynamic forwarding can
be configured.


# Windows Distribution

The Windows distribution is a complete package and contains, with the exception
of Node.js, all components for using Seanox XMEX in Windows and as a Windows
service.

Download the library here: https://github.com/seanox/xml-micro-exchange-js/releases

Also with the Windows distribution, the archive can be unpacked anywhere file
system. Because the service should run with a Windows service account and proper
access rights, it is recommended to place and install it outside the user
profiles.

By default, the service is installed with the Windows service account
`NetworkService`, but other service accounts can also be used. The access rights
required for the program directory are set during installation.

The parameters to configure the service have been bundled in the batch file and
are easily accessible.

To install the service, the batch file `service.cmd` is used. To do this, open
the console (shell/prompt) as administrator and change to the application
directory and call the batch file with the desired function.

```
usage: service.cmd [command]
```

Overview of available commands:
The letter case (upper and lower case) is to be respected for the commands.

| Command     | Description                                                       |
| :---------- | :---------------------------------------------------------------- |
| `install`   |	Installs the service.                                             |
| `update`    |	Removes the service and reinstalls it with updated configuration. |
| `uninstall` |	Removes the service.                                              |
| `start`     |	Starts the service.                                               |
| `restart`   |	Stops the service and restarts it.                                |
| `stop`      |	Stops the service.                                                |

__The distribution does not contain a Node.js.__

Node.js is the runtime environment used by Seanox XMEX.

Download the runtime environment here: https://nodejs.org/en/download/

After unpacking, the runtime environment path must be added to the `PATH`
environment variable, or the runtime environment will be unpacked to `./node`
in the application directory of Seanox XMEX.


# Linux

In the following the installation is described exemplarily for distributions
based on Debian.

Download and installation of the latest version of XMEX.

```
cd ~
mkdir xmex
cd xmex
curl -o seanox-xmex-latest.zip -fsSL https://github.com/seanox/xml-micro-exchange-js/releases/latest/download/seanox-xmex-latest.zip
unzip seanox-xmex-latest.zip -d .
sudo chmod -R 755 .
```

After unpacking, the following directory structure should be available.

```
+ xmex
  + content 
  + data
  - service.js
```

Afterwards the installation of the further runtime components follows. Before
this, the system should be brought up to date.

```
sudo apt update
```

## libxml2

Node.js does not have its own XSLT processor and the existing implementations
for Node.js did not meet the functional expectation, so there was a decision to
go with a more powerful native solution -- libxml2 and xsltproc.

Installation of libxml2, libxslt and xsltproc.

```
sudo apt-get install libxml2 libxslt1.1 xsltproc
```

## Node.js

Node.js is the runtime environment used by Seanox XMEX.

Installation of Node.js, the latest LTS version is recommended.

```
curl -fsSL https://deb.nodesource.com/setup_14.x | sudo -E bash -
sudo apt-get install -y nodejs
```

After this step, Seanox XMEX can be started manually in the application
directory as follows.

```
node service.js 
```

## Daemon

Using Seanox XMEX as a daemon is completely optional. Here the use of `systemd`
is described.

Creating of the configuration file.

```
sudo nano /lib/systemd/system/xmex.service
```

Example of the structure and content of the configuration file.

```
[Unit]
Description=Seanox XML-Micro-Exchange
Documentation=https://github.com/seanox/xml-micro-exchange-js
After=network.target

[Service]
Environment=NODE_PORT=80
Type=simple
User=nobody
WorkingDirectory=/home/<user>/xmex/
ExecStart=/usr/bin/node /home/<user>/xmex/service.js
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

After that, the daemon must be reloaded from systemd.

```
sudo systemctl daemon-reload
```

Overview of available commands for the daemon:

| Command                        | Description                      |
| :----------------------------- | :------------------------------- |
| `sudo systemctl start xmex`    | Starts the daemon.               |
| `sudo systemctl stop xmex`     | Stops the daemon.                |
| `sudo systemctl status xmex`   | Shows the staus from the demon.  |
| `sudo systemctl daemon-reload` | Reconfigures the daemon.         |
| `journalctl -u xmex`           | Shows the logging of the daemon. |

## Web Server

For responding to requests outside the XMEX API path, the integrated web server
can be used. The directory `./docs` is the document root. The web server
implements only the elementary HTTP methods `OPTIONS`, `HEAD` and `GET`. Default
files can be specified when calling directories. A listing of directory contents
(Directory Index) is not implemented. Requests from directories without default
are responded with status 403. Alternatively, static or dynamic forwarding can
be configured.  


# Container

Containers are also a very easy way to use Seanox XMEX.

The container is available in the Docker Hub: https://hub.docker.com/repository/docker/seanox/xmex

The service runs with the user `nobody` and is therefore not a root.

```
docker run -d -p 80:80/tcp --rm --name xmex seanox/xmex:latest
```

The REST API is then usable via all host and IP address allowed/supported for
the container as follows. A direct browser request is answered with status 400.  
Please read more about the usage of the [API](api.md).
```
http://localhost/xmex!
```

## Directory Structure

```
+ xmex
  + content
    - ...  
  + data
    - <storage>.xml
    - ...
  - service.js
```
The directories `/xmex/data` and `/xmex/content` can be mapped, binded to other
places or be changed and overwritten in their own images. For the configuration
of the service the environment variables are used.

The directory `./data` need read-write access in the fil system. This must be
taken into account if the container is used with a read-only file system.


- - -
&#9665; [Motivation](motivation.md)
&nbsp;&nbsp;&nbsp;&nbsp; &#8801; [Table of Contents](README.md)
&nbsp;&nbsp;&nbsp;&nbsp; [Configuration](configuration.md) &#9655;
