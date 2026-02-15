/**
 * Pleasant notification sound using Web Audio API (no external file).
 * Two-tone chime for reminders; softer tone for notification panel.
 */

let audioContext = null;

function getAudioContext() {
  if (typeof window === "undefined") return null;
  if (audioContext) return audioContext;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (Ctx) audioContext = new Ctx();
  return audioContext;
}

function playTone(frequency, startTime, duration, volume = 0.15) {
  const ctx = getAudioContext();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.frequency.setValueAtTime(frequency, startTime);
  osc.type = "sine";
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(volume, startTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  osc.start(startTime);
  osc.stop(startTime + duration);
}

/**
 * Pleasant chime for the 3-minute reminder (two ascending tones).
 */
export function playReminderSound() {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === "suspended") ctx.resume();
  const now = ctx.currentTime;
  playTone(523.25, now, 0.2, 0.12);           // C5
  playTone(659.25, now + 0.18, 0.35, 0.1);    // E5
}

/**
 * Softer notification sound (e.g. when opening panel with unread).
 */
export function playNotificationSound() {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === "suspended") ctx.resume();
  const now = ctx.currentTime;
  playTone(440, now, 0.15, 0.08);
  playTone(554.37, now + 0.12, 0.2, 0.06);   // C#5
}
