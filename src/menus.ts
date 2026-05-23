import { COMMAND_IDS } from './constants';

export interface MenuEntry {
  readonly command: string;
  readonly when: string;
  readonly group: string;
}

export interface MenuManifest {
  readonly menus: Record<string, readonly MenuEntry[]>;
  readonly commandPalette: readonly { readonly command: string; readonly when: string }[];
}

const MENU_IDS = {
  scmHistoryItem: 'scm/historyItem/context',
  scmResourceState: 'scm/resourceState/context',
  editorTitleContext: 'editor/title/context',
  explorerContext: 'explorer/context',
  commandPalette: 'commandPalette',
} as const;

const WHEN_GIT = 'scmProvider == git';
const WHEN_FILE = 'resourceScheme == file';
const WHEN_FILE_NOT_FOLDER = 'resourceScheme == file && !explorerResourceIsFolder';
const NEVER = 'false';

const commitLevelCommands = [
  COMMAND_IDS.compareWith,
  COMMAND_IDS.compareWithWorkingCopy,
  COMMAND_IDS.compareWithPrevious,
  COMMAND_IDS.compareWithBranch,
  COMMAND_IDS.compareWithTag,
] as const;

const fileLevelCommands = [
  COMMAND_IDS.compareFileWithCommit,
  COMMAND_IDS.compareFileWithBranch,
  COMMAND_IDS.compareFileWithTag,
] as const;

const groupedEntries = (
  commands: readonly string[],
  when: string,
  groupPrefix: string,
): readonly MenuEntry[] =>
  commands.map((command, i) => ({
    command,
    when,
    group: `${groupPrefix}@${i + 1}`,
  }));

const hideFromPalette = (commands: readonly string[]) =>
  commands.map((command) => ({ command, when: NEVER }));

export const buildMenuManifest = (): MenuManifest => ({
  menus: {
    [MENU_IDS.scmHistoryItem]: groupedEntries(commitLevelCommands, WHEN_GIT, 'diffy'),
    [MENU_IDS.scmResourceState]: groupedEntries(fileLevelCommands, WHEN_GIT, 'diffy'),
    [MENU_IDS.editorTitleContext]: groupedEntries(fileLevelCommands, WHEN_FILE, 'diffy'),
    [MENU_IDS.explorerContext]: groupedEntries(fileLevelCommands, WHEN_FILE_NOT_FOLDER, 'diffy'),
  },
  commandPalette: hideFromPalette([
    COMMAND_IDS.compareWith,
    COMMAND_IDS.compareWithWorkingCopy,
    COMMAND_IDS.compareWithPrevious,
    COMMAND_IDS.compareWithBranch,
    COMMAND_IDS.compareWithTag,
    COMMAND_IDS.showLogs,
  ]),
});

export const COMMAND_TITLES: Record<string, string> = {
  [COMMAND_IDS.compareWith]: 'Diffy: Compare with…',
  [COMMAND_IDS.compareWithWorkingCopy]: 'Diffy: Compare with Working Copy',
  [COMMAND_IDS.compareWithPrevious]: 'Diffy: Compare with Previous',
  [COMMAND_IDS.compareWithBranch]: 'Diffy: Compare with Branch…',
  [COMMAND_IDS.compareWithTag]: 'Diffy: Compare with Tag…',
  [COMMAND_IDS.compareTwoCommits]: 'Diffy: Compare Two Commits',
  [COMMAND_IDS.compareFileWithCommit]: 'Diffy: Compare with Commit…',
  [COMMAND_IDS.compareFileWithBranch]: 'Diffy: Compare with Branch…',
  [COMMAND_IDS.compareFileWithTag]: 'Diffy: Compare with Tag…',
  [COMMAND_IDS.reopenLast]: 'Diffy: Reopen Last Comparison',
  [COMMAND_IDS.showLogs]: 'Diffy: Show Logs',
};
