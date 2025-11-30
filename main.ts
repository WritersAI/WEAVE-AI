import { App, Editor, MarkdownView, Notice, Plugin, PluginSettingTab, Setting, ItemView, WorkspaceLeaf, TFile, addIcon, MarkdownRenderer, Component, Modal } from 'obsidian';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import { writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';

const execAsync = promisify(exec);

interface ObsidianAICliSettings {
	claudeCodePath: string;
	geminiCliPath: string;
	codexPath: string;
	qwenPath: string;
	claudeParams: string;
	geminiParams: string;
	codexParams: string;
	qwenParams: string;
	promptStorageFile: string;
	selectedTool: 'claude' | 'gemini' | 'codex' | 'qwen';
	testedTools: string[]; // Tools that were previously tested as working
}

const DEFAULT_SETTINGS: ObsidianAICliSettings = {
	claudeCodePath: 'claude',
	geminiCliPath: 'gemini',
	codexPath: 'codex',
	qwenPath: 'qwen',
	claudeParams: '--allowedTools Read,Edit,Write,Bash,Grep,MultiEdit,WebFetch,TodoRead,TodoWrite,WebSearch',
	geminiParams: '--yolo',
	codexParams: 'exec --dangerously-bypass-approvals-and-sandbox --skip-git-repo-check',
	qwenParams: '--yolo',
	promptStorageFile: 'System/AI Prompts.md',
	selectedTool: 'claude',
	testedTools: []
}

// WEAVE-AI View Type Constants
const WEAVE_VIEW_TYPE_CLAUDE = 'weave-ai-claude';
const WEAVE_VIEW_TYPE_GEMINI = 'weave-ai-gemini';
const WEAVE_VIEW_TYPE_CODEX = 'weave-ai-codex';
const WEAVE_VIEW_TYPE_QWEN = 'weave-ai-qwen';

// Legacy view type aliases for migration compatibility
const CLAUDE_VIEW_TYPE = WEAVE_VIEW_TYPE_CLAUDE;
const GEMINI_VIEW_TYPE = WEAVE_VIEW_TYPE_GEMINI;
const CODEX_VIEW_TYPE = WEAVE_VIEW_TYPE_CODEX;
const QWEN_VIEW_TYPE = WEAVE_VIEW_TYPE_QWEN;

export default class ObsidianAICliPlugin extends Plugin {
	settings: ObsidianAICliSettings;

	async onload() {
		await this.loadSettings();

		// Register custom icons
		console.log('Registering Claude and Gemini icons...');
		addIcon('claude-icon', `<svg xmlns="http://www.w3.org/2000/svg" shape-rendering="geometricPrecision" text-rendering="geometricPrecision" image-rendering="optimizeQuality" fill-rule="evenodd" clip-rule="evenodd" viewBox="0 0 512 509.64"><path fill="#D77655" d="M115.612 0h280.775C459.974 0 512 52.026 512 115.612v278.415c0 63.587-52.026 115.612-115.613 115.612H115.612C52.026 509.639 0 457.614 0 394.027V115.612C0 52.026 52.026 0 115.612 0z"/><path fill="#FCF2EE" fill-rule="nonzero" d="M142.27 316.619l73.655-41.326 1.238-3.589-1.238-1.996-3.589-.001-12.31-.759-42.084-1.138-36.498-1.516-35.361-1.896-8.897-1.895-8.34-10.995.859-5.484 7.482-5.03 10.717.935 23.683 1.617 35.537 2.452 25.782 1.517 38.193 3.968h6.064l.86-2.451-2.073-1.517-1.618-1.517-36.776-24.922-39.81-26.338-20.852-15.166-11.273-7.683-5.687-7.204-2.451-15.721 10.237-11.273 13.75.935 3.513.936 13.928 10.716 29.749 23.027 38.848 28.612 5.687 4.727 2.275-1.617.278-1.138-2.553-4.271-21.13-38.193-22.546-38.848-10.035-16.101-2.654-9.655c-.935-3.968-1.617-7.304-1.617-11.374l11.652-15.823 6.445-2.073 15.545 2.073 6.547 5.687 9.655 22.092 15.646 34.78 24.265 47.291 7.103 14.028 3.791 12.992 1.416 3.968 2.449-.001v-2.275l1.997-26.641 3.69-32.707 3.589-42.084 1.239-11.854 5.863-14.206 11.652-7.683 9.099 4.348 7.482 10.716-1.036 6.926-4.449 28.915-8.72 45.294-5.687 30.331h3.313l3.792-3.791 15.342-20.372 25.782-32.227 11.374-12.789 13.27-14.129 8.517-6.724 16.1-.001 11.854 17.617-5.307 18.199-16.581 21.029-13.75 17.819-19.716 26.54-12.309 21.231 1.138 1.694 2.932-.278 44.536-9.479 24.062-4.347 28.714-4.928 12.992 6.066 1.416 6.167-5.106 12.613-30.71 7.583-36.018 7.204-53.636 12.689-.657.48.758.935 24.164 2.275 10.337.556h25.301l47.114 3.514 12.309 8.139 7.381 9.959-1.238 7.583-18.957 9.655-25.579-6.066-59.702-14.205-20.474-5.106-2.83-.001v1.694l17.061 16.682 31.266 28.233 39.152 36.397 1.997 8.999-5.03 7.102-5.307-.758-34.401-25.883-13.27-11.651-30.053-25.302-1.996-.001v2.654l6.926 10.136 36.574 54.975 1.895 16.859-2.653 5.485-9.479 3.311-10.414-1.895-21.408-30.054-22.092-33.844-17.819-30.331-2.173 1.238-10.515 113.261-4.929 5.788-11.374 4.348-9.478-7.204-5.03-11.652 5.03-23.027 6.066-30.052 4.928-23.886 4.449-29.674 2.654-9.858-.177-.657-2.173.278-22.37 30.71-34.021 45.977-26.919 28.815-6.445 2.553-11.173-5.789 1.037-10.337 6.243-9.2 37.257-47.392 22.47-29.371 14.508-16.961-.101-2.451h-.859l-98.954 64.251-17.618 2.275-7.583-7.103.936-11.652 3.589-3.791 29.749-20.474-.101.102.024.101z"/></svg>`);
		console.log('Claude icon registered');

		addIcon('gemini-icon', `<svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path d="M16 8.016A8.522 8.522 0 008.016 16h-.032A8.521 8.521 0 000 8.016v-.032A8.521 8.521 0 007.984 0h.032A8.522 8.522 0 0016 7.984v.032z" fill="url(#prefix__paint0_radial_980_20147)"/><defs><radialGradient id="prefix__paint0_radial_980_20147" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="matrix(16.1326 5.4553 -43.70045 129.2322 1.588 6.503)"><stop offset=".067" stop-color="#9168C0"/><stop offset=".343" stop-color="#5684D1"/><stop offset=".672" stop-color="#1BA1E3"/></radialGradient></defs></svg>`);
		console.log('Gemini icon registered');

		addIcon('codex-icon', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 158.7128 157.296"><path fill="white" d="M60.8734,57.2556v-14.9432c0-1.2586.4722-2.2029,1.5728-2.8314l30.0443-17.3023c4.0899-2.3593,8.9662-3.4599,13.9988-3.4599,18.8759,0,30.8307,14.6289,30.8307,30.2006,0,1.1007,0,2.3593-.158,3.6178l-31.1446-18.2467c-1.8872-1.1006-3.7754-1.1006-5.6629,0l-39.4812,22.9651ZM131.0276,115.4561v-35.7074c0-2.2028-.9446-3.7756-2.8318-4.8763l-39.481-22.9651,12.8982-7.3934c1.1007-.6285,2.0453-.6285,3.1458,0l30.0441,17.3024c8.6523,5.0341,14.4708,15.7296,14.4708,26.1107,0,11.9539-7.0769,22.965-18.2461,27.527v.0021ZM51.593,83.9964l-12.8982-7.5497c-1.1007-.6285-1.5728-1.5728-1.5728-2.8314v-34.6048c0-16.8303,12.8982-29.5722,30.3585-29.5722,6.607,0,12.7403,2.2029,17.9324,6.1349l-30.987,17.9324c-1.8871,1.1007-2.8314,2.6735-2.8314,4.8764v45.6159l-.0014-.0015ZM79.3562,100.0403l-18.4829-10.3811v-22.0209l18.4829-10.3811,18.4812,10.3811v22.0209l-18.4812,10.3811ZM91.2319,147.8591c-6.607,0-12.7403-2.2031-17.9324-6.1344l30.9866-17.9333c1.8872-1.1005,2.8318-2.6728,2.8318-4.8759v-45.616l13.0564,7.5498c1.1005.6285,1.5723,1.5728,1.5723,2.8314v34.6051c0,16.8297-13.0564,29.5723-30.5147,29.5723v.001ZM53.9522,112.7822l-30.0443-17.3024c-8.652-5.0343-14.471-15.7296-14.471-26.1107,0-12.1119,7.2356-22.9652,18.403-27.5272v35.8634c0,2.2028.9443,3.7756,2.8314,4.8763l39.3248,22.8068-12.8982,7.3938c-1.1007.6287-2.045.6287-3.1456,0ZM52.2229,138.5791c-17.7745,0-30.8306-13.3713-30.8306-29.8871,0-1.2585.1578-2.5169.3143-3.7754l30.987,17.9323c1.8871,1.1005,3.7757,1.1005,5.6628,0l39.4811-22.807v14.9435c0,1.2585-.4721,2.2021-1.5728,2.8308l-30.0443,17.3025c-4.0898,2.359-8.9662,3.4605-13.9989,3.4605h.0014ZM91.2319,157.296c19.0327,0,34.9188-13.5272,38.5383-31.4594,17.6164-4.562,28.9425-21.0779,28.9425-37.908,0-11.0112-4.719-21.7066-13.2133-29.4143.7867-3.3035,1.2595-6.607,1.2595-9.909,0-22.4929-18.2471-39.3247-39.3251-39.3247-4.2461,0-8.3363.6285-12.4262,2.045-7.0792-6.9213-16.8318-11.3254-27.5271-11.3254-19.0331,0-34.9191,13.5268-38.5384,31.4591C11.3255,36.0212,0,52.5373,0,69.3675c0,11.0112,4.7184,21.7065,13.2125,29.4142-.7865,3.3035-1.2586,6.6067-1.2586,9.9092,0,22.4923,18.2466,39.3241,39.3248,39.3241,4.2462,0,8.3362-.6277,12.426-2.0441,7.0776,6.921,16.8302,11.3251,27.5271,11.3251Z"/></svg>`);
		console.log('Codex icon registered');

		addIcon('qwen-icon', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><path d="M174.82 108.75L155.38 75L165.64 57.75C166.46 56.31 166.46 54.53 165.64 53.09L155.38 35.84C154.86 34.91 153.87 34.33 152.78 34.33H114.88L106.14 19.03C105.62 18.1 104.63 17.52 103.54 17.52H83.3C82.21 17.52 81.22 18.1 80.7 19.03L61.26 52.77H41.02C39.93 52.77 38.94 53.35 38.42 54.28L28.16 71.53C27.34 72.97 27.34 74.75 28.16 76.19L45.52 107.5L36.78 122.8C35.96 124.24 35.96 126.02 36.78 127.46L47.04 144.71C47.56 145.64 48.55 146.22 49.64 146.22H87.54L96.28 161.52C96.8 162.45 97.79 163.03 98.88 163.03H119.12C120.21 163.03 121.2 162.45 121.72 161.52L141.16 127.78H158.52C159.61 127.78 160.6 127.2 161.12 126.27L171.38 109.02C172.2 107.58 172.2 105.8 171.38 104.36L174.82 108.75Z" fill="url(#paint0_radial)"/><path d="M119.12 163.03H98.88L87.54 144.71H49.64L61.26 126.39H80.7L38.42 55.29H61.26L83.3 19.03L93.56 37.35L83.3 55.29H161.58L151.32 72.54L170.76 106.28H151.32L141.16 88.34L101.18 163.03H119.12Z" fill="white"/><path d="M127.86 79.83H76.14L101.18 122.11L127.86 79.83Z" fill="url(#paint1_radial)"/><defs><radialGradient id="paint0_radial" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(100 100) rotate(90) scale(100)"><stop stop-color="#665CEE"/><stop offset="1" stop-color="#332E91"/></radialGradient><radialGradient id="paint1_radial" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(100 100) rotate(90) scale(100)"><stop stop-color="#665CEE"/><stop offset="1" stop-color="#332E91"/></radialGradient></defs></svg>`);
		console.log('Qwen icon registered');

		this.registerView(
			CLAUDE_VIEW_TYPE,
			(leaf) => new ToolView(leaf, this, 'claude')
		);

		this.registerView(
			GEMINI_VIEW_TYPE,
			(leaf) => new ToolView(leaf, this, 'gemini')
		);

		this.registerView(
			CODEX_VIEW_TYPE,
			(leaf) => new ToolView(leaf, this, 'codex')
		);

		this.registerView(
			QWEN_VIEW_TYPE,
			(leaf) => new ToolView(leaf, this, 'qwen')
		);

		this.addCommand({
			id: 'weave-ai:open',
			name: 'Open WEAVE-AI',
			callback: () => {
				this.activateWeaveView();
			}
		});

		this.addSettingTab(new ObsidianAICliSettingTab(this.app, this));
	}

	async activateWeaveView() {
		const { workspace } = this.app;

		// Check for any existing WEAVE view
		const viewTypes = [CLAUDE_VIEW_TYPE, GEMINI_VIEW_TYPE, CODEX_VIEW_TYPE, QWEN_VIEW_TYPE];
		for (const viewType of viewTypes) {
			const leaves = workspace.getLeavesOfType(viewType);
			if (leaves.length > 0) {
				workspace.revealLeaf(leaves[0]);
				return;
			}
		}

		// Try to open in right sidebar bottom (where Outline lives)
		// Look for an existing leaf in that area to open next to
		let targetLeaf: WorkspaceLeaf | null = null;

		// Try to find Outline or other common bottom-right views to open next to
		const bottomRightTypes = ['outline', 'backlink', 'tag-pane', 'outgoing-link'];
		for (const type of bottomRightTypes) {
			const leaves = workspace.getLeavesOfType(type);
			if (leaves.length > 0) {
				// Create new leaf in same split as this view
				targetLeaf = workspace.createLeafInParent(leaves[0].parent, -1);
				break;
			}
		}

		// Fallback to right sidebar if no bottom-right view found
		if (!targetLeaf) {
			targetLeaf = workspace.getRightLeaf(false);
		}

		if (targetLeaf) {
			await targetLeaf.setViewState({ type: CLAUDE_VIEW_TYPE, active: true });
			workspace.revealLeaf(targetLeaf);
		}
	}

	onunload() {
		this.app.workspace.detachLeavesOfType(CLAUDE_VIEW_TYPE);
		this.app.workspace.detachLeavesOfType(GEMINI_VIEW_TYPE);
		this.app.workspace.detachLeavesOfType(CODEX_VIEW_TYPE);
		this.app.workspace.detachLeavesOfType(QWEN_VIEW_TYPE);
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	getCurrentContext(): { file: TFile | null, selection: string, lineRange: { start: number, end: number } | null, debug: string } {
		let debugInfo = '';
		let file = null;
		let selection = '';
		let lineRange: { start: number, end: number } | null = null;

		// Method 1: Try getActiveFile() (most reliable)
		file = this.app.workspace.getActiveFile();
		debugInfo += `getActiveFile(): ${file ? file.path : 'null'}\n`;

		// Method 2: Get active MarkdownView for selection
		let activeView = null;
		
		// First try getMostRecentLeaf (since this worked for you)
		const mostRecentLeaf = this.app.workspace.getMostRecentLeaf();
		if (mostRecentLeaf?.view instanceof MarkdownView) {
			activeView = mostRecentLeaf.view;
			debugInfo += `Found MarkdownView via getMostRecentLeaf\n`;
		}

		// Fallback to getActiveViewOfType
		if (!activeView) {
			activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
			if (activeView) {
				debugInfo += `Found MarkdownView via getActiveViewOfType\n`;
			} else {
				debugInfo += `No MarkdownView found via getActiveViewOfType\n`;
			}
		}

		// Fallback to activeLeaf
		if (!activeView) {
			const activeLeaf = this.app.workspace.activeLeaf;
			if (activeLeaf?.view instanceof MarkdownView) {
				activeView = activeLeaf.view;
				debugInfo += `Found MarkdownView via activeLeaf\n`;
			}
		}

		// Get selection if we have an activeView
		if (activeView) {
			debugInfo += `ActiveView file: ${activeView.file?.path || 'null'}\n`;
			
			// If getActiveFile() didn't work, use the file from activeView
			if (!file && activeView.file) {
				file = activeView.file;
				debugInfo += `Using file from activeView\n`;
			}
			
			// Try to get selection from the editor
			if (activeView.editor) {
				selection = activeView.editor.getSelection() || '';
				debugInfo += `Selection length: ${selection.length}\n`;
				if (selection.length > 0) {
					debugInfo += `Selection preview: "${selection.substring(0, 50)}${selection.length > 50 ? '...' : ''}"\n`;
					
					// Get line range for selection
					const selectionRange = activeView.editor.listSelections()[0];
					if (selectionRange) {
						lineRange = {
							start: selectionRange.anchor.line + 1, // Convert to 1-based line numbers
							end: selectionRange.head.line + 1
						};
						// Ensure start is always less than or equal to end
						if (lineRange.start > lineRange.end) {
							[lineRange.start, lineRange.end] = [lineRange.end, lineRange.start];
						}
						debugInfo += `Line range: ${lineRange.start}-${lineRange.end}\n`;
					}
				}
			} else {
				debugInfo += `No editor found on activeView\n`;
			}
		} else {
			debugInfo += `No MarkdownView found\n`;
		}

		return { file, selection, lineRange, debug: debugInfo };
	}

	async expandFileReferences(prompt: string): Promise<string> {
		const filePattern = /@([^\s]+\.md)/g;
		let expandedPrompt = prompt;
		const matches = prompt.match(filePattern);
		
		if (matches) {
			for (const match of matches) {
				const fileName = match.substring(1);
				const file = this.app.vault.getAbstractFileByPath(fileName);
				
				if (file instanceof TFile) {
					try {
						const content = await this.app.vault.read(file);
						expandedPrompt = expandedPrompt.replace(match, `File: ${fileName}\nContent:\n${content}\n`);
					} catch (error) {
						expandedPrompt = expandedPrompt.replace(match, `[Error reading file: ${fileName}]`);
					}
				} else {
					expandedPrompt = expandedPrompt.replace(match, `[File not found: ${fileName}]`);
				}
			}
		}
		
		return expandedPrompt;
	}

	async loadPrompts(): Promise<{[key: string]: string}> {
		const file = this.app.vault.getAbstractFileByPath(this.settings.promptStorageFile);
		if (!(file instanceof TFile)) {
			return {};
		}

		try {
			const content = await this.app.vault.read(file);
			const prompts: {[key: string]: string} = {};
			
			// Parse markdown headings and content
			const lines = content.split('\n');
			let currentPromptName = '';
			let currentPromptContent: string[] = [];
			
			for (const line of lines) {
				const headingMatch = line.match(/^#+ (.+)$/);
				if (headingMatch) {
					// Save previous prompt if exists
					if (currentPromptName && currentPromptContent.length > 0) {
						prompts[currentPromptName] = currentPromptContent.join('\n').trim();
					}
					// Start new prompt
					currentPromptName = headingMatch[1];
					currentPromptContent = [];
				} else if (currentPromptName) {
					// Add content to current prompt
					currentPromptContent.push(line);
				}
			}
			
			// Save last prompt
			if (currentPromptName && currentPromptContent.length > 0) {
				prompts[currentPromptName] = currentPromptContent.join('\n').trim();
			}
			
			return prompts;
		} catch (error) {
			console.error('Failed to load prompts:', error);
			return {};
		}
	}

	async savePrompt(name: string, content: string): Promise<void> {
		// Ensure we have a valid prompt name and content
		if (!name.trim() || !content.trim()) {
			throw new Error('Prompt name and content cannot be empty');
		}

		let file = this.app.vault.getAbstractFileByPath(this.settings.promptStorageFile);
		let fileContent = '';
		let prompts: {[key: string]: string} = {};
		
		// Load existing prompts if file exists
		if (file instanceof TFile) {
			prompts = await this.loadPrompts();
		}
		
		// Add or update the prompt
		prompts[name] = content;
		
		// Generate markdown content
		const sortedNames = Object.keys(prompts).sort();
		for (const promptName of sortedNames) {
			fileContent += `# ${promptName}\n\n${prompts[promptName]}\n\n`;
		}
		
		// Create or update the file
		if (file instanceof TFile) {
			await this.app.vault.modify(file, fileContent);
		} else {
			await this.app.vault.create(this.settings.promptStorageFile, fileContent);
		}
	}

	async deletePrompt(name: string): Promise<void> {
		const file = this.app.vault.getAbstractFileByPath(this.settings.promptStorageFile);
		if (!(file instanceof TFile)) {
			return;
		}

		const prompts = await this.loadPrompts();
		delete prompts[name];
		
		// Regenerate file content without the deleted prompt
		let fileContent = '';
		const sortedNames = Object.keys(prompts).sort();
		for (const promptName of sortedNames) {
			fileContent += `# ${promptName}\n\n${prompts[promptName]}\n\n`;
		}
		
		await this.app.vault.modify(file, fileContent);
	}
}

// Chat message interface for history
interface ChatMessage {
	role: 'user' | 'assistant';
	content: string;
	timestamp: Date;
	isStreaming?: boolean;
}

class ToolView extends ItemView {
	plugin: ObsidianAICliPlugin;
	toolType: 'claude' | 'gemini' | 'codex' | 'qwen';

	// New UI elements for chat layout
	private containerEl_: HTMLDivElement;
	private responseArea: HTMLDivElement;
	private thinkingSection: HTMLDetailsElement;
	private thinkingContent: HTMLDivElement;
	private inputArea: HTMLDivElement;
	private promptInput: HTMLTextAreaElement;
	private sendButton: HTMLButtonElement;
	private contextBar: HTMLDivElement;
	private gearButton: HTMLButtonElement;

	// Chat history
	private chatHistory: ChatMessage[] = [];
	private currentStreamingMessage: HTMLDivElement | null = null;

	// State
	isRunning: boolean = false;
	currentProcess: any = null;
	contextEnabled: boolean = true;
	private thinkingBuffer: string = '';
	private responseBuffer: string = '';
	private userScrolledUp: boolean = false;

	// Autocomplete
	private eventRefs: any[] = [];
	private autocompleteEl: HTMLDivElement | null = null;
	private currentAutocompleteItems: string[] = [];
	private selectedAutocompleteIndex: number = -1;
	private cachedFiles: string[] = [];
	private autocompleteDebounceTimer: number | null = null;
	private selectionPollInterval: number | null = null;

	constructor(leaf: WorkspaceLeaf, plugin: ObsidianAICliPlugin, toolType: 'claude' | 'gemini' | 'codex' | 'qwen') {
		super(leaf);
		this.plugin = plugin;
		// Use saved tool preference, fallback to passed toolType
		this.toolType = plugin.settings.selectedTool || toolType;
		this.eventRefs = [];
	}

	registerEvent(eventRef: any) {
		this.eventRefs.push(eventRef);
	}

	getViewType() {
		switch (this.toolType) {
			case 'claude': return CLAUDE_VIEW_TYPE;
			case 'gemini': return GEMINI_VIEW_TYPE;
			case 'codex': return CODEX_VIEW_TYPE;
			case 'qwen': return QWEN_VIEW_TYPE;
		}
	}

	getDisplayText() {
		return "WEAVE-AI";
	}

	getIcon() {
		// Use WEAVE icon for all views (tool indicated by dropdown)
		return 'bot';
	}

	getToolDisplayName(tool: 'claude' | 'gemini' | 'codex' | 'qwen'): string {
		switch (tool) {
			case 'claude': return "Claude Code";
			case 'gemini': return "Gemini CLI";
			case 'codex': return "OpenAI Codex";
			case 'qwen': return "Qwen Code";
		}
	}

	async onOpen() {
		const container = this.containerEl.children[1] as HTMLElement;
		container.empty();
		container.addClass('weave-container');

		// === RESPONSE AREA (chat history) ===
		this.responseArea = container.createDiv('weave-response-area');

		// Chat messages container
		const chatContainer = this.responseArea.createDiv('weave-chat-container');

		// Welcome message
		this.addSystemMessage(chatContainer, `Welcome to WEAVE-AI! Using ${this.getToolDisplayName(this.toolType)}.\n\nType a prompt below and press Enter to send. Use @ to reference files.`);

		// Track scroll position for auto-scroll behavior
		this.responseArea.addEventListener('scroll', () => {
			const isAtBottom = this.responseArea.scrollHeight - this.responseArea.scrollTop <= this.responseArea.clientHeight + 50;
			this.userScrolledUp = !isAtBottom;
		});

		// === INPUT AREA ===
		this.inputArea = container.createDiv('weave-input-area');

		this.promptInput = this.inputArea.createEl('textarea', {
			cls: 'weave-prompt-input',
			attr: {
				placeholder: `Ask ${this.getToolDisplayName(this.toolType)}...`,
				rows: '1'
			}
		});

		// Auto-resize textarea
		this.promptInput.addEventListener('input', () => {
			this.autoResizeInput();
			this.handleAutocomplete({ target: this.promptInput } as any);
		});

		// Enter to submit, Shift+Enter for newline
		this.promptInput.addEventListener('keydown', (e) => {
			if (e.key === 'Enter' && !e.shiftKey) {
				e.preventDefault();
				if (!this.isRunning) {
					this.runTool();
				}
			} else if (e.key === 'Escape') {
				if (this.isRunning) {
					this.cancelTool();
				} else {
					this.promptInput.value = '';
					this.autoResizeInput();
				}
			} else {
				this.handleAutocompleteKeydown(e);
			}
		});

		this.promptInput.addEventListener('blur', () => {
			setTimeout(() => this.hideAutocomplete(), 200);
		});

		// Send/Stop button
		this.sendButton = this.inputArea.createEl('button', { cls: 'weave-send-button' });
		this.updateSendButton();
		this.sendButton.addEventListener('click', () => {
			if (this.isRunning) {
				this.cancelTool();
			} else {
				this.runTool();
			}
		});

		// === CONTEXT BAR ===
		this.contextBar = container.createDiv('weave-context-bar');

		// Left side: context info
		const contextLeft = this.contextBar.createDiv('weave-context-left');
		const contextInfo = contextLeft.createSpan({ cls: 'weave-context-info' });
		contextInfo.addEventListener('click', () => this.updateContext());

		// Right side: Gear button (settings menu)
		const contextRight = this.contextBar.createDiv('weave-context-right');
		this.gearButton = contextRight.createEl('button', {
			cls: 'weave-gear-button'
		});
		this.gearButton.createSpan({ text: '⚙', cls: 'weave-gear-icon' });
		this.gearButton.addEventListener('click', () => this.showGearMenu());

		// Register workspace change listeners
		this.registerEvent(this.plugin.app.workspace.on('active-leaf-change', () => {
			this.updateContext();
		}));

		this.registerEvent(this.plugin.app.workspace.on('file-open', () => {
			this.updateContext();
		}));

		// Update context on editor changes (including selection)
		this.registerEvent(this.plugin.app.workspace.on('editor-change', () => {
			this.updateContext();
		}));

		// Poll for selection changes (editor-change doesn't catch all selection events)
		this.selectionPollInterval = window.setInterval(() => {
			this.updateContextDisplay();
		}, 500);

		// Register vault change listeners for file cache invalidation
		this.registerEvent(this.plugin.app.vault.on('create', () => {
			this.invalidateFileCache();
		}));

		this.registerEvent(this.plugin.app.vault.on('delete', () => {
			this.invalidateFileCache();
		}));

		this.registerEvent(this.plugin.app.vault.on('rename', () => {
			this.invalidateFileCache();
		}));

		// Initialize context display
		this.updateContext();
	}

	// Auto-resize input textarea (1-5 rows)
	private autoResizeInput() {
		this.promptInput.style.height = 'auto';
		const lineHeight = 24; // Approximate line height
		const minHeight = lineHeight;
		const maxHeight = lineHeight * 5;
		const scrollHeight = this.promptInput.scrollHeight;
		this.promptInput.style.height = Math.min(Math.max(scrollHeight, minHeight), maxHeight) + 'px';
	}

	// Update send button appearance
	private updateSendButton() {
		this.sendButton.empty();
		if (this.isRunning) {
			this.sendButton.addClass('weave-stop-button');
			this.sendButton.removeClass('weave-send-button');
			this.sendButton.createSpan({ text: '⏹', cls: 'weave-button-icon' });
		} else {
			this.sendButton.removeClass('weave-stop-button');
			this.sendButton.addClass('weave-send-button');
			this.sendButton.createSpan({ text: '↑', cls: 'weave-button-icon' });
		}
	}

	// Switch to a different tool
	private switchTool(newTool: 'claude' | 'gemini' | 'codex' | 'qwen'): void {
		if (newTool === this.toolType) return;

		// Confirm if there's chat history
		if (this.chatHistory.length > 0) {
			if (!confirm(`Switch to ${this.getToolDisplayName(newTool)}? This will clear the current conversation.`)) {
				return;
			}
		}

		this.toolType = newTool;
		this.plugin.settings.selectedTool = newTool;
		this.plugin.saveSettings();
		this.chatHistory = [];
		this.promptInput.placeholder = `Ask ${this.getToolDisplayName(newTool)}...`;

		// Clear and reset response area (this also removes any thinking sections)
		const chatContainer = this.responseArea.querySelector('.weave-chat-container');
		if (chatContainer) {
			chatContainer.empty();
			this.addSystemMessage(chatContainer as HTMLElement, `Switched to ${this.getToolDisplayName(newTool)}.\n\nType a prompt below and press Enter to send.`);
		}

		// Reset thinking state
		this.thinkingSection = null as any;
		this.thinkingContent = null as any;
		this.thinkingSummaryEl = null;
		this.thinkingBuffer = '';
	}

	// Add system message to chat
	private addSystemMessage(container: HTMLElement, text: string) {
		const msgEl = container.createDiv('weave-message weave-message-system');
		msgEl.createDiv({ text, cls: 'weave-message-content' });
	}

	// Add user message to chat
	private addUserMessage(text: string): HTMLDivElement {
		const chatContainer = this.responseArea.querySelector('.weave-chat-container') as HTMLElement;
		const msgEl = chatContainer.createDiv('weave-message weave-message-user');
		const contentEl = msgEl.createDiv({ cls: 'weave-message-content' });
		contentEl.setText(text);

		this.chatHistory.push({ role: 'user', content: text, timestamp: new Date() });
		this.scrollToBottom();
		return msgEl;
	}

	// Cute verbs for the thinking indicator (Claude Code style)
	private readonly thinkingVerbs = [
		'Pondering', 'Thinking', 'Contemplating', 'Reasoning', 'Processing',
		'Analyzing', 'Considering', 'Evaluating', 'Working', 'Computing',
		'Reflecting', 'Deliberating', 'Musing', 'Cogitating', 'Ruminating'
	];
	private thinkingSummaryEl: HTMLElement | null = null;

	// Create thinking section for current exchange (called after user message)
	private createThinkingSection(): void {
		const chatContainer = this.responseArea.querySelector('.weave-chat-container') as HTMLElement;

		// Create thinking/doing section
		this.thinkingSection = chatContainer.createEl('details', { cls: 'weave-thinking' });
		const thinkingSummary = this.thinkingSection.createEl('summary');
		this.thinkingSummaryEl = thinkingSummary.createSpan({ cls: 'weave-thinking-summary' });
		this.cycleThinkingVerb();
		this.thinkingContent = this.thinkingSection.createDiv('weave-thinking-content');
	}

	// Cycle to a random thinking verb
	private cycleThinkingVerb(): void {
		if (!this.thinkingSummaryEl) return;
		const verb = this.thinkingVerbs[Math.floor(Math.random() * this.thinkingVerbs.length)];
		this.thinkingSummaryEl.setText(`${verb}...`);
	}

	// Add assistant message placeholder for streaming
	private addAssistantMessage(): HTMLDivElement {
		const chatContainer = this.responseArea.querySelector('.weave-chat-container') as HTMLElement;
		const msgEl = chatContainer.createDiv('weave-message weave-message-assistant');

		const contentEl = msgEl.createDiv({ cls: 'weave-message-content' });
		contentEl.setText('...');

		// Add copy button at bottom
		const copyBtn = msgEl.createEl('button', {
			cls: 'weave-message-copy',
			text: 'Copy'
		});
		copyBtn.addEventListener('click', () => this.copyMessageContent(msgEl, copyBtn));

		this.currentStreamingMessage = msgEl;
		this.scrollToBottom();
		return msgEl;
	}

	// Copy message content to clipboard
	private async copyMessageContent(msgEl: HTMLElement, copyBtn: HTMLButtonElement): Promise<void> {
		const contentEl = msgEl.querySelector('.weave-message-content') as HTMLElement;
		if (!contentEl) return;

		// Get the original markdown from chat history
		const msgIndex = Array.from(this.responseArea.querySelectorAll('.weave-message-assistant')).indexOf(msgEl);
		const assistantMessages = this.chatHistory.filter(m => m.role === 'assistant');
		const text = assistantMessages[msgIndex]?.content || contentEl.innerText || '';

		try {
			await navigator.clipboard.writeText(text);

			// Visual feedback
			const originalText = copyBtn.textContent;
			copyBtn.textContent = 'Copied!';
			copyBtn.addClass('weave-message-copy-success');

			setTimeout(() => {
				copyBtn.textContent = originalText;
				copyBtn.removeClass('weave-message-copy-success');
			}, 1500);
		} catch (err) {
			console.error('Failed to copy:', err);
			new Notice('Failed to copy to clipboard');
		}
	}

	// Update streaming message content with markdown
	private async updateStreamingMessage(content: string) {
		if (!this.currentStreamingMessage) return;

		const contentEl = this.currentStreamingMessage.querySelector('.weave-message-content') as HTMLElement;
		if (!contentEl) return;

		contentEl.empty();
		const component = new Component();
		await MarkdownRenderer.renderMarkdown(content, contentEl, '', component);

		if (!this.userScrolledUp) {
			this.scrollToBottom();
		}
	}

	// Finalize streaming message
	private finalizeStreamingMessage(content: string) {
		if (content) {
			this.chatHistory.push({ role: 'assistant', content, timestamp: new Date() });
		}
		this.currentStreamingMessage = null;
	}

	// Scroll response area to bottom
	private scrollToBottom() {
		this.responseArea.scrollTop = this.responseArea.scrollHeight;
	}

	// Update context display in context bar
	private updateContextDisplay() {
		const contextInfo = this.contextBar.querySelector('.weave-context-info') as HTMLElement;
		if (!contextInfo) return;

		const { file, selection, lineRange } = this.plugin.getCurrentContext();

		let contextText = '';
		if (!this.contextEnabled) {
			contextText = '(context disabled)';
			contextInfo.addClass('weave-context-disabled');
		} else {
			contextInfo.removeClass('weave-context-disabled');
			if (file) {
				const fileName = file.path.split('/').pop() || file.path;
				contextText = `📄 ${fileName}`;
				if (selection && selection.trim() && lineRange) {
					contextText += ` • ✏️ L${lineRange.start}-${lineRange.end}`;
				}
			} else {
				contextText = '📄 No file';
			}
		}

		contextInfo.setText(contextText);

		// Set tooltip with full details
		let tooltip = this.contextEnabled ? '' : 'Context disabled\n';
		if (file) {
			tooltip += `File: ${file.path}`;
			if (selection && selection.trim()) {
				const preview = selection.length > 50 ? selection.substring(0, 50) + '...' : selection;
				tooltip += `\nSelection: "${preview}"`;
			}
		} else {
			tooltip += 'No file open';
		}
		contextInfo.setAttribute('title', tooltip);
	}

	// Show gear menu (tool selection + prompts)
	private async showGearMenu() {
		// Toggle: remove existing menu if open
		const existingMenu = document.querySelector('.weave-gear-menu');
		if (existingMenu) {
			existingMenu.remove();
			return;
		}

		const prompts = await this.plugin.loadPrompts();
		const promptNames = Object.keys(prompts).sort();

		const menu = document.createElement('div');
		menu.className = 'weave-gear-menu';

		// Model selection (expandable)
		const modelSection = menu.createDiv('weave-gear-section');
		const modelHeader = modelSection.createDiv('weave-gear-item weave-gear-model-header');
		modelHeader.createSpan({ text: `Model: ${this.getToolDisplayName(this.toolType)}`, cls: 'weave-gear-item-name' });
		modelHeader.createSpan({ text: '▸', cls: 'weave-gear-expand-icon' });

		const modelOptions = modelSection.createDiv('weave-gear-model-options');
		modelOptions.style.display = 'none';

		// Only show tested/available tools
		const testedTools = this.plugin.settings.testedTools || [];
		const availableTools: Array<'claude' | 'gemini' | 'codex' | 'qwen'> = ['claude', 'codex', 'qwen', 'gemini']
			.filter(t => testedTools.includes(t) && t !== this.toolType) as Array<'claude' | 'gemini' | 'codex' | 'qwen'>;

		if (availableTools.length === 0) {
			const noTools = modelOptions.createDiv('weave-gear-empty');
			noTools.setText('No other models available');
		} else {
			availableTools.forEach(tool => {
				const item = modelOptions.createDiv('weave-gear-item');
				item.createSpan({ text: this.getToolDisplayName(tool), cls: 'weave-gear-item-name' });
				item.addEventListener('click', () => {
					menu.remove();
					this.switchTool(tool);
				});
			});
		}

		modelHeader.addEventListener('click', () => {
			const isExpanded = modelOptions.style.display !== 'none';
			modelOptions.style.display = isExpanded ? 'none' : 'block';
			modelHeader.querySelector('.weave-gear-expand-icon')?.setText(isExpanded ? '▸' : '▾');
		});

		// Context toggle
		const contextItem = modelSection.createDiv('weave-gear-item weave-gear-context-toggle');
		contextItem.createSpan({
			text: `Context: ${this.contextEnabled ? 'On' : 'Off'}`,
			cls: 'weave-gear-item-name'
		});
		contextItem.addEventListener('click', () => {
			this.contextEnabled = !this.contextEnabled;
			this.updateContextDisplay();
			menu.remove();
		});

		// Prompts section
		const promptsSection = menu.createDiv('weave-gear-section');
		promptsSection.createDiv({ text: 'Prompts', cls: 'weave-gear-section-title' });

		if (promptNames.length === 0) {
			const emptyMsg = promptsSection.createDiv('weave-gear-empty');
			emptyMsg.setText('No saved prompts');
		} else {
			promptNames.forEach(name => {
				const item = promptsSection.createDiv('weave-gear-item');
				item.createSpan({ text: name, cls: 'weave-gear-item-name' });

				const deleteBtn = item.createSpan({ text: '×', cls: 'weave-gear-item-delete' });
				deleteBtn.addEventListener('click', async (e) => {
					e.stopPropagation();
					if (confirm(`Delete prompt "${name}"?`)) {
						await this.plugin.deletePrompt(name);
						menu.remove();
						new Notice(`Prompt "${name}" deleted`);
					}
				});

				item.addEventListener('click', () => {
					this.promptInput.value = prompts[name];
					this.autoResizeInput();
					menu.remove();
				});
			});
		}

		// Save prompt option
		const saveItem = promptsSection.createDiv('weave-gear-item weave-gear-save');
		saveItem.setText('+ Save current prompt');
		saveItem.addEventListener('click', () => {
			menu.remove();
			this.showSavePromptDialog();
		});

		// Position menu
		const rect = this.gearButton.getBoundingClientRect();
		menu.style.position = 'fixed';
		menu.style.bottom = (window.innerHeight - rect.top + 5) + 'px';
		menu.style.right = (window.innerWidth - rect.right) + 'px';

		document.body.appendChild(menu);

		// Close on click outside
		const closeHandler = (e: MouseEvent) => {
			if (!menu.contains(e.target as Node) && e.target !== this.gearButton) {
				menu.remove();
				document.removeEventListener('click', closeHandler);
			}
		};
		setTimeout(() => document.addEventListener('click', closeHandler), 0);
	}

	// Update thinking section content
	private updateThinkingContent(content: string) {
		if (!this.thinkingContent) return;
		this.thinkingContent.empty();
		this.thinkingContent.createEl('pre', { text: content, cls: 'weave-thinking-text' });
		// Cycle verb on each update for visual feedback
		this.cycleThinkingVerb();
	}

	handleAutocomplete(e: Event) {
		// Clear previous debounce timer
		if (this.autocompleteDebounceTimer) {
			clearTimeout(this.autocompleteDebounceTimer);
		}

		// Debounce the autocomplete to avoid excessive processing
		this.autocompleteDebounceTimer = window.setTimeout(() => {
			const input = e.target as HTMLTextAreaElement;
			const cursorPos = input.selectionStart;
			const text = input.value;
			
			// Find the last @ symbol before cursor
			let atIndex = -1;
			for (let i = cursorPos - 1; i >= 0; i--) {
				if (text[i] === '@') {
					atIndex = i;
					break;
				}
				if (text[i] === ' ' || text[i] === '\n') {
					break; // Stop at whitespace
				}
			}
			
			if (atIndex !== -1) {
				const searchTerm = text.substring(atIndex + 1, cursorPos);
				// Only show autocomplete if search term is at least 0 characters (so it shows on @)
				this.showAutocomplete(searchTerm, atIndex);
			} else {
				this.hideAutocomplete();
			}
		}, 150); // 150ms debounce delay
	}

	handleAutocompleteKeydown(e: KeyboardEvent) {
		if (!this.autocompleteEl || this.autocompleteEl.style.display === 'none') {
			return;
		}

		switch (e.key) {
			case 'ArrowDown':
				e.preventDefault();
				this.selectedAutocompleteIndex = Math.min(
					this.selectedAutocompleteIndex + 1,
					this.currentAutocompleteItems.length - 1
				);
				this.updateAutocompleteSelection();
				break;
			case 'ArrowUp':
				e.preventDefault();
				this.selectedAutocompleteIndex = Math.max(this.selectedAutocompleteIndex - 1, -1);
				this.updateAutocompleteSelection();
				break;
			case 'Enter':
			case 'Tab':
				if (this.selectedAutocompleteIndex >= 0) {
					e.preventDefault();
					this.selectAutocompleteItem(this.currentAutocompleteItems[this.selectedAutocompleteIndex]);
				}
				break;
			case 'Escape':
				this.hideAutocomplete();
				break;
		}
	}

	invalidateFileCache() {
		this.cachedFiles = [];
	}

	getFiles(): string[] {
		// Use cached files if available
		if (this.cachedFiles.length === 0) {
			this.cachedFiles = this.plugin.app.vault.getFiles().map(file => file.path);
		}
		return this.cachedFiles;
	}

	showAutocomplete(searchTerm: string, atIndex: number) {
		// Skip very short search terms to avoid showing too many results
		if (searchTerm.length === 0 && this.getFiles().length > 50) {
			this.hideAutocomplete();
			return;
		}

		// Get cached files
		const allFiles = this.getFiles();
		
		// Optimized search with early termination
		const searchTermLower = searchTerm.toLowerCase();
		const filteredFiles: string[] = [];
		const maxResults = 10;
		
		// First pass: exact matches at start of filename
		for (const filePath of allFiles) {
			if (filteredFiles.length >= maxResults) break;
			const fileName = filePath.split('/').pop()?.toLowerCase() || '';
			if (fileName.startsWith(searchTermLower)) {
				filteredFiles.push(filePath);
			}
		}
		
		// Second pass: partial matches if we need more results
		if (filteredFiles.length < maxResults && searchTerm.length > 0) {
			for (const filePath of allFiles) {
				if (filteredFiles.length >= maxResults) break;
				if (!filteredFiles.includes(filePath) && 
					filePath.toLowerCase().includes(searchTermLower)) {
					filteredFiles.push(filePath);
				}
			}
		}

		if (filteredFiles.length === 0) {
			this.hideAutocomplete();
			return;
		}

		this.currentAutocompleteItems = filteredFiles;
		this.selectedAutocompleteIndex = -1;

		if (!this.autocompleteEl) {
			this.autocompleteEl = document.createElement('div');
			this.autocompleteEl.className = 'file-autocomplete';
			document.body.appendChild(this.autocompleteEl);
		}

		// Position the autocomplete dropdown
		const rect = this.promptInput.getBoundingClientRect();
		this.autocompleteEl.style.position = 'fixed';
		this.autocompleteEl.style.left = rect.left + 'px';
		this.autocompleteEl.style.top = (rect.bottom + 2) + 'px';
		this.autocompleteEl.style.width = rect.width + 'px';
		this.autocompleteEl.style.display = 'block';

		// Populate the dropdown
		this.autocompleteEl.innerHTML = '';
		filteredFiles.forEach((filePath, index) => {
			const item = document.createElement('div');
			item.className = 'autocomplete-item';
			item.textContent = filePath;
			item.addEventListener('click', () => {
				this.selectAutocompleteItem(filePath);
			});
			this.autocompleteEl!.appendChild(item);
		});
	}

	hideAutocomplete() {
		if (this.autocompleteEl) {
			this.autocompleteEl.style.display = 'none';
		}
		this.selectedAutocompleteIndex = -1;
	}

	updateAutocompleteSelection() {
		if (!this.autocompleteEl) return;

		const items = this.autocompleteEl.querySelectorAll('.autocomplete-item');
		items.forEach((item, index) => {
			if (index === this.selectedAutocompleteIndex) {
				item.classList.add('selected');
			} else {
				item.classList.remove('selected');
			}
		});
	}

	selectAutocompleteItem(filePath: string) {
		const cursorPos = this.promptInput.selectionStart;
		const text = this.promptInput.value;
		
		// Find the @ symbol before cursor
		let atIndex = -1;
		for (let i = cursorPos - 1; i >= 0; i--) {
			if (text[i] === '@') {
				atIndex = i;
				break;
			}
			if (text[i] === ' ' || text[i] === '\n') {
				break;
			}
		}
		
		if (atIndex !== -1) {
			// Replace the partial path with the selected file path
			const newText = text.substring(0, atIndex + 1) + filePath + text.substring(cursorPos);
			this.promptInput.value = newText;
			
			// Set cursor position after the inserted file path
			const newCursorPos = atIndex + 1 + filePath.length;
			this.promptInput.setSelectionRange(newCursorPos, newCursorPos);
			this.promptInput.focus();
		}
		
		this.hideAutocomplete();
	}

	async showSavePromptDialog() {
		const promptContent = this.promptInput.value.trim();
		if (!promptContent) {
			new Notice('Please enter a prompt before saving');
			return;
		}

		// Create a simple input dialog
		const modal = new SavePromptModal(this.plugin.app, async (name: string) => {
			try {
				await this.plugin.savePrompt(name, promptContent);
				new Notice(`Prompt "${name}" saved successfully`);
			} catch (error) {
				console.error('Failed to save prompt:', error);
				new Notice(`Failed to save prompt: ${error.message}`);
			}
		});

		modal.open();
	}

	updateContext() {
		this.updateContextDisplay();
	}

	async runTool() {
		if (this.isRunning) return;

		let prompt = this.promptInput.value.trim();
		if (!prompt) {
			new Notice('Please enter a prompt');
			return;
		}

		// Add user message to chat
		this.addUserMessage(prompt);

		// Clear input and reset
		this.promptInput.value = '';
		this.autoResizeInput();

		// Update UI state
		this.isRunning = true;
		this.updateSendButton();
		this.responseBuffer = '';
		this.thinkingBuffer = '';
		this.userScrolledUp = false;

		// Create thinking section (between user message and assistant response)
		this.createThinkingSection();

		// Add assistant message placeholder
		this.addAssistantMessage();

		try {
			prompt = await this.plugin.expandFileReferences(prompt);

			const commandInfo = this.buildCommand(prompt);
			const vaultPath = (this.plugin.app.vault.adapter as any).basePath || (this.plugin.app.vault.adapter as any).path || process.cwd();

			// Update thinking section with execution info
			let executionText = `Command: ${commandInfo.command}\n`;
			if (commandInfo.useStdin && commandInfo.stdinContent) {
				executionText += `\nPrompt sent via stdin:\n${'-'.repeat(40)}\n${commandInfo.stdinContent}\n${'-'.repeat(40)}\n`;
			}
			executionText += '\nExecuting...\n';
			this.updateThinkingContent(executionText);
			console.log(commandInfo.command);

			await this.runCommandWithSpawn(commandInfo.command, vaultPath, commandInfo.stdinContent);

		} catch (error) {
			// Update streaming message with error
			await this.updateStreamingMessage(`**Error:** ${error.message}`);
			this.thinkingBuffer += `\nError: ${error.message}`;
			this.updateThinkingContent(this.thinkingBuffer);

			if (error.message.includes('ENOENT')) {
				new Notice('CLI tool not found. Check the path in settings.');
			} else if (error.message.includes('cancelled')) {
				new Notice('Command was cancelled.');
			} else {
				new Notice('Command execution failed. Check output for details.');
			}
		} finally {
			this.isRunning = false;
			this.updateSendButton();
			this.finalizeStreamingMessage(this.responseBuffer);
			this.currentProcess = null;
		}
	}

	async runCommandWithSpawn(command: string, cwd: string, stdinContent?: string): Promise<void> {
		return new Promise((resolve, reject) => {
			const timeout = 600000;

			this.currentProcess = spawn(command, [], {
				cwd,
				shell: true,
				stdio: ['pipe', 'pipe', 'pipe']
			});

			// Handle stdin content or close immediately to prevent hanging
			if (this.currentProcess.stdin) {
				if (stdinContent) {
					this.currentProcess.stdin.write(stdinContent);
					this.currentProcess.stdin.end();
				} else {
					this.currentProcess.stdin.end();
				}
			}

			this.currentProcess.stdout?.on('data', async (data: Buffer) => {
				const output = data.toString();

				// Add to thinking/doing log
				this.thinkingBuffer += output;
				this.updateThinkingContent(this.thinkingBuffer);

				// For response display, accumulate in buffer and filter
				this.responseBuffer += output;

				// Apply filtering for Gemini
				let filteredResult = this.responseBuffer;
				if (this.toolType === 'gemini') {
					filteredResult = filteredResult.replace(/^Loaded cached credentials\.\s*\n?/m, '');
				}

				// Apply filtering for Qwen
				if (this.toolType === 'qwen') {
					filteredResult = filteredResult.replace(/^Loaded cached Qwen credentials\.\s*\n?/m, '');
				}

				// Update streaming message with markdown rendering
				await this.updateStreamingMessage(filteredResult);
			});

			this.currentProcess.stderr?.on('data', (data: Buffer) => {
				const output = data.toString();
				this.thinkingBuffer += '\nStderr: ' + output;
				this.updateThinkingContent(this.thinkingBuffer);
			});

			this.currentProcess.on('close', async (code: number, signal: string) => {
				if (code === 0) {
					this.thinkingBuffer += '\n\nCommand completed successfully.';
					this.updateThinkingContent(this.thinkingBuffer);
					resolve();
				} else if (signal === 'SIGTERM' || signal === 'SIGKILL') {
					this.thinkingBuffer += '\n\nCommand was cancelled.';
					this.updateThinkingContent(this.thinkingBuffer);
					await this.updateStreamingMessage(this.responseBuffer + '\n\n*[Cancelled]*');
					reject(new Error('Command was cancelled'));
				} else {
					this.thinkingBuffer += `\n\nCommand failed with exit code ${code}`;
					this.updateThinkingContent(this.thinkingBuffer);
					reject(new Error(`Command failed with exit code ${code}`));
				}
			});

			this.currentProcess.on('error', (error: Error) => {
				reject(error);
			});

			// Set timeout
			setTimeout(() => {
				if (this.currentProcess && !this.currentProcess.killed) {
					this.currentProcess.kill('SIGTERM');
					reject(new Error(`Command timed out after ${timeout/1000} seconds`));
				}
			}, timeout);
		});
	}

	buildCommand(prompt: string): { command: string, useStdin: boolean, stdinContent: string } {
		let contextPrompt = prompt;
		
		// Only add context if checkbox is enabled
		if (this.contextEnabled) {
			const { file, selection, lineRange } = this.plugin.getCurrentContext();
			
			// Add file reference using @file_path syntax (both tools support this)
			if (file) {
				contextPrompt += ` @${file.path}`;
			}
			
			// Add selection as compact JSON context if available
			if (selection && selection.trim()) {
				const contextData: { selectedText: string, lineRange?: { start: number, end: number } } = { 
					selectedText: selection 
				};
				if (lineRange) {
					contextData.lineRange = lineRange;
				}
				const contextJson = JSON.stringify(contextData);
				contextPrompt += ` Context: ${contextJson}`;
			}
		}

		// Always use stdin for consistency and robustness
		switch (this.toolType) {
			case 'claude':
				return {
					command: `${this.plugin.settings.claudeCodePath} ${this.plugin.settings.claudeParams}`,
					useStdin: true,
					stdinContent: contextPrompt
				};
			case 'gemini':
				return {
					command: `${this.plugin.settings.geminiCliPath} ${this.plugin.settings.geminiParams}`,
					useStdin: true,
					stdinContent: contextPrompt
				};
			case 'codex':
				return {
					command: `${this.plugin.settings.codexPath} ${this.plugin.settings.codexParams}`,
					useStdin: true,
					stdinContent: contextPrompt
				};
			case 'qwen':
				return {
					command: `${this.plugin.settings.qwenPath} ${this.plugin.settings.qwenParams}`,
					useStdin: true,
					stdinContent: contextPrompt
				};
		}
	}

	cancelTool() {
		if (this.currentProcess && !this.currentProcess.killed) {
			// Try SIGTERM first, then SIGKILL if it doesn't respond
			this.currentProcess.kill('SIGTERM');
			setTimeout(() => {
				if (this.currentProcess && !this.currentProcess.killed) {
					this.currentProcess.kill('SIGKILL');
				}
			}, 2000);

			// Reset UI state immediately
			this.isRunning = false;
			this.updateSendButton();
			this.currentProcess = null;
		}
	}

	async onClose() {
		// Clean up event listeners
		this.eventRefs.forEach(ref => {
			if (ref && typeof ref.off === 'function') {
				ref.off();
			}
		});
		this.eventRefs = [];
		
		// Clean up debounce timer
		if (this.autocompleteDebounceTimer) {
			clearTimeout(this.autocompleteDebounceTimer);
			this.autocompleteDebounceTimer = null;
		}

		// Clean up selection poll interval
		if (this.selectionPollInterval) {
			clearInterval(this.selectionPollInterval);
			this.selectionPollInterval = null;
		}
		
		// Clean up autocomplete element
		if (this.autocompleteEl) {
			this.autocompleteEl.remove();
			this.autocompleteEl = null;
		}
		
		// Clean up any running process
		if (this.currentProcess && !this.currentProcess.killed) {
			this.currentProcess.kill('SIGTERM');
		}
	}
}

class SavePromptModal extends Modal {
	private onSubmit: (name: string) => Promise<void>;
	private nameInput: HTMLInputElement;

	constructor(app: App, onSubmit: (name: string) => Promise<void>) {
		super(app);
		this.onSubmit = onSubmit;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();

		contentEl.createEl('h2', { text: 'Save Prompt' });

		const form = contentEl.createEl('form');
		form.style.display = 'flex';
		form.style.flexDirection = 'column';
		form.style.gap = '15px';

		const inputContainer = form.createDiv();
		inputContainer.createEl('label', { 
			text: 'Prompt name:',
			attr: { for: 'prompt-name' }
		});
		
		this.nameInput = inputContainer.createEl('input', {
			type: 'text',
			attr: { 
				id: 'prompt-name',
				placeholder: 'Enter a name for this prompt...'
			}
		});
		this.nameInput.style.width = '100%';
		this.nameInput.style.marginTop = '5px';
		this.nameInput.style.padding = '8px';
		this.nameInput.style.border = '1px solid var(--background-modifier-border)';
		this.nameInput.style.borderRadius = '4px';

		const buttonContainer = form.createDiv();
		buttonContainer.style.display = 'flex';
		buttonContainer.style.gap = '10px';
		buttonContainer.style.justifyContent = 'flex-end';

		const cancelButton = buttonContainer.createEl('button', {
			text: 'Cancel',
			type: 'button'
		});
		cancelButton.style.padding = '8px 16px';
		cancelButton.onclick = () => this.close();

		const saveButton = buttonContainer.createEl('button', {
			text: 'Save',
			type: 'submit'
		});
		saveButton.style.padding = '8px 16px';
		saveButton.style.background = 'var(--interactive-accent)';
		saveButton.style.color = 'var(--text-on-accent)';
		saveButton.style.border = 'none';
		saveButton.style.borderRadius = '4px';

		form.onsubmit = async (e) => {
			e.preventDefault();
			const name = this.nameInput.value.trim();
			if (name) {
				await this.onSubmit(name);
				this.close();
			} else {
				new Notice('Please enter a prompt name');
			}
		};

		// Focus the input field
		setTimeout(() => this.nameInput.focus(), 50);
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

class ObsidianAICliSettingTab extends PluginSettingTab {
	plugin: ObsidianAICliPlugin;
	private statusCircles: Map<string, HTMLElement> = new Map();

	// Documentation URLs for each tool
	private readonly toolDocs: Record<string, string> = {
		claude: 'https://docs.anthropic.com/en/docs/claude-code/getting-started',
		codex: 'https://github.com/openai/codex',
		qwen: 'https://github.com/QwenLM/Qwen-Agent',
		gemini: 'https://github.com/google-gemini/gemini-cli'
	};

	// Brand colors for each tool
	private readonly toolColors: Record<string, string> = {
		claude: '#D97706',  // orange
		codex: '#10B981',   // green
		qwen: '#8B5CF6',    // purple
		gemini: '#3B82F6'   // blue
	};

	// Path settings for each tool
	private readonly toolPaths: Record<string, keyof ObsidianAICliSettings> = {
		claude: 'claudeCodePath',
		codex: 'codexPath',
		qwen: 'qwenPath',
		gemini: 'geminiCliPath'
	};

	constructor(app: App, plugin: ObsidianAICliPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;
		containerEl.empty();
		containerEl.addClass('weave-settings');

		// Header
		const header = containerEl.createDiv('weave-settings-header');

		const headerLeft = header.createDiv('weave-settings-header-left');
		headerLeft.createEl('h1', { text: 'WEAVE' });
		const headerMeta = headerLeft.createDiv('weave-settings-meta');
		headerMeta.createSpan({ text: `v${this.plugin.manifest.version}`, cls: 'weave-settings-version' });
		const githubLink = headerMeta.createEl('a', {
			text: 'GitHub',
			cls: 'weave-settings-github',
			href: 'https://github.com/rosshannon7677/WEAVE-AI'
		});
		githubLink.setAttribute('target', '_blank');

		const headerRight = header.createDiv('weave-settings-header-right');
		headerRight.createEl('p', {
			text: "Writer's Enhanced AI Vault Experience",
			cls: 'weave-settings-tagline'
		});
		headerRight.createEl('p', {
			text: 'Orchestrate your writing with AI-powered assistance',
			cls: 'weave-settings-subtitle'
		});

		// Models configuration
		const modelsSection = containerEl.createDiv('weave-settings-section');
		modelsSection.createEl('h2', { text: 'Models' });
		const toolGrid = modelsSection.createDiv('weave-tool-grid');

		// Claude
		this.createToolSection(toolGrid, {
			name: 'Claude Code',
			description: 'Anthropic\'s Claude with tool use capabilities',
			pathSetting: 'claudeCodePath',
			paramsSetting: 'claudeParams',
			pathPlaceholder: 'claude',
			paramsPlaceholder: '--allowedTools Read,Edit,Write,Bash...',
			toolKey: 'claude'
		});

		// Codex
		this.createToolSection(toolGrid, {
			name: 'OpenAI Codex',
			description: 'OpenAI\'s code-specialized model',
			warning: 'Requires macOS, Linux, or Windows WSL2',
			pathSetting: 'codexPath',
			paramsSetting: 'codexParams',
			pathPlaceholder: 'codex',
			paramsPlaceholder: 'exec --full-auto --skip-git-repo-check',
			toolKey: 'codex'
		});

		// Qwen
		this.createToolSection(toolGrid, {
			name: 'Qwen Code',
			description: 'Alibaba\'s Qwen coding assistant',
			pathSetting: 'qwenPath',
			paramsSetting: 'qwenParams',
			pathPlaceholder: 'qwen',
			paramsPlaceholder: '--yolo',
			toolKey: 'qwen'
		});

		// Gemini
		this.createToolSection(toolGrid, {
			name: 'Gemini CLI',
			description: 'Google\'s Gemini model via CLI',
			pathSetting: 'geminiCliPath',
			paramsSetting: 'geminiParams',
			pathPlaceholder: 'gemini',
			paramsPlaceholder: '--yolo',
			toolKey: 'gemini'
		});

		// Storage section
		const storageSection = containerEl.createDiv('weave-settings-section weave-settings-last');
		storageSection.createEl('h2', { text: 'Storage' });

		const promptSetting = new Setting(storageSection)
			.setName('Prompt library file')
			.setDesc('Markdown file for saved prompts (created automatically)');

		// Create autocomplete input
		const inputContainer = promptSetting.controlEl.createDiv('weave-file-input-container');
		const input = inputContainer.createEl('input', {
			type: 'text',
			cls: 'weave-file-input',
			value: this.plugin.settings.promptStorageFile,
			placeholder: 'System/AI Prompts.md'
		});

		const autocompleteList = inputContainer.createDiv('weave-file-autocomplete');
		autocompleteList.style.display = 'none';

		// Get all markdown files for autocomplete
		const getMarkdownFiles = () => {
			return this.app.vault.getMarkdownFiles().map(f => f.path).sort();
		};

		input.addEventListener('input', async () => {
			const value = input.value.toLowerCase();
			const files = getMarkdownFiles();
			const matches = files.filter(f => f.toLowerCase().includes(value)).slice(0, 8);

			autocompleteList.empty();
			if (matches.length > 0 && value.length > 0) {
				matches.forEach(file => {
					const item = autocompleteList.createDiv('weave-file-autocomplete-item');
					item.setText(file);
					item.addEventListener('click', async () => {
						input.value = file;
						this.plugin.settings.promptStorageFile = file;
						await this.plugin.saveSettings();
						autocompleteList.style.display = 'none';
					});
				});
				autocompleteList.style.display = 'block';
			} else {
				autocompleteList.style.display = 'none';
			}

			// Save value even if not in autocomplete
			this.plugin.settings.promptStorageFile = input.value || 'System/AI Prompts.md';
			await this.plugin.saveSettings();
		});

		input.addEventListener('blur', () => {
			// Delay to allow click on autocomplete item
			setTimeout(() => { autocompleteList.style.display = 'none'; }, 200);
		});

		input.addEventListener('focus', () => {
			if (input.value.length > 0) {
				input.dispatchEvent(new Event('input'));
			}
		});

		// Help section
		const helpSection = containerEl.createDiv('weave-settings-help');
		helpSection.createEl('h2', { text: 'Getting Started' });
		const helpText = helpSection.createDiv('weave-help-content');
		helpText.innerHTML = `
			<p><strong>1.</strong> Install the CLI tools you want to use (click the docs link on each model card)</p>
			<p><strong>2.</strong> Configure the paths above (or leave default if the tool is in your PATH)</p>
			<p><strong>3.</strong> Click the circle on each model card to test if it's installed correctly</p>
			<p><strong>4.</strong> Open WEAVE-AI from the command palette (<code>Cmd/Ctrl+P</code> → "Open WEAVE-AI")</p>
			<p style="margin-top: 12px; color: var(--text-muted); font-size: 0.85em;">
				<strong>Tips:</strong> Use <code>@filename</code> in prompts to reference files. Select text in the editor to include it as context. Use the gear menu to switch models and manage saved prompts.
			</p>
		`;

		// Auto-test previously tested tools
		this.autoTestTools();
	}

	private async autoTestTools() {
		const testedTools = this.plugin.settings.testedTools || [];
		for (const toolKey of testedTools) {
			const statusCircle = this.statusCircles.get(toolKey);
			if (!statusCircle) continue;

			const pathSetting = this.toolPaths[toolKey];
			const path = this.plugin.settings[pathSetting] as string;
			const color = this.toolColors[toolKey];

			try {
				await execAsync(`${path} --version`);
				statusCircle.addClass('weave-tool-status-working');
				statusCircle.style.backgroundColor = color;
				statusCircle.setText('✓');
			} catch {
				// Tool no longer working, remove from tested list
				this.plugin.settings.testedTools = testedTools.filter(t => t !== toolKey);
				await this.plugin.saveSettings();
			}
		}
	}

	private createToolSection(container: HTMLElement, config: {
		name: string;
		description: string;
		warning?: string;
		pathSetting: keyof ObsidianAICliSettings;
		paramsSetting: keyof ObsidianAICliSettings;
		pathPlaceholder: string;
		paramsPlaceholder: string;
		toolKey: string;
	}) {
		const section = container.createDiv('weave-tool-config');
		const color = this.toolColors[config.toolKey];
		const docsUrl = this.toolDocs[config.toolKey];

		// Header row with status circle, name, and links
		const header = section.createDiv('weave-tool-header');

		// Left side: status circle + name/description
		const headerLeft = header.createDiv('weave-tool-header-left');

		// Status circle (clickable)
		const statusCircle = headerLeft.createDiv('weave-tool-status');
		statusCircle.setAttribute('title', 'Click to test');
		statusCircle.dataset.color = color;

		// Store reference for auto-testing
		this.statusCircles.set(config.toolKey, statusCircle);

		statusCircle.addEventListener('click', async () => {
			const currentPath = this.plugin.settings[config.pathSetting] as string;
			statusCircle.removeClass('weave-tool-status-working', 'weave-tool-status-error');
			statusCircle.addClass('weave-tool-status-testing');
			statusCircle.style.backgroundColor = '';
			statusCircle.empty();

			try {
				await execAsync(`${currentPath} --version`);
				statusCircle.removeClass('weave-tool-status-testing');
				statusCircle.addClass('weave-tool-status-working');
				statusCircle.style.backgroundColor = color;
				statusCircle.setText('✓');
				new Notice(`${config.name} is working!`);

				// Save to tested tools
				if (!this.plugin.settings.testedTools.includes(config.toolKey)) {
					this.plugin.settings.testedTools.push(config.toolKey);
					await this.plugin.saveSettings();
				}
			} catch {
				statusCircle.removeClass('weave-tool-status-testing');
				statusCircle.addClass('weave-tool-status-error');
				statusCircle.setText('✗');
				new Notice(`${config.name} not found. Check the path.`);

				// Remove from tested tools
				this.plugin.settings.testedTools = this.plugin.settings.testedTools.filter(t => t !== config.toolKey);
				await this.plugin.saveSettings();
			}
		});

		const headerText = headerLeft.createDiv('weave-tool-header-text');
		headerText.createEl('strong', { text: config.name });
		headerText.createEl('span', { text: config.description, cls: 'weave-tool-desc' });

		// Right side: docs link and warning
		const headerRight = header.createDiv('weave-tool-header-right');

		const docsLink = headerRight.createEl('a', {
			text: 'Docs ↗',
			cls: 'weave-tool-docs-link',
			href: docsUrl
		});
		docsLink.setAttribute('target', '_blank');

		if (config.warning) {
			headerRight.createEl('span', {
				text: `⚠️ ${config.warning}`,
				cls: 'weave-tool-warning'
			});
		}

		// Settings
		const settings = section.createDiv('weave-tool-settings');

		new Setting(settings)
			.setName('Path')
			.addText(text => text
				.setPlaceholder(config.pathPlaceholder)
				.setValue(this.plugin.settings[config.pathSetting] as string)
				.onChange(async (value) => {
					(this.plugin.settings[config.pathSetting] as string) = value;
					await this.plugin.saveSettings();
				}));

		new Setting(settings)
			.setName('Parameters')
			.addText(text => text
				.setPlaceholder(config.paramsPlaceholder)
				.setValue(this.plugin.settings[config.paramsSetting] as string)
				.onChange(async (value) => {
					(this.plugin.settings[config.paramsSetting] as string) = value;
					await this.plugin.saveSettings();
				}));
	}
}
