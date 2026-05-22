export type Sha = string;

export type ChangedFileStatus = 'A' | 'M' | 'D' | 'R' | 'C';

export interface ChangedFile {
  readonly status: ChangedFileStatus;
  readonly path: string;
  readonly oldPath?: string;
  readonly similarity?: number;
}

export interface Commit {
  readonly sha: Sha;
  readonly shortSha: string;
  readonly author: string;
  readonly authorTime: number;
  readonly subject: string;
}

export interface DiffStat {
  readonly path: string;
  readonly oldPath?: string;
  readonly added: number;
  readonly deleted: number;
  readonly binary: boolean;
}

export type CommitRev = { readonly kind: 'commit'; readonly sha: Sha };
export type WorkingCopyRev = { readonly kind: 'workingCopy' };
export type IndexRev = { readonly kind: 'index' };

export type RevSpec = CommitRev | WorkingCopyRev | IndexRev;

export type DiffyAddressableRev = CommitRev | IndexRev;

export type RefType = 'branch' | 'tag' | 'other';

export interface Ref {
  readonly name: string;
  readonly fullName: string;
  readonly sha: Sha;
  readonly type: RefType;
}

export type GitErrorKind =
  | 'spawnFailed'
  | 'nonZeroExit'
  | 'parseError'
  | 'notARepo'
  | 'notFound';

export interface GitError {
  readonly kind: GitErrorKind;
  readonly message: string;
  readonly stderr?: string;
  readonly exitCode?: number;
}
