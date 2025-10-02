# RoboCode VS Code Extension

A comprehensive VS Code extension for KUKA KRL (KUKA Robot Language) programming with advanced folding, syntax highlighting, and code intelligence features.

## Features

- **Syntax Highlighting**: Full KRL (KUKA Robot Language) syntax highlighting for `.src` and `.dat` files
- **Advanced Folding System**: 
  - Custom `;FOLD` / `;ENDFOLD` regions with smart hiding behavior
  - FOLD markers hidden when collapsed, showing only content
  - Special comments (`;%{PE}`, `;%{h}...`, `DEFAULT ;%{PE}`) are automatically hidden
  - Click anywhere on FOLD/ENDFOLD lines to toggle folding
  - Navigate between matching FOLD/ENDFOLD pairs
- **Code Intelligence**:
  - IntelliSense completion for KUKA commands (PTP, LIN, etc.)
  - Semantic token highlighting for enhanced syntax coloring
  - Document outline with proper symbol ranges
  - Diagnostics for unmatched FOLD/ENDFOLD pairs
- **Code Formatting**:
  - Assignment alignment (`=` signs lined up)
  - Automatic keyword uppercasing
  - Configurable formatting options
- **Snippets**: Quick insertion templates for common KRL constructs
- **Robot Management**: Connection and program upload commands (planned)

## Folding Features

The extension provides advanced folding capabilities specifically designed for KUKA KRL:

### Smart FOLD Hiding
- When a `;FOLD` region is collapsed, both the `;FOLD` and `;ENDFOLD` markers are hidden
- Only the content description and folded content are visible
- Special parameter comments (`;%{PE}`, `;%{h}...`) are automatically hidden

### Interactive Folding
- **Double-click** any FOLD/ENDFOLD line to toggle folding
- **Ctrl+Shift+]** to navigate between matching FOLD/ENDFOLD pairs
- **Ctrl+Shift+F** to toggle fold on current line
- Click anywhere on a FOLD line (not just the arrow) to fold/unfold

### Automatic Organization
- FOLD regions auto-collapse when files are opened
- DEF/END blocks remain expanded for better code visibility
- Nested FOLD regions are properly handled

## Extension Settings

This extension contributes the following settings:

* `robocode.format.alignAssignments`: Enable/disable alignment of assignment operators (default: true)
* `robocode.format.uppercaseKeywords`: Enable/disable automatic uppercasing of KRL keywords (default: true)

## Keyboard Shortcuts

* `Ctrl+Shift+]`: Navigate to matching FOLD/ENDFOLD
* `Ctrl+Shift+F`: Toggle fold on current line

## Usage

1. Open any `.src` or `.dat` file
2. Use `;FOLD` and `;ENDFOLD` comments to create collapsible regions
3. Double-click on FOLD lines to toggle folding
4. Use Format Document to apply code formatting
5. Access robot commands through the Command Palette

## Sample Files

The extension includes sample files to test functionality:
- `sample_robot_pick_place.src` - Basic pick and place program
- `sample_with_folds.src` - Demonstrates advanced folding features

## Known Issues

- Folding marker hiding requires VS Code's folding system to be active
- Some themes may not display semantic tokens differently from regular syntax highlighting

## Release Notes

Users appreciate release notes as you update your extension.

### 1.0.0

Initial release of ...

### 1.0.1

Fixed issue #.

### 1.1.0

Added features X, Y, and Z.

---

## Following extension guidelines

Ensure that you've read through the extensions guidelines and follow the best practices for creating your extension.

* [Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)

## Working with Markdown

You can author your README using Visual Studio Code. Here are some useful editor keyboard shortcuts:

* Split the editor (`Cmd+\` on macOS or `Ctrl+\` on Windows and Linux).
* Toggle preview (`Shift+Cmd+V` on macOS or `Shift+Ctrl+V` on Windows and Linux).
* Press `Ctrl+Space` (Windows, Linux, macOS) to see a list of Markdown snippets.

## For more information

* [Visual Studio Code's Markdown Support](http://code.visualstudio.com/docs/languages/markdown)
* [Markdown Syntax Reference](https://help.github.com/articles/markdown-basics/)

**Enjoy!**
