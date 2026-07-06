# Plan 016: Remove dead public assets and untrack committed `.DS_Store` junk

> **Executor instructions**: Follow step by step. The reference-check in Step 1 is
> mandatory before any deletion (some assets are referenced via *constructed* paths, not
> literal basenames). STOP conditions halt you. Update `plans/README.md` when done.
>
> **Drift check**: `git diff --stat 8a71db6..HEAD -- public src/data` — if data files changed, re-run Step 1's grep before deleting.

## Status
- **Priority**: P3
- **Effort**: S
- **Risk**: LOW (unreferenced assets + gitignored junk)
- **Depends on**: none (fully independent)
- **Category**: tech-debt (dead code / repo hygiene)
- **Planned at**: commit `8a71db6`, 2026-07-01

## Why this matters
The `public/` dir carries leftover TanStack-starter assets and stray report-preview files
no code references, plus four committed `.DS_Store` files (already in `.gitignore:2`, so
they were force-added). They inflate the repo and every deploy. Removing them is safe once
confirmed unreferenced — with one caveat below.

## Current state (verified at `8a71db6`)

**Confirmed DEAD (zero references, safe to delete):**
```
public/lta-illustration.png
public/students-illustration.png
public/tanstack-word-logo-white.svg          ← TanStack starter leftover
public/tanstack-circle-logo.png              ← TanStack starter leftover
public/preview-menu.html
public/report-previews/nric-report-thumb.png
public/report-previews/assq.png              ← the BARE png (not *-thumb.png, not *.pdf)
public/report-previews/children-home.png     ← the BARE png
public/report-templates/nric-report.docx
figma-wireframe.js                            ← repo-root one-off script, zero references
```
**Committed junk (untrack; already gitignored):**
```
./.DS_Store   public/.DS_Store   src/.DS_Store   public/logos/.DS_Store
```

**MUST KEEP — do NOT delete:**
- `public/report-previews/*-thumb.png` (imh-cgc, cps, msf-psv, intake, sc-swo-a, sc-swo-b,
  children-home, sps, spf, assq, cnb, msf, msf-probation, navh, reach) — these are
  referenced via a **constructed path** (`/report-previews/${...}-thumb.png`) in the report
  mock data, so a basename grep won't find them. The two files above marked dead are the
  *bare* `assq.png` / `children-home.png` (no `-thumb`) and `nric-report-thumb.png`
  specifically — confirm each individually in Step 1.
- `public/report-previews/assq.pdf`, `public/report-previews/children-home.pdf` (embedded PDF previews)
- `public/robots.txt`, `public/manifest.json`, `public/favicon.ico`, `public/logo192.png`, `public/logo512.png` (web meta / referenced by manifest+HTML)

### Repo conventions
`bun` runtime. Build output is `.output/`/`dist/` (gitignored). Conventional commits.

## Commands you will need
| Purpose | Command | Expected |
|---|---|---|
| Reference check (per file) | `grep -rF "<basename>" src index.html public/*.html public/manifest.json` | empty for a dead asset |
| Constructed-path check | `grep -rnE "report-previews/" src/data` | shows the template that keeps `-thumb.png` alive |
| Build | `bun run build` | exit 0 |

## Scope
**In scope**: the 10 dead asset files + `figma-wireframe.js` + 4 `.DS_Store`; `plans/README.md`.
**Out of scope**: every "MUST KEEP" file above; any code.

## Steps

### Step 1: Confirm each dead asset is unreferenced (INCLUDING constructed paths)
For each of the 10 dead files: `grep -rF "<basename>" src index.html public/preview-menu.html public/manifest.json` → expect empty. Then run `grep -rnE "report-previews/" src/data` and eyeball that the surviving `-thumb.png` names are produced by a template while `assq.png`/`children-home.png`/`nric-report-thumb.png` are NOT. If any "dead" file is actually referenced (literally or via a constructed prefix + its stem), STOP and drop it from the list.

### Step 2: Delete dead assets + untrack junk
```
git rm public/lta-illustration.png public/students-illustration.png \
       public/tanstack-word-logo-white.svg public/tanstack-circle-logo.png \
       public/preview-menu.html public/report-previews/nric-report-thumb.png \
       public/report-previews/assq.png public/report-previews/children-home.png \
       public/report-templates/nric-report.docx figma-wireframe.js
git rm --cached .DS_Store public/.DS_Store src/.DS_Store public/logos/.DS_Store
```
(`--cached` for `.DS_Store` untracks them while leaving the local files; they stay ignored.)

### Step 3: Verify
- `bun run build` → exit 0.
- `git status` shows only the removals + `plans/README.md`.
- Spot: `grep -rnE "report-previews/" src/data` still resolves to files that STILL exist
  (no kept `-thumb.png` was deleted).

## Test plan
No tests. Gate: build green, no surviving reference to a deleted asset, kept thumbnails intact.

## Done criteria
- [ ] 10 dead assets + `figma-wireframe.js` deleted; 4 `.DS_Store` untracked
- [ ] All `*-thumb.png`, `*.pdf`, and web-meta files still present
- [ ] `bun run build` exit 0
- [ ] `plans/README.md` row updated

## STOP conditions
- A "dead" asset turns out to be referenced (literal or constructed path) — keep it, report.
- The build fails after removal (an asset was imported in code, not just `public/`) — restore and report.

## Maintenance notes
- If report previews are ever added/removed, they follow the `/report-previews/<stem>-thumb.png`
  convention driven by the report mock data — keep new thumbs matching that pattern.
- `.DS_Store` is gitignored; if it reappears tracked, someone `git add -f`'d it.
