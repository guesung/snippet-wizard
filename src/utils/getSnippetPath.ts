import os from 'os';
import vscode from 'vscode';
import { getGlobalSnippetsFolder } from './getGlobalSnippetFolder';
import path from 'path';

export async function getSnippetsPath(
  snippetType: string,
  languageId: string
): Promise<string> {
  const homeDir = os.homedir();
  let snippetsDir: string;

  switch (snippetType) {
    case 'Global Snippets':
      snippetsDir = path.join(homeDir, getGlobalSnippetsFolder());
      return path.join(snippetsDir, 'global-snippets.json');

    case 'Workspace Snippets':
      // eslint-disable-next-line no-case-declarations
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders) throw new Error('No workspace folder open');
      if (!workspaceFolders[0]) return '';
      snippetsDir = path.join(workspaceFolders[0].uri.fsPath, '.vscode');
      return path.join(snippetsDir, 'workspace-snippets.json');

    case 'Language Specific Snippets':
      snippetsDir = path.join(homeDir, getGlobalSnippetsFolder());
      return path.join(snippetsDir, `${languageId}.json`);

    default:
      throw new Error('Invalid snippet type');
  }
}
