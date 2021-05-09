# tfsec

This VS Code extension is for [tfsec](https://tfsec.dev). A static analysis security scanner for your Terraform code that discovers problems with your infrastructure before hackers do.

## Features

### Issue Explorer
The issue explorer displays an an organised view the issues that have been found in the current workspace. 

The code runs tfsec in a VS Code integrated terminal so you can see the the output - when it is complete, press the refresh button to reload.

Right clicking on an tfsec code will let you view the associated page on [https://tfsec.dev](https://tfsec.dev)

Issues can be ignored by right clicking the location in the explorer and selecting `ignore this issue`.




![tfsec explorer](tfsec-explorer.gif)
### Ignore Code Resolution

Ignore codes will be automatically resolved and the description of the error will be displayed inline.

![ignoredesc](ignoredesc.gif)

## Release Notes

### 1.1.7
- Reload the tree when tfsec is run
- move single line ignores above issue

### 1.1.6
- Add tfsec ignore on a same line when single line issue
- add local check help to the Tfsec navigation pane
- restructure code for easier disable of plugin

### 1.1.5
- Only use a single terminal for tfsec, don't create a new one on each run
- Add option on extension settings to turn off the ignore code resolution

### 1.1.4
- Add link to check page from explorer view
- Update the icon for the activity bar

### 1.1.3
- Clean up the path in the treeview to remove prefix

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

