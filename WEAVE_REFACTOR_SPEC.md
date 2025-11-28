# WEAVE-AI Refactor Specification

**Version**: 1.1
**Author**: Ross
**Date**: 2025-11-28
**Status**: Approved — Ready for Implementation

---

## 1. Overview

### 1.1 Project Rename
- **Current Name**: Obsidian AI CLI Plugin
- **New Name**: WEAVE-AI
- **Creator**: Ross

### 1.2 Scope
Major UI overhaul transforming the current form-based interface into a modern chat-style interface inspired by Claude Code's terminal experience. The core CLI integration functionality remains unchanged; this refactor focuses on user experience and interface design.

### 1.3 Design Philosophy
- **Minimal friction**: Enter to send, immediate response streaming
- **Context-aware**: Always-visible abbreviated context, easy file references
- **Keyboard-first**: Power users can operate entirely via keyboard
- **Future-ready**: Architecture supports planned voice input capabilities

---

## 2. Current State Analysis

### 2.1 Existing Architecture (main.ts: 1,619 lines)
| Component | Lines | Description |
|-----------|-------|-------------|
| Settings Interface | 9-31 | Configuration storage |
| Main Plugin Class | 38-347 | Lifecycle, view registration, context detection |
| ToolView Class | 349-1351 | All UI and execution logic |
| CSS (inline) | 577-787 | 211 lines of styles in TypeScript |
| Prompt Management | 254-327, 1001-1065 | Save/load prompts from markdown |
| Settings Tab | 1436-1619 | Configuration UI |

### 2.2 Current UI Layout (Top-to-Bottom)
```
┌─────────────────────────────────────┐
│ [ICON] Tool Name Header             │
├─────────────────────────────────────┤
│ Prompt: [Collapsible help tips]     │
│ ┌──────────────────────────────────┐│
│ │ [Textarea - 4 rows]              ││
│ └──────────────────────────────────┘│
├─────────────────────────────────────┤
│ Saved Prompts: [Dropdown][Load][Save]│
├─────────────────────────────────────┤
│ [Run] [Cancel]                      │
├─────────────────────────────────────┤
│ Result: [Markdown rendered output]  │
├─────────────────────────────────────┤
│ [Command Execution] (collapsible)   │
├─────────────────────────────────────┤
│ Context: [File/Selection info]      │
└─────────────────────────────────────┘
```

### 2.3 Key Strengths to Preserve
- Unified `ToolView` class handling all 4 AI tools via `toolType` parameter
- stdin-based prompt delivery (robust, no escaping issues)
- Real-time output streaming
- `@filename.md` autocomplete with debouncing and caching
- Markdown rendering via Obsidian's `MarkdownRenderer`
- Prompt storage in markdown format
- Obsidian CSS variable usage for theme compatibility

---

## 3. Target UI Design

### 3.1 New Layout (Chat-Style, Input at Bottom)
```
┌─────────────────────────────────────┐
│ [ICON] WEAVE-AI  [Claude ▾]         │  Header with tool switcher dropdown
├─────────────────────────────────────┤
│                                     │
│  ┌────────────────────────────────┐ │
│  │ ▶ Thinking/Doing...            │ │  Thinking/Doing indicator
│  │   (collapsed by default)       │ │  (includes reasoning + execution)
│  └────────────────────────────────┘ │
│                                     │
│  ┌────────────────────────────────┐ │
│  │ [User prompt bubble]           │ │
│  │                                │ │
│  │ [AI response bubble]           │ │  Response area with
│  │   Response content streams     │ │  persistent chat history
│  │   here with markdown render    │ │  (scrollable, flex-grow)
│  │                                │ │
│  │ [User prompt bubble]           │ │
│  │                                │ │
│  │ [AI response streaming...]     │ │  Auto-scrolls to bottom
│  └────────────────────────────────┘ │
│                                     │
├─────────────────────────────────────┤
│ ┌──────────────────────────────┐ ▶️ │  Input area
│ │ Enter prompt...              │    │  (auto-resize, shift+enter
│ └──────────────────────────────┘    │   for newline)
├─────────────────────────────────────┤
│ 📄 doc.md • ✏️ L5-7 🔘 │ [Prompts] │  Context bar (below input)
└─────────────────────────────────────┘    Toggle (🔘) to enable/disable
```

### 3.2 Component Specifications

#### 3.2.1 Header with Tool Switcher
- **Position**: Top of panel, fixed
- **Components**:
  - WEAVE-AI icon and title (left)
  - Tool switcher dropdown (right): Claude, Gemini, Codex, Qwen
- **Behavior**:
  - Dropdown allows switching AI tools within the same panel
  - Switching tools clears current conversation (with confirmation if history exists)
  - Current tool shown in dropdown button text

#### 3.2.2 Response Area (Chat History)
- **Position**: Main content area, fills available vertical space
- **Behavior**:
  - **Persistent chat history**: Previous exchanges remain visible within session
  - Streams content in real-time as CLI outputs
  - Auto-scrolls to bottom during streaming
  - User scroll-up pauses auto-scroll; new content resumes it
  - Markdown rendered via Obsidian's `MarkdownRenderer`
- **Message Display**:
  - User prompts displayed as sent messages (right-aligned or distinct styling)
  - AI responses displayed as received messages (left-aligned or distinct styling)
  - Clear visual separation between exchanges
- **Styling**:
  - Clean background using `--background-primary`
  - Subtle padding, readable line-height
  - Code blocks with syntax highlighting
- **Session Scope**: History persists until panel is closed or tool is switched

#### 3.2.3 Thinking/Doing Indicator
- **Position**: Above main response content (at top of response area)
- **Purpose**: Shows both AI reasoning (`<thinking>` tags) and execution context (command being run, files being accessed)
- **Default State**: Collapsed (permanent default, not persisted)
- **Collapsed Display**: `▶ Thinking/Doing...` with brief activity hint
- **Expanded Display**:
  - Streaming thinking content from AI
  - Command execution details (what was in "Command Execution" debug section)
- **Visual**:
  - Muted text color (`--text-muted`)
  - Italic or lighter font weight
  - Disclosure triangle/chevron for expand/collapse
- **Trigger**: Automatically appears when thinking tags detected or command executing

#### 3.2.4 Context Bar
- **Position**: Below input area (bottom of panel)
- **Left Side** (Context Display):
  - Abbreviated format: `📄 filename.md • ✏️ L5-7` or `📄 filename.md • No selection`
  - Tooltip on hover shows full path and selected text preview
  - Click to refresh context
  - **Toggle switch** to enable/disable context inclusion (inline, visible)
- **Right Side** (Actions):
  - Single "Prompts" button for prompt management
  - Opens dropdown/popover with saved prompts
  - Includes "Save current" option in dropdown

#### 3.2.5 Input Area
- **Component**: Auto-resizing textarea (1-5 rows based on content)
- **Behavior**:
  - `Enter`: Submit prompt
  - `Shift+Enter`: Insert newline
  - `Escape`: Cancel running command (if active) or clear input
  - `@` triggers file autocomplete (existing behavior)
- **Send Button**:
  - Icon-only button (paper plane / arrow-up style)
  - Positioned to right of textarea
  - Transforms to "Stop" button (square icon) during execution
- **Placeholder**: "Ask WEAVE-AI..." or tool-specific hint

#### 3.2.6 Prompts Management (Dropdown/Popover)
- **Trigger**: Click "Prompts" button in context bar
- **Content**:
  - List of saved prompts (from `ai-prompts.md`)
  - Click to load into input area
  - Delete button (trash icon) per item
  - "Save current prompt" option at bottom
  - Search/filter if many prompts exist
- **Position**: Anchored below button, doesn't obscure input area

---

## 4. Interaction Patterns

### 4.1 Keyboard Shortcuts
| Shortcut | Action | Scope |
|----------|--------|-------|
| `Cmd/Ctrl+Shift+W` | Focus WEAVE-AI input | Global (configurable) |
| `Enter` | Submit prompt | Input focused |
| `Shift+Enter` | Insert newline | Input focused |
| `Escape` | Stop execution / Clear input | Input focused |
| `@` | Trigger file autocomplete | Input focused |
| `Up/Down` | Navigate autocomplete | Autocomplete open |
| `Tab/Enter` | Select autocomplete item | Autocomplete open |

### 4.2 Submission Flow
1. User types prompt in input area
2. Press Enter (or click send button)
3. Input area clears, send button becomes stop button
4. Response area begins streaming output
5. Thinking content appears in collapsed section (if present)
6. On completion, stop button returns to send button
7. User can type next prompt immediately

### 4.3 Cancellation
- Click stop button OR press Escape
- SIGTERM sent to process, SIGKILL after 2 seconds (existing behavior)
- Partial output preserved in response area
- "[Cancelled]" indicator appended

---

## 5. Technical Implementation

### 5.1 File Structure Changes

**APPROVED: Yes**

#### Proposed Structure
```
WEAVE-AI/
├── main.ts              # Plugin entry, settings, view registration
├── src/
│   ├── views/
│   │   └── ToolView.ts  # Refactored chat view component
│   ├── components/
│   │   ├── ResponseArea.ts
│   │   ├── ThinkingIndicator.ts
│   │   ├── ContextBar.ts
│   │   ├── InputArea.ts
│   │   └── PromptsDropdown.ts
│   ├── services/
│   │   ├── CliExecutor.ts      # Process spawning, stdin handling
│   │   ├── ContextDetector.ts  # File/selection detection
│   │   └── PromptStorage.ts    # Prompt save/load
│   └── utils/
│       ├── FileAutocomplete.ts
│       └── ThinkingParser.ts   # Parse thinking tags from output
├── styles.css           # External stylesheet (not inline)
├── manifest.json
└── package.json
```

#### Justification for Modular Structure

**Why change from single-file to modular?**

1. **Current Pain Points**:
   - `main.ts` at 1,619 lines exceeds comfortable single-file maintainability (~500-800 lines ideal)
   - Mixed concerns: UI rendering, process execution, context detection, prompt storage all interleaved
   - Difficult to test components in isolation
   - Cognitive load when navigating—must hold entire file structure in memory

2. **Benefits of Proposed Structure**:
   - **Separation of concerns**: Each file has single responsibility
   - **Testability**: Services and utils can be unit tested independently
   - **Parallel development**: Multiple components can be worked on without merge conflicts
   - **Discoverability**: New contributors can find relevant code by filename
   - **Incremental refactoring**: Can migrate piece by piece, not big-bang

3. **Why It Won't Break Things**:
   - Obsidian plugins compile to single `main.js` via esbuild—file structure is development-only
   - No runtime behavior change; all imports resolve at build time
   - Existing `tsconfig.json` and `esbuild` config support multi-file projects
   - Can maintain backwards compatibility by re-exporting from `main.ts` if needed

4. **Migration Path**:
   - Extract CSS first (lowest risk, already empty `styles.css` exists)
   - Extract utility functions (FileAutocomplete, ThinkingParser)
   - Extract services (CliExecutor, ContextDetector, PromptStorage)
   - Extract components last (most coupled to ToolView)
   - Each step is independently testable with `npm run build`

5. **Risk Mitigation**:
   - Keep `main.ts` as the entry point (Obsidian requirement)
   - Run `npm run build` after each extraction to catch import errors
   - Maintain git history for easy rollback
   - Can abort modularization partway through if issues arise

### 5.2 CSS Architecture
- **Move from inline to external**: Extract 211 lines of inline CSS to `styles.css`
- **CSS Custom Properties**: Continue using Obsidian's CSS variables for theme compatibility
- **Layout**: CSS Flexbox/Grid for responsive chat layout
- **Key Classes**:
  ```css
  .weave-container { display: flex; flex-direction: column; height: 100%; }
  .weave-response-area { flex: 1; overflow-y: auto; }
  .weave-context-bar { display: flex; justify-content: space-between; }
  .weave-input-area { display: flex; gap: 8px; }
  .weave-thinking { /* collapsed state styles */ }
  .weave-thinking.expanded { /* expanded state styles */ }
  ```

### 5.3 Event Handling Updates
- Register global hotkey command via `addCommand()` with configurable hotkey
- Input area keydown handler for Enter/Shift+Enter differentiation
- Auto-scroll logic: track user scroll position, resume on new content
- Thinking section expand/collapse toggle

### 5.4 Thinking Tag Parsing
```typescript
// Detect thinking content in streamed output
// Patterns to match:
// - <thinking>...</thinking>
// - <antThinking>...</antThinking>
// - Lines starting with specific prefixes

interface ParsedOutput {
  thinking: string;
  response: string;
}

function parseStreamChunk(chunk: string, state: ParserState): ParsedOutput;
```

---

## 6. Branding Updates

### 6.1 Plugin Metadata
```json
// manifest.json
{
  "id": "weave-ai",
  "name": "WEAVE-AI",
  "author": "Ross",
  "description": "Writers' Enhanced AI Vault Experience - Orchestrate your writing with AI!"
}
```

### 6.2 View Types
```typescript
const WEAVE_VIEW_TYPE_CLAUDE = 'weave-ai-claude';
const WEAVE_VIEW_TYPE_GEMINI = 'weave-ai-gemini';
const WEAVE_VIEW_TYPE_CODEX = 'weave-ai-codex';
const WEAVE_VIEW_TYPE_QWEN = 'weave-ai-qwen';
```

### 6.3 Command IDs
```typescript
// Updated command IDs
'weave-ai:open-claude'
'weave-ai:open-gemini'
'weave-ai:open-codex'
'weave-ai:open-qwen'
'weave-ai:focus-input'  // New: jump to input
```

---

## 7. Future Considerations

### 7.1 Framework Redesign

**Current Approach**: Plain TypeScript with Obsidian APIs (maintained for this refactor)

The current implementation uses vanilla TypeScript with Obsidian's imperative DOM APIs. This approach is maintained for the initial refactor to minimize risk and avoid introducing new dependencies.

#### Considerations for Future Framework Adoption

**Why consider a framework?**
- More dynamic UI components (chat history, streaming updates, collapsible sections)
- Reactive state management (tool selection, context toggle, running state)
- Cleaner component composition and reusability
- Better separation of logic and presentation

**Candidate Frameworks**:

| Framework | Pros | Cons | Link |
|-----------|------|------|------|
| **Svelte** | Minimal bundle size, compiles away, simple syntax | Less ecosystem than React, learning curve | [svelte.dev](https://svelte.dev/) |
| **Preact** | React-compatible, tiny (3KB), familiar API | Less tooling than full React | [preactjs.com](https://preactjs.com/) |
| **Solid** | Fine-grained reactivity, no virtual DOM, fast | Smaller community, newer | [solidjs.com](https://www.solidjs.com/) |
| **Lit** | Web components, small, Google-backed | Different mental model | [lit.dev](https://lit.dev/) |
| **Vue** | Gentle learning curve, good docs | Larger bundle, template syntax | [vuejs.org](https://vuejs.org/) |

**Recommendation for Future**: Svelte or Preact are best suited for Obsidian plugins due to:
- Small bundle size (Obsidian plugins should be lightweight)
- Svelte compiles to vanilla JS (no runtime overhead)
- Preact offers React familiarity with minimal footprint

**Migration Path** (if adopted later):
1. Complete current refactor with vanilla TS
2. Identify most complex component (likely ResponseArea with chat history)
3. Prototype single component in chosen framework
4. Evaluate bundle size impact and performance
5. Gradually migrate other components if successful

### 7.2 Voice Input Capabilities

**Status**: Out of scope for initial refactor. Documented for architectural awareness.

#### Wispr Flow-Inspired Design
Based on [Wispr Flow](https://wisprflow.ai/)'s hold-to-talk paradigm:

- **Trigger**: Hold configurable function key (default: `Fn` or `Option`)
- **Behavior**:
  - Hold key → start recording (visual indicator in input area)
  - Release key → send audio to transcription service
  - Transcribed text appears in input area
  - Optional: auto-submit after transcription
- **Visual Feedback**:
  - Microphone icon in input area (or near send button)
  - Pulsing animation during recording
  - Waveform or level indicator

#### Implementation Considerations
- **Transcription Backend**: OpenAI Whisper API, local Whisper, or other service
- **Audio Capture**: Electron/Node.js audio APIs via Obsidian's environment
- **Privacy**: Option for local-only transcription
- **Latency**: Target 1-2 second transcription time (per Wispr Flow benchmarks)

---

## 8. Migration Strategy

### 8.1 Settings Migration
- Preserve all existing settings
- Add new settings for:
  - Global focus hotkey (default: `Cmd/Ctrl+Shift+W`)
  - Auto-scroll behavior toggle
  - Thinking section default state (collapsed/expanded)
- Migrate `promptStorageFile` path unchanged

### 8.2 Backwards Compatibility
- Existing prompt storage files continue to work
- CLI tool paths and parameters unchanged
- No breaking changes to command execution

### 8.3 Rollout Phases
0. **Phase 0**: File structure modularization (5.1) and branding updates (6)
1. **Phase 1**: UI refactor with new chat layout
2. **Phase 2**: Keyboard shortcuts and focus management
3. **Phase 3**: Polish, animations, and edge cases
4. **Phase 4** (Lower Priority): Settings tab beautification
5. **Phase 5** (Future): Voice input integration

### 8.4 Settings Tab Improvements (Lower Priority)

The settings UI works but could benefit from polish after core functionality is complete:

- **Visual Organization**: Group related settings with collapsible sections (CLI Tools, Prompts, Behavior)
- **Prominent Separation**: Add visual dividers between tool configurations
- **Rational Ordering**: Most-used settings first, advanced settings in collapsed "Advanced" section
- **Inline Help**: Brief descriptions under each setting explaining impact
- **Validation Feedback**: Real-time path validation with status indicators

This is deprioritized below core UI refactor work.

---

## 9. Research References

### 9.1 Obsidian Plugin Best Practices
- [Obsidian Developer Documentation](https://docs.obsidian.md/)
- [Plugin Guidelines](https://docs.obsidian.md/Plugins/Releasing/Plugin+guidelines)
- [Official Sample Plugin](https://github.com/obsidianmd/obsidian-sample-plugin)
- Use `registerEvent()` for proper cleanup on unload
- CSS variables for theme compatibility
- TypeScript for type safety and documentation

### 9.2 Chat Interface Design Patterns
- [16 Chat UI Design Patterns That Work in 2025](https://bricxlabs.com/blogs/message-screen-ui-deisgn)
- [Chat UI Kit - Stream](https://getstream.io/chat/ui-kit/)
- [UXPin: Chat User Interface Design](https://www.uxpin.com/studio/blog/chat-user-interface-design/)
- Message bubbles increase engagement by up to 72%
- Input at bottom is standard for chat interfaces
- Real-time streaming with visual feedback is expected

### 9.3 Claude Code Interface
- [Claude Code Product Page](https://claude.com/product/claude-code)
- [How I Use Claude Code - Builder.io](https://www.builder.io/blog/claude-code)
- [Claude Code WebUI](https://github.com/sugyan/claude-code-webui)
- Escape to stop (not Ctrl+C)
- `@` for file references
- Thinking content separated from main response

### 9.4 Wispr Flow Voice Input
- [Wispr Flow Official](https://wisprflow.ai/)
- [Wispr Flow Review - Zack Proser](https://zackproser.com/blog/wisprflow-review)
- [Wispr Flow Lite (Open Source)](https://github.com/tommyyau/wispr-flow-lite)
- Hold Fn key to record, release to transcribe
- 97.2% transcription accuracy
- 170-179 WPM dictation speed achievable
- Auto-removes filler words ("um", "uh", "like")

---

## Appendix A: Current CSS Variables Used

From `main.ts` lines 577-787, the plugin uses these Obsidian variables:
- `--interactive-accent`, `--interactive-accent-hover`
- `--text-on-accent`, `--text-normal`, `--text-muted`, `--text-success`, `--text-error`, `--text-warning`
- `--background-primary`, `--background-primary-alt`, `--background-secondary`
- `--background-modifier-border`, `--background-modifier-hover`
- `--font-monospace`

## Appendix B: Current Prompt Format

Prompts stored in markdown (default: `ai-prompts.md`):
```markdown
# Translate to French
Translate the following text to French:

# Fix Grammar
Fix spelling and grammar errors:

# Summarize
Create a concise summary of:
```

Each `# Heading` becomes a prompt name; content until next heading is the prompt body.
