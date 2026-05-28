import { strict as assert } from "node:assert";
import { REV_KINDS, URI_PARSE_ERROR_KINDS } from "../../constants";
import { buildDifflyUri, parseDifflyUri } from "../../ui/uri";
import { expectErr, expectOk } from "../../result";
import type { DifflyAddressableRev } from "../../git/types";

const SHA = "abc1234def567890fedcba0987654321aaaaaaaa";

const commit = (sha: string): DifflyAddressableRev => ({
  kind: REV_KINDS.commit,
  sha,
});
const index = (): DifflyAddressableRev => ({ kind: REV_KINDS.index });

const roundTrip = (rev: DifflyAddressableRev, path: string): void => {
  const uri = buildDifflyUri(rev, path);
  const parsed = parseDifflyUri(uri);
  expectOk(parsed);
  assert.deepEqual(parsed.value.rev, rev);
  assert.equal(parsed.value.path, path);
};

describe("buildDifflyUri", () => {
  it("builds a commit URI with sha and path", () => {
    const uri = buildDifflyUri(commit(SHA), "src/file.ts");
    assert.equal(uri, `diffly://commit/${SHA}/src/file.ts`);
  });

  it("builds an index URI without sha", () => {
    const uri = buildDifflyUri(index(), "src/file.ts");
    assert.equal(uri, "diffly://index/src/file.ts");
  });

  it("percent-encodes spaces in path segments", () => {
    const uri = buildDifflyUri(commit(SHA), "a folder/b file.ts");
    assert.equal(uri, `diffly://commit/${SHA}/a%20folder/b%20file.ts`);
  });

  it("percent-encodes ? and # so they are not parsed as query/fragment", () => {
    const uri = buildDifflyUri(commit(SHA), "weird?name#here.ts");
    assert.equal(uri, `diffly://commit/${SHA}/weird%3Fname%23here.ts`);
  });

  it("preserves forward slashes as segment separators", () => {
    const uri = buildDifflyUri(commit(SHA), "a/b/c/d.ts");
    assert.equal(uri, `diffly://commit/${SHA}/a/b/c/d.ts`);
  });

  it("encodes unicode characters in path segments", () => {
    const uri = buildDifflyUri(commit(SHA), "src/日本語.ts");
    const encoded = encodeURIComponent("日本語");
    assert.equal(uri, `diffly://commit/${SHA}/src/${encoded}.ts`);
  });
});

describe("parseDifflyUri", () => {
  it("parses a commit URI and decodes the path", () => {
    const r = parseDifflyUri(`diffly://commit/${SHA}/src/file.ts`);
    expectOk(r);
    assert.deepEqual(r.value.rev, { kind: REV_KINDS.commit, sha: SHA });
    assert.equal(r.value.path, "src/file.ts");
  });

  it("parses an index URI and decodes the path", () => {
    const r = parseDifflyUri("diffly://index/src/file.ts");
    expectOk(r);
    assert.deepEqual(r.value.rev, { kind: REV_KINDS.index });
    assert.equal(r.value.path, "src/file.ts");
  });

  it("rejects a non-diffly scheme", () => {
    const r = parseDifflyUri("file:///some/path.ts");
    expectErr(r);
    assert.equal(r.error.kind, URI_PARSE_ERROR_KINDS.invalidScheme);
  });

  it("rejects an unknown authority", () => {
    const r = parseDifflyUri(`diffly://stash/${SHA}/x.ts`);
    expectErr(r);
    assert.equal(r.error.kind, URI_PARSE_ERROR_KINDS.invalidAuthority);
  });

  it("rejects a commit URI with no path after the sha", () => {
    const r = parseDifflyUri(`diffly://commit/${SHA}/`);
    expectErr(r);
    assert.equal(r.error.kind, URI_PARSE_ERROR_KINDS.emptyPath);
  });

  it("rejects a commit URI with no sha", () => {
    const r = parseDifflyUri("diffly://commit//file.ts");
    expectErr(r);
    assert.equal(r.error.kind, URI_PARSE_ERROR_KINDS.missingSha);
  });

  it("rejects an index URI with no path", () => {
    const r = parseDifflyUri("diffly://index/");
    expectErr(r);
    assert.equal(r.error.kind, URI_PARSE_ERROR_KINDS.emptyPath);
  });

  it("rejects a malformed URI with no scheme separator", () => {
    const r = parseDifflyUri("not-a-uri");
    expectErr(r);
    assert.equal(r.error.kind, URI_PARSE_ERROR_KINDS.malformed);
  });

  it("rejects a URI missing the authority/path slash", () => {
    const r = parseDifflyUri("diffly://commit");
    expectErr(r);
    assert.equal(r.error.kind, URI_PARSE_ERROR_KINDS.malformed);
  });

  it("rejects a URI with malformed percent encoding", () => {
    const r = parseDifflyUri(`diffly://commit/${SHA}/bad%ZZpath.ts`);
    expectErr(r);
    assert.equal(r.error.kind, URI_PARSE_ERROR_KINDS.badEncoding);
  });

  it("rejects an index URI with malformed percent encoding", () => {
    const r = parseDifflyUri("diffly://index/bad%ZZpath.ts");
    expectErr(r);
    assert.equal(r.error.kind, URI_PARSE_ERROR_KINDS.badEncoding);
  });
});

describe("buildDifflyUri ↔ parseDifflyUri round-trip", () => {
  it("round-trips a simple commit URI", () => {
    roundTrip(commit(SHA), "src/file.ts");
  });

  it("round-trips a simple index URI", () => {
    roundTrip(index(), "src/file.ts");
  });

  it("round-trips paths with spaces", () => {
    roundTrip(commit(SHA), "a folder/b file.ts");
    roundTrip(index(), "a folder/b file.ts");
  });

  it("round-trips paths with unicode", () => {
    roundTrip(commit(SHA), "src/日本語/файл.ts");
    roundTrip(index(), "src/日本語/файл.ts");
  });

  it("round-trips paths containing # and ?", () => {
    roundTrip(commit(SHA), "weird?name#here.ts");
    roundTrip(index(), "q=1&r=2#frag.ts");
  });

  it("round-trips paths with quotes and brackets", () => {
    roundTrip(commit(SHA), 'a "b" [c] (d).ts');
  });

  it("round-trips deeply nested paths", () => {
    roundTrip(commit(SHA), "a/b/c/d/e/f/g/h/i/j.ts");
  });
});
