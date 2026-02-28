// ═══════════════════════════════════════════════════════
// LOCALSTORAGE HELPERS
// ═══════════════════════════════════════════════════════
export function getStore(key) {
  try {
    const v = localStorage.getItem('sv_' + key)
    return v ? JSON.parse(v) : defaultFor(key)
  } catch {
    return defaultFor(key)
  }
}

export function setStore(key, value) {
  localStorage.setItem('sv_' + key, JSON.stringify(value))
}

function defaultFor(key) {
  const defaults = {
    user: { name: '' },
    contacts: [],
    medications: [],
    appointments: [],
    reminders: [],
    history: [],
    preferences: { voice_speed: 0.82 },
    medication_log: [],
    api_keys: { groq: '' },
    ha_config: { url: '', token: '' },
    onboarded: false
  }
  return defaults[key] ?? null
}
