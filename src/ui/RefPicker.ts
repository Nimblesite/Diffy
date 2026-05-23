import type * as vscode from 'vscode';
import { type Result, map } from '../result';
import type { Ref, RefType } from '../git/types';
import { showSinglePick } from './runQuickPick';
import type { Cancelled } from './cancelled';
import { refTypeLabel } from './format/refLabel';

interface RefPickItem extends vscode.QuickPickItem {
  readonly ref: Ref;
}

const toItem = (ref: Ref): RefPickItem => ({
  label: ref.name,
  description: ref.sha.slice(0, 7),
  detail: refTypeLabel(ref),
  ref,
});

export const filterRefs = (
  refs: readonly Ref[],
  filter?: RefType,
): readonly Ref[] =>
  filter === undefined ? refs : refs.filter((r) => r.type === filter);

export const pickRef = async ({
  refs,
  placeholder,
  filter,
}: {
  refs: readonly Ref[];
  placeholder?: string;
  filter?: RefType;
}): Promise<Result<Ref, Cancelled>> => {
  const items = filterRefs(refs, filter).map(toItem);
  const r = await showSinglePick<RefPickItem>({
    items,
    placeholder: placeholder ?? 'Pick a branch or tag',
    matchOnDescription: true,
    matchOnDetail: true,
  });
  return map(r, (item) => item.ref);
};
