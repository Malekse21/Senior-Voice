import { getStore } from './storage'

// ═══════════════════════════════════════════════════════
// SPEECH SYNTHESIS
// ═══════════════════════════════════════════════════════
export function speak(text, onEnd) {
  if (!text || !window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  const prefs = getStore('preferences')
  u.lang = 'fr-FR'
  u.rate = prefs?.voice_speed || 0.82
  u.pitch = 1.0
  u.volume = 1.0
  if (onEnd) u.onend = onEnd
  window.speechSynthesis.speak(u)
}
