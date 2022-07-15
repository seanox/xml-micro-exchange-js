# Development


## Contents Overview
* [Preparation of the project for development](#preparation-of-the-project-for-development)
* [How to create a release?](#how-to-create-a-release)


## Preparation of the project for development
- Call `ant install` in the directory `./development`  
  then you can start the development with Windows
- For Linux/Unix/MacOS: libxml2 is needed as subdirectory in the source directory


## How to create a release?

### Test everything first

- Start in the project directory
- Call `ant -f ./development/build.xml clean`  
  This deletes `./source/data` and empties `./sources/trace.log` as well
  `./sources/trace-docker.log`.
- Cumulate all test  
  `cd ./test`  
  `node cumulate.js`
---

- Start the service locally  
  `cd ../sources`  
  `node service.js`
- Execute `./test/cumulate.http` (local) -- last pass: 45 sec  
- Compare `./sources/trace.log` with the version in GitHub  
  Generated empty lines can be ignored.  
  These occur when the request takes longer than expected.
---

TODO:
