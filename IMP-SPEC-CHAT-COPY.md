# IMP-SPEC-CHAT-COPY: Selectable Text and Copy Button for Agent Responses

## Problem

Agent responses in the chat interface cannot be selected by the user. This prevents:
- Copying specific portions of responses
- Quick full-message copying for use elsewhere

## Solution

1. **Enable text selection** on assistant message content
2. **Add copy button** to each assistant message (appears on hover)

---

## Implementation

### 1. CSS Changes (`styles.css`)

Add `user-select: text` to assistant messages and create copy button styles:

```css
/* In .weave-message-assistant or .weave-message-content */
.weave-message-assistant .weave-message-content {
    user-select: text;
    -webkit-user-select: text;
    -moz-user-select: text;
    -ms-user-select: text;
}

/* Copy button container */
.weave-message-assistant {
    position: relative;
}

.weave-message-copy {
    position: absolute;
    top: 4px;
    right: 4px;
    padding: 2px 6px;
    border: none;
    border-radius: 4px;
    background: var(--background-modifier-hover);
    color: var(--text-muted);
    font-size: 0.7em;
    cursor: pointer;
    opacity: 0;
    transition: opacity 0.15s ease;
}

.weave-message-assistant:hover .weave-message-copy {
    opacity: 1;
}

.weave-message-copy:hover {
    background: var(--interactive-accent);
    color: var(--text-on-accent);
}

.weave-message-copy-success {
    background: var(--text-success) !important;
    color: white !important;
}
```

### 2. TypeScript Changes (`main.ts`)

#### A. Modify `addAssistantMessage()` (~line 662)

Add copy button when creating assistant message:

```typescript
private addAssistantMessage(): HTMLDivElement {
    const chatContainer = this.responseArea.querySelector('.weave-chat-container') as HTMLElement;
    const msgEl = chatContainer.createDiv('weave-message weave-message-assistant');

    // Add copy button
    const copyBtn = msgEl.createEl('button', {
        cls: 'weave-message-copy',
        text: 'Copy'
    });
    copyBtn.addEventListener('click', () => this.copyMessageContent(msgEl, copyBtn));

    const contentEl = msgEl.createDiv({ cls: 'weave-message-content' });
    contentEl.setText('...');

    this.currentStreamingMessage = msgEl;
    this.scrollToBottom();
    return msgEl;
}
```

#### B. Add copy handler method (new method)

```typescript
private async copyMessageContent(msgEl: HTMLElement, copyBtn: HTMLButtonElement): Promise<void> {
    const contentEl = msgEl.querySelector('.weave-message-content') as HTMLElement;
    if (!contentEl) return;

    // Get text content (strips HTML)
    const text = contentEl.innerText || contentEl.textContent || '';

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
```

---

## File Changes Summary

| File | Change |
|------|--------|
| `styles.css` | Add `user-select` to message content, add `.weave-message-copy` button styles |
| `main.ts` | Modify `addAssistantMessage()` to include copy button, add `copyMessageContent()` method |

---

## Testing

1. Send a prompt and receive a response
2. Verify text can be selected with mouse/keyboard
3. Hover over assistant message → copy button appears
4. Click copy → clipboard contains message text
5. Visual feedback: button shows "Copied!" briefly
6. Verify streaming messages still work correctly (copy button present during stream)

---

## Notes

- Copy button uses `innerText` to get clean text without HTML markup
- Button appears on hover to keep UI clean
- Success state provides visual confirmation
- Uses native `navigator.clipboard` API (supported in Electron/Obsidian)
