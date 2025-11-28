# WEAVE-AI Refactor Log

**Project**: WEAVE-AI (formerly Obsidian AI CLI Plugin)
**Author**: Ross
**Started**: 2025-11-28

---

## Phase 0: File Structure & Branding

**Date**: 2025-11-28
**Status**: Complete
**Branch**: `initial-weave-refactor`

### Objectives
- Establish modular directory structure for future code extraction
- Update all branding from "Obsidian AI CLI" to "WEAVE-AI"
- Extract inline CSS to external stylesheet
- Update view type constants and command IDs

### Changes Made

#### 1. Directory Structure Created
```
src/
├── views/       # Future: ToolView.ts
├── components/  # Future: ResponseArea, ThinkingIndicator, ContextBar, InputArea, PromptsDropdown
├── services/    # Future: CliExecutor, ContextDetector, PromptStorage
└── utils/       # Future: FileAutocomplete, ThinkingParser
```

#### 2. Branding Updates

**manifest.json**
| Field | Before | After |
|-------|--------|-------|
| id | `obsidian-ai-cli` | `weave-ai` |
| name | `Obsidian AI CLI` | `WEAVE-AI` |
| author | `BlackDragonBE` | `Ross` |
| description | Generic CLI tools description | `Writers' Enhanced AI Vault Experience - Orchestrate your writing with AI!` |

**package.json**
| Field | Before | After |
|-------|--------|-------|
| name | `obsidian-ai-cli` | `weave-ai` |
| author | (empty) | `Ross` |
| description | Generic description | `Writers' Enhanced AI Vault Experience - Orchestrate your writing with AI!` |

#### 3. View Type Constants (main.ts:33-43)

**New constants:**
```typescript
const WEAVE_VIEW_TYPE_CLAUDE = 'weave-ai-claude';
const WEAVE_VIEW_TYPE_GEMINI = 'weave-ai-gemini';
const WEAVE_VIEW_TYPE_CODEX = 'weave-ai-codex';
const WEAVE_VIEW_TYPE_QWEN = 'weave-ai-qwen';
```

**Legacy aliases maintained for compatibility:**
```typescript
const CLAUDE_VIEW_TYPE = WEAVE_VIEW_TYPE_CLAUDE;
const GEMINI_VIEW_TYPE = WEAVE_VIEW_TYPE_GEMINI;
const CODEX_VIEW_TYPE = WEAVE_VIEW_TYPE_CODEX;
const QWEN_VIEW_TYPE = WEAVE_VIEW_TYPE_QWEN;
```

#### 4. Command ID Updates (main.ts:85-115)

| Before | After |
|--------|-------|
| `open-claude-code` | `weave-ai:open-claude` |
| `open-gemini-cli` | `weave-ai:open-gemini` |
| `open-codex` | `weave-ai:open-codex` |
| `open-qwen` | `weave-ai:open-qwen` |

Command names now prefixed with `WEAVE-AI:` (e.g., `WEAVE-AI: Claude Code`)

#### 5. CSS Extraction

**Removed from main.ts:**
- `addStyles()` method (lines 577-787, ~211 lines of inline CSS)
- Call to `this.addStyles()` in `onOpen()`

**Added to styles.css:**
- All plugin styles extracted to external stylesheet
- Obsidian automatically loads `styles.css` when plugin is enabled
- Styles organized by component with comments

#### 6. Files Modified

| File | Change Type | Lines Changed |
|------|-------------|---------------|
| `main.ts` | Modified | ~220 lines removed (CSS), ~15 lines added (constants) |
| `manifest.json` | Modified | 4 fields updated |
| `package.json` | Modified | 3 fields updated |
| `styles.css` | Replaced | ~250 lines added |

### Build Verification

```bash
npm install  # Dependencies installed
npm run build  # TypeScript check + esbuild production build
# Result: Success, no errors
```

### Notes

- Legacy view type aliases ensure existing workspace layouts continue to work
- The `src/` directories are empty placeholders for Phase 1 modular extraction
- No functional changes to plugin behavior—purely structural/branding

### Next Phase

**Phase 1: UI Refactor** — Implement new chat-style layout per spec Section 3

---

## Changelog Format

Each phase entry should include:
- Date and status
- Objectives (what was planned)
- Changes Made (what was done)
- Files Modified (with line counts where relevant)
- Build Verification (pass/fail)
- Notes (gotchas, decisions, deviations from spec)
- Next Phase (what's coming)
