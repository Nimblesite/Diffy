# Diffy — VSCode Extension Plan

## Context

Diffy is a new VSCode extension whose only job is **"pick two things and diff them"** against a git repository and allow editing of the working state side. Side A is a commit; Side B can be another commit, the working copy, the index, or a branch/tag (resolved to a commit).

**KISS principle, enforced**: Diffy adds **no new views, no activity-bar icon, no tree provider, no webviews**. Everything is wired as **context-menu entries on VSCode's existing Source Control surfaces** (SCM history, SCM resource state, editor title, explorer) plus a small number of palette commands. Browsing many changed files between two commits is handled by a **multi-step QuickPick**, not a persistent panel. The user already has a Rust LSP framework (`lsp_toolkit`) and Rust+TS extension precedent (`GithubIssues`) — both explicitly rejected for Diffy.

## Stack decision: pure TypeScript

LSP exposes **language** semantics (completion, hover, diagnostics). Diffy does none of that — it shells out to `git` and hands two URIs to `vscode.diff`. A Rust LSP adds per-platform binaries, IPC plumbing, and deployment complexity for zero capability or perf gain. Match the existing [CommandTree](../../Documents/Code/CommandTree) TS-only structure.

## Non-negotiables (inherited from CommandTree CLAUDE.md)

- `Result<T,E>` discriminated union — **no thrown exceptions** except panic-level bugs
- Strict TypeScript (`strict: true`), no `any`, no `!`, no `@ts-ignore`, no untyped casts
- Functions < 20 lines, files < 450 lines
- **No regex on structured data** — git porcelain output parsed via NUL-delimiters
- **Providers decoupled from `vscode` SDK** — VSCode-binding shells wrap pure logic
- Named constants in one location; named parameters for 3+ args
- pino structured logging → file + VSCode OutputChannel; no PII, no secrets
- 100% coverage goal, ratchet-only via `coverage-thresholds.json`
- E2E = black-box only via VSCode commands/UI; unit tests for isolation only
- Seven Makefile targets: `build`, `test`, `lint`, `fmt`, `clean`, `ci`, `setup` (+ `package`)

## UX surface (context menus only)

```
SCM history view, right-click a commit:
  ├── Diffy: Compare with…              → SideBPicker → diff (single file) or multi-file QuickPick
  ├── Diffy: Compare with Working Copy  → multi-file QuickPick → diff
  └── Diffy: Compare with Previous      → diff against commit^1

SCM Changes view, right-click a changed file:
  └── Diffy: Compare with Commit…       → CommitPicker → diff this file at picked commit vs working copy

Editor title bar / Explorer, right-click a file:
  └── Diffy: Compare with Commit…       → CommitPicker → diff this file at picked commit vs working copy

Command palette:
  ├── Diffy: Compare Two Commits        → CommitPicker → SideBPicker → file QuickPick → diff
  ├── Diffy: Compare Current File with Commit
  └── Diffy: Reopen Last Comparison
```

**Browsing many changed files between two commits**: after Side A and Side B are picked, show a `QuickPick<FileItem>` listing all changed files with `+N -M` in the description and `A/M/D/R/C` status as the detail. Picking a file opens `vscode.diff`; the QuickPick stays open (`ignoreFocusOut: true`) so the user can dismiss the diff and pick another file. **This replaces the tree view entirely.**

## Project layout

```
/Users/christianfindlay/Documents/Code/Diffy/
├── .github/workflows/{ci.yml,release.yml}
├── .vscode-test.mjs
├── Makefile
├── package.json
├── tsconfig.json
├── eslint.config.mjs
├── .prettierrc.json
├── coverage-thresholds.json
├── cspell.json
├── icon.png
├── README.md
├── CHANGELOG.md
├── LICENSE
├── CLAUDE.md                       # copied from CommandTree, project-specific edits
├── src/
│   ├── extension.ts                # activate/deactivate; command + provider registration ONLY
│   ├── constants.ts                # command IDs, scheme name, context keys
│   ├── result.ts                   # Result<T,E>
│   ├── logger.ts                   # pino + OutputChannel sink
│   ├── state.ts                    # Memento wrapper: lastComparison
│   ├── git/
│   │   ├── GitRunner.ts            # subprocess exec → Result<string, GitError>
│   │   ├── GitRepo.ts              # log, nameStatus, numstat, show, revParse, refs
│   │   ├── parsers.ts              # NUL-delimited porcelain parsers (no regex)
│   │   └── types.ts                # Commit, ChangedFile, DiffStat, RevSpec, Ref
│   ├── providers/
│   │   └── DiffyContentProvider.ts # TextDocumentContentProvider for diffy://
│   ├── ui/
│   │   ├── CommitPicker.ts         # QuickPick over git log
│   │   ├── RefPicker.ts            # branches + tags, resolves to RevSpec
│   │   ├── SideBPicker.ts          # Commit | Working Copy | Index | Branch/Tag
│   │   ├── FilePicker.ts           # QuickPick over changed files with stats
│   │   └── uri.ts                  # buildDiffyUri / parseDiffyUri (pure)
│   ├── commands/
│   │   ├── compareWith.ts          # SCM-history "Compare with…" entry
│   │   ├── compareWithWorkingCopy.ts
│   │   ├── compareWithPrevious.ts
│   │   ├── compareTwoCommits.ts    # palette
│   │   ├── compareFileWithCommit.ts # editor/explorer/SCM-resource "Compare with Commit…"
│   │   └── reopenLast.ts
│   └── test/
│       ├── unit/                   # mocha, no vscode
│       │   ├── parsers.test.ts
│       │   ├── uri.test.ts
│       │   └── result.test.ts
│       └── suite/                  # @vscode/test-electron, black-box only
│           ├── activation.test.ts
│           ├── compareTwoCommits.test.ts
│           ├── compareFileWithCommit.test.ts
│           └── contentProvider.test.ts
└── test-fixtures/
    └── repo-seed/                  # script-built throwaway git repo for E2E
```

## Core modules

- **`git/GitRunner.ts`** — `run(args: readonly string[], cwd: string): Promise<Result<string, GitError>>`. Spawns `git`, captures stdout/stderr, never throws. Logs entry/exit at `debug`.
- **`git/GitRepo.ts`** — Domain wrapper. Methods:
  - `log({ limit, ref? }): Promise<Result<readonly Commit[], GitError>>` → `git log --format=%H%x00%h%x00%an%x00%at%x00%s -z`
  - `nameStatus({ from, to }): Promise<Result<readonly ChangedFile[], GitError>>` → `git diff --name-status -z`
  - `numstat({ from, to }): Promise<Result<readonly DiffStat[], GitError>>` → `git diff --numstat -z`
  - `show({ rev, path }): Promise<Result<string, GitError>>` → `git show <rev>:<path>`
  - `refs(): Promise<Result<readonly Ref[], GitError>>` → `git for-each-ref --format='%(refname:short)%00%(objectname)%00%(objecttype)'`
  - `revParse(name): Promise<Result<Sha, GitError>>`
- **`providers/DiffyContentProvider.ts`** — `TextDocumentContentProvider` for scheme `diffy`. URI shapes:
  - `diffy://commit/<sha>/<relpath>` → `git show <sha>:<path>`
  - `diffy://index/<relpath>` → `git show :<path>` (fallback when built-in git ext's `toGitUri` is unavailable)
  Returns empty string for deleted files. Pure dispatch — URI parse + GitRepo call.
- **`ui/CommitPicker.ts`** / **`RefPicker.ts`** / **`SideBPicker.ts`** / **`FilePicker.ts`** — `vscode.window.createQuickPick<T>()` wrappers returning `Result<T, Cancelled>`. SideB prepends synthetic items: `WORKING_COPY`, `INDEX`, `BRANCH_OR_TAG…` (last opens RefPicker). FilePicker stays open after selection so multiple files can be diffed in sequence from one comparison.
- **`ui/uri.ts`** — `buildDiffyUri(rev, path): Uri`, `parseDiffyUri(uri): Result<{rev, path}, ParseError>`. Pure, unit-tested. Handles spaces/unicode/`#`/`?` via proper URI encoding.
- **Types**
  - `RevSpec = { kind: 'commit', sha: string } | { kind: 'workingCopy' } | { kind: 'index' }` — refs resolve to `commit` before reaching anything downstream.
  - `uriFor(rev, absPath, relPath)`:
    - `commit` → `diffy://commit/<sha>/<relpath>`
    - `workingCopy` → `Uri.file(absPath)`
    - `index` → built-in git extension's `toGitUri(fileUri, '~')` if available, else `diffy://index/<relpath>`

## `package.json` contributions

```jsonc
{
  "activationEvents": ["onStartupFinished"],
  "extensionDependencies": ["vscode.git"],
  "contributes": {
    "commands": [
      { "command": "diffy.compareWith",              "title": "Diffy: Compare with…" },
      { "command": "diffy.compareWithWorkingCopy",   "title": "Diffy: Compare with Working Copy" },
      { "command": "diffy.compareWithPrevious",      "title": "Diffy: Compare with Previous" },
      { "command": "diffy.compareTwoCommits",        "title": "Diffy: Compare Two Commits" },
      { "command": "diffy.compareFileWithCommit",    "title": "Diffy: Compare with Commit…" },
      { "command": "diffy.reopenLast",               "title": "Diffy: Reopen Last Comparison" }
    ],
    "menus": {
      "scm/history/item/context": [
        { "command": "diffy.compareWith",            "when": "scmProvider == git", "group": "diffy@1" },
        { "command": "diffy.compareWithWorkingCopy", "when": "scmProvider == git", "group": "diffy@2" },
        { "command": "diffy.compareWithPrevious",    "when": "scmProvider == git", "group": "diffy@3" }
      ],
      "scm/resourceState/context": [
        { "command": "diffy.compareFileWithCommit",  "when": "scmProvider == git", "group": "diffy@1" }
      ],
      "editor/title/context": [
        { "command": "diffy.compareFileWithCommit",  "when": "resourceScheme == file", "group": "3_compare" }
      ],
      "explorer/context": [
        { "command": "diffy.compareFileWithCommit",  "when": "resourceScheme == file && !explorerResourceIsFolder", "group": "3_compare" }
      ],
      "commandPalette": [
        { "command": "diffy.compareWith",            "when": "false" },
        { "command": "diffy.compareWithWorkingCopy", "when": "false" },
        { "command": "diffy.compareWithPrevious",    "when": "false" }
      ]
    }
  }
}
```

The three SCM-history commands receive the commit object as an argument from VSCode; the file/SCM-resource commands receive a `Uri`/`SourceControlResourceState`. Palette-only commands (`compareTwoCommits`, `compareFileWithCommit`, `reopenLast`) take no arguments and prompt for everything.

## Execution flows

**SCM history: "Compare with…"** (entry point passes the commit)
```
diffy.compareWith(historyItem)
  → revA = { kind:'commit', sha: historyItem.id }
  → SideBPicker → revB
  → GitRepo.nameStatus({ from: revA, to: revB }) + numstat
  → FilePicker(files, stats) — stays open
    → on pick: vscode.diff(uriFor(revA, path), uriFor(revB, path), title)
  → state.saveLast({ revA, revB })
```

**SCM history: "Compare with Working Copy"** — same flow, `revB = { kind:'workingCopy' }`, no SideBPicker.

**SCM history: "Compare with Previous"** — `revB = { kind:'commit', sha: <historyItem.id>^1 }`, no SideBPicker.

**Palette: "Compare Two Commits"**
```
diffy.compareTwoCommits
  → resolve repo via vscode.git API (auto if single)
  → GitRepo.log({ limit:200 }) → CommitPicker → revA
  → SideBPicker → revB
  → FilePicker → diff (same loop as above)
```

**Editor/Explorer/SCM-resource: "Compare with Commit…"**
```
diffy.compareFileWithCommit(uri)
  → GitRepo.log → CommitPicker → rev
  → leftUri  = buildDiffyUri({ kind:'commit', sha:rev }, relPath)
  → rightUri = uri  (file://)
  → vscode.diff(leftUri, rightUri, `${shortSha} ↔ Working Copy — ${basename}`)
```

## Out of scope for v1

Custom diff renderer; activity-bar icon; sidebar / tree view; webviews; blame; merge conflict UI; three-way diff; stash diffing; GitHub/GitLab PR integration; remote-fetch on demand; submodule support; LFS-aware preview; per-hunk staging; binary file preview.

## Testing strategy

**Unit (`src/test/unit/`, mocha, no VSCode):**
- `parsers.test.ts` — NUL-delimited log; name-status `A/M/D/R/C` with similarity scores; numstat with binary `-`/`-` markers; empty input; malformed → `Err`
- `uri.test.ts` — round-trip `build → parse`; paths with spaces, unicode, `#`, `?`; reject malformed
- `result.test.ts` — combinators if added

**E2E (`src/test/suite/`, `@vscode/test-electron`, black-box only):**
- `activation.test.ts` — extension activates; all commands registered (`vscode.commands.getCommands(true)`)
- `compareTwoCommits.test.ts` — invoke palette command against fixture repo; assert FilePicker opens with expected file list; selecting a file opens a `TabInputTextDiff` tab (poll `vscode.window.tabGroups.all`)
- `compareFileWithCommit.test.ts` — open a fixture file, invoke command, assert diff tab opens with expected `diffy://` left URI
- `contentProvider.test.ts` — `workspace.openTextDocument(Uri.parse('diffy://commit/<sha>/file.txt'))` returns the historical content from the seed repo

Coverage starts at 80% in `coverage-thresholds.json`; ratchet-only.

## IntelliJ portability (noted, not pursued)

`src/git/` (Runner, Repo, parsers, types) and `src/ui/uri.ts` are pure subprocess + string parsing — directly portable to Kotlin against `Git4Idea`. `RevSpec` / `ChangedFile` shapes port verbatim. Everything else is VSCode-API-specific (`vscode.diff` → `DiffManager.showDiff`; `TextDocumentContentProvider` → `VirtualFile`/`FileEditorProvider`; QuickPick → `JBPopupFactory`). Not worth pre-factoring; revisit on user demand.

## Critical files to create

- [src/extension.ts](../../Documents/Code/Diffy/src/extension.ts)
- [src/constants.ts](../../Documents/Code/Diffy/src/constants.ts)
- [src/git/GitRunner.ts](../../Documents/Code/Diffy/src/git/GitRunner.ts)
- [src/git/GitRepo.ts](../../Documents/Code/Diffy/src/git/GitRepo.ts)
- [src/git/parsers.ts](../../Documents/Code/Diffy/src/git/parsers.ts)
- [src/providers/DiffyContentProvider.ts](../../Documents/Code/Diffy/src/providers/DiffyContentProvider.ts)
- [src/ui/CommitPicker.ts](../../Documents/Code/Diffy/src/ui/CommitPicker.ts)
- [src/ui/SideBPicker.ts](../../Documents/Code/Diffy/src/ui/SideBPicker.ts)
- [src/ui/RefPicker.ts](../../Documents/Code/Diffy/src/ui/RefPicker.ts)
- [src/ui/FilePicker.ts](../../Documents/Code/Diffy/src/ui/FilePicker.ts)
- [src/ui/uri.ts](../../Documents/Code/Diffy/src/ui/uri.ts)
- [src/commands/compareWith.ts](../../Documents/Code/Diffy/src/commands/compareWith.ts)
- [src/commands/compareWithWorkingCopy.ts](../../Documents/Code/Diffy/src/commands/compareWithWorkingCopy.ts)
- [src/commands/compareWithPrevious.ts](../../Documents/Code/Diffy/src/commands/compareWithPrevious.ts)
- [src/commands/compareTwoCommits.ts](../../Documents/Code/Diffy/src/commands/compareTwoCommits.ts)
- [src/commands/compareFileWithCommit.ts](../../Documents/Code/Diffy/src/commands/compareFileWithCommit.ts)
- [package.json](../../Documents/Code/Diffy/package.json)
- [Makefile](../../Documents/Code/Diffy/Makefile)
- [CLAUDE.md](../../Documents/Code/Diffy/CLAUDE.md)

## Verification

1. **Scaffold**: `make setup && make build` succeeds; `make lint` and `make fmt CHECK=1` clean.
2. **Tests**: `make test` runs unit + E2E suites against the seed repo; thresholds enforced from `coverage-thresholds.json`.
3. **Manual smoke** in an Extension Development Host on a real repo:
   - Open Source Control → Graph/History → right-click a commit → **Compare with…** → pick another commit → FilePicker lists changed files → click one → diff tab opens with both historical revisions
   - Same commit → right-click → **Compare with Working Copy** → FilePicker → click a file → diff shows commit-vs-live (edits in the editor reflect in the right pane)
   - Same commit → right-click → **Compare with Previous** → diff opens immediately against `^1`
   - Pick **Branch/Tag** in SideBPicker → ref resolves to a SHA → behaves as commit-vs-commit
   - Source Control Changes view → right-click a modified file → **Compare with Commit…** → pick a commit → diff opens
   - Right-click a file in Explorer / editor title → **Compare with Commit…** → same as above
   - Palette → **Diffy: Compare Two Commits** → end-to-end without context menu
   - Palette → **Diffy: Reopen Last Comparison** → reproduces previous FilePicker
4. **Package**: `make package` produces a loadable `.vsix`; install in clean VSCode and rerun the manual smoke.
