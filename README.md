
<p align="center">
  <img src="https://raw.githubusercontent.com/Aleynikovich/RoboCode/main/.github/robocode-logo.svg" width="120" alt="RoboCode Logo"/>
</p>

# RoboCode VS Code Extension

<p align="center">
  <b>Universal Industrial Robot Programming Suite</b><br/>
  <svg width="18" height="18"><rect width="18" height="18" fill="#f90"/></svg> <b>KUKA</b>
  <svg width="18" height="18"><rect width="18" height="18" fill="#e00"/></svg> <b>ABB</b>
  <svg width="18" height="18"><rect width="18" height="18" fill="#ff0"/></svg> <b>FANUC</b>
  <svg width="18" height="18"><rect width="18" height="18" fill="#0af"/></svg> <b>CNC</b>
  <svg width="18" height="18"><rect width="18" height="18" fill="#0c0"/></svg> <b>RoboDK</b>
</p>

---

## <svg width="18" height="18"><rect width="18" height="18" fill="#4CAF50"/></svg> Features

- <b>Multi-Brand Support:</b> KUKA, ABB, FANUC, CNC, RoboDK, Dobot, and more
- <b>Live Robot Connection:</b> Connect, monitor, and control robots via TCP/IP (simulated protocol)
- <b>Program Upload:</b> Upload and manage robot programs directly from VS Code
- <b>Syntax Highlighting:</b> Full support for KRL, RAPID, FANUC AS, G-code, and more
- <b>Box-Style Folding:</b> Clean, modern code folding with visual boxes for FOLD regions
- <b>IntelliSense:</b> Smart code completion for robot commands and parameters
- <b>Diagnostics:</b> Real-time error checking for unmatched FOLD/ENDFOLD, syntax, and connection issues
- <b>Document Outline:</b> Symbol navigation for DEF, PROC, FOLD, and more
- <b>Snippets:</b> Quick templates for common robot tasks
- <b>Simulated Communication Protocols:</b> C++ and Python examples for robot connectivity
- <b>Project Templates:</b> Start new robot projects for any supported brand
- <b>Debugging:</b> Step through robot code with breakpoints and variable inspection (simulated)
- <b>Real-Time Status:</b> Monitor robot state and connection health in the status bar
- <b>Customizable UI:</b> Theme-aware, configurable folding colors and display options

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
