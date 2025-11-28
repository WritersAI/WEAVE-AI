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

## Phase 1: UI Refactor - Chat Layout

**Date**: 2025-11-28
**Status**: Complete
**Branch**: `phase-1-ui-refactor`

### Objectives
- Transform form-based UI into modern chat-style interface
- Add tool switcher dropdown in header
- Implement persistent chat history within session
- Add collapsible Thinking/Doing indicator
- Move input to bottom with Enter/Shift+Enter handling
- Add context bar below input with toggle
- Implement send/stop icon button

### Changes Made

#### 1. New UI Layout Structure

```
┌─────────────────────────────────────┐
│ 🤖 WEAVE-AI     [Claude Code ▾]     │  Header + Tool Switcher
├─────────────────────────────────────┤
│ ▶ Thinking/Doing...                 │  Collapsed Indicator
│                                     │
│ [Welcome message]                   │  Chat Container
│ [User message bubble]               │  (scrollable)
│ [Assistant response bubble]         │
│                                     │
├─────────────────────────────────────┤
│ [Ask Claude Code...          ] [↑]  │  Input Area
├─────────────────────────────────────┤
│ ☑ 📄 file.md • ✏️ L5  | [Prompts]  │  Context Bar
└─────────────────────────────────────┘
```

#### 2. New Class Properties (main.ts:368-400)

**UI Elements:**
```typescript
private containerEl_: HTMLDivElement;
private headerEl: HTMLDivElement;
private toolSwitcher: HTMLSelectElement;
private responseArea: HTMLDivElement;
private thinkingSection: HTMLDetailsElement;
private thinkingContent: HTMLDivElement;
private inputArea: HTMLDivElement;
private promptInput: HTMLTextAreaElement;
private sendButton: HTMLButtonElement;
private contextBar: HTMLDivElement;
private contextToggle: HTMLInputElement;
private promptsButton: HTMLButtonElement;
```

**Chat State:**
```typescript
private chatHistory: ChatMessage[] = [];
private currentStreamingMessage: HTMLDivElement | null = null;
private thinkingBuffer: string = '';
private responseBuffer: string = '';
private userScrolledUp: boolean = false;
```

#### 3. New Methods Added

| Method | Purpose |
|--------|---------|
| `getToolDisplayName()` | Returns human-readable tool name |
| `autoResizeInput()` | Auto-grows textarea 1-5 rows |
| `updateSendButton()` | Toggles send ↑ / stop ⏹ icons |
| `handleToolSwitch()` | Switches tool, clears history with confirmation |
| `addSystemMessage()` | Adds centered system message to chat |
| `addUserMessage()` | Adds right-aligned user bubble |
| `addAssistantMessage()` | Creates placeholder for streaming |
| `updateStreamingMessage()` | Updates assistant message with markdown |
| `finalizeStreamingMessage()` | Saves to chat history |
| `scrollToBottom()` | Scrolls response area |
| `updateContextDisplay()` | Updates abbreviated context in bar |
| `showPromptsDropdown()` | Shows popover with saved prompts |
| `updateThinkingContent()` | Updates thinking section |

#### 4. Removed Methods

| Method | Reason |
|--------|--------|
| `refreshPromptDropdown()` | Replaced by popover-based prompts |
| `loadSelectedPrompt()` | Replaced by popover click handler |
| `renderMarkdown()` | Replaced by `updateStreamingMessage()` |

#### 5. Modified Methods

**`onOpen()`** - Complete rewrite for new layout structure
- Creates header with tool switcher
- Creates response area with thinking section and chat container
- Creates input area with auto-resize and Enter handling
- Creates context bar with toggle and prompts button

**`runTool()`** - Updated for chat UI
- Adds user message to chat history
- Clears input after submission
- Creates assistant message placeholder
- Uses `updateSendButton()` instead of old button manipulation

**`runCommandWithSpawn()`** - Updated for streaming
- Streams to `updateStreamingMessage()` instead of `renderMarkdown()`
- Updates thinking section with execution info
- Uses `responseBuffer` and `thinkingBuffer`

**`cancelTool()`** - Simplified
- Uses `updateSendButton()` instead of old button references

**`updateContext()`** - Simplified
- Now delegates to `updateContextDisplay()`

**`showSavePromptDialog()`** - Simplified
- Removed `refreshPromptDropdown()` call (no longer needed)

#### 6. New CSS Classes (styles.css)

**Layout:**
- `.weave-container` - Flexbox column layout
- `.weave-header` - Header with tool switcher
- `.weave-response-area` - Scrollable chat area
- `.weave-input-area` - Bottom input container
- `.weave-context-bar` - Context toggle and prompts

**Components:**
- `.weave-tool-switcher` - Dropdown select
- `.weave-thinking` / `.weave-thinking-content` - Collapsible section
- `.weave-chat-container` - Chat messages container
- `.weave-message` / `.weave-message-user` / `.weave-message-assistant` - Message bubbles
- `.weave-prompt-input` - Auto-resize textarea
- `.weave-send-button` / `.weave-stop-button` - Icon buttons
- `.weave-context-toggle` / `.weave-context-info` - Context controls
- `.weave-prompts-dropdown` / `.weave-prompts-item` - Prompts popover

#### 7. Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Enter` | Submit prompt |
| `Shift+Enter` | Insert newline |
| `Escape` | Stop execution or clear input |
| `@` | File autocomplete (unchanged) |

#### 8. Files Modified

| File | Change Type | Description |
|------|-------------|-------------|
| `main.ts` | Major rewrite | ~300 lines changed, new chat UI structure |
| `styles.css` | Major update | ~400 lines, complete new styling |

### Build Verification

```bash
npm run build
# Result: Success, no TypeScript errors
```

### Key Decisions

1. **Tool switching within panel** - Dropdown in header allows switching tools without opening new panel
2. **Confirmation on switch** - If chat history exists, prompts user before clearing
3. **Prompts as popover** - Replaced inline dropdown with click-triggered popover anchored to bottom
4. **Send/Stop icon toggle** - Single button changes between ↑ (send) and ⏹ (stop)
5. **Auto-scroll pause** - User scrolling up pauses auto-scroll; new content resumes it

### Notes

- Chat history is session-only (cleared on panel close or tool switch)
- Thinking section remains collapsed by default (per spec)
- Context bar shows abbreviated file + line range with tooltip for details
- Legacy CSS classes preserved for backwards compatibility

### Next Phase

**Phase 2: Settings UI Refresh**

---

## Phase 2: Settings UI Refresh

**Date**: 2025-11-28
**Status**: Complete
**Version**: 0.0.3

### Objectives
- Redesign settings page with professional appearance
- Add 2x2 model card grid layout
- Implement clickable status indicators with brand colors
- Add model auto-testing on settings load
- Add file autocomplete for prompt library path
- Filter gear menu to only show tested models
- Persist model selection and tested status

### Changes Made

#### 1. Version Reset
- Reset versioning from 1.0.7 to 0.0.3
- Created `docs/CHANGELOG-LEGACY.md` for pre-fork history
- New CHANGELOG.md with 0.0.1 (fork), 0.0.2 (UI overhaul), 0.0.3 (settings refresh)

#### 2. Settings Interface Updates

**New Settings Fields:**
```typescript
interface ObsidianAICliSettings {
    // ... existing fields ...
    selectedTool: 'claude' | 'gemini' | 'codex' | 'qwen';
    testedTools: string[];
}
```

#### 3. Settings Page Layout

**Header:**
```
WEAVE                    │  Writer's Enhanced AI Vault Experience
v0.0.3  GitHub          │  Orchestrate your writing with AI-powered assistance
```

**Model Grid (2x2):**
```
┌─────────────────┐ ┌─────────────────┐
│ ○ Claude Code   │ │ ○ OpenAI Codex  │
│   Path: [____]  │ │   Path: [____]  │
│   Params: [___] │ │   Params: [___] │
└─────────────────┘ └─────────────────┘
┌─────────────────┐ ┌─────────────────┐
│ ○ Qwen Code     │ │ ○ Gemini CLI    │
│   Path: [____]  │ │   Path: [____]  │
│   Params: [___] │ │   Params: [___] │
└─────────────────┘ └─────────────────┘
```

#### 4. Status Indicator Behavior
- Grey circle by default
- Click to test → animates while testing
- Success: Brand color (orange/green/purple/blue) + ✓
- Failure: Red + ✗
- Auto-tests previously working tools on page load

#### 5. Model Card Features
- Docs link (↗) in upper right linking to vendor documentation
- Warning text (OpenAI) displayed subtly under docs link
- Path and Parameters inputs with consistent styling
- Full-width adaptive input fields

#### 6. Gear Menu Filtering
- Only shows models that have been tested as working
- Shows "No other models available" if none tested
- Persists tested status between restarts

#### 7. File Autocomplete
- Prompt library path field now has file autocomplete
- Searches vault markdown files as you type
- Default changed to `System/AI Prompts.md`

#### 8. Files Modified

| File | Change Type | Description |
|------|-------------|-------------|
| `main.ts` | Modified | Settings interface, ToolView gear menu filter |
| `styles.css` | Modified | Settings page styles, model grid, status indicators |
| `manifest.json` | Modified | Version 0.0.3, updated authorUrl |
| `package.json` | Modified | Version 0.0.3 |
| `versions.json` | Replaced | Fresh versioning 0.0.1-0.0.3 |
| `CHANGELOG.md` | Replaced | New changelog with fork history link |
| `docs/CHANGELOG-LEGACY.md` | Created | Pre-fork changelog archive |

### Build Verification

```bash
npm run build
# Result: Success, no TypeScript errors
```

### Key Decisions

1. **Version reset** - Started fresh at 0.0.x to reflect new project identity
2. **2x2 grid** - Compact layout fits more information without scrolling
3. **Status as indicator** - Circles double as test buttons and status display
4. **Brand colors** - Each model has distinct color for quick recognition
5. **Tested-only in gear menu** - Prevents confusion from selecting unavailable models

### Notes

- Legacy changelog preserved in docs/ folder for reference
- GitHub link in header points to new repo location
- Settings width no longer artificially constrained

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
