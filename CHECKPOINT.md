# Checkpoint — 2026-05-31 05:15
_Mode: full | Skill version: 1.0_

## Done this session
- **Cursor emoji-morph + wander feature committed** — commit `927e54b`
  (19 files, +870/−90), pushed to `origin/feat/cursor-emoji-morph-wander`,
  **PR #3** opened: https://github.com/Borkd-AU/borkd-landing/pull/3.
  (Folds in the prior uncommitted branch work — CursorDog MORPHED state +
  wander state machine — plus this session's additions below.)
- **11 hover-emoji words across all 4 routes** (`borkd-emoji-word` +
  `data-emoji` contract): home (🐕 more friends than you do, 🗺️ everywhere
  worth ending up), /about (🏖️ beach, ✨ genuinely, 📍 Good places found),
  /for-venues (🥣 water bowls, 🐾 real dog owners, 📍 Good places found),
  /contact (👋 Say hi, ✉️ a line, 🦘 Sydney).
- **Emoji pinned ABOVE the hovered word** (`morphEmojiY` in
  `CursorDog/index.tsx` + `MORPH_EMOJI_GAP_PX=10` in `constants.ts`): emoji
  bottom sits a fixed 10px above the word's top edge, so the word stays
  readable for any word height and any cursor position within it; x still
  follows the cursor. No top clamp (not covering the word is the hard
  requirement; partly-offscreen glyph is the acceptable trade).
- **Removed `scale(1.04)` + `will-change: transform`** from
  `.borkd-emoji-word` in `app/globals.css` — they made the italic word
  blurry/faint (non-integer scale rasterizes glyphs; permanent
  will-change promotes to a compositor layer that loses sub-pixel AA). Now
  a crisp instant serif-italic swap, no transform.
- **contact `h1` aria-label fix** (`app/contact/page.tsx`): explicit `{" "}`
  before `<br/>` so SplitText's textContent-derived aria-label reads
  "Drop us a line." not "Drop usa line.".
- **Removed dead `emoji` fields from StepsSection `steps[]`** — `StepCard`
  never consumed them (inert).
- **DESIGN-RULES.md #4 updated** (in `927e54b`): documents the cursor-hover
  morph as the single allowed emoji exception. `wanderPhases.test.ts` added
  to the `npm test` script.
- **Codex 3-stage cross-validation: APPROVED, 45/50** (thread `f1ee83ee`).
  It caught a tall-word clearance bug (fixed-em offset failed on the 88px
  contact h1) and a self-contradicting top-clamp mid-review; both fixed.

## In progress
- 없음. Feature는 commit + push + PR 완료. Working tree는 CHECKPOINT.md
  (이 파일)와 untracked 환경 파일만 남음.

## Next
1. **PR #3 실기기 시각 검증 + 머지** — 실제 데스크탑 브라우저(마우스 =
   `pointer: fine`)에서 /about "beach", /for-venues "real dog owners",
   /contact "a line" 등에 호버해서 (a) 이모지가 단어 **위**에 뜨고 단어가
   안 가려지는지, (b) 이탤릭 전환이 **선명**한지(흐릿함 사라졌는지) 확인.
   자동화로는 확인 불가(아래 Blockers). 문제 없으면 PR #3 머지.
2. **`.claude/` + `.mcp.json` 커밋 여부 결정** — 이번 feature 커밋에서
   의도적으로 제외함(프로젝트 툴링 설정, 별개 관심사). 트래킹할지 사용자 결정.

## Blockers / open questions
- **호버 모핑 라이브 시각 확인 불가 (자동화 한정)** — claude-in-chrome /
  chrome-devtools 자동화 브라우저가 `pointer: coarse`로 보고돼서 CursorDog
  컨트롤러가 (정상적으로) 자기 자신을 비활성화함 → `[data-cursor-dog]`이
  mount 안 됨. 그래서 모핑/호버를 자동화로 못 봄. 대신 DOM geometry로
  검증함(모든 단어 갭 정확히 10px, covers_word=false). 실제 데스크탑에서만
  확인 가능.

## Abandoned / dead ends
- **고정 em 오프셋으로 이모지 띄우기** (`marginTop: -1.35em`) — 작은 본문
  단어는 가렸지만 키 큰 단어(contact h1 `clamp(40px,8vw,88px)`)는 커서가
  단어 아래쪽일 때 여전히 덮음. Codex가 LOOP. `morphEmojiY` (단어 top 기준)
  로 대체.
- **`Math.max(4, ...)` 화면밖 방지 clamp** — 화면 맨 위 단어에서 오히려
  이모지를 단어 위로 도로 밀어 덮는 모순. Codex 지적으로 제거. 실제로 이
  사이트엔 화면 top 근처 단어가 없어 발동도 안 하던 dead code였음.
- **Step 카드에 이모지** (📝/❤️/💪) — 사용자가 "Step 카드는 빼기" 선택.
  본문 카드에 큰 이모지가 과하다고 판단. 데이터 필드 제거함.

## Runtime state
- **Branch:** `feat/cursor-emoji-morph-wander` (origin과 sync, 0 ahead/behind)
- **HEAD:** `927e54b`
- **Working tree:** CHECKPOINT.md(이 파일)만 modified, `.claude/` +
  `.mcp.json` untracked (의도적 미커밋 — 환경/툴링 설정)
- **PR:** #3 open against `main` — https://github.com/Borkd-AU/borkd-landing/pull/3
- **Dev server:** 실행 중 (next-server v16.2.4, PID 14661, :3000). 작업
  중 globals.css 변경 후 recompile 확인됨. 다음 세션은 이미 떠있다고 가정
  하거나 재시작.
- **Migrations:** 없음 (코드만 수정)
- **Env vars:** 변경 없음
- **Vercel:** 이번 세션 deploy 안 함 (PR 머지 시 배포 예정)

## Mental model notes
- 호버 이모지의 핵심 제약: 이모지(64px)가 본문 텍스트(16px)보다 훨씬 커서,
  "커서 중앙"에 두면 단어를 덮음. 해법은 **커서 y가 아니라 단어 box의 top
  기준**으로 세로 위치를 잡는 것 (`morphEmojiY = wordTop - GAP - SIZE`).
  커서는 x만 따라감. 이래야 단어 높이·커서 위치 무관하게 단어가 안 가려짐.
- 이탤릭 단어 "흐릿함"의 두 원인: (1) 비정수 `scale()`은 글자를 비트맵화 후
  확대 → 가장자리 흐림, (2) `will-change: transform`은 텍스트를 GPU 레이어로
  올려 sub-pixel AA 상실 → 평소에도 가늘고 흐림. UI 텍스트엔 둘 다 피할 것.
- 자동화 브라우저(headless/CDP)는 `pointer: coarse`로 인식되므로
  `pointer: fine` gate가 걸린 인터랙션(CursorDog 등)은 자동화로 시각 확인
  불가. geometry 계산이나 실기기로 검증해야 함.

---

## Resume prompt

Paste into a fresh Claude Code session:

> Please read MEMORY.md, CHECKPOINT.md, and any other relevant .md files
> to get up to speed. Give me a brief summary of where we left off and
> what's next before we do anything. Specifically, pick up from: PR #3
> (feat/cursor-emoji-morph-wander) 실기기 시각 검증 + 머지 — 실제 데스크탑
> 브라우저에서 호버 시 이모지가 단어 위에 뜨고 안 가려지는지 + 이탤릭
> 전환이 선명한지 확인하고, 문제 없으면 PR #3 머지.
