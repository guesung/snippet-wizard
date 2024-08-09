import path from 'path';

export const getGlobalSnippetsFolder = (): string => {
  switch (process.platform) {
    case 'win32':
      return path.join('AppData', 'Roaming', 'Code', 'User', 'snippets');
    case 'darwin':
      return path.join(
        'Library',
        'Application Support',
        'Code',
        'User',
        'snippets'
      );
    default: // linux and others
      return path.join('.config', 'Code', 'User', 'snippets');
  }
};
