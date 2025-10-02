// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// Regex helpers
const FOLD_START = /^\s*;\s*(FOLD|#region)\b(.*)$/i;
const FOLD_END = /^\s*;\s*(ENDFOLD|#endregion)\b/i;

const foldDiagnostics = vscode.languages.createDiagnosticCollection('krl-folds');
let enfoldDecoration: vscode.TextEditorDecorationType | undefined;

// Robot connection status
interface RobotConnection {
	id: string;
	name: string;
	type: 'KUKA';
	ipAddress: string;
	status: 'connected' | 'disconnected' | 'error';
}

// Robot Explorer Provider
class RobotExplorerProvider implements vscode.TreeDataProvider<RobotConnection> {
	private _onDidChangeTreeData: vscode.EventEmitter<RobotConnection | undefined | null | void> = new vscode.EventEmitter<RobotConnection | undefined | null | void>();
	readonly onDidChangeTreeData: vscode.Event<RobotConnection | undefined | null | void> = this._onDidChangeTreeData.event;

	private robots: RobotConnection[] = [];

	refresh(): void {
		this._onDidChangeTreeData.fire();
	}

	getTreeItem(element: RobotConnection): vscode.TreeItem {
		const item = new vscode.TreeItem(element.name, vscode.TreeItemCollapsibleState.None);
		item.description = `${element.type} - ${element.status}`;
		item.tooltip = `${element.name} (${element.ipAddress}) - ${element.status}`;
		item.iconPath = new vscode.ThemeIcon(element.status === 'connected' ? 'plug' : 'debug-disconnect');
		item.contextValue = element.status === 'connected' ? 'connectedRobot' : 'disconnectedRobot';
		return item;
	}

	getChildren(element?: RobotConnection): Thenable<RobotConnection[]> {
		if (!element) {
			return Promise.resolve(this.robots);
		}
		return Promise.resolve([]);
	}

	addRobot(robot: RobotConnection): void {
		this.robots.push(robot);
		this.refresh();
	}

	removeRobot(id: string): void {
		this.robots = this.robots.filter(r => r.id !== id);
		this.refresh();
	}

	updateRobotStatus(id: string, status: 'connected' | 'disconnected' | 'error'): void {
		const robot = this.robots.find(r => r.id === id);
		if (robot) {
			robot.status = status;
			this.refresh();
		}
	}
}

// Status bar item for robot connection
let robotStatusBarItem: vscode.StatusBarItem;

// This method is called when your extension is activated
export function activate(context: vscode.ExtensionContext) {
	console.log('RoboCode extension is now active!');

	// Create robot explorer
	const robotProvider = new RobotExplorerProvider();
	vscode.window.registerTreeDataProvider('robotExplorer', robotProvider);

	// Create status bar item
	robotStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
	robotStatusBarItem.text = "$(robot) No Robot Connected";
	robotStatusBarItem.command = 'robocode.showRobotStatus';
	robotStatusBarItem.show();
	context.subscriptions.push(robotStatusBarItem);

	// Register commands
	const connectRobotCommand = vscode.commands.registerCommand('robocode.connectRobot', async () => {
		const ipAddress = await vscode.window.showInputBox({
			prompt: 'Enter KUKA controller IP address',
			placeHolder: '192.168.1.100'
		});
		if (!ipAddress) { return; }
		const robotName = await vscode.window.showInputBox({
			prompt: 'Enter robot name',
			placeHolder: 'KUKA Robot'
		});
		if (!robotName) { return; }
		const robot: RobotConnection = {
			id: Date.now().toString(),
			name: robotName,
			type: 'KUKA',
			ipAddress,
			status: 'connected'
		};
		robotProvider.addRobot(robot);
		robotStatusBarItem.text = `$(plug) ${robotName} Connected`;
		vscode.window.showInformationMessage(`Connected to ${robotName} (KUKA)`);
	});

	const disconnectRobotCommand = vscode.commands.registerCommand('robocode.disconnectRobot', () => {
		robotStatusBarItem.text = "$(robot) No Robot Connected";
		vscode.window.showInformationMessage('Robot disconnected');
	});

	const showRobotStatusCommand = vscode.commands.registerCommand('robocode.showRobotStatus', () => {
		vscode.window.showInformationMessage('Robot Status: Check the Robot Explorer for details');
	});

	const uploadProgramCommand = vscode.commands.registerCommand('robocode.uploadProgram', (uri: vscode.Uri) => {
		if (uri) {
			const fileName = uri.fsPath.split('/').pop();
			vscode.window.showInformationMessage(`Uploading ${fileName} to robot...`);
			// TODO: Implement actual upload logic
		}
	});

	// Register completion provider for robot languages
	const krlCompletionProvider = vscode.languages.registerCompletionItemProvider('krl', {
		provideCompletionItems(document: vscode.TextDocument, position: vscode.Position) {
			const completionItems: vscode.CompletionItem[] = [];
			
			// Add KUKA-specific completions
			const moveCompletion = new vscode.CompletionItem('PTP', vscode.CompletionItemKind.Function);
			moveCompletion.detail = 'Point-to-Point Motion';
			moveCompletion.documentation = 'Moves the robot to a specified position';
			completionItems.push(moveCompletion);
			
			const linCompletion = new vscode.CompletionItem('LIN', vscode.CompletionItemKind.Function);
			linCompletion.detail = 'Linear Motion';
			linCompletion.documentation = 'Moves the robot in a straight line';
			completionItems.push(linCompletion);
			
			return completionItems;
		}
	});

	// Command: Wrap selection in FOLD region
	const wrapFoldCommand = vscode.commands.registerCommand('robocode.wrapFoldRegion', () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor || editor.document.languageId !== 'krl') { return; }
		const sel = editor.selection;
		const text = editor.document.getText(sel);
		editor.edit(ed => {
			ed.replace(sel, `; FOLD Region\n${text}\n; ENDFOLD`);
		});
	});

	// Command: Insert FOLD template
	const insertFoldTemplate = vscode.commands.registerCommand('robocode.insertFoldTemplate', async () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor || editor.document.languageId !== 'krl') { return; }
		const name = await vscode.window.showInputBox({ prompt: 'Fold description', placeHolder: 'Initialization' });
		if (name === undefined) { return; }
		editor.insertSnippet(new vscode.SnippetString(`; FOLD ${name}\n$0\n; ENDFOLD`));
	});

	// Command: Go to matching FOLD/ENDFOLD
	const goToMatchingFold = vscode.commands.registerCommand('robocode.goToMatchingFold', () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor || editor.document.languageId !== 'krl') { return; }
		
		const position = editor.selection.active;
		const lineText = editor.document.lineAt(position.line).text;
		
		if (FOLD_START.test(lineText)) {
			// Find matching ENDFOLD
			const stack: number[] = [];
			for (let i = position.line; i < editor.document.lineCount; i++) {
				const text = editor.document.lineAt(i).text;
				if (FOLD_START.test(text)) {
					stack.push(i);
				} else if (FOLD_END.test(text)) {
					stack.pop();
					if (stack.length === 0) {
						const newPosition = new vscode.Position(i, 0);
						editor.selection = new vscode.Selection(newPosition, newPosition);
						editor.revealRange(new vscode.Range(newPosition, newPosition));
						return;
					}
				}
			}
		} else if (FOLD_END.test(lineText)) {
			// Find matching FOLD
			const stack: number[] = [];
			for (let i = position.line; i >= 0; i--) {
				const text = editor.document.lineAt(i).text;
				if (FOLD_END.test(text)) {
					stack.push(i);
				} else if (FOLD_START.test(text)) {
					stack.pop();
					if (stack.length === 0) {
						const newPosition = new vscode.Position(i, 0);
						editor.selection = new vscode.Selection(newPosition, newPosition);
						editor.revealRange(new vscode.Range(newPosition, newPosition));
						return;
					}
				}
			}
		}
	});

	// Command: Toggle fold on current line
	const toggleFoldOnLine = vscode.commands.registerCommand('robocode.toggleFoldOnLine', () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor || editor.document.languageId !== 'krl') { return; }
		
		const position = editor.selection.active;
		const lineText = editor.document.lineAt(position.line).text;
		
		if (FOLD_START.test(lineText)) {
			vscode.commands.executeCommand('editor.fold');
		} else if (FOLD_END.test(lineText)) {
			// Navigate to matching FOLD first, then toggle
			vscode.commands.executeCommand('robocode.goToMatchingFold').then(() => {
				vscode.commands.executeCommand('editor.fold');
			});
		}
	});

	// Diagnostics for unmatched FOLD/ENDFOLD
	function validateFolds(doc: vscode.TextDocument) {
		if (doc.languageId !== 'krl') { return; }
		const diagnostics: vscode.Diagnostic[] = [];
		const stack: number[] = [];
		for (let i = 0; i < doc.lineCount; i++) {
			const line = doc.lineAt(i).text;
			if (FOLD_START.test(line)) {
				stack.push(i);
			} else if (FOLD_END.test(line)) {
				if (stack.length === 0) {
					diagnostics.push(new vscode.Diagnostic(new vscode.Range(i, 0, i, line.length), 'ENDFOLD without matching FOLD', vscode.DiagnosticSeverity.Warning));
				} else {
					stack.pop();
				}
			}
		}
		while (stack.length) {
			const startLine = stack.pop()!;
			const lineText = doc.lineAt(startLine).text;
			diagnostics.push(new vscode.Diagnostic(new vscode.Range(startLine, 0, startLine, lineText.length), 'FOLD without matching ENDFOLD', vscode.DiagnosticSeverity.Warning));
		}
		foldDiagnostics.set(doc.uri, diagnostics);
	}

	// Decoration to dim or hide ENDFOLD lines when folded (simulate hiding by opacity)
	if (!enfoldDecoration) {
		enfoldDecoration = vscode.window.createTextEditorDecorationType({
			opacity: '0.35',
			fontStyle: 'italic'
		});
	}

	// Decorations for hiding special comments and FOLD markers
	let hiddenCommentDecoration: vscode.TextEditorDecorationType | undefined;
	let foldMarkerDecoration: vscode.TextEditorDecorationType | undefined;
	
	if (!hiddenCommentDecoration) {
		hiddenCommentDecoration = vscode.window.createTextEditorDecorationType({
			opacity: '0',
			textDecoration: 'none; font-size: 0px; line-height: 0;'
		});
	}
	
	if (!foldMarkerDecoration) {
		foldMarkerDecoration = vscode.window.createTextEditorDecorationType({
			opacity: '0',
			textDecoration: 'none; font-size: 0px;'
		});
	}

	// Folding Range Provider to hide FOLD markers when collapsed
	const foldingProvider = vscode.languages.registerFoldingRangeProvider('krl', {
		provideFoldingRanges(document: vscode.TextDocument): vscode.FoldingRange[] {
			const ranges: vscode.FoldingRange[] = [];
			const stack: { line: number; kind?: vscode.FoldingRangeKind }[] = [];
			
			for (let i = 0; i < document.lineCount; i++) {
				const lineText = document.lineAt(i).text;
				
				if (FOLD_START.test(lineText)) {
					stack.push({ line: i, kind: vscode.FoldingRangeKind.Region });
				} else if (FOLD_END.test(lineText)) {
					const start = stack.pop();
					if (start) {
						// Create range that hides the start and end markers
						ranges.push(new vscode.FoldingRange(start.line, i, start.kind));
					}
				}
			}
			
			return ranges;
		}
	});

	function refreshEnfoldDecorations(editor: vscode.TextEditor) {
		if (editor.document.languageId !== 'krl') { return; }
		
		const enfoldRanges: vscode.Range[] = [];
		const hiddenCommentRanges: vscode.Range[] = [];
		const foldMarkerRanges: vscode.Range[] = [];
		
		// Get folded ranges to determine which FOLD markers to hide
		const foldedRanges = editor.visibleRanges;
		const isLineFolded = (lineNumber: number): boolean => {
			return foldedRanges.some(range => 
				lineNumber < range.start.line || lineNumber > range.end.line
			);
		};
		
		for (let i = 0; i < editor.document.lineCount; i++) {
			const line = editor.document.lineAt(i);
			const text = line.text;
			
			// Hide ENDFOLD lines (dim them)
			if (FOLD_END.test(text)) {
				enfoldRanges.push(new vscode.Range(i, 0, i, text.length));
			}
			
			// Hide special comments: ;%{PE}, ;%{h}..., DEFAULT ;%{PE}
			if (/;\s*%\{[^}]*\}/.test(text) || /DEFAULT\s*;\s*%\{PE\}/.test(text)) {
				hiddenCommentRanges.push(new vscode.Range(i, 0, i, text.length));
			}
			
			// Hide FOLD markers when their region is collapsed
			if (FOLD_START.test(text) && isLineFolded(i + 1)) {
				// Only hide the FOLD marker part, keep the description
				const match = text.match(/^(\s*;\s*FOLD\s*)(.*)/i);
				if (match) {
					foldMarkerRanges.push(new vscode.Range(i, 0, i, match[1].length));
				}
			}
		}
		
		editor.setDecorations(enfoldDecoration!, enfoldRanges);
		editor.setDecorations(hiddenCommentDecoration!, hiddenCommentRanges);
		editor.setDecorations(foldMarkerDecoration!, foldMarkerRanges);
	}

	// Outline (DocumentSymbol) provider for FOLD regions & DEF
	const symbolProvider = vscode.languages.registerDocumentSymbolProvider('krl', {
		provideDocumentSymbols(doc: vscode.TextDocument): vscode.DocumentSymbol[] {
			const symbols: vscode.DocumentSymbol[] = [];
			// Pre-scan for FOLD ranges using a stack
			const foldRanges: { start: number; end: number; desc: string }[] = [];
			const stack: { line: number; desc: string }[] = [];
			for (let i=0;i<doc.lineCount;i++) {
				const lineText = doc.lineAt(i).text;
				if (FOLD_START.test(lineText)) {
					const desc = lineText.replace(/^[;\s]*FOLD\s*/i,'').trim();
					stack.push({ line: i, desc: desc || 'Fold Region' });
				} else if (FOLD_END.test(lineText)) {
					const open = stack.pop();
					if (open) {
						foldRanges.push({ start: open.line, end: i, desc: open.desc });
					}
				}
			}
			// DEF symbol detection: range until matching END on its own line or file end
			for (let i=0;i<doc.lineCount;i++) {
				const text = doc.lineAt(i).text;
				if (/^\s*DEF\b/i.test(text)) {
					const nameMatch = text.match(/^\s*DEF\s+([A-Za-z0-9_]+)/i);
					const name = nameMatch ? nameMatch[1] : 'Program';
					let endLine = i;
					for (let j=i+1;j<doc.lineCount;j++) {
						if (/^\s*END\b/i.test(doc.lineAt(j).text)) { endLine = j; break; }
					}
					symbols.push(new vscode.DocumentSymbol(name, 'Program', vscode.SymbolKind.Function, new vscode.Range(i,0,endLine, doc.lineAt(endLine).text.length), new vscode.Range(i,0,i,text.length)));
				}
			}
			for (const fr of foldRanges) {
				const startText = doc.lineAt(fr.start).text;
				symbols.push(new vscode.DocumentSymbol(fr.desc, 'Region', vscode.SymbolKind.Namespace, new vscode.Range(fr.start,0,fr.end, doc.lineAt(fr.end).text.length), new vscode.Range(fr.start,0,fr.start,startText.length)));
			}
			return symbols;
		}
	});

	// Semantic Tokens Provider (enhanced coloring)
	const tokenTypes: string[] = ['keyword','function','type','property','enumMember'];
	const legend = new vscode.SemanticTokensLegend(tokenTypes, []);
	const motionCmds = /\b(PTP|LIN|CIRC|SPLINE|SLIN|SPTP|BAS)\b/g;
	const controlKeywords = /\b(IF|THEN|ELSE|ENDIF|FOR|ENDFOR|WHILE|ENDWHILE|REPEAT|UNTIL|SWITCH|CASE|DEFAULT|GOTO|HALT|WAIT|RETURN)\b/g;
	const typesRe = /\b(INT|REAL|BOOL|CHAR|ENUM|STRUC)\b/g;
	const enumConst = /\b(TRUE|FALSE)\b/g;
	const ioVar = /\$[A-Z][A-Z0-9_\[\]]*/g;

	function classify(line: string) {
		const out: { start:number; length:number; type:string }[] = [];
		function collect(re: RegExp, type: string) {
			re.lastIndex = 0;
			let m: RegExpExecArray | null;
			while ((m = re.exec(line))) {
				out.push({ start: m.index, length: m[0].length, type });
			}
		}
		collect(motionCmds, 'function');
		collect(controlKeywords, 'keyword');
		collect(typesRe, 'type');
		collect(enumConst, 'enumMember');
		collect(ioVar, 'property');
		return out;
	}

	const semanticProvider = vscode.languages.registerDocumentSemanticTokensProvider('krl', {
		provideDocumentSemanticTokens(doc: vscode.TextDocument) {
			const builder = new vscode.SemanticTokensBuilder(legend);
			for (let line = 0; line < doc.lineCount; line++) {
				const text = doc.lineAt(line).text;
				for (const t of classify(text)) {
					const idx = tokenTypes.indexOf(t.type);
					if (idx >= 0) { builder.push(line, t.start, t.length, idx, 0); }
				}
			}
			return builder.build();
		}
	}, legend);

	// Formatting Provider
	const formattingProvider = vscode.languages.registerDocumentFormattingEditProvider('krl', {
		provideDocumentFormattingEdits(doc: vscode.TextDocument): vscode.TextEdit[] {
			const cfg = vscode.workspace.getConfiguration('robocode.format');
			const doAlign = cfg.get<boolean>('alignAssignments', true);
			const uppercase = cfg.get<boolean>('uppercaseKeywords', true);
			const assignRegex = /^(\s*[_A-Za-z0-9$\.\[\]]+\s*)=(?!=)/;
			let maxLeft = 0;
			const leftMeta: (string|null)[] = [];
			for (let i=0;i<doc.lineCount;i++) {
				const line = doc.lineAt(i).text;
				if (doAlign && assignRegex.test(line)) {
					const left = assignRegex.exec(line)![1].trim();
					maxLeft = Math.max(maxLeft, left.length);
					leftMeta[i] = left;
				} else {
					leftMeta[i] = null;
				}
			}
			const keywordSet = /\b(DEF|END|DEFDAT|ENDDAT|IF|THEN|ELSE|ENDIF|FOR|ENDFOR|WHILE|ENDWHILE|REPEAT|UNTIL|SWITCH|CASE|DEFAULT|GOTO|HALT|WAIT|RETURN|PTP|LIN|CIRC|SPLINE|BAS)\b/gi;
			const newLines: string[] = [];
			for (let i=0;i<doc.lineCount;i++) {
				let line = doc.lineAt(i).text;
				if (leftMeta[i] && doAlign) {
					const right = line.substring(line.indexOf('=')+1).trim();
					line = leftMeta[i]!.padEnd(maxLeft, ' ') + ' = ' + right;
				}
				if (uppercase) { line = line.replace(keywordSet, m => m.toUpperCase()); }
				newLines.push(line);
			}
			const last = doc.lineCount - 1;
			const fullRange = new vscode.Range(0,0,last, doc.lineAt(last).text.length);
			return [vscode.TextEdit.replace(fullRange, newLines.join('\n'))];
		}
	});

	// Hook events
	context.subscriptions.push(vscode.workspace.onDidOpenTextDocument(validateFolds));
	context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(e => validateFolds(e.document)));
	vscode.workspace.textDocuments.forEach(validateFolds);
	refreshEditors();

	function refreshEditors() {
		vscode.window.visibleTextEditors.forEach(refreshEnfoldDecorations);
	}
	context.subscriptions.push(vscode.window.onDidChangeVisibleTextEditors(() => refreshEditors()));
	context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(e => {
		if (vscode.window.activeTextEditor && e.document === vscode.window.activeTextEditor.document) {
			refreshEnfoldDecorations(vscode.window.activeTextEditor);
		}
	}));

	// Auto-collapse only marker regions (;FOLD / ;ENDFOLD) leaving DEF/END & DEFFCT blocks expanded
	const autoFold = vscode.workspace.onDidOpenTextDocument(doc => {
		if (doc.languageId === 'krl') {
			setTimeout(() => {
				const editor = vscode.window.visibleTextEditors.find(e => e.document === doc);
				if (editor) {
					// Fold only marker-based regions
					vscode.commands.executeCommand('editor.foldAllMarkerRegions');
				}
			}, 120); // slight delay to allow VS Code to compute folding regions
		}
	});

	// Add click handler for line-based folding
	const clickHandler = vscode.window.onDidChangeTextEditorSelection(e => {
		if (!e.textEditor || e.textEditor.document.languageId !== 'krl') { return; }
		
		// Check if cursor is on a FOLD/ENDFOLD line
		const selection = e.selections[0];
		if (selection && selection.isEmpty) {
			const line = e.textEditor.document.lineAt(selection.start.line);
			const lineText = line.text;
			
			// If cursor is anywhere on a FOLD or ENDFOLD line, enable folding on that line
			if (FOLD_START.test(lineText) || FOLD_END.test(lineText)) {
				// Add a small delay to distinguish from regular cursor movement
				setTimeout(() => {
					const currentEditor = vscode.window.activeTextEditor;
					if (currentEditor && currentEditor === e.textEditor) {
						const currentSelection = currentEditor.selection;
						if (currentSelection.isEmpty && currentSelection.start.line === selection.start.line) {
							// Cursor is still on the same line, user likely wants to interact with fold
							// We don't auto-fold here, but we could highlight or provide visual feedback
						}
					}
				}, 100);
			}
		}
	});

	// Add double-click handler for folding
	let lastClickTime = 0;
	let lastClickLine = -1;
	
	const doubleClickHandler = vscode.window.onDidChangeTextEditorSelection(e => {
		if (!e.textEditor || e.textEditor.document.languageId !== 'krl') { return; }
		
		const now = Date.now();
		const selection = e.selections[0];
		
		if (selection && selection.isEmpty) {
			const currentLine = selection.start.line;
			const lineText = e.textEditor.document.lineAt(currentLine).text;
			
			// Check for double-click (within 500ms on same line)
			if (now - lastClickTime < 500 && currentLine === lastClickLine) {
				if (FOLD_START.test(lineText) || FOLD_END.test(lineText)) {
					vscode.commands.executeCommand('robocode.toggleFoldOnLine');
				}
			}
			
			lastClickTime = now;
			lastClickLine = currentLine;
		}
	});

	// Listen for fold state changes to update decorations
	const foldChangeHandler = vscode.window.onDidChangeTextEditorVisibleRanges(e => {
		if (e.textEditor.document.languageId === 'krl') {
			refreshEnfoldDecorations(e.textEditor);
		}
	});

	// Push all subscriptions
	context.subscriptions.push(
		connectRobotCommand,
		disconnectRobotCommand,
		showRobotStatusCommand,
		uploadProgramCommand,
		krlCompletionProvider,
		autoFold,
		wrapFoldCommand,
		insertFoldTemplate,
		goToMatchingFold,
		toggleFoldOnLine,
		symbolProvider,
		semanticProvider,
		formattingProvider,
		foldingProvider,
		clickHandler,
		doubleClickHandler,
		foldChangeHandler
	);
}

// This method is called when your extension is deactivated
export function deactivate() {
	if (robotStatusBarItem) {
		robotStatusBarItem.dispose();
	}
	foldDiagnostics.clear();
}
