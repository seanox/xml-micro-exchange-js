[Development](development.md) | [TOC](README.md) | [Test](test.md)
- - -

# Build

The release is primarily created with the Ant task `release`.  
In addition to the release, the version in the README.md is also updated.

```
cd ./development
ant release
```

The build process uses [Webpack](https://webpack.js.org) to create a release
version of the JavaScript with all embedded dependencies. Minimization was
omitted because Reflections are used, which does not work due to the
obfuscation also performed during minimization.  
Minimizing is therefore done later smoothly by the Ant script.

```
npm run build
```



- - -

[Development](development.md) | [TOC](README.md) | [Test](test.md)