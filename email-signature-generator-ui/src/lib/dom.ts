/**
 * Tiny shared DOM helpers used across modes.
 */

export type MessageType = 'success' | 'warning' | 'error' | 'info';

/** Append a styled message to a container. */
export function showMessage(container: HTMLElement, type: MessageType, text: string): void {
  const div = document.createElement('div');
  div.className = `msg msg-${type}`;
  div.textContent = text;
  container.appendChild(div);
}

/** Replace messages in a container with a single message. */
export function setMessage(container: HTMLElement, type: MessageType, text: string): void {
  container.innerHTML = '';
  showMessage(container, type, text);
}

/** Clear all messages in a container. */
export function clearMessages(container: HTMLElement): void {
  container.innerHTML = '';
}

/** Light-up the first N step pills in a steps indicator. */
export function setActiveSteps(steps: HTMLElement[], activeStep: number): void {
  steps.forEach((step, i) => step.classList.toggle('active', i < activeStep));
}

/** Strict element lookup; throws if missing (catches HTML/JS drift early). */
export function $<T extends HTMLElement = HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing element: #${id}`);
  return el as T;
}

