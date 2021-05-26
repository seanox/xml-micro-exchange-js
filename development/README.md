# Development


## Contents Overview
* [How to create a release?](#how-to-create-a-release)


## How to create a release?
- Delete `./source/data`
- Emtpty `./sources/trace.log`
- Execute `./test/cumulate.js`  
  `cd /test`  
  `node cumulate.js`
---


- Clear all Docker imgaes  
  `docker system prune -a`
- Execute `ant release`  
---


- Start the service locally  
  `cd /sources`  
  `node service.js`
- Execute `./test/cumulate.http` (local)
- Compare `./sources/trace.log` with the version in GitHub
---


- Start the integration test  
  Start `ant docker-integration` 
- Execute `./test/cumulate.http` (local Docker)
  Ignore the test results, only the comparison of the trace files is relevant.
- Update trace-docker.log  
  `docker cp xmex-integration:/xmex/trace.log ../sources/trace-docker.log`  
  `docker cp xmex-integration:/xmex/trace-cumulate.http ../sources/trace-cumulate.http`
  Replace in `./sources/trace-cumulate.http` 172.*** with 127.0.0.1
- Compare `./sources/trace-docker.log` with the version in GitHub  
  The tests may differ due to the different operating systems and components
  e.g. line endings causing the hash values to differ. However, it is
  considered in the trace.
---


- Start the release   
  Start `ant docker-release`
- Execute `./sources/trace-cumulate.http` (local Docker)
  __Unlike trace-cumulate.http, no errors should occur here.__
---


- Install seanox-xmex-win-latest.zip  
  e.g. unzip into C:\Temp\xmex
- Add Node.js in to ./xmex/node  
- Open the console (shell/prompt) as administrator
- Install the service (if .\xmex\node is empty, add it)  
  `cd /D C:\Temp\xmex`  
  `service.cmd install`
- Test of `snake.html`
- Switch to service-build-test.js (replace service.js)
- Restart from service
- Test of `cumulate.http`
- Test of the service functions
  `cd /D C:\Temp\xmex`  
  `service.cmd update`  
  `service.cmd start`  
  `service.cmd restart`  
  `service.cmd stop`  
  `service.cmd uninstall`
- Remove the installation  
---


- Finalize the version in CHANGES  
- Execute `ant release`
- Check the ./xml-micro-exchange-js/.credentials
  The properties are needed for the Docker image release!
- Execute `ant docker-push-release`  
---


- Add new version (zip) to SCM
- Commit with comment `Release x.x.x`
- Git Create tag `x.x.x` (comment: x.x.x)
- Git Push + tags
- Go to GitHub -> Project -> Tags -> Create Release (... to the right of the tag)   
  Title: Version x.x.x 20xxxxxx  
  Content: Short version of CHANGES  
  Attach files...
    seanox-xmex-x.x.x.zip
    seanox-xmex-x.x.x-win.zip
  Click "Publish release"
