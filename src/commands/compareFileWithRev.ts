import * as vscode from 'vscode';
import type { GitRepo } from '../git/GitRepo';
import type { RefType, Sha } from '../git/types';
import type { Result } from '../result';
import { err, ok } from '../result';
import { CANCELLED, type Cancelled } from '../ui/cancelled';
import { pickCommit } from '../ui/CommitPicker';
import { findRepoForUri } from '../vscodeGitApi';
import {
  type CommandDeps,
  buildRepo,
  openDiff,
} from './shared';
import { pickRefAsSha, reportGitError, sideAFromSha } from './flow';

export type FileRevSource = 'commits' | RefType;

const NO_EDITOR = 'Diffy: open a file first.';
const NOT_IN_REPO = 'Diffy: file is not in a git repository.';

const pickShaForFile = async ({
  repo,
  source,
  output,
}: {
  repo: GitRepo;
  source: FileRevSource;
  output: vscode.OutputChannel;
}): Promise<Result<Sha, Cancelled>> => {
  if (source === 'commits') {
    const log = await repo.log({});
    if (!log.ok) {
      reportGitError({ output, op: 'log', e: log.error });
      return err(CANCELLED);
    }
    const picked = await pickCommit({ commits: log.value });
    if (!picked.ok) {
      return err(CANCELLED);
    }
    return ok(picked.value.sha);
  }
  return pickRefAsSha({ repo, output, filter: source });
};

const resolveTargetUri = (uri?: vscode.Uri): vscode.Uri | undefined =>
  uri ?? vscode.window.activeTextEditor?.document.uri;

const handler = async ({
  deps,
  uri,
  source,
}: {
  deps: CommandDeps;
  uri: vscode.Uri | undefined;
  source: FileRevSource;
}): Promise<void> => {
  const target = resolveTargetUri(uri);
  if (target === undefined) {
    void vscode.window.showWarningMessage(NO_EDITOR);
    return;
  }
  const vsRepo = findRepoForUri(deps.gitApi, target);
  if (vsRepo === undefined) {
    void vscode.window.showWarningMessage(NOT_IN_REPO);
    return;
  }
  const repo = buildRepo(deps.runner, vsRepo);
  const sha = await pickShaForFile({ repo, source, output: deps.output });
  if (!sha.ok) {
    return;
  }
  await openDiff({
    revA: sideAFromSha(sha.value),
    revB: { kind: 'workingCopy' },
    repoRoot: vsRepo.rootUri.fsPath,
    relPath: vscode.workspace.asRelativePath(target, false),
  });
};

export const makeCompareFileWithRev = ({
  deps,
  source,
}: {
  deps: CommandDeps;
  source: FileRevSource;
}) =>
  async (uri?: vscode.Uri): Promise<void> => handler({ deps, uri, source });
