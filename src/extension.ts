// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// Robot connection status
interface RobotConnection {
	id: string;
	name: string;
	type: 'KUKA' | 'ABB' | 'FANUC' | 'DOBOT';
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
		const robotType = await vscode.window.showQuickPick(['KUKA', 'ABB', 'FANUC', 'DOBOT'], {
			placeHolder: 'Select robot type'
		});
		
		if (robotType) {
			const ipAddress = await vscode.window.showInputBox({
				prompt: 'Enter robot IP address',
				placeHolder: '192.168.1.100'
			});
			
			if (ipAddress) {
				const robotName = await vscode.window.showInputBox({
					prompt: 'Enter robot name',
					placeHolder: `${robotType} Robot`
				});
				
				if (robotName) {
					const robot: RobotConnection = {
						id: Date.now().toString(),
						name: robotName,
						type: robotType as any,
						ipAddress,
						status: 'connected'
					};
					
					robotProvider.addRobot(robot);
					robotStatusBarItem.text = `$(plug) ${robotName} Connected`;
					vscode.window.showInformationMessage(`Connected to ${robotName} (${robotType})`);
				}
			}
		}
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

	const rapidCompletionProvider = vscode.languages.registerCompletionItemProvider('rapid', {
		provideCompletionItems(document: vscode.TextDocument, position: vscode.Position) {
			const completionItems: vscode.CompletionItem[] = [];
			
			// Add ABB RAPID-specific completions
			const moveJCompletion = new vscode.CompletionItem('MoveJ', vscode.CompletionItemKind.Function);
			moveJCompletion.detail = 'Joint Motion';
			moveJCompletion.documentation = 'Moves the robot to a joint position';
			completionItems.push(moveJCompletion);
			
			const moveLCompletion = new vscode.CompletionItem('MoveL', vscode.CompletionItemKind.Function);
			moveLCompletion.detail = 'Linear Motion';
			moveLCompletion.documentation = 'Moves the robot in a straight line';
			completionItems.push(moveLCompletion);
			
			return completionItems;
		}
	});

	// Push all subscriptions
	context.subscriptions.push(
		connectRobotCommand,
		disconnectRobotCommand,
		showRobotStatusCommand,
		uploadProgramCommand,
		krlCompletionProvider,
		rapidCompletionProvider
	);
}

// This method is called when your extension is deactivated
export function deactivate() {
	if (robotStatusBarItem) {
		robotStatusBarItem.dispose();
	}
}
