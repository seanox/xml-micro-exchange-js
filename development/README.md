# Development


## Contents Overview
* [Preparation for development](#preparation-for-development)
* [Testing](#testing)
  * [Preparation](#preparation-for-development)
  * [Testing local version](#testing-local-version)
  * [Testing in the Docker environment](#testing-in-the-docker-environment)
  * [Testing release candidate in the Docker environment](#testing-release-candidate-in-the-docker-environment)
  * [Testing Windows Service](#testing-windows-service)
* [Publish a release](#publish-a-release)
  * [GitHub](#github)
  * [Docker Hub](#docker-hub)


## Preparation for development
- Call `ant install` in the directory `./development`  
  then you can start the development with Windows
- For Linux/Unix/MacOS: libxml2 is needed as subdirectory in the source directory


## Testing

### Preparation
- Start in the project directory
- Call `ant -f ./development/build.xml clean`  
  Deletes `./source/data`; `./source/temp` and empties `./sources/trace.log`
- Cumulate all test  
  `cd ./test`  
  `node cumulate.js`

### Testing local version
- __Based on the previous step__
- Start the service locally  
  `cd ../sources`  
  `node service.js`
- Execute `./test/cumulate.http` (local) -- last pass: 45 sec
- Stop the running service
- Compare `./sources/trace.log` with the version in GitHub  
  __Generated empty lines can be ignored.__  
  __These occur when the request takes longer than expected.__

### Testing in the Docker environment
- __Based on the previous step__
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

### Testing release candidate in the Docker environment
- __Based on the previous step__
- Create and start the release candidate in the Docker environment     
  Start `ant -f ../development/build.xml docker-release`
- Execute `./sources/trace-cumulate.http` (local Docker) -- last pass: 43 sec  
  __Unlike before, no errors should occur with trace-cumulate.http.__

### Testing Windows Service
- __Based on the previous step__
- Unzip `./release/seanox-xmex-win-latest.zip` e.g. unzip to `C:\Temp\xmex`  
  The user directory (%USERPROFILE%) should not be used, as it may not be
  possible to set the required permissions for the service.
- Add Node.js in to `./xmex/node`
- Open the console (shell/prompt) as administrator
- Install the service  
  `cd /D C:\Temp\xmex`  
  `service.cmd install`
- Test of `./sources/snake.html`
- Switch to `service-build-test.js`  
  Replace `C:\Temp\xmex\service.js` with `./sources/service-build-test.js`  
  and copy `./sources/trace-cumulate.js` to `C:\Temp\xmex` 
- Restart from service
  `service.cmd restart`
- Test of `cumulate.http`
- Test of the service functions  
  `cd /D C:\Temp\xmex`  
  `service.cmd update`  
  `service.cmd start`  
  `service.cmd restart`  
  `service.cmd stop`  
  `service.cmd uninstall`
- Remove the installation

## Publish a release

### GitHub
- Start in the project directory
- __Provided all tests are successful!__
- Finalize the version in CHANGES  
  Call `ant -f ./development/build.xml release`
- Check the differences with the Git repository
- Commit all changes with the comment `Release x.x.x`
- Git Create tag `x.x.x` (comment: short version of changes)
- Git Push + tags
- GitHub -> Project -> Tags -> Create Release (... to the right of the tag)   
  Title: Version x.x.x 20xxxxxx  
  Content: Short version of CHANGES  
  Attach files...
  seanox-xmex-x.x.x.zip
  seanox-xmex-x.x.x-win.zip
  Click "Publish release"

### Docker Hub
- __Based on the previous step__
- Publish the release in Docker Hub  
  Call `ant -f ./development/build.xml docker-push-release`  
  __Docker Hub requires the following environment variables as credentials:__  
  __`docker-registry`, `docker-id`, `docker-password`__
