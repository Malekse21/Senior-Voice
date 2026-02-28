import { getStore, setStore } from './storage'
import { speak } from './speech'

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// AGENT TOOLS
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
const tools = {
  reminder_manager: async (params) => {
    if (params.action === 'set') {
      const reminders = getStore('reminders') || []
      const reminder = {
        id: Date.now(),
        text: params.text,
        time: params.time,
        contact: params.contact,
        created: new Date().toISOString(),
        fired: false
      }
      reminders.push(reminder)
      setStore('reminders', reminders)
      return { success: true, reminder_id: reminder.id }
    } else if (params.action === 'list') {
      return getStore('reminders')?.filter(r => !r.fired) || []
    } else if (params.action === 'delete') {
      const reminders = getStore('reminders') || []
      const filtered = reminders.filter(r => r.id !== params.id)
      setStore('reminders', filtered)
      return { success: true }
    }
  },

  contact_caller: async (params) => {
    const contacts = getStore('contacts') || []
    const contact = contacts.find(c => 
      c.name.toLowerCase().includes(params.contact_name.toLowerCase()) ||
      c.nickname?.includes(params.contact_name) ||
      params.contact_name.includes(c.nickname)
    )
    if (!contact) return { error: 'not_found', message: 'Contact non trouvÃ©' }
    window.location.href = 'tel:' + contact.phone
    return { success: true, calling: contact.name, phone: contact.phone }
  },

  whatsapp_sender: async (params) => {
    const contacts = getStore('contacts') || []
    const contact = contacts.find(c => 
      c.name.toLowerCase().includes(params.contact_name.toLowerCase()) ||
      c.nickname?.includes(params.contact_name)
    )
    if (!contact) return { error: 'not_found' }
    let phone = contact.phone.replace(/\D/g, '')
    if (phone.startsWith('0')) phone = '216' + phone.slice(1)
    if (phone.startsWith('+')) phone = phone.slice(1)
    const url = 'https://wa.me/' + phone + '?text=' + encodeURIComponent(params.message)
    window.open(url, '_blank')
    return { success: true, sent_to: contact.name }
  },

  medication_tracker: async (params) => {
    if (params.action === 'taken') {
      const log = getStore('medication_log') || []
      log.push({
        medication: params.medication_name,
        taken_at: new Date().toISOString(),
        status: 'taken'
      })
      setStore('medication_log', log)
      return { success: true, message: params.medication_name + ' marquÃ© comme pris' }
    } else if (params.action === 'list_due') {
      const hour = new Date().getHours()
      const meds = getStore('medications') || []
      const timeMap = { matin: 8, midi: 12, soir: 18, nuit: 21 }
      return meds.filter(m => {
        if (!m.schedule) return false
        return m.schedule.some(s => Math.abs(timeMap[s] - hour) <= 1)
      })
    }
  },

  calendar_manager: async (params) => {
    if (params.action === 'add') {
      const appointments = getStore('appointments') || []
      appointments.push({
        id: Date.now(),
        title: params.title,
        doctor: params.doctor,
        date: params.date,
        time: params.time,
        created: new Date().toISOString()
      })
      setStore('appointments', appointments)
      return { success: true }
    } else if (params.action === 'list_upcoming') {
      const today = new Date().toDateString()
      return (getStore('appointments') || [])
        .filter(a => new Date(a.date).toDateString() >= today)
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(0, 5)
    }
  },

  weather_fetcher: async (params) => {
    const res = await fetch('https://wttr.in/' + (params.city || 'Tunis') + '?format=%C+%t&lang=fr')
    const text = await res.text()
    return { weather: text, city: params.city }
  },

  news_fetcher: async () => {
    const rssUrl = encodeURIComponent('https://www.tap.info.tn/fr/?format=feed&type=rss')
    const res = await fetch('https://api.rss2json.com/v1/api.json?rss_url=' + rssUrl)
    const data = await res.json()
    const headlines = data.items?.slice(0, 3).map(i => i.title) || []
    return { headlines }
  },

  smart_home_controller: async (params) => {
    const ha = getStore('ha_config')
    if (ha?.url && ha?.token) {
      const entityMap = {
        'lumiÃ¨re': 'light.salon',
        'lampe': 'light.salon',
        'tÃ©lÃ©vision': 'media_player.tv',
        'tv': 'media_player.tv',
        'climatiseur': 'climate.salon',
        'ventilateur': 'fan.salon'
      }
      const entity = entityMap[params.device] || params.device
      const service = params.action === 'turn_on' ? 'turn_on' : 'turn_off'
      await fetch(ha.url + '/api/services/' + entity.split('.')[0] + '/' + service, {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + ha.token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ entity_id: entity })
      })
      return { success: true, device: params.device, action: params.action }
    }
    return { fallback: true, instruction: 'Veuillez ' + params.action + ' le ' + params.device + ' manuellement' }
  },

  emergency_responder: async (params) => {
    speak('Attention ! Restenez calme. J\'appelle les secours.')
    const contacts = getStore('contacts') || []
    const emergency = contacts.find(c => c.is_emergency)
    if (emergency) {
      const msg = 'URGENT: ' + (getStore('user')?.name || 'Votre proche') + ' a besoin d\'aide immÃ©diate. SymptÃ´mes: ' + params.symptoms
      window.open('https://wa.me/' + emergency.phone.replace(/\D/g, '') + '?text=' + encodeURIComponent(msg))
    }
    setTimeout(() => { window.location.href = 'tel:190' }, 3000)
    return { called: '190', notified: emergency?.name || 'personne' }
  }
}

export async function executeTool(name, params) {
  if (!tools[name]) throw new Error('Outil inconnu: ' + name)
  return tools[name](params)
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// AGENT PROMPT
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
export function buildAgentPrompt(transcript, memory) {
  return `
Tu es "Sama", l'assistante vocale personnelle de ${memory.name || 'cette personne'}.
Tu es comme un membre de la famille â€” chaleureux, patient, bienveillant, jamais pressÃ©.
Tu t'exprimes en franÃ§ais simple OU en arabe dialectal tunisien selon comment la personne parle.
Tu comprends les phrases hÃ©sitantes, incomplÃ¨tes, et le mÃ©lange franÃ§ais-arabe dialectal tunisien.
Tu agis de maniere autonome: tu prends l'initiative avec la meilleure action possible sans demander de clarification.

PROFIL COMPLET DE L'UTILISATEUR:
Contacts: ${JSON.stringify(memory.contacts)}
MÃ©dicaments: ${JSON.stringify(memory.medications)}
Rendez-vous: ${JSON.stringify(memory.appointments)}
Historique rÃ©cent: ${JSON.stringify(memory.history)}
PrÃ©fÃ©rences: ${JSON.stringify(memory.preferences)}

CE QUE LA PERSONNE VIENT DE DIRE:
"${transcript}"

HEURE ACTUELLE: ${new Date().toLocaleString('fr-TN')}

OUTILS DISPONIBLES:
1. reminder_manager - params: { action: "set|list|delete", text, time, contact }
2. contact_caller - params: { contact_name }
3. whatsapp_sender - params: { contact_name, message }
4. medication_tracker - params: { action: "taken|list_due", medication_name }
5. calendar_manager - params: { action: "add|list_upcoming", title, date, time, doctor }
6. weather_fetcher - params: { city }
7. news_fetcher - params: { category }
8. smart_home_controller - params: { device, action: "turn_on|turn_off" }
9. emergency_responder - params: { severity, symptoms }

RÃˆGLES DE DÃ‰CISION:
- "Ø¹ÙŠÙ‘Ø· Ø¹Ù„Ù‰ ÙˆÙ„Ø¯ÙŠ" ou "appelle mon fils" â†’ contact_caller
- "ÙÙƒÙ‘Ø±Ù†ÙŠ" ou "rappelle-moi" â†’ reminder_manager
- "Ù†Ø³ÙŠØª Ø§Ù„Ø¯ÙˆØ§Ø¡" ou "j'ai pris mon mÃ©dicament" â†’ medication_tracker
- "j'ai mal" + urgent â†’ emergency_responder
- Plusieurs actions possibles â†’ appelle plusieurs outils
- Si la demande est ambigue -> choisis l'interpretation la plus utile et execute-la
- Ne demande pas de clarification; fais un meilleur effort autonome

RETOURNE UNIQUEMENT CE JSON VALIDE:
{
  "understood": "ce que tu as compris",
  "response_voice": "rÃ©ponse Ã  dire Ã  voix haute",
  "tools_to_call": [{ "tool": "nom_outil", "params": {}, "reason": "pourquoi" }],
  "needs_clarification": false,
  "clarification_question": null,
  "confidence": 0.95
}
`
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// PROACTIVE CHECK
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
export function proactiveCheck(onAlert) {
  const hour = new Date().getHours()
  const meds = getStore('medications') || []
  const log = getStore('medication_log') || []
  const appts = getStore('appointments') || []
  const today = new Date().toDateString()

  const timeMap = { matin: 8, midi: 12, soir: 18, nuit: 21 }
  
  Object.entries(timeMap).forEach(([period, h]) => {
    if (hour === h) {
      const due = meds.filter(m => m.schedule?.includes(period))
      if (due.length > 0) {
        const names = due.map(m => m.name).join(', ')
        onAlert('N\'oubliez pas vos mÃ©dicaments de ' + period + ' : ' + names)
      }
    }
  })

  if (hour === 21) {
    const missed = meds.filter(m => {
      const takenToday = log.some(l =>
        l.medication === m.name &&
        new Date(l.taken_at).toDateString() === today &&
        l.status === 'taken'
      )
      return !takenToday
    })
    if (missed.length > 0) {
      onAlert('Avez-vous pris votre ' + missed[0].name + ' aujourd\'hui ?')
    }
  }

  if (hour === 20) {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowStr = tomorrow.toDateString()
    const tAppts = appts.filter(a => new Date(a.date).toDateString() === tomorrowStr)
    if (tAppts.length > 0) {
      onAlert('Rappel: ' + tAppts[0].title + ' demain Ã  ' + tAppts[0].time)
    }
  }
}

