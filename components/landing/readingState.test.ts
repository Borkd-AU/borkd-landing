import { test } from "node:test";
import assert from "node:assert/strict";
import { getActiveIdx, shouldShowToc, type ReadingGeometry } from "./readingState.ts";

// Codex Stage 2 fixture — five h2s with a short tail section. The bug
// the tests pin down: at scrollY=scrollMax, the final heading (offset
// 4050) is 550px below the probe line (viewportH * 0.45 = 450px), so a
// pure probe scan parks active on heading 3. Terminal snap fixes it.
const tailFixture: ReadingGeometry = {
  headings: [
    { offset: 100 },
    { offset: 1000 },
    { offset: 2000 },
    { offset: 3000 },
    { offset: 4050 },
  ],
  articleBottomOffset: 4150,
  scrollY: 3500,
  scrollMax: 3500,
  viewportH: 1000,
};

test("getActiveIdx snaps to last heading at scrollMax", () => {
  // The whole reason this module exists.
  assert.equal(getActiveIdx(tailFixture), 4);
});

test("getActiveIdx returns 0 at page top", () => {
  assert.equal(
    getActiveIdx({ ...tailFixture, scrollY: 0, scrollMax: 3500 }),
    0,
  );
});

test("getActiveIdx tracks middle headings via the 45% probe", () => {
  // scrollY=550 -> probeFromTop=450 -> heading at offset 1000 is at
  // viewport-top 450, exactly on the probe line. Returns index 1.
  assert.equal(
    getActiveIdx({ ...tailFixture, scrollY: 550 }),
    1,
  );
  // scrollY=1550 -> heading at offset 2000 is at viewport-top 450.
  assert.equal(
    getActiveIdx({ ...tailFixture, scrollY: 1550 }),
    2,
  );
});

test("getActiveIdx terminal snap survives sub-pixel rounding", () => {
  // smoother.scrollTop() can return e.g. 3499.7 at the actual bottom.
  assert.equal(
    getActiveIdx({ ...tailFixture, scrollY: 3499.7 }),
    4,
  );
});

test("getActiveIdx returns -1 for empty headings list", () => {
  assert.equal(
    getActiveIdx({ ...tailFixture, headings: [] }),
    -1,
  );
});

test("shouldShowToc hides only after article bottom passes viewport mid", () => {
  // Article bottom at offset 4150, scrollY=3500, viewportH=1000.
  // articleBottomFromTop = 650, viewportH * 0.5 = 500 -> still visible.
  assert.equal(shouldShowToc(tailFixture), true);
  // Push scrollY further so articleBottomFromTop < 500 -> hide.
  assert.equal(
    shouldShowToc({ ...tailFixture, scrollY: 3700 }),
    false,
  );
});

test("shouldShowToc is independent of getActiveIdx", () => {
  // Visibility decision must not consult heading offsets at all. This
  // test pins it by mutating headings to absurd values; visibility
  // result must be unchanged.
  const a = shouldShowToc(tailFixture);
  const b = shouldShowToc({
    ...tailFixture,
    headings: [{ offset: -9999 }, { offset: 99999 }],
  });
  assert.equal(a, b);
});

test("invariant: every heading has a reachable scrollY where it is active", () => {
  // Sweep scroll positions every 50px and prove every heading wins at
  // some point. This is the invariant from the module doc comment.
  const seen = new Set<number>();
  for (let scrollY = 0; scrollY <= tailFixture.scrollMax; scrollY += 50) {
    seen.add(getActiveIdx({ ...tailFixture, scrollY }));
  }
  for (let i = 0; i < tailFixture.headings.length; i++) {
    assert.ok(seen.has(i), `heading ${i} never became active during sweep`);
  }
});

// Realistic short-tail page: /privacy/terms shape. Final 3 sections are
// short one-paragraph blocks ("Governing law", "Contact",
// "Borkd, Sydney, Australia") clustered into the last screen-and-a-bit.
// articleBottom must sit far enough below the last heading that every
// heading offset is reachable within [0, scrollMax]; otherwise the
// invariant is mathematically unsolvable — the heading offset literally
// cannot be reached by any scroll position. Here last heading is at
// 3300 and articleBottom is 4400, so scrollMax=3400 > last heading
// offset.
const realisticTail: ReadingGeometry = {
  headings: [
    { offset: 100 },
    { offset: 700 },
    { offset: 1400 },
    { offset: 2100 },
    { offset: 2700 },
    { offset: 2900 }, // tail starts: 200px from prior
    { offset: 3100 }, // tail: 200px from prior
    { offset: 3300 }, // tail: 200px from prior — reachable at scrollY 3300
  ],
  articleBottomOffset: 4400,
  scrollY: 0,
  scrollMax: 3400, // articleBottomOffset - viewportH
  viewportH: 1000,
};

test("invariant holds on realistic short-tail page", () => {
  const seen = new Set<number>();
  for (let scrollY = 0; scrollY <= realisticTail.scrollMax; scrollY += 25) {
    seen.add(getActiveIdx({ ...realisticTail, scrollY }));
  }
  // Force the terminal scrollY too.
  seen.add(getActiveIdx({ ...realisticTail, scrollY: realisticTail.scrollMax }));
  for (let i = 0; i < realisticTail.headings.length; i++) {
    assert.ok(
      seen.has(i),
      `heading ${i} unreachable — terminal snap or tail fallback regression?`,
    );
  }
});

test("terminal snap fires at scroll max for the realistic tail", () => {
  // The whole reason for the rule split. Without terminal snap, last
  // heading (offset 3300 at viewport-top 0 at scrollY=scrollMax 3400 —
  // actually -100, above viewport top) the probe scan would pick it
  // up directly anyway here. The terminal snap is the belt-and-braces
  // for cases where the last heading is below the probe at scroll max.
  assert.equal(
    getActiveIdx({ ...realisticTail, scrollY: realisticTail.scrollMax }),
    realisticTail.headings.length - 1,
  );
});

test("tail-region merge picks the later of probe and passed-by-top", () => {
  // At scrollY=2900 (tail), the probe scan claims heading 7 (3300 −
  // 2900 = 400 < 450 probe). Passed-by-top claims heading 5. The
  // merge takes the later — heading 7 — which is the visually
  // correct choice (heading 7 sits at viewport-top 400, exactly at
  // the reading-attention probe line).
  assert.equal(
    getActiveIdx({ ...realisticTail, scrollY: 2900 }),
    7,
  );
  // At scrollY=2700 (still tail: 3400−2700=700<1000), the probe
  // catches heading 5 (2900−2700=200<450), heading 6 (3100−2700=400
  // <450), heading 7 (3300−2700=600>450 → no). Probe picks the
  // latest, heading 6. Passed-by-top picks heading 4 (2700≤2700).
  // Merge → 6.
  assert.equal(
    getActiveIdx({ ...realisticTail, scrollY: 2700 }),
    6,
  );
});

test("active idx is monotone non-decreasing while scrolling down", () => {
  // The body→tail boundary is at scrollY = scrollMax - viewportH. The
  // pre-merge implementation jumped active backward at that boundary
  // because probe scan and passed-by-top disagreed by one or more
  // headings (Codex Round 1 Stage 3 finding). Merge rule pins this.
  let prev = -1;
  for (let scrollY = 0; scrollY <= realisticTail.scrollMax; scrollY += 1) {
    const idx = getActiveIdx({ ...realisticTail, scrollY });
    assert.ok(
      idx >= prev,
      `active idx regressed at scrollY=${scrollY}: ${prev} -> ${idx}`,
    );
    prev = idx;
  }
});

test("body→tail boundary is continuous", () => {
  const boundary = realisticTail.scrollMax - realisticTail.viewportH;
  const before = getActiveIdx({ ...realisticTail, scrollY: boundary });
  const after = getActiveIdx({ ...realisticTail, scrollY: boundary + 1 });
  assert.ok(
    after >= before,
    `boundary discontinuity: ${before} (body) -> ${after} (tail)`,
  );
});

test("combined invariant: every heading is active AND visible at some scrollY", () => {
  // The module-level invariant: every TOC entry must have a reachable
  // scrollY where it is BOTH the active entry AND the TOC is visible.
  // Codex Stage 3 added this — the loop must guarantee user-observable
  // coverage, not just internal state changes.
  for (let i = 0; i < realisticTail.headings.length; i++) {
    let covered = false;
    for (let scrollY = 0; scrollY <= realisticTail.scrollMax; scrollY += 25) {
      const g = { ...realisticTail, scrollY };
      if (getActiveIdx(g) === i && shouldShowToc(g)) {
        covered = true;
        break;
      }
    }
    assert.ok(
      covered,
      `heading ${i} never active-and-visible — TOC chrome hides it from the user`,
    );
  }
});
