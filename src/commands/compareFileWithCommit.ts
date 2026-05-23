import type { CommandDeps } from './shared';
import { makeCompareFileWithRev } from './compareFileWithRev';

export const makeCompareFileWithCommit = (deps: CommandDeps) =>
  makeCompareFileWithRev({ deps, source: 'commits' });
