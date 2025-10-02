

<p align="center">
  <img src="https://raw.githubusercontent.com/Aleynikovich/RoboCode/main/.github/robocode-logo.png" width="120" alt="RoboCode Logo"/>
</p>

# RoboCode VS Code Extension

<p align="center">
  <b>Universal Industrial Robot Programming Suite</b><br/>
  <b>KUKA</b> | <b>ABB</b> | <b>FANUC</b> | <b>CNC</b> | <b>RoboDK</b> | <b>Dobot</b>
</p>

---

## Features

- **Multi-Brand Support:** KUKA, ABB, FANUC, CNC, RoboDK, Dobot, and more
- **Live Robot Connection:** Connect, monitor, and control robots via TCP/IP (simulated protocol)
- **Program Upload:** Upload and manage robot programs directly from VS Code
- **Syntax Highlighting:** Full support for KRL, RAPID, FANUC AS, G-code, and more
- **Box-Style Folding:** Clean, modern code folding with visual boxes for FOLD regions
- **IntelliSense:** Smart code completion for robot commands and parameters
- **Diagnostics:** Real-time error checking for unmatched FOLD/ENDFOLD, syntax, and connection issues
- **Document Outline:** Symbol navigation for DEF, PROC, FOLD, and more
- **Snippets:** Quick templates for common robot tasks
- **Simulated Communication Protocols:** C++ and Python examples for robot connectivity
- **Project Templates:** Start new robot projects for any supported brand
- **Debugging:** Step through robot code with breakpoints and variable inspection (simulated)
- **Real-Time Status:** Monitor robot state and connection health in the status bar
- **Customizable UI:** Theme-aware, configurable folding colors and display options

## Box-Style Folding

The extension provides a **clean, minimal box-style folding system** that makes code structure visually clear:

### Visual Design
- **Simple Borders**: Clean borders around fold content (no background highlights)
- **Subtle Markers**: FOLD/ENDFOLD lines are slightly dimmed but remain readable
- **Chat-Box Style**: Similar to modern chat applications - clean and unobtrusive
- **Nested Support**: Multiple levels of nesting with consistent styling

### Customization
- **Configurable Colors**: Set your preferred border color via `robocode.display.boxFoldColor`
- **Toggle Box Mode**: Enable/disable via `robocode.display.boxFolds` setting
- **Minimal Design**: Focus on code readability, not decorative elements

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
* `robocode.display.boxFolds`: Enable/disable box-style visual folding (default: true)
* `robocode.display.boxFoldColor`: Color for fold box borders and accents (default: "#4CAF50")

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


### 1.2.0
- Multi-brand robot support: KUKA, ABB, FANUC, CNC, RoboDK, Dobot
- Simulated robot connection and upload
- Enhanced box-style folding visuals
- C++/Python protocol examples
- Improved IntelliSense and diagnostics

### 1.1.0
- Box-style folding for KUKA KRL
- IntelliSense for KUKA commands
- Robot status bar integration

### 1.0.0
- Initial release: KUKA KRL folding, syntax, and snippets

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
