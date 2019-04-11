# KBase UI Integration

This package is dedicated to providing resources for plugin integration into kbase-ui.

## Updating a Plugin

`scripts/update-plugin-js`

This tool will update a plugin's iframe support. Note that this tool presently only works with plugins which have already been ported to the iframe architecture.

```
npm install
node scripts/update-plugin.js --plugin=PLUGIN
```

After running this script, new files may be added and existing files updated. It is best to run this script against a plugin which is up to date git-wise. This allows you to use the git changes feature (e.g. of VSC) to inspect the changes made if you need to. The script should not overwrite any files you have touched.

One exception is the main.js file. This file initially required touching in order to hook up view routes. However, view configuration has now been moved to the internal config.yml file `src/plugin/iframe_root/modules/config.yml`.

To accommodate stomping of main.js, you can inspect the previous version of main.js and copy the view routes to this config file.

```
## Config for kbase-ui-plugin-PLUGIN
---
package:
  author: KBase Developer
  name: PLUGIN
source:
  modules:
views:
  -
    module: panel
    view: VIEW
    type: factory
```
