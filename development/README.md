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
- Execute `./test/cumulate.http` (local)
- Compare `./sources/trace.log` with the version in GitHub
- Execute `./test/cumulate.http` (local Docker)
- Compare `./sources/trace-docker.log` with the version in GitHub
- Execute `ant release`
- Add new version (zip) to SCM
- Commit with comment `Release x.x.x`
- Git Create tag `x.x.x` (comment: x.x.x)
- Git Push + tags
- Go to GitHub -> Project -> Tags ->  Create Release (... to the right of the tag)   
  Title: Version x.x.x 20xxxxxx  
  Content: Short version of CHANGES  
  Attach files...: seanox-xmex-x.x.x.zip  
  Click "Publish release"
