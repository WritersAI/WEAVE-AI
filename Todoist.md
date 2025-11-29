# WEAVE-AI Feature Backlog

*Extracted from Todoist WEAVE project - 2025-11-29*

---

## Core UI/UX Enhancements

### Simplified Chat Interface
- [ ] Radically simplify UI: chat box at bottom, scrolling response window above
- [ ] Hotkey to jump to prompt box
- [ ] Save/load prompts functionality

### File & Context Integration
- [ ] `[[` file picker in prompt field (Obsidian-native link syntax)
- [ ] Keyboard shortcut for file selection
- [ ] Long-form output → timestamped note with auto-open in split screen
- [ ] Revision mode: side-by-side view for comparing versions

### Authentication & Error Handling
- [ ] Handle invalid/expired authentication in-app (avoid terminal jumps)

---

## Voice Integration

### Transcription Features
- [ ] WisprFlow-style transcription on keyboard shortcut
- [ ] Apple native transcription (preferred)
- [ ] OpenAI Whisper fallback with user-provided API key
- [ ] Works in both sidebar and editor contexts

### Reference Projects
- [obsidian-scribe](https://github.com/Mikodin/obsidian-scribe) - Record, transcribe, transform
- [NeuroVox](https://github.com/Synaptic-Labs-AI/NeuroVox) - Transcription and generation
- [openaugi](https://github.com/bitsofchris/openaugi-obsidian-plugin) - Self-organizing second brain

---

## Graph & Context Intelligence

### Smart Graph Integration (Phase X)
- [ ] X.1 - Baseline Verification: Audit codebase for existing graph capabilities
- [ ] X.2 - MetadataCache Integration: Direct access to Obsidian's graph model
- [ ] X.3 - Graph Service Module: Create reusable GraphAnalyzer service class
- [ ] X.4 - Tool Registration: Make graph capabilities available to CLI tools
- [ ] X.5 - Semantic Search Enhancement: Query operators for AI agents

---

## Offline Modes

### Ollama-Based Offline (Phase X+1)
*Prerequisite: Ollama installed and running*

- [ ] Connectivity detection
- [ ] Ollama API integration
- [ ] Lightweight orchestration framework (Vercel AI SDK candidate)
- [ ] Tool definitions for local models
- [ ] Permission system
- [ ] Model recommendations

**Framework Requirements:**
- Parallel processes
- ReAct loops
- Agentic todo list
- File system navigation
- Sandboxing
- Markdown editing

### Bundled Model Offline (Phase X+2)
*Zero-dependency, HuggingFace download on first run*

- [ ] Model selection (<4GB, permissive license, quantized)
- [ ] Inference runtime (node-llama-cpp candidate)
- [ ] Download manager
- [ ] Inference integration
- [ ] Fallback chain: Primary CLI → Ollama → Bundled

---

## Role-Based Agent System

### Role Selector UI
- [ ] Role dropdown at top: Editor, Co-pilot, General Purpose, etc.
- [ ] All roles available as subagents at all times
- [ ] Explicit role switching via dropdown
- [ ] Agent selection as a tool (e.g., "call the line editor" changes UI)
- [ ] Role persistence until explicitly changed

### Multi-Agent Workflows (Future)
- [ ] Pass workflow to team and watch agents converse
- [ ] User intercession at any point
- [ ] Team coordination for complex editorial tasks

---

## Publishing House Features (Phase X+3)

### Editorial Team Roles
- [ ] Development Editor
- [ ] Line Editor
- [ ] Copy Editor
- [ ] Fact Checker
- [ ] Additional editorial personas

### "Talk With Your Manuscript"
*Conversational manuscript analysis - core differentiator*
- [ ] Manuscript-specific feedback
- [ ] Understanding of work's internal logic
- [ ] Context-aware suggestions

### Publishing Workflow Tools
- [ ] Multi-agent orchestration
- [ ] Editorial workflow automation
- [ ] User research integration

---

## Tone & Style System

### Tone Primitives
- [ ] **IDENTIFY BEST SAMPLES**: Extract representative passages that capture author's voice
- [ ] **EXTRACT TONE PROFILE**: Generate heuristics/rubrics/guidelines from passage analysis
- [ ] **EVALUATE TONE**: Determine if writing matches target tone profile
- [ ] **MORPH TONE**: Transform existing text to match a tone profile
- [ ] **APPLY TONE**: Generate new content from outline/summary in target voice

### Enabled Workflows
- "Rewrite this old piece in my current voice"
- "Turn these research notes into a summary in my style"
- Voice consistency across long-form projects

---

## Story & Structure Tools

### Outlining & Architecture
- [ ] Outline generation
- [ ] Outline morphing
- [ ] Outline ↔ text conversion
- [ ] Story arc selection (Hero's Journey, Harmon Circle, 3-Act, etc.)
- [ ] Arc recommendation: which structure fits story best

### Scene & Narrative
- [ ] Scene structuring
- [ ] Scene setting assistance
- [ ] Dialog writing
- [ ] World building tools

---

## Command System

### Slash Commands
- [ ] Handle /commands in prompt input
- [ ] Custom command definitions
- [ ] Command palette integration

---

## Technical Decisions Log

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Graph implementation | Independent | Not dependent on MCP plugin |
| Ollama integration | Direct API | Not Qwen Code CLI wrapper |
| Orchestration framework | Vercel AI SDK | Candidate for evaluation |
| Bundled inference | node-llama-cpp | For offline mode |

---

## Related Tasks (Outside Project)

- [ ] Investigate if WEAVE can access Obsidian object model directly
- [ ] Review [local mode conversation](https://claude.ai/share/169752b9-33df-4ad7-96ac-04a49e9efe5e)
- [ ] Finish processing writing taxonomy report (Part II: Comprehensive Taxonomy of Writing Work)

---

## Priority Items (Due Today: 2025-11-29)

1. **Role dropdown** - Consider role selector UI implementation
2. **Handle /commands** - Ensure slash command support in prompts
