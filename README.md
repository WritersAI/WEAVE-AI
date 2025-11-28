# WEAVE-AI

**Writer's Enhanced AI Vault Experience** — Orchestrate your writing with AI-powered assistance.

An Obsidian plugin that integrates multiple AI CLI tools directly into your workspace through a modern chat-style interface.

## Features

- **Modern Chat Interface**: Message bubbles, streaming responses, and persistent chat history
- **Multi-AI Support**: Claude Code, Gemini CLI, OpenAI Codex, and Qwen Code
- **Gear Menu**: Quick access to model switching, context toggle, and saved prompts
- **Automatic Context**: Current file and selected text passed to AI automatically
- **File References**: Use `@filename.md` syntax to reference other vault files
- **Real-time Streaming**: See AI responses as they're generated
- **Collapsible Thinking**: View AI reasoning in expandable section

## History

WEAVE-AI is a fork of [Obsidian AI CLI](https://github.com/BlackDragonBE/obsidian-ai-cli) by BlackDragonBE (v1.0.7). It has been substantially rewritten with a new UI, rebranded, and refocused for writers. See [docs/CHANGELOG-LEGACY.md](docs/CHANGELOG-LEGACY.md) for pre-fork history.

## Prerequisites

Install at least one supported CLI tool:

| Tool | Install | Test Command |
|------|---------|--------------|
| Claude Code | [claude.ai/code](https://claude.ai/code) | `claude --version` |
| Gemini CLI | [github.com/google-gemini/gemini-cli](https://github.com/google-gemini/gemini-cli) | `gemini --version` |
| OpenAI Codex | [openai.com](https://openai.com) | `codex --version` |
| Qwen Code | [github.com/anthropics/qwen-code](https://github.com/anthropics/qwen-code) | `qwen --version` |

## Installation

### BRAT (Recommended)

1. Install [BRAT](https://github.com/TfTHacker/obsidian42-brat) from Community Plugins
2. In BRAT settings, click "Add Beta Plugin"
3. Enter: `WritersAI/WEAVE-AI`
4. Enable WEAVE-AI in Community Plugins

### Manual Installation

1. Download the latest release
2. Extract to `YourVault/.obsidian/plugins/weave-ai/`
3. Enable in Settings → Community Plugins

## Usage

1. Open command palette (`Cmd/Ctrl + P`)
2. Search "Open WEAVE-AI"
3. Type your prompt and press `Enter`

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Enter` | Send prompt |
| `Shift+Enter` | New line |
| `Escape` | Stop execution |
| `@` | File autocomplete |

### Gear Menu

Click the gear icon (⚙) to access:
- **Model**: Switch between AI tools (only tested models shown)
- **Context**: Toggle file/selection context on/off
- **Prompts**: Load or save prompts

## Settings

Go to Settings → WEAVE-AI to configure:
- CLI tool paths for each model
- Click status circles to test each tool
- Set prompt library file location

## Development

### Quick Start

```bash
git clone https://github.com/WritersAI/WEAVE-AI.git
cd WEAVE-AI
npm install
npm run dev
```

### Hot Reload Setup

For live development with automatic reloading:

1. **Install BRAT**: Required to load the Hot Reload plugin
   - Settings → Community Plugins → Browse → search "BRAT"
   - Install and enable BRAT

2. **Install Hot Reload via BRAT**:
   - BRAT Settings → Add Beta Plugin
   - Enter: `pjeby/hot-reload`
   - Enable Hot Reload in Community Plugins

3. **Symlink or clone plugin to vault**:
   ```bash
   # Option A: Symlink (recommended)
   ln -s /path/to/WEAVE-AI /path/to/YourVault/.obsidian/plugins/weave-ai

   # Option B: Clone directly into vault
   cd YourVault/.obsidian/plugins
   git clone https://github.com/WritersAI/WEAVE-AI.git weave-ai
   ```

4. **Run dev build**:
   ```bash
   npm run dev
   ```
   This watches for changes and rebuilds automatically. Hot Reload detects the new `main.js` and reloads the plugin.

### Build Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Development build with file watching |
| `npm run build` | Production build (TypeScript check + minified) |
| `npm run version` | Bump version in manifest and package files |

### Architecture

```
WEAVE-AI/
├── main.ts           # Plugin entry, ToolView, Settings
├── styles.css        # All UI styling
├── manifest.json     # Plugin metadata
├── src/              # Future: modular components
│   ├── views/
│   ├── components/
│   ├── services/
│   └── utils/
└── docs/             # Documentation
```

See [CLAUDE.md](CLAUDE.md) for detailed architecture notes.

## Troubleshooting

### CLI Tool Not Found
1. Verify tool works in terminal: `claude --version`
2. Check path in WEAVE-AI settings
3. Use full path if not in system PATH
4. Restart Obsidian after changing settings

### No Context Detected
1. Click in the editor to ensure it's focused
2. Switch files and back
3. Ensure you're in editing mode (not reading mode)

### Hot Reload Not Working
1. Ensure BRAT is installed and enabled
2. Ensure Hot Reload plugin is enabled
3. Check that `.hotreload` file exists in plugin folder
4. Verify `npm run dev` is running

## License

MIT License. See [LICENSE](LICENSE) for details.

WEAVE-AI is a fork of [Obsidian AI CLI](https://github.com/BlackDragonBE/obsidian-ai-cli) by BlackDragonBE.

---

Made with ❤️ for writers with ADHD.
