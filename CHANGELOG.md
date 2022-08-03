# Change Log

All notable changes to the "tfsec" extension will be documented in this file.

### 1.11.0
- Add findings to the Problems tab

### 1.10.1
- Fix Windows filepaths

### 1.10.0
- Fix issue with file path names in the explorer
- Add context support for locally ignoring files and directories

### 1.9.0
- Support new tfsec filesystem (relative path resolution)
  - Maintain support older versions of tfsec

### 1.8.0
- Add snippets support
  - using `tfsec-check-file` in a yaml file to create custom check
  - using `tfsec-custom-check` in the existing check file to add a new custom check
- Add icon on toolbar to get the version

### 1.7.5
- Update the severity icons inline with Aqua colours

### 1.7.4 
- Fix the icons for Severity and tfsec checkname

### 1.7.3
- Fix issue with tfsec `v1.0.0-rc.2`

### 1.7.2
- Fix issue with glob

### 1.7.1
- Minify the extension

### 1.7.0
- Support multi folder workspaces
- Save results in a folder with unique names

### 1.6.2
- Refactor the runner to clean up extension code
- clean up some redundant code

### 1.6.1
- Prettify with nice icons
- 
### 1.6.0
- Switch from ExecSync to Spawn for running tfsec
- Don't show the output window so much, we know its there
- Update mass ignores to always add a new line

### 1.5.0
- Check for tfsec before running any commands
- Add debug setting for richer output option
- remove some redundant logging

### 1.4.0
- Use output channel instead of terminal for better cross platform command support
- Remove explicit run command and use refresh to update the list with a fresh run
- Add ignore all severity
- Fix the refresh after ignores have been completed
- Add more information to the update output  
  
### 1.3.1
- Update the repository link

### 1.3.0
- Remove dependency on codes resource for resolving legacy IDs

### 1.2.2
- Add support for AVD ID

### 1.2.1
- Update the logo to the AquaSecurity one

### 1.2.0
- Restructure explorer to be by severity
- Fix the Help view for the checks
- Add "Ignore all" to ignore all instances of an issue

### 1.1.11
- Add menu button to update tfsec from within vscode (post tfsec v0.39.39)
- Add command to show the current version of tfsec running

### 1.1.10
- Updating the codes to support latest tfsec

### 1.1.9
- Handle deprecated checks better in the help window

### 1.1.8
- Add setting to choose if auto running tfsec after ignore should happen

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
- add link to check page from explorer view
- update the icon for the activity bar

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

### 1.0.8
- Fix and issue with the code resolution
- Record the demo gif and add
- Fix ignore placement

### 1.0.6
- Add ignore functionality in the context menu.

### 1.0.5
- Fix issue reloading the results file on recreation

### 1.0.4 
- Fix issue when run against workspace with no data

### 1.0.3
- Add the treeview for current issues in the workspace

### 1.0.2
- Restructuring the code

### 1.0.1
- Fixes to the Readme for the marketplace page

### 1.0.0
- Initial release of tfsec extension with ignore parsing
