/**
 * Notification and reminder sounds. Notification uses custom file from public/sounds/ if present.
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
 * Notification: plays public/sounds/notification.mp3 if present, else two-tone chime.
 * Distinct two-tone chime (D5 + G5) so it’s different from the reminder sound.
 */
/** Path to custom notification sound (place file in public/sounds/). Use .mp3 or .wav. */
export const NOTIFICATION_SOUND_PATH = "/sounds/notification.mp3";

function playNotificationSoundFallback() {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === "suspended") ctx.resume();
  const now = ctx.currentTime;
  playTone(587.33, now, 0.18, 0.08);       // D5
  playTone(783.99, now + 0.16, 0.22, 0.06); // G5
}

export function playNotificationSound() {
  if (typeof window === "undefined") return;
  const audio = new window.Audio(NOTIFICATION_SOUND_PATH);
  audio.volume = 0.6;
  const onError = () => playNotificationSoundFallback();
  audio.addEventListener("error", onError);
  audio.play().catch(onError);
}
