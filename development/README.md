# Development


## Contents Overview
* [How to create a release?](#how-to-create-a-release)


## How to create a release?
- Delete `./source/data`
- Emtpty `./sources/trace.log`
- Execute `./test/cumulate.js`  
  `cd /test`  
  `node cumulate.js`


- Execute `ant release`  


- Start the service locally  
  `cd /sources`  
  `node service.js`
- Execute `./test/cumulate.http` (local)
- Compare `./sources/trace.log` with the version in GitHub

  
- Start `xmex:integration` in Docker  
  `docker run -d -p 8000:8000 --rm --name xmex-int xmex:integration` 
- Execute `./test/cumulate.http` (local Docker)
- Update trace-docker.log  
  `docker cp xmex-int:/xmex/trace.log ../sources/trace-docker.log` 
- Compare `./sources/trace-docker.log` with the version in GitHub  
  Ignore the test results, only the comparison of the trace files is relevant.
  The tests may differ due to the different operating systems and components
  e.g. line endings causing the hash values to differ. However, it is
  considered in the trace.
  

- Finalize the version in CHANGES  
- Execute `ant release`
- Check the ./xml-micro-exchange-js/.credentials
  The properties are needed for the Docker image release!
- Execute `ant docker-push-release`  


- Add new version (zip) to SCM
- Commit with comment `Release x.x.x`
- Git Create tag `x.x.x` (comment: x.x.x)
- Git Push + tags
- Go to GitHub -> Project -> Tags ->  Create Release (... to the right of the tag)   
  Title: Version x.x.x 20xxxxxx  
  Content: Short version of CHANGES  
  Attach files...
    seanox-xmex-x.x.x.zip
    seanox-xmex-x.x.x-win.zip
  Click "Publish release"
