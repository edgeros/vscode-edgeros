# Change Log

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