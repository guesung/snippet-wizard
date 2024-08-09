import path from 'path';
import fs from 'fs';
import vscode from 'vscode';

export const readSnippetsFile = async (
  filePath: string
): Promise<Record<string, any>> => {
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
    const reset = await vscode.window.showWarningMessage(
      message,
      'Reset File',
      'Cancel'
    );

    if (reset === 'Reset File') {
      try {
        fs.writeFileSync(filePath, '{}');
        vscode.window.showInformationMessage('Snippets file has been reset.');
        return {};
      } catch (writeError) {
        const writeErrorMessage =
          writeError instanceof Error ? writeError.message : String(writeError);
        vscode.window.showErrorMessage(
          `Failed to reset snippets file: ${writeErrorMessage}`
        );
        return {};
      }
    } else {
      throw new Error(
        'Unable to read or reset snippets file. Operation cancelled.'
      );
    }
  }
};

export function deactivate() {}
