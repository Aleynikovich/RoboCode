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
	function refreshEnfoldDecorations(editor: vscode.TextEditor) {
		if (editor.document.languageId !== 'krl') { return; }
		const ranges: vscode.Range[] = [];
		for (let i = 0; i < editor.document.lineCount; i++) {
			const line = editor.document.lineAt(i);
			if (FOLD_END.test(line.text)) {
				ranges.push(new vscode.Range(i, 0, i, line.text.length));
			}
		}
		editor.setDecorations(enfoldDecoration!, ranges);
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
		symbolProvider
		,semanticProvider
		,formattingProvider
	);
}

// This method is called when your extension is deactivated
export function deactivate() {
	if (robotStatusBarItem) {
		robotStatusBarItem.dispose();
	}
	foldDiagnostics.clear();
}
