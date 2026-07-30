/**
 * Notification sound for incoming news items.
 *
 * The alert is synthesized with the Web Audio API instead of shipping an audio
 * file: it keeps the blip short and quiet enough to sit under a fast-moving
 * feed, and there's no asset to load before the first event arrives.
 *
 * The on/off preference lives in `localStorage` (it should survive a tab close,
 * unlike the session token) and is exposed as an external store so components
 * can read it with `useSyncExternalStore` — no hydration mismatch and no
 * state-setting effect.
 */

const STORAGE_KEY = "upcome.sound";

/** Same-tab preference-change notification (the `storage` event is cross-tab only). */
const PREF_EVENT = "upcome:sound-pref";

/** Minimum gap between alerts, so a burst of events is one blip, not twenty. */
const MIN_INTERVAL_MS = 1200;

/** Peak envelope gain — deliberately low; this fires all day. */
const PEAK_GAIN = 0.09;

type WebAudioWindow = Window & { webkitAudioContext?: typeof AudioContext };

let audioContext: AudioContext | null = null;
let unlockBound = false;
let lastPlayedAt = 0;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (audioContext) return audioContext;

  const Ctor = window.AudioContext ?? (window as WebAudioWindow).webkitAudioContext;
  if (!Ctor) return null;

  audioContext = new Ctor();
  bindUnlock();
  return audioContext;
}

/**
 * Browsers start an AudioContext suspended until the page has seen a user
 * gesture (a reload with a stored token reaches the feed without one), so
 * resume it on the first click or keypress.
 */
function bindUnlock(): void {
  if (unlockBound || typeof window === "undefined") return;
  unlockBound = true;

  const resume = () => {
    audioContext?.resume().catch(() => {});
    window.removeEventListener("pointerdown", resume);
    window.removeEventListener("keydown", resume);
  };

  window.addEventListener("pointerdown", resume);
  window.addEventListener("keydown", resume);
}

/** One note with a short attack/decay envelope — a raw gate would click. */
function blip(ctx: AudioContext, frequency: number, at: number, duration: number): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "triangle";
  osc.frequency.setValueAtTime(frequency, at);

  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(PEAK_GAIN, at + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);

  osc.connect(gain).connect(ctx.destination);
  osc.start(at);
  osc.stop(at + duration + 0.02);
}

/**
 * Play the two-note alert. No-ops when muted, when the throttle window is still
 * open, or while autoplay is blocked (we ask for a resume and let the next item
 * try again rather than queueing a blip that fires late).
 */
export function playNewsAlert(): void {
  if (!isSoundEnabled()) return;

  const now = Date.now();
  if (now - lastPlayedAt < MIN_INTERVAL_MS) return;

  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === "suspended") {
    ctx.resume().catch(() => {});
    return;
  }

  lastPlayedAt = now;
  const start = ctx.currentTime;
  blip(ctx, 880, start, 0.09);
  blip(ctx, 1320, start + 0.08, 0.12);
}

/** Sound is on unless the user has explicitly muted it. */
export function isSoundEnabled(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(STORAGE_KEY) !== "off";
  } catch {
    return true;
  }
}

/** Server snapshot for `useSyncExternalStore` — matches the unmuted default. */
export function getSoundEnabledDefault(): boolean {
  return true;
}

export function setSoundEnabled(enabled: boolean): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, enabled ? "on" : "off");
  } catch {
    /* storage unavailable (private mode / quota) — the toggle just won't persist */
  }

  if (enabled) {
    // The toggle click is a user gesture: create/resume the context now, and
    // clear the throttle so the caller can play a confirmation blip.
    getAudioContext()?.resume().catch(() => {});
    lastPlayedAt = 0;
  }

  window.dispatchEvent(new Event(PREF_EVENT));
}

export function subscribeSoundPref(onChange: () => void): () => void {
  window.addEventListener(PREF_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(PREF_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}
