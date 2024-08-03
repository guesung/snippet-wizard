import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand('snippetWizard.generateSnippet', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showWarningMessage('No active text editor.');
            return;
        }

        const selection = editor.selection;
        const text = editor.document.getText(selection);

        if (!text) {
            vscode.window.showWarningMessage('No text selected. Please select some code first.');
            return;
        }

        const snippetType = await vscode.window.showQuickPick(
            ['Global Snippets', 'Workspace Snippets', 'Language Specific Snippets'],
            { placeHolder: 'Select where to save the snippet' }
        );

        if (!snippetType) {
            return; 
        }

        let languageId = '';
        if (snippetType === 'Language Specific Snippets') {
            languageId = editor.document.languageId;
        }

        const snippetName = await vscode.window.showInputBox({
            prompt: "Enter a name for your snippet"
        });

        if (!snippetName) {
            vscode.window.showWarningMessage('Snippet name is required.');
            return;
        }

        const snippetPrefix = await vscode.window.showInputBox({
            prompt: "Enter a prefix for your snippet"
        });

        if (!snippetPrefix) {
            vscode.window.showWarningMessage('Snippet prefix is required.');
            return;
        }

        const snippetObject = {
            [snippetName]: {
                prefix: snippetPrefix,
                body: text.split('\n'),
                description: `Generated snippet: ${snippetName}`
            }
        };

        try {
            const snippetsPath = await getSnippetsPath(snippetType, languageId);
            const existingSnippets = await readSnippetsFile(snippetsPath);
            const updatedSnippets = { ...existingSnippets, ...snippetObject };

            fs.writeFileSync(snippetsPath, JSON.stringify(updatedSnippets, null, 2));

            const message = `Snippet '${snippetName}' added successfully!`;
            vscode.window.showInformationMessage(message, 'Open Snippet File').then(selection => {
                if (selection === 'Open Snippet File') {
                    vscode.workspace.openTextDocument(snippetsPath).then(doc => {
                        vscode.window.showTextDocument(doc);
                    });
                }
            });
        } catch (error) {
            vscode.window.showErrorMessage(`Error processing snippet: ${error instanceof Error ? error.message : String(error)}`);
        }
    });

    context.subscriptions.push(disposable);
}

async function getSnippetsPath(snippetType: string, languageId: string): Promise<string> {
    const homeDir = os.homedir();
    let snippetsDir: string;

    switch (snippetType) {
        case 'Global Snippets':
            snippetsDir = path.join(homeDir, getGlobalSnippetsFolder());
            return path.join(snippetsDir, 'global.code-snippets');
        case 'Workspace Snippets':
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders) {
                throw new Error('No workspace folder open');
            }
            snippetsDir = path.join(workspaceFolders[0].uri.fsPath, '.vscode');
            return path.join(snippetsDir, 'snippets.code-snippets');
        case 'Language Specific Snippets':
            snippetsDir = path.join(homeDir, getGlobalSnippetsFolder());
            return path.join(snippetsDir, `${languageId}.json`);
        default:
            throw new Error('Invalid snippet type');
    }
}

function getGlobalSnippetsFolder(): string {
    switch (process.platform) {
        case 'win32':
            return path.join('AppData', 'Roaming', 'Code', 'User', 'snippets');
        case 'darwin':
            return path.join('Library', 'Application Support', 'Code', 'User', 'snippets');
        default: // linux and others
            return path.join('.config', 'Code', 'User', 'snippets');
    }
}

async function readSnippetsFile(filePath: string): Promise<Record<string, any>> {
    const snippetsDir = path.dirname(filePath);
    if (!fs.existsSync(snippetsDir)) {
        fs.mkdirSync(snippetsDir, { recursive: true });
    }

    if (!fs.existsSync(filePath)) {
        return {};
    }

    try {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(fileContent);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const message = `Error reading snippets file: ${errorMessage}. Do you want to reset the file?`;
        const reset = await vscode.window.showWarningMessage(message, 'Reset File', 'Cancel');
        
        if (reset === 'Reset File') {
            try {
                fs.writeFileSync(filePath, '{}');
                vscode.window.showInformationMessage('Snippets file has been reset.');
                return {};
            } catch (writeError) {
                const writeErrorMessage = writeError instanceof Error ? writeError.message : String(writeError);
                vscode.window.showErrorMessage(`Failed to reset snippets file: ${writeErrorMessage}`);
                return {};
            }
        } else {
            throw new Error('Unable to read or reset snippets file. Operation cancelled.');
        }
    }
}

export function deactivate() {}