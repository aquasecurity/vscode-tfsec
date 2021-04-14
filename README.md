# tfsec

View this extension in the [Marketplace](https://marketplace.visualstudio.com/items?itemName=tfsec.tfsec)

VSCode extension for [tfsec](https://tfsec.dev) with a growing set of features for interacting with tfsec, THE Terraform static analysis tool.


## Features

### Ignore Code Resolution

Ignore codes will be automatically resolved and the description of the error will be displayed inline.

![ignoredesc](ignoredesc.gif)

### tfsec Issue Explorer

Initial release of the tfsec Issue Explorer. This control will add a new pane to the tool bar showing the current issues in the workspace. 

Note: In this initial release, it is assumed that `tfsec` is on your path and that you have a relatively new version. The command is run in a terminal so any issues will be displayed and you can raise an issue accordingly. 

Issues can be ignored by right clicking the location in the explorer and selecting `ignore this issue`.

![tfsec explorer](tfsec-explorer.gif)

## Release Notes
### 1.1.3
- clean up the path in the treeview to remove prefix

### 1.1.2
- Add some configuration options
  - binary path override
  - deep searching
  - exclude downloaded modules
  
### 1.1.1
- Fixing issues with Windows path
- Switch to using --out for results file, Powershell piping seems to use UTF8 BOM which is tricky
### 1.1.0
- TFsec Explorer

### 1.0.7
- Fix and issue with the code resolution
- Record the demo gif and add
- Fix ignore placement

### 1.0.6
- Add ignore functionality in the context menu.
### 1.0.5
- Fix issue reloading the results file on recreation
### 1.0.4 
- Fix issue when run against workspace with no data
