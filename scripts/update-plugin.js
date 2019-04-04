/*
General purpose plugin update tool.

For now, updates a plugin from pre-iframe to iframe.

- ensure that the given directory is a plugin
  - inspect the package.json file
  - config for kbase-ui has a config field plugin-version
    - if it is undefined, assume it is not iframe
    - if it is 2.0.0, assume it is already converted, exit
  - copy assets in from the plugins-assets directory
  
    

*/
