import * as vscode from 'vscode';

interface RegisteredTerminal {
	statusBarItem: vscode.StatusBarItem;
	terminal: vscode.Terminal;
	name: string;
}

const MaxTerminals = 5;
const Terminals: RegisteredTerminal[] = [];
let addTerminalStatusBarItem: vscode.StatusBarItem;

export function activate(context: vscode.ExtensionContext) {
	addTerminalStatusBarItem = vscode.window.createStatusBarItem();
	addTerminalStatusBarItem.text = '$(plus) Add terminal';
	addTerminalStatusBarItem.command = 'terminalis.addTerminal';
	addTerminalStatusBarItem.show();

	let disposable = vscode.commands.registerCommand('terminalis.addTerminal', async () => {
		if (Terminals.length < MaxTerminals) {
			const name = await vscode.window.showInputBox({ placeHolder: 'Enter the name of your terminal. E.g. docker' });
			const terminal = vscode.window.createTerminal(name);
		} else {
			vscode.window.showInformationMessage('You can only add 5 terminals to the status bar.');
		}
	});
	context.subscriptions.push(disposable);
	for (let i = 0; i < MaxTerminals; i++) {
		disposable = vscode.commands.registerCommand(`terminalis.showTerminal${i}`, () => {
			Terminals[i].terminal.show();
		});
		context.subscriptions.push(disposable);
	}

	vscode.window.onDidOpenTerminal((terminal: vscode.Terminal) => {
		if (Terminals.length < MaxTerminals) {
			addTerminal(terminal);
		}
	});

	disposable = vscode.window.onDidCloseTerminal((terminal: vscode.Terminal) => {
		const removedIndex = Terminals.findIndex(t => t.terminal === terminal);
		const t = Terminals[removedIndex];
		t.statusBarItem.dispose();
		Terminals.splice(removedIndex, 1);
		updateStatusBarItemCommands();
	});
	context.subscriptions.push(disposable);

	if (vscode.window.terminals) {
		vscode.window.terminals.forEach(t => addTerminal(t));
	}
}

function addTerminal(terminal: vscode.Terminal) {
	const name = terminal.name;
	const statusBarItem = vscode.window.createStatusBarItem();
	statusBarItem.text = `$(terminal) ${name}`;
	statusBarItem.command = `terminalis.showTerminal${Terminals.length}`;
	statusBarItem.show();
	Terminals.push({ terminal, statusBarItem, name });
}

function updateStatusBarItemCommands() {
	for (let i = 0; i < Terminals.length; i++) {
		const terminal = Terminals[i];
		terminal.statusBarItem.command = `terminalis.showTerminal${i}`;
	}
}

export function deactivate() {
	for (let i = 0; i < Terminals.length; i++) {
		const terminal = Terminals[i];
		terminal.statusBarItem.dispose();
	}
	addTerminalStatusBarItem.dispose();
}
