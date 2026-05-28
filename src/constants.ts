export const SCHEME = "diffly";

export const OUTPUT_CHANNEL_NAME = "Diffly";

export const COMMAND_IDS = {
  compareWith: "diffly.compareWith",
  compareWithWorkingCopy: "diffly.compareWithWorkingCopy",
  compareWithPrevious: "diffly.compareWithPrevious",
  compareWithBranch: "diffly.compareWithBranch",
  compareWithTag: "diffly.compareWithTag",
  compareTwoCommits: "diffly.compareTwoCommits",
  compareFileWithCommit: "diffly.compareFileWithCommit",
  compareFileWithBranch: "diffly.compareFileWithBranch",
  compareFileWithTag: "diffly.compareFileWithTag",
  reopenLast: "diffly.reopenLast",
  showLogs: "diffly.showLogs",
} as const;

export const BUILT_IN_COMMANDS = {
  diff: "vscode.diff",
  setContext: "setContext",
} as const;

export const CONTEXT_KEYS = {
  gitAvailable: "diffly.gitAvailable",
} as const;

export const MEMENTO_KEYS = {
  lastComparison: "diffly.lastComparison",
} as const;

export const URI_AUTHORITIES = {
  commit: "commit",
  index: "index",
} as const;

export const DEFAULT_LOG_LIMIT = 200;

export const SHORT_SHA_LEN = 7;

export const GIT_BINARY = "git";

export const NUL = "\x00";
export const TAB = "\t";
export const LF = "\n";

export const GIT_LOG_FORMAT = "%H%x00%h%x00%an%x00%at%x00%s";

export const REFS_FORMAT = "%(refname)%00%(refname:short)%00%(objectname)";

export const REF_PREFIX_HEADS = "refs/heads/";
export const REF_PREFIX_TAGS = "refs/tags/";

export const REV_KINDS = {
  commit: "commit",
  workingCopy: "workingCopy",
  index: "index",
} as const;

export const REF_TYPES = {
  branch: "branch",
  tag: "tag",
  other: "other",
} as const;

export const SIDE_B_KINDS = {
  workingCopy: REV_KINDS.workingCopy,
  index: REV_KINDS.index,
  pickRef: "pickRef",
  pickCommit: "pickCommit",
} as const;

export const URI_PARSE_ERROR_KINDS = {
  invalidScheme: "invalidScheme",
  invalidAuthority: "invalidAuthority",
  missingSha: "missingSha",
  emptyPath: "emptyPath",
  badEncoding: "badEncoding",
  malformed: "malformed",
} as const;

export const GIT_ERROR_KINDS = {
  spawnFailed: "spawnFailed",
  nonZeroExit: "nonZeroExit",
  parseError: "parseError",
  notARepo: "notARepo",
  notFound: "notFound",
} as const;

export const CHANGED_FILE_STATUSES = {
  added: "A",
  modified: "M",
  deleted: "D",
  renamed: "R",
  copied: "C",
} as const;

export const MENU_IDS = {
  scmHistoryItem: "scm/historyItem/context",
  scmResourceState: "scm/resourceState/context",
  editorTitleContext: "editor/title/context",
  explorerContext: "explorer/context",
  commandPalette: "commandPalette",
} as const;

export const MENU_WHEN = {
  scmGit: "scmProvider == git",
  resourceFile: "resourceScheme == file",
  resourceFileNotFolder: "resourceScheme == file && !explorerResourceIsFolder",
  never: "false",
} as const;

export const MENU_GROUP_PREFIX = "diffly";

export const TITLE_PREFIX = "Diffly:";

export const UI_TEXT = {
  workingCopy: "Working Copy",
  workingCopyDescription: "On-disk files in this repository",
  indexLabel: "Index",
  indexDescription: "The git staging area",
  pickCommitLabel: "Pick a commit…",
  pickCommitDescription: "Choose from recent log entries",
  pickRefLabel: "Pick a branch or tag…",
  pickRefDescription: "Choose from refs in this repository",
  pickCommitPlaceholder: "Pick a commit",
  pickRefPlaceholder: "Pick a branch or tag",
  pickBranchPlaceholder: "Pick a branch",
  pickTagPlaceholder: "Pick a tag",
  pickRepoPlaceholder: "Pick a git repository",
  compareAgainstPlaceholder: "Compare against…",
  branchLabel: "Branch",
  tagLabel: "Tag",
  refLabel: "Ref",
  binaryStat: "binary",
  justNow: "just now",
  noChanges: "Diffly: no changes between selected sides.",
  pathArrow: "↔",
  pathDash: "—",
  bulletDot: "•",
} as const;

export const LOG_EVENTS = {
  extensionActivated: "extension.activated",
  extensionDeactivated: "extension.deactivated",
  gitRunStart: "git.run.start",
  gitRunEnd: "git.run.end",
  gitRunSpawnFailed: "git.run.spawnFailed",
  gitError: "git.error",
  diffOpen: "diff.open",
  providerParseFailed: "provider.parseFailed",
  providerRepoUnresolved: "provider.repoUnresolved",
  providerShowFailed: "provider.showFailed",
} as const;

export const VSCODE_GIT_EXTENSION_ID = "vscode.git";

export const LOG_LEVELS = {
  trace: "trace",
  debug: "debug",
  info: "info",
  warn: "warn",
  error: "error",
} as const;

export type LogLevel = (typeof LOG_LEVELS)[keyof typeof LOG_LEVELS];
