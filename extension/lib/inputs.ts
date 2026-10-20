/**
 * Helpers for reading from and writing to prompt inputs, which may be either
 * `<textarea>` elements or contenteditable rich-text editors (ProseMirror,
 * Quill, etc. are used by ChatGPT, Claude and Gemini).
 */

export type PromptInput = HTMLTextAreaElement | HTMLElement;

export function isTextArea(el: PromptInput): el is HTMLTextAreaElement {
  return el instanceof HTMLTextAreaElement;
}

export function isContentEditable(el: PromptInput): boolean {
  return el instanceof HTMLElement && el.isContentEditable;
}

/** Reads the current prompt text from a textarea or contenteditable element. */
export function getInputText(el: PromptInput): string {
  if (isTextArea(el)) return el.value;
  return (el.innerText ?? "").replace(/\u00a0/g, " ");
}

/** Focuses the input so paste/typing lands in the right place. */
export function focusInput(el: PromptInput): void {
  el.focus();
}

/**
 * Replaces the prompt text and dispatches the events rich-text editors listen
 * for so their internal state stays in sync (React controlled inputs included).
 */
export function setInputText(el: PromptInput, text: string): void {
  if (isTextArea(el)) {
    const setter = Object.getOwnPropertyDescriptor(
      HTMLTextAreaElement.prototype,
      "value"
    )?.set;
    setter?.call(el, text);
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
    return;
  }

  focusInput(el);
  el.textContent = text;
  el.dispatchEvent(
    new InputEvent("input", { bubbles: true, inputType: "insertText", data: text })
  );
}

/**
 * Intercepts the next paste to inject `text`, so single-page editors that only
 * accept paste/typing (rather than textContent assignment) pick up the value.
 */
export function pasteIntoInput(el: PromptInput, text: string): void {
  focusInput(el);
  const onPaste = (e: Event) => {
    const pe = e as ClipboardEvent;
    pe.preventDefault();
    pe.clipboardData?.setData("text/plain", text);
  };
  el.addEventListener("paste", onPaste, { once: true });
  document.execCommand("paste");
  el.removeEventListener("paste", onPaste);
}

/** Returns the first matching input on the page, or null. */
export function findInput(selectors: { selector: string }[]): PromptInput | null {
  for (const { selector } of selectors) {
    const el = document.querySelector<PromptInput>(selector);
    if (el && isVisible(el)) return el;
  }
  // Selectors for these SPAs change constantly — fall back to the most
  // likely candidate on the page so the widget still works.
  return findHeuristicInput();
}

/** True when an element is rendered with a non-trivial size. */
function isVisible(el: Element): boolean {
  const rect = el.getBoundingClientRect();
  if (rect.width < 40 || rect.height < 12) return false;
  const style = window.getComputedStyle(el);
  return style.display !== "none" && style.visibility !== "hidden";
}

/**
 * Best-effort prompt box detection: the largest visible textarea or editable
 * element in the lower half of the viewport (where chat composers live).
 */
function findHeuristicInput(): PromptInput | null {
  const candidates = Array.from(
    document.querySelectorAll<PromptInput>('textarea, div[contenteditable="true"], [role="textbox"]')
  );

  let best: PromptInput | null = null;
  let bestArea = 0;

  for (const el of candidates) {
    if (!isVisible(el)) continue;
    // Skip our own UI and tiny/off-screen helpers.
    if (el.closest("#promhance-root, [data-promhance]")) continue;
    const rect = el.getBoundingClientRect();
    const area = rect.width * rect.height;
    if (area > bestArea) {
      bestArea = area;
      best = el;
    }
  }
  return best;
}
