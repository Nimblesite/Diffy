export const SCHEME = 'diffy';

export const OUTPUT_CHANNEL_NAME = 'Diffy';

export const COMMAND_IDS = {
  compareWith: 'diffy.compareWith',
  compareWithWorkingCopy: 'diffy.compareWithWorkingCopy',
  compareWithPrevious: 'diffy.compareWithPrevious',
  compareWithBranch: 'diffy.compareWithBranch',
  compareWithTag: 'diffy.compareWithTag',
  compareTwoCommits: 'diffy.compareTwoCommits',
  compareFileWithCommit: 'diffy.compareFileWithCommit',
  compareFileWithBranch: 'diffy.compareFileWithBranch',
  compareFileWithTag: 'diffy.compareFileWithTag',
  reopenLast: 'diffy.reopenLast',
  showLogs: 'diffy.showLogs',
} as const;

export const BUILT_IN_COMMANDS = {
  diff: 'vscode.diff',
} as const;

export const CONTEXT_KEYS = {
  gitAvailable: 'diffy.gitAvailable',
} as const;

export const MEMENTO_KEYS = {
  lastComparison: 'diffy.lastComparison',
} as const;

export const URI_AUTHORITIES = {
  commit: 'commit',
  index: 'index',
} as const;

export const DEFAULT_LOG_LIMIT = 200;

export const SHORT_SHA_LEN = 7;

export const GIT_BINARY = 'git';

export const NUL = '\x00';
export const TAB = '\t';
export const LF = '\n';

export const GIT_LOG_FORMAT = '%H%x00%h%x00%an%x00%at%x00%s';

export const REFS_FORMAT = '%(refname)%00%(refname:short)%00%(objectname)';

export const REF_PREFIX_HEADS = 'refs/heads/';
export const REF_PREFIX_TAGS = 'refs/tags/';
