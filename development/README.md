# Development


## Contents Overview
* [Preparation for development](#preparation-for-development)
* [Testing](#testing)
  * [Preparation](#preparation-for-development)
  * [Testing the local version](#testing-the-local-version)
  * [Testing in the Docker environment](#testing-in-the-docker-environment)
  * [Testing the release candidate in the Docker environment](#testing-the-release-candidate-in-the-docker-environment)
* [Publish a release](#publish-a-release)


## Preparation for development
- Call `ant install` in the directory `./development`  
  then you can start the development with Windows
- For Linux/Unix/MacOS: libxml2 is needed as subdirectory in the source directory


## Testing

### Preparation
- Start in the project directory
- Call `ant -f ./development/build.xml clean`  
  This deletes `./source/data` and empties `./sources/trace.log` as well
  `./sources/trace-docker.log`.
- Cumulate all test  
  `cd ./test`  
  `node cumulate.js`

### Testing the local version
- Start the service locally  
  `cd ../sources`  
  `node service.js`
- Execute `./test/cumulate.http` (local) -- last pass: 45 sec
- Stop the running service
- Compare `./sources/trace.log` with the version in GitHub  
  __Generated empty lines can be ignored.__  
  __These occur when the request takes longer than expected.__

### Testing in the Docker environment
- Create and start the service in the Docker environment  
  Call `ant -f ../development/build.xml docker-clean release docker-integration`  
- Execute `./test/cumulate.http` (local Docker) -- last pass: 19 sec  
  __Ignore the test results, only the comparison of the trace files is relevant.__
- Updating trace-docker.log with trace.log in the container  
  Call `ant -f ../development/build.xml docker-integration-trace`
- Compare `./sources/trace-docker.log` with the version in GitHub  
  The tests may differ due to the different operating systems and components
  e.g. line endings causing the hash values to differ. However, it is
  considered in the trace.

### Testing the release candidate in the Docker environment
- Create and start the release candidate in the Docker environment     
  Start `ant -f ../development/build.xml docker-release`
- Execute `./sources/trace-cumulate.http` (local Docker) -- last pass: 43 sec  
  __Unlike trace-cumulate.http before, no errors should occur here.__


## Publish a release

TODO: Must be continued
