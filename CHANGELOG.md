# Change Log

## v0.5.29

1. fix apiDoc URL

## v0.5.28

1. fix local project could not be created

## v0.5.27

1. add desc.json param -> program.doctype

## v0.5.26

1. i18n updates
2. house keeping

## v0.5.25

1. edgeros.json accept program.mesv of integer array, like desc.json.
2. remember last used EdgerOS device to target commands like "Install EdgerOS App".
3. new context menu item "Install EdgerOS App from file" on the device tree.

## v0.5.22

1. fix: update icon size 24x24 --> 16x16

## v0.5.21

1. fix: update edgeros.schema.json

## v0.5.20

1. fix: pack no d.ts file
2. add compilation errors output terminal
3. add pre executed commands - prebuild

## v0.5.19

1. fix: ts project syntax errors, build exceptions

## v0.5.18

1. fix: TS Project Compilation Order

## v0.5.17

1. fix：build eap to rely on edgeros.json-related parameters

## v0.5.16

1. add view title localization and change "Device Info" to "Device Information"

## v0.5.15

1. fix: Adjust the splash importing mode

## v0.5.14

1. fix：Compatible past template

## v0.5.13

1. Modify the location of the splash file at compile time
2. Adjusting the local template edgeros.json package.json file

## v0.5.12

1. Console button added to Welcome page

## v0.5.11

1. fixed banner for simple template

## v0.5.10

1. Remove '.git' related files when creating a project
2. The project is not built again when you manually select the installation package

## v.0.5.9

1. Support for packaging native JS modules by configuration file
2. refactor built-in utility funtions `copyModules` 
3. upgrade gif of demo in the `README.md`

## v.0.5.8

1. Update the base template

## v.0.5.7

1. App desc.json adds a "resource" attribute

## v.0.5.6

1. Create project page UI optimization
2. Add save path to save history items

## v.0.5.5

1. Upgrade dependency module
2. Modified some message alerts
3. added format checks for cell phones and faxes when creating documents
4. added a button to refresh the console
5. fixed some bugs

## v0.5.4

1. Add name checks when creating applications

## v0.5.3

1. update tpl-simple

## v0.5.2

1. Add edgeros.json format check
2. Add 'assets' attribute file verify
3. Fixed some bugs

## v0.5.1

1. to remember the browsing posistion, the document editor will not refresh when losing focus.
2. fixed the problem that console status button might hang on MacOS.

## v0.5.0

1. support new online template schema, which is **NOT** compatible with old
   version of this extension, please upgrade as soon as possible.
2. support sub directory project discovery
3. support TypeScript project auto compilation
4. optimize the "create project" page
5. use `.eap` build suffix by default

## v0.4.6

1. fix the install eap version does not autoincrement

## v0.4.5

1. fix an build error: report user friendly message of missed widget ico

## v0.4.4

1. change maxBodyLength 256MB
2. catch github template request error

## v0.4.3

1. add email validation
2. fix version does not increase
3. fix edgeros.json -> widget.ico change

## v0.4.2

Relax vendor id validation to allow normal letters.

## v0.4.1

Fix i18n messages.

## v0.4.0

1. support remote template repositories from Github (or Gitee)
2. rework git providers
3. normalize configuration storage keys
4. introduce strong types
5. update vscode.engine to 1.57.1
6. validate version, mail phone and fax

## v0.3.0

1. rename extension setting `edgeros.buildType` to `edgeros.buildSuffix`
2. add eslint
3. add types.ts

## v0.2.8

1. Support the "loading" field in edgeros.json

## v0.2.0

Project structure of version 0.2.0+ is not compatible with 0.1.x:

Old project structure:
```
edgeros-project-0.1.x
|——program
|   |——assets
|   |——public
|   |——routers
|   |——views
|   |——main.js
|——big.png
|——desc.json
|——jsconfig.json
|——package.json
|——small.png
```

New project structure:
```
edgeros-project-0.2.0
|——node_modules
|——assets
|   |——big.png
|   |——small.png
|   |——start.png
|   |——widget_1.png
|——public
|——routers
|——temp
|——views
|——.eslintrc.json
|——.edgeros.json
|——main.js
|——package-lock.json
|——package.json
```

Map 0.1.x to 0.2.x:
```
v0.1.1                      v0.2.0
./program/assets     ->     ./assets
./program/public     ->     ./public
./program/routers    ->     ./routers
./program/views      ->     ./views
./program/main.js    ->     ./main.js
./big.png            ->     ./assets/big.png
./small.png          ->     ./assets/small.png 
./desc.json          ->     ./edgeros.json
```

### Important Notes:

From version 0.2.0+ we use `pacakge.json` and `edgerso.json` to replace the 
original `desc.json`, which will be automatically generated from the 2 files,
and the field names are mapped as below:

```
[package.json].name              ->    [desc.json].name
[package.json].version           ->    [desc.json].program.version
[edgeros.json].bundleid          ->    [desc.json].id
[edgeros.json].program.gss       ->    [desc.json].program.gss
[edgeros.json].program.log       ->    [desc.json].program.log
[edgeros.json].program.will      ->    [desc.json].program.will
[edgeros.json].program.reside    ->    [desc.json].program.reside
[edgeros.json].program.mesv      ->    [desc.json].program.mesv
[edgeros.json].vendor            ->    [desc.json].vendor
[edgeros.json].update            ->    [desc.json].update
[edgeros.json].assets.ico_big    ->    [desc.json].ico.big
[edgeros.json].assets.small      ->    [desc.json].ico.small
```

### Notes about the build

1. This extension will load `edgeros.json` and `packager.json` then generate `desc.json` 
   which is required for a valid the EdgerOS device application.
2. Pack @edgeros/xxx modules inside your `package.json` into `jsre_modules`, which will 
   be searched during your application execution for 3rd party packages.
3. Pack everything else not filtered (see below) under your project folder into
   the application package.

### What's new in edgeros.json

- ignore_modules: filter out the modules not required to run your EdgerOS device.
- ignore_path: filter other resource files you may not want in your application package.
- [More info](https://docs.edgeros.com/edgeros/guide/development_guide/0003.html)