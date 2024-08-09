import vscode from 'vscode';
import fs from 'fs';
import { getSnippetsPath, readSnippetsFile } from './utils';

export const activate = (context: vscode.ExtensionContext) =>  {
  let disposable = vscode.commands.registerCommand(
    'snippetWizard.generateSnippet',
    async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showWarningMessage('No active text editor.');
        return;
      }

      const selection = editor.selection;
      const text = editor.document.getText(selection);

      if (!text) {
        vscode.window.showWarningMessage(
          'No text selected. Please select some code first.'
        );
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
        prompt: 'Enter a name for your snippet',
      });

      if (!snippetName) {
        vscode.window.showWarningMessage('Snippet name is required.');
        return;
      }

      const snippetPrefix = await vscode.window.showInputBox({
        prompt: 'Enter a prefix for your snippet',
      });

      if (!snippetPrefix) {
        vscode.window.showWarningMessage('Snippet prefix is required.');
        return;
      }

      const snippetObject = {
        [snippetName]: {
          prefix: snippetPrefix,
          body: text.split('\n'),
          description: `Generated snippet: ${snippetName}`,
        },
      };

      try {
        const snippetsPath = await getSnippetsPath(snippetType, languageId);
        const existingSnippets = await readSnippetsFile(snippetsPath);
        const updatedSnippets = { ...existingSnippets, ...snippetObject };

        fs.writeFileSync(
          snippetsPath,
          JSON.stringify(updatedSnippets, null, 2)
        );

        const message = `Snippet '${snippetName}' added successfully!`;
        vscode.window
          .showInformationMessage(message, 'Open Snippet File')
          .then(selection => {
            if (selection === 'Open Snippet File') {
              vscode.workspace.openTextDocument(snippetsPath).then(doc => {
                vscode.window.showTextDocument(doc);
              });
            }
          });
      } catch (error) {
        vscode.window.showErrorMessage(
          `Error processing snippet: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  );

  context.subscriptions.push(disposable);
}
