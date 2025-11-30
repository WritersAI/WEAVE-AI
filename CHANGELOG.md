# Changelog

All notable changes to WEAVE-AI will be documented in this file.

WEAVE-AI is forked from [Obsidian AI CLI](https://github.com/BlackDragonBE/obsidian-ai-cli) by BlackDragonBE. See [docs/CHANGELOG-LEGACY.md](docs/CHANGELOG-LEGACY.md) for pre-fork history.

---

## [0.0.4] - 2025-11-29

### Added
- Selectable text in assistant responses (user-select enabled)
- Copy button on assistant messages (hover to reveal, copies markdown)
- Multi-target deploy system for developing across multiple Obsidian vaults
- `npm run target:add <name> <vault-path>` - Add a new vault target
- `npm run dev <target>` - Watch mode with deploy to specific vault
- `npm run dev:all` - Watch mode deploying to all configured vaults
- `npm run deploy <target>` - One-time deploy to specific vault
- `npm run deploy:all` - Deploy to all configured vaults
- `.targets/targets.yaml` for machine-specific vault configuration (gitignored)

### Changed
- esbuild config now integrates deploy plugin for automatic copying on rebuild

## [0.0.3] - 2025-11-28

### Added
- Professional settings page with 2x2 model card grid layout
- Clickable status indicators on model cards (grey → brand color when tested)
- Auto-test previously working models on settings page load
- Documentation links for each model (Docs ↗)
- File autocomplete for prompt library path selection
- Gear menu only shows tested/available models
- Persistent model selection between restarts
- Persistent tested model status between restarts

### Changed
- Settings header redesigned with version info and GitHub link
- Model cards now more compact with balanced input field widths
- Input fields styled consistently across settings
- OpenAI Codex warning moved to subtle right-aligned text
- Default prompt library path changed to `System/AI Prompts.md`
- Removed redundant Model Status section from settings top

## [0.0.2] - 2025-11-28

### Added
- Modern chat-style interface with message bubbles
- Collapsible Thinking/Doing indicator with cycling verbs
- Gear menu combining model selection and prompt management
- Context bar with file/selection display
- Context toggle moved to gear menu
- Single "Open WEAVE-AI" command (consolidated from 4 commands)
- Smart panel placement (opens near Outline in right sidebar)
- Auto-resize input textarea (1-5 rows)
- Send/Stop toggle button
- Selection polling for real-time context updates

### Changed
- Complete UI overhaul from form-based to chat-based layout
- Input moved to bottom of panel
- Tool switching via gear menu instead of dropdown
- Removed header section for cleaner look
- Reduced font sizes throughout for compact display

### Removed
- Individual command palette entries per model
- Header with tool switcher dropdown
- Prompts button (replaced by gear menu)

## [0.0.1] - 2025-11-28

### Added
- Initial fork from [Obsidian AI CLI](https://github.com/BlackDragonBE/obsidian-ai-cli) v1.0.7
- Rebranded to WEAVE-AI (Writer's Enhanced AI Vault Experience)
- New directory structure (`src/views`, `src/components`, `src/services`, `src/utils`)
- External stylesheet (`styles.css`) extracted from inline CSS
- New view type constants (`WEAVE_VIEW_TYPE_*`)
- New command ID namespace (`weave-ai:*`)

### Changed
- Plugin ID: `obsidian-ai-cli` → `weave-ai`
- Plugin name: `Obsidian AI CLI` → `WEAVE-AI`
- Author: `BlackDragonBE` → `Ross`
- Description updated to reflect writing focus

---

## Version History

| Version | Date | Summary |
|---------|------|---------|
| 0.0.4 | 2025-11-29 | Multi-target deploy system |
| 0.0.3 | 2025-11-28 | Settings UI refresh |
| 0.0.2 | 2025-11-28 | Major UI overhaul |
| 0.0.1 | 2025-11-28 | Fork and rebrand |
