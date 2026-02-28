/* ═══════════════════════════════════════════════════════
   SeniorVoice — app.js
   Complete AI Agent "Nour" for elderly Tunisian users
   Pure client-side, no backend, API keys in localStorage
   ═══════════════════════════════════════════════════════ */

'use strict';

/* ══════════════════════════════════════════
   LOCALSTORAGE HELPERS
   ══════════════════════════════════════════ */
function getStore(key) {
  try {
    return JSON.parse(localStorage.getItem('sv_' + key) || 'null') || defaultFor(key);
  } catch { return defaultFor(key); }
}

function setStore(key, value) {
  localStorage.setItem('sv_' + key, JSON.stringify(value));
}

function defaultFor(key) {
  const defaults = {
    contacts:        [],
    medications:     [],
    appointments:    [],
    reminders:       [],
    history:         [],
    medication_log:  [],
    preferences:     { lang: 'auto', voice_speed: 0.82 },
    user:            { name: '' },
    ha_config:       null,
    api_keys:        {}
  };
  return defaults[key] !== undefined ? defaults[key] : null;
}

/* ══════════════════════════════════════════
   SCREEN SYSTEM
   ══════════════════════════════════════════ */
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const target = document.getElementById(id);
  if (target) target.classList.add('active');

  // Update bottom nav active state
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.screen === id);
  });

  // Show/hide topbar and bottom nav
  const isOnboarding = id === 'screen-onboarding';
  const topbar = document.getElementById('topbar');
  const bottomNav = document.getElementById('bottom-nav');
  const alertBanner = document.getElementById('alert-banner');
  if (topbar) topbar.style.display = isOnboarding ? 'none' : '';
  if (bottomNav) bottomNav.style.display = isOnboarding ? 'none' : '';
  if (alertBanner && isOnboarding) alertBanner.classList.add('hidden');

  // Render screen-specific content
  if (id === 'screen-dashboard') renderDashboard();
  if (id === 'screen-contacts') renderContacts();
  if (id === 'screen-medications') renderMedications();
  if (id === 'screen-history') renderHistory();
  if (id === 'screen-settings') loadSettingsScreen();
}

/* ══════════════════════════════════════════
   ONBOARDING STATE
   ══════════════════════════════════════════ */
let obStep = 1;
const OB_TOTAL = 4;

function initOnboarding() {
  obStep = 1;
  updateObDots();
  showObStep(1);

  // Step 1 — Name voice input
  document.getElementById('ob-name-voice').addEventListener('click', async () => {
    const btn = document.getElementById('ob-name-voice');
    btn.textContent = ' Écoute…';
    btn.disabled = true;
    try {
      const blob = await recordShort(3000);
      const { text } = await transcribeAudio(blob);
      if (text) document.getElementById('ob-name').value = text.trim().split(' ')[0];
    } catch (e) {
      showToast('Impossible d\'enregistrer', true);
    }
    btn.textContent = ' Dire mon prénom';
    btn.disabled = false;
  });

  // Step 2 — Add medication
  document.getElementById('ob-add-med').addEventListener('click', obAddMed);
  document.getElementById('ob-skip-meds').addEventListener('click', () => goObStep(3));

  // Step 3 — Add contact
  document.getElementById('ob-add-con').addEventListener('click', obAddContact);

  // Step 4 — Add appointment
  document.getElementById('ob-add-apt').addEventListener('click', obAddAppointment);
  document.getElementById('ob-skip-apts').addEventListener('click', () => {
    const name = getStore('user')?.name || '';
    document.getElementById('ob-finish-title').textContent = `Bonjour ${name} ! Nour est prête. `;
    showObStep('finish');
    document.getElementById('ob-nav').style.display = 'none';
  });

  // Finish
  document.getElementById('ob-start').addEventListener('click', finishOnboarding);

  // Nav buttons
  document.getElementById('ob-back').addEventListener('click', obBack);
  document.getElementById('ob-next').addEventListener('click', obNext);

  // Render existing lists
  renderObMedList();
  renderObConList();
  renderObAptList();
}

function showObStep(step) {
  document.querySelectorAll('.onboarding-step').forEach(s => s.classList.remove('active'));
  const el = document.getElementById('ob-step-' + step);
  if (el) el.classList.add('active');

  const nav = document.getElementById('ob-nav');
  const isFinish = step === 'finish';
  if (nav) nav.style.display = isFinish ? 'none' : 'flex';

  const backBtn = document.getElementById('ob-back');
  if (backBtn) backBtn.style.visibility = (step === 1) ? 'hidden' : 'visible';
}

function updateObDots() {
  document.querySelectorAll('.dot').forEach((dot, i) => {
    const s = i + 1;
    dot.classList.remove('active', 'done');
    if (s < obStep) dot.classList.add('done');
    else if (s === obStep) dot.classList.add('active');
  });
}

function goObStep(step) {
  obStep = step;
  updateObDots();
  showObStep(step);
}

function obBack() {
  if (obStep > 1) goObStep(obStep - 1);
}

function obNext() {
  if (obStep === 1) {
    const name = document.getElementById('ob-name').value.trim();
    if (!name) { showToast('Veuillez entrer votre prénom', true); return; }
    const user = getStore('user') || {};
    user.name = name;
    setStore('user', user);
    goObStep(2);
  } else if (obStep === 2) {
    goObStep(3);
  } else if (obStep === 3) {
    goObStep(4);
  } else if (obStep === 4) {
    // Show finish
    const name = getStore('user')?.name || '';
    document.getElementById('ob-finish-title').textContent = `Bonjour ${name} ! Nour est prête. `;
    showObStep('finish');
    document.getElementById('ob-nav').style.display = 'none';
  }
}

function obAddMed() {
  const name = document.getElementById('ob-med-name').value.trim();
  const dose = document.getElementById('ob-med-dose').value.trim();
  if (!name) { showToast('Entrez le nom du médicament', true); return; }
  const schedule = [];
  if (document.getElementById('ob-med-matin').checked) schedule.push('matin');
  if (document.getElementById('ob-med-midi').checked) schedule.push('midi');
  if (document.getElementById('ob-med-soir').checked) schedule.push('soir');
  if (document.getElementById('ob-med-nuit').checked) schedule.push('nuit');
  const meds = getStore('medications');
  meds.push({ id: Date.now(), name, dose, schedule, created: new Date().toISOString() });
  setStore('medications', meds);
  document.getElementById('ob-med-name').value = '';
  document.getElementById('ob-med-dose').value = '';
  ['matin','midi','soir','nuit'].forEach(t => { document.getElementById('ob-med-' + t).checked = false; });
  renderObMedList();
  showToast(name + ' ajouté ');
}

function renderObMedList() {
  const meds = getStore('medications');
  const list = document.getElementById('ob-med-list');
  if (!list) return;
  list.innerHTML = meds.map(m => `
    <div class="ob-list-item">
      <div>
        <div class="ob-list-item-text"> ${escHtml(m.name)} ${m.dose ? '— ' + escHtml(m.dose) : ''}</div>
        <div class="ob-list-item-sub">${(m.schedule || []).join(', ')}</div>
      </div>
      <button class="ob-delete-btn" onclick="obDeleteMed(${m.id})"></button>
    </div>`).join('');
}

function obDeleteMed(id) {
  setStore('medications', getStore('medications').filter(m => m.id !== id));
  renderObMedList();
}

function obAddContact() {
  const name = document.getElementById('ob-con-name').value.trim();
  const nick = document.getElementById('ob-con-nick').value.trim();
  const phone = document.getElementById('ob-con-phone').value.trim();
  if (!name || !phone) { showToast('Nom et téléphone requis', true); return; }
  const isEmergency = document.getElementById('ob-con-emergency').checked;
  const contacts = getStore('contacts');
  contacts.push({ id: Date.now(), name, nickname: nick, phone, is_emergency: isEmergency, created: new Date().toISOString() });
  setStore('contacts', contacts);
  document.getElementById('ob-con-name').value = '';
  document.getElementById('ob-con-nick').value = '';
  document.getElementById('ob-con-phone').value = '';
  document.getElementById('ob-con-emergency').checked = false;
  renderObConList();
  showToast(name + ' ajouté ');
}

function renderObConList() {
  const contacts = getStore('contacts');
  const list = document.getElementById('ob-con-list');
  if (!list) return;
  list.innerHTML = contacts.map(c => `
    <div class="ob-list-item">
      <div>
        <div class="ob-list-item-text">${c.is_emergency ? ' ' : ''}${escHtml(c.name)} ${c.nickname ? '(' + escHtml(c.nickname) + ')' : ''}</div>
        <div class="ob-list-item-sub">${escHtml(c.phone)}</div>
      </div>
      <button class="ob-delete-btn" onclick="obDeleteContact(${c.id})"></button>
    </div>`).join('');
  const hint = document.getElementById('ob-con-hint');
  if (hint) hint.style.display = contacts.some(c => c.is_emergency) ? 'none' : '';
}

function obDeleteContact(id) {
  setStore('contacts', getStore('contacts').filter(c => c.id !== id));
  renderObConList();
}

function obAddAppointment() {
  const title = document.getElementById('ob-apt-title').value.trim();
  const doctor = document.getElementById('ob-apt-doctor').value.trim();
  const date = document.getElementById('ob-apt-date').value;
  const time = document.getElementById('ob-apt-time').value;
  if (!title || !date) { showToast('Titre et date requis', true); return; }
  const apts = getStore('appointments');
  apts.push({ id: Date.now(), title, doctor, date, time, created: new Date().toISOString() });
  setStore('appointments', apts);
  document.getElementById('ob-apt-title').value = '';
  document.getElementById('ob-apt-doctor').value = '';
  document.getElementById('ob-apt-date').value = '';
  document.getElementById('ob-apt-time').value = '';
  renderObAptList();
  showToast(title + ' ajouté ');
}

function renderObAptList() {
  const apts = getStore('appointments');
  const list = document.getElementById('ob-apt-list');
  if (!list) return;
  list.innerHTML = apts.map(a => `
    <div class="ob-list-item">
      <div>
        <div class="ob-list-item-text"> ${escHtml(a.title)}</div>
        <div class="ob-list-item-sub">${a.date} ${a.time || ''} ${a.doctor ? '— Dr. ' + escHtml(a.doctor) : ''}</div>
      </div>
      <button class="ob-delete-btn" onclick="obDeleteApt(${a.id})"></button>
    </div>`).join('');
}

function obDeleteApt(id) {
  setStore('appointments', getStore('appointments').filter(a => a.id !== id));
  renderObAptList();
}

function finishOnboarding() {
  setStore('onboarded', true);
  showScreen('screen-main');
  updateGreeting();
  proactiveCheck();
  speak('Bonjour ' + (getStore('user')?.name || '') + ' ! Je suis Nour, votre assistante. Appuyez sur le bouton pour me parler.');
}

/* ══════════════════════════════════════════
   GREETING
   ══════════════════════════════════════════ */
function updateGreeting() {
  const name = getStore('user')?.name || '';
  const hour = new Date().getHours();
  let sub = 'Bonne matinée !';
  if (hour >= 12 && hour < 18) sub = 'Bon après-midi !';
  else if (hour >= 18 && hour < 22) sub = 'Bonne soirée !';
  else if (hour >= 22 || hour < 6) sub = 'Bonsoir !';

  const nameEl = document.getElementById('greeting-name');
  const subEl = document.getElementById('greeting-sub');
  if (nameEl) nameEl.textContent = 'Bonjour ' + (name || '') + ' ';
  if (subEl) subEl.textContent = sub;
}

/* ══════════════════════════════════════════
   MIC STATE MACHINE
   ══════════════════════════════════════════ */
function setMicState(state) {
  const btn = document.getElementById('mic-btn');
  const icon = document.getElementById('mic-icon');
  const spinner = document.getElementById('mic-spinner');
  const label = document.getElementById('mic-label');
  const pulse = document.getElementById('pulse-ring');
  if (!btn) return;

  btn.className = 'mic-btn';
  icon.classList.remove('hidden');
  spinner.classList.add('hidden');
  pulse.classList.remove('active');

  switch (state) {
    case 'idle':
      icon.textContent = '';
      label.textContent = 'Appuyer pour parler';
      break;
    case 'recording':
      btn.classList.add('recording');
      icon.textContent = '';
      label.textContent = 'Appuyer pour arrêter';
      pulse.classList.add('active');
      break;
    case 'processing':
      btn.classList.add('processing');
      icon.classList.add('hidden');
      spinner.classList.remove('hidden');
      label.textContent = 'Analyse en cours…';
      break;
    case 'speaking':
      btn.classList.add('speaking');
      icon.textContent = '';
      label.textContent = 'Nour parle…';
      break;
  }
}

/* ══════════════════════════════════════════
   RECORDING
   ══════════════════════════════════════════ */
let mediaRecorder = null;
let audioChunks = [];
let isRecording = false;

async function startRecording() {
  const keys = getStore('api_keys');
  if (!keys?.groq) {
    showToast('Ajoutez votre clé Groq dans  Paramètres pour activer Nour', true);
    speak('Pour utiliser Nour, ajoutez votre clé Groq dans les paramètres.');
    showScreen('screen-settings');
    return;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mimeType = ['audio/webm;codecs=opus','audio/webm','audio/ogg'].find(t => MediaRecorder.isTypeSupported(t)) || 'audio/webm';
    mediaRecorder = new MediaRecorder(stream, { mimeType });
    audioChunks = [];

    mediaRecorder.ondataavailable = e => { if (e.data.size > 0) audioChunks.push(e.data); };
    mediaRecorder.onstop = async () => {
      stream.getTracks().forEach(t => t.stop());
      const blob = new Blob(audioChunks, { type: mimeType });
      await processRecording(blob);
    };

    mediaRecorder.start(100);
    isRecording = true;
    setMicState('recording');
    speak('Je vous écoute.');
  } catch (err) {
    speak('Impossible d\'accéder au microphone. Vérifiez les permissions.');
    showToast('Microphone inaccessible', true);
  }
}

function stopRecording() {
  if (mediaRecorder?.state === 'recording') {
    mediaRecorder.stop();
  }
  isRecording = false;
  setMicState('processing');
}

function toggleRecording() {
  if (isRecording) stopRecording();
  else startRecording();
}

async function processRecording(blob) {
  hideCards();
  try {
    const { text, language } = await transcribeAudio(blob);
    if (!text || text.trim().length < 2) {
      speak('Je n\'ai rien entendu. Pouvez-vous répéter plus fort ?');
      setMicState('idle');
      return;
    }
    showTranscriptCard(text, language);
    await runAgent(text);
  } catch (err) {
    const msg = 'Une erreur est survenue. ' + (err.message || 'Réessayez.');
    speak(msg);
    showToast(msg, true);
    setMicState('idle');
    console.error('processRecording error:', err);
  }
}

// Short recording helper for onboarding name input
function recordShort(ms) {
  return new Promise(async (resolve, reject) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = ['audio/webm;codecs=opus','audio/webm','audio/ogg'].find(t => MediaRecorder.isTypeSupported(t)) || 'audio/webm';
      const rec = new MediaRecorder(stream, { mimeType });
      const chunks = [];
      rec.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
      rec.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        resolve(new Blob(chunks, { type: mimeType }));
      };
      rec.start();
      setTimeout(() => rec.stop(), ms);
    } catch (e) { reject(e); }
  });
}

/* ══════════════════════════════════════════
   API HELPERS
   ══════════════════════════════════════════ */
async function transcribeAudio(audioBlob) {
  const keys = getStore('api_keys');
  if (!keys?.groq) throw new Error('Clé Groq manquante');

  const form = new FormData();
  form.append('file', audioBlob, 'audio.webm');
  form.append('model', 'whisper-large-v3');
  form.append('response_format', 'verbose_json');

  const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + keys.groq },
    body: form
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error('Groq Whisper: ' + (err.error?.message || res.status));
  }
  const data = await res.json();
  return { text: data.text || '', language: data.language || 'fr' };
}

async function callGroq(prompt) {
  const keys = getStore('api_keys');
  if (!keys?.groq) throw new Error('Clé Groq manquante');

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + keys.groq,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      response_format: { type: 'json_object' }
    })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error('Groq LLM: ' + (err.error?.message || res.status));
  }
  const data = await res.json();
  return data.choices[0].message?.content || '';
}

function speak(text, onEnd) {
  if (!text || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  const prefs = getStore('preferences');
  u.lang = 'fr-FR';
  u.rate = prefs?.voice_speed || 0.82;
  u.pitch = 1.0;
  u.volume = 1.0;
  // Try to find a French voice
  const voices = window.speechSynthesis.getVoices();
  const frVoice = voices.find(v => v.lang.startsWith('fr'));
  if (frVoice) u.voice = frVoice;
  if (onEnd) u.onend = onEnd;
  window.speechSynthesis.speak(u);
}

// Ensure voices are loaded
if (window.speechSynthesis) {
  window.speechSynthesis.onvoiceschanged = () => {};
}

/* ══════════════════════════════════════════
   AGENT BRAIN
   ══════════════════════════════════════════ */
async function runAgent(transcript) {
  setMicState('processing');
  showAgentProgress();

  const memory = {
    name:         getStore('user')?.name,
    contacts:     getStore('contacts'),
    medications:  getStore('medications'),
    appointments: getStore('appointments'),
    history:      (getStore('history') || []).slice(0, 5),
    preferences:  getStore('preferences')
  };

  const prompt = buildAgentPrompt(transcript, memory);

  let plan;
  try {
    const raw = await callGroq(prompt);
    const clean = raw.replace(/```json|```/g, '').trim();
    plan = JSON.parse(clean);
  } catch (err) {
    console.error('Agent parse error:', err);
    plan = {
      understood: 'Je n\'ai pas pu analyser votre demande',
      response_voice: 'Excusez-moi, pouvez-vous répéter ?',
      tools_to_call: [],
      needs_clarification: false,
      confidence: 0
    };
  }

  if (plan.needs_clarification) {
    speak(plan.clarification_question || 'Pouvez-vous préciser ?');
    showClarificationCard(plan.clarification_question || 'Pouvez-vous préciser ?');
    return;
  }

  const toolResults = [];
  for (const toolCall of (plan.tools_to_call || [])) {
    updateToolProgress(toolCall.tool, 'running');
    try {
      const result = await executeTool(toolCall.tool, toolCall.params || {});
      toolResults.push({ tool: toolCall.tool, result, success: true });
      updateToolProgress(toolCall.tool, 'done');
    } catch (err) {
      toolResults.push({ tool: toolCall.tool, error: err.message, success: false });
      updateToolProgress(toolCall.tool, 'error');
    }
  }

  const responseText = plan.response_voice || plan.understood || 'C\'est fait !';
  speak(responseText, () => setMicState('idle'));
  setMicState('speaking');

  showResultCard(plan, toolResults);
  saveInteraction(transcript, plan, toolResults);

  // Auto-dismiss after 6 seconds
  setTimeout(() => {
    const card = document.getElementById('card-result');
    if (card && !card.classList.contains('hidden')) {
      card.classList.add('hidden');
      setMicState('idle');
    }
  }, 6000);
}

function buildAgentPrompt(transcript, memory) {
  return `Tu es "Nour", l'assistante vocale personnelle de ${memory.name || 'cette personne'}.
Tu es comme un membre de la famille — chaleureux, patient, bienveillant, jamais pressé.
Tu t'exprimes en français simple OU en arabe dialectal tunisien selon comment la personne parle.
Tu comprends les phrases hésitantes, incomplètes, et le mélange français-arabe dialectal tunisien.

PROFIL COMPLET DE L'UTILISATEUR:
Contacts: ${JSON.stringify(memory.contacts)}
Médicaments: ${JSON.stringify(memory.medications)}
Rendez-vous: ${JSON.stringify(memory.appointments)}
Historique récent: ${JSON.stringify(memory.history)}
Préférences: ${JSON.stringify(memory.preferences)}

CE QUE LA PERSONNE VIENT DE DIRE:
"${transcript}"

HEURE ACTUELLE: ${new Date().toLocaleString('fr-TN')}

OUTILS DISPONIBLES:
1. reminder_manager — params: { action: "set|list|delete", text: string, time: string, contact: string|null }
2. contact_caller — params: { contact_name: string }
3. whatsapp_sender — params: { contact_name: string, message: string }
4. medication_tracker — params: { action: "taken|missed|list_due|list_missed", medication_name: string|null }
5. calendar_manager — params: { action: "add|list_upcoming|next|delete", title: string, date: string, time: string, doctor: string }
6. weather_fetcher — params: { city: "Tunis" }
7. news_fetcher — params: { category: "general" }
8. smart_home_controller — params: { device: string, action: "turn_on|turn_off" }
9. emergency_responder — params: { severity: "high|critical", symptoms: string }
10. memory_reader — params: { type: "contacts|medications|appointments|all" }

RÈGLES DE DÉCISION:
- "عيّط على ولدي" ou "appelle mon fils" → contact_caller, cherche par nom OU nickname arabe
- "فكّرني" ou "rappelle-moi" → reminder_manager
- "نسيت الدواء" ou "j'ai pris mon médicament" → medication_tracker
- "j'ai mal" + urgent → emergency_responder
- Plusieurs actions possibles → appelle plusieurs outils
- Incertain → needs_clarification: true

RETOURNE UNIQUEMENT CE JSON VALIDE, SANS MARKDOWN, SANS BACKTICKS:
{
  "understood": "ce que tu as compris en une phrase simple en français",
  "response_voice": "réponse à dire à voix haute, chaleureuse et courte, en français OU darija selon comment la personne a parlé",
  "tools_to_call": [
    {
      "tool": "nom_exact_outil",
      "params": {},
      "reason": "pourquoi cet outil"
    }
  ],
  "needs_clarification": false,
  "clarification_question": null,
  "confidence": 0.95
}`;
}

/* ══════════════════════════════════════════
   TOOL EXECUTOR
   ══════════════════════════════════════════ */
async function executeTool(name, params) {
  if (!tools[name]) throw new Error('Outil inconnu: ' + name);
  return await tools[name](params);
}

const tools = {

  /* ── TOOL 1: reminder_manager ── */
  reminder_manager: async (params) => {
    const action = params.action || 'set';
    const reminders = getStore('reminders');

    if (action === 'list') {
      return { reminders: reminders.filter(r => !r.fired) };
    }

    if (action === 'delete') {
      const updated = reminders.filter(r => r.id !== params.id);
      setStore('reminders', updated);
      return { success: true };
    }

    // set
    const parsedTime = parseTimeString(params.time || '');
    const reminder = {
      id: Date.now(),
      text: params.text || 'Rappel',
      time: params.time || null,
      contact: params.contact || null,
      created: new Date().toISOString(),
      fired: false,
      scheduled_for: parsedTime ? parsedTime.toISOString() : null
    };
    reminders.push(reminder);
    setStore('reminders', reminders);

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }

    // Schedule if within 24 hours
    if (parsedTime) {
      const delay = parsedTime.getTime() - Date.now();
      if (delay > 0 && delay < 86400000) {
        setTimeout(() => {
          if (Notification.permission === 'granted') {
            new Notification('SeniorVoice — Rappel', { body: reminder.text, icon: '' });
          }
          speak(reminder.text);
          // Mark as fired
          const rs = getStore('reminders');
          const r = rs.find(x => x.id === reminder.id);
          if (r) { r.fired = true; setStore('reminders', rs); }
        }, delay);
      }
    }

    return { success: true, reminder_id: reminder.id, scheduled_for: reminder.scheduled_for };
  },

  /* ── TOOL 2: contact_caller ── */
  contact_caller: async (params) => {
    const contacts = getStore('contacts');
    const query = (params.contact_name || '').toLowerCase();
    const contact = contacts.find(c =>
      c.name.toLowerCase().includes(query) ||
      (c.nickname && (c.nickname.includes(query) || query.includes(c.nickname))) ||
      query.includes(c.name.toLowerCase())
   );
    if (!contact) return { error: 'not_found', message: 'Je ne trouve pas ce contact dans votre liste.' };
    // On mobile, initiate call
    const isMobile = /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent);
    if (isMobile) {
      setTimeout(() => { window.location.href = 'tel:' + contact.phone; }, 1500);
    } else {
      window.location.href = 'tel:' + contact.phone;
    }
    return { success: true, calling: contact.name, phone: contact.phone };
  },

  /* ── TOOL 3: whatsapp_sender ── */
  whatsapp_sender: async (params) => {
    const contacts = getStore('contacts');
    const query = (params.contact_name || '').toLowerCase();
    const contact = contacts.find(c =>
      c.name.toLowerCase().includes(query) ||
      (c.nickname && (c.nickname.includes(query) || query.includes(c.nickname)))
   );
    if (!contact) return { error: 'not_found', message: 'Contact introuvable.' };
    let phone = contact.phone.replace(/\s/g, '');
    if (phone.startsWith('0')) phone = '216' + phone.slice(1);
    if (phone.startsWith('+')) phone = phone.slice(1);
    const url = 'https://wa.me/' + phone + '?text=' + encodeURIComponent(params.message || '');
    window.open(url, '_blank');
    return { success: true, sent_to: contact.name };
  },

  /* ── TOOL 4: medication_tracker ── */
  medication_tracker: async (params) => {
    const action = params.action || 'taken';
    const log = getStore('medication_log');
    const meds = getStore('medications');
    const now = new Date();
    const today = now.toDateString();

    if (action === 'taken') {
      const medName = params.medication_name;
      // Find the medication (fuzzy match)
      const med = meds.find(m => !medName || m.name.toLowerCase().includes((medName || '').toLowerCase()));
      const name = med ? med.name : (medName || 'médicament');
      log.push({ medication: name, taken_at: now.toISOString(), status: 'taken' });
      setStore('medication_log', log);
      return { success: true, message: name + ' marqué comme pris' };
    }

    if (action === 'list_due') {
      const hour = now.getHours();
      const timeMap = { matin: 8, midi: 12, soir: 18, nuit: 21 };
      const due = meds.filter(m =>
        (m.schedule || []).some(period => Math.abs((timeMap[period] || 0) - hour) <= 1)
     );
      return { due_medications: due };
    }

    if (action === 'list_missed' || action === 'missed') {
      const missed = meds.filter(m => {
        const takenToday = log.some(l =>
          l.medication === m.name &&
          new Date(l.taken_at).toDateString() === today &&
          l.status === 'taken'
       );
        return !takenToday;
      });
      return { missed_medications: missed };
    }

    return { success: false, message: 'Action inconnue' };
  },

  /* ── TOOL 5: calendar_manager ── */
  calendar_manager: async (params) => {
    const action = params.action || 'list_upcoming';
    const apts = getStore('appointments');
    const today = new Date().toISOString().split('T')[0];

    if (action === 'add') {
      const newApt = {
        id: Date.now(),
        title: params.title || 'Rendez-vous',
        doctor: params.doctor || '',
        date: params.date || today,
        time: params.time || '',
        created: new Date().toISOString()
      };
      apts.push(newApt);
      setStore('appointments', apts);
      return { success: true, appointment: newApt };
    }

    if (action === 'delete') {
      setStore('appointments', apts.filter(a => a.id !== params.id));
      return { success: true };
    }

    const upcoming = apts
      .filter(a => a.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date));

    if (action === 'next') return { next: upcoming[0] || null };
    return { appointments: upcoming.slice(0, 5) };
  },

  /* ── TOOL 6: weather_fetcher ── */
  weather_fetcher: async (params) => {
    const city = params.city || 'Tunis';
    try {
      const res = await fetch('https://wttr.in/' + encodeURIComponent(city) + '?format=%C+%t&lang=fr');
      const text = await res.text();
      return { weather: text.trim(), city };
    } catch (e) {
      return { weather: 'Météo indisponible', city };
    }
  },

  /* ── TOOL 7: news_fetcher ── */
  news_fetcher: async (params) => {
    try {
      const rssUrl = encodeURIComponent('https://www.tap.info.tn/fr/?format=feed&type=rss');
      const res = await fetch('https://api.rss2json.com/v1/api.json?rss_url=' + rssUrl);
      const data = await res.json();
      const headlines = (data.items || []).slice(0, 3).map(i => i.title);
      return { headlines };
    } catch (e) {
      return { headlines: ['Actualités indisponibles pour le moment.'] };
    }
  },

  /* ── TOOL 8: smart_home_controller ── */
  smart_home_controller: async (params) => {
    const ha = getStore('ha_config');
    if (ha && ha.url && ha.token) {
      const entityMap = {
        'lumière': 'light.salon', 'lampe': 'light.salon',
        'télévision': 'media_player.tv', 'tv': 'media_player.tv',
        'climatiseur': 'climate.salon', 'ventilateur': 'fan.salon'
      };
      const device = (params.device || '').toLowerCase();
      const entityKey = Object.keys(entityMap).find(k => device.includes(k));
      const entity = entityMap[entityKey] || ('switch.' + device.replace(/\s/g, '_'));
      const service = params.action === 'turn_on' ? 'turn_on' : 'turn_off';
      try {
        await fetch(ha.url + '/api/services/' + entity.split('.')[0] + '/' + service, {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer ' + ha.token,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ entity_id: entity })
        });
        return { success: true, device: params.device, action: params.action };
      } catch (e) {
        return { fallback: true, instruction: 'Veuillez ' + service + ' le ' + params.device + ' manuellement' };
      }
    }
    return { fallback: true, instruction: 'Veuillez ' + (params.action === 'turn_on' ? 'allumer' : 'éteindre') + ' le ' + (params.device || 'appareil') + ' manuellement' };
  },

  /* ── TOOL 9: emergency_responder ── */
  emergency_responder: async (params) => {
    speak('Attention ! Restez calme. J\'appelle les secours.');
    showEmergencyScreen(params.symptoms || '');

    const contacts = getStore('contacts');
    const emergency = contacts.find(c => c.is_emergency);
    if (emergency) {
      const name = getStore('user')?.name || 'Votre proche';
      const msg = 'URGENT: ' + name + ' a besoin d\'aide immédiate. Symptômes: ' + (params.symptoms || 'inconnus');
      let phone = emergency.phone.replace(/\D/g, '');
      if (phone.startsWith('0')) phone = '216' + phone.slice(1);
      window.open('https://wa.me/' + phone + '?text=' + encodeURIComponent(msg), '_blank');
    }

    setTimeout(() => { window.location.href = 'tel:190'; }, 3000);
    return { called: '190', notified: emergency?.name || 'personne' };
  },

  /* ── TOOL 10: memory_reader ── */
  memory_reader: async (params) => {
    const all = {
      name:         getStore('user')?.name,
      contacts:     getStore('contacts'),
      medications:  getStore('medications'),
      appointments: getStore('appointments'),
      preferences:  getStore('preferences')
    };
    if (params.type && all[params.type] !== undefined) {
      return { [params.type]: all[params.type] };
    }
    return all;
  }
};

/* ══════════════════════════════════════════
   TIME PARSER
   ══════════════════════════════════════════ */
function parseTimeString(timeStr) {
  if (!timeStr) return null;
  const now = new Date();
  const s = timeStr.toLowerCase();

  // "dans X heures"
  const inHours = s.match(/dans\s+(\d+)\s+heure/);
  if (inHours) {
    const d = new Date(now);
    d.setHours(d.getHours() + parseInt(inHours[1]));
    return d;
  }

  // "demain matin" / "demain à Xh"
  if (s.includes('demain')) {
    const d = new Date(now);
    d.setDate(d.getDate() + 1);
    const hMatch = s.match(/(\d{1,2})\s*h/);
    d.setHours(hMatch ? parseInt(hMatch[1]) : 8, 0, 0, 0);
    return d;
  }

  // "ce soir" / "ce matin" / "ce midi"
  if (s.includes('soir')) { const d = new Date(now); d.setHours(18, 0, 0, 0); return d; }
  if (s.includes('matin')) { const d = new Date(now); d.setHours(8, 0, 0, 0); return d; }
  if (s.includes('midi')) { const d = new Date(now); d.setHours(12, 0, 0, 0); return d; }
  if (s.includes('nuit')) { const d = new Date(now); d.setHours(21, 0, 0, 0); return d; }

  // "à Xh" or "Xh"
  const hourMatch = s.match(/(?:à\s*)?(\d{1,2})\s*h(?:\s*(\d{2}))?/);
  if (hourMatch) {
    const d = new Date(now);
    d.setHours(parseInt(hourMatch[1]), hourMatch[2] ? parseInt(hourMatch[2]) : 0, 0, 0);
    if (d <= now) d.setDate(d.getDate() + 1); // next occurrence
    return d;
  }

  return null;
}

/* ══════════════════════════════════════════
   UI HELPERS — CARDS
   ══════════════════════════════════════════ */
function hideCards() {
  ['card-transcript','card-progress','card-result','card-clarification'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
  });
}

function showTranscriptCard(text, language) {
  const card = document.getElementById('card-transcript');
  const textEl = document.getElementById('transcript-text');
  const badge = document.getElementById('lang-badge');
  if (!card) return;

  textEl.textContent = text;
  textEl.classList.toggle('rtl', /[\u0600-\u06FF]/.test(text));

  const langMap = { ar: 'AR', fr: 'FR', arabic: 'AR', french: 'FR' };
  const detectedLang = langMap[language] || (/[\u0600-\u06FF]/.test(text) ? 'AR' : 'FR');
  badge.textContent = detectedLang;
  if (detectedLang === 'AR') badge.style.background = '#fef3c7';
  else badge.style.background = '';

  card.classList.remove('hidden');
}

function showAgentProgress() {
  const card = document.getElementById('card-progress');
  const list = document.getElementById('tool-list');
  if (!card) return;
  list.innerHTML = '';
  card.classList.remove('hidden');
}

const toolIcons = {
  reminder_manager: '', contact_caller: '', whatsapp_sender: '',
  medication_tracker: '', calendar_manager: '', weather_fetcher: '',
  news_fetcher: '', smart_home_controller: '', emergency_responder: '',
  memory_reader: ''
};

const toolLabels = {
  reminder_manager: 'Gestion des rappels', contact_caller: 'Appel en cours',
  whatsapp_sender: 'Envoi WhatsApp', medication_tracker: 'Suivi médicaments',
  calendar_manager: 'Calendrier', weather_fetcher: 'Météo',
  news_fetcher: 'Actualités', smart_home_controller: 'Maison connectée',
  emergency_responder: 'Urgence', memory_reader: 'Mémoire'
};

function updateToolProgress(toolName, status) {
  const list = document.getElementById('tool-list');
  if (!list) return;

  let item = document.getElementById('tool-item-' + toolName);
  if (!item) {
    item = document.createElement('div');
    item.className = 'tool-item';
    item.id = 'tool-item-' + toolName;
    item.innerHTML = `
      <span class="tool-item-icon">${toolIcons[toolName] || ''}</span>
      <span class="tool-item-name">${toolLabels[toolName] || toolName}…</span>
      <span class="tool-item-status" id="tool-status-${toolName}"></span>`;
    list.appendChild(item);
  }

  const statusEl = document.getElementById('tool-status-' + toolName);
  if (!statusEl) return;
  if (status === 'running') statusEl.innerHTML = '<span class="tool-spinner"></span>';
  else if (status === 'done') statusEl.textContent = '';
  else if (status === 'error') statusEl.textContent = '';
}

function showResultCard(plan, toolResults) {
  const card = document.getElementById('card-result');
  const understood = document.getElementById('result-understood');
  const response = document.getElementById('result-response');
  if (!card) return;

  // Build result text including tool outputs
  let responseText = plan.response_voice || plan.understood || '';

  // Append tool results to response if useful
  for (const tr of toolResults) {
    if (!tr.success) continue;
    const r = tr.result;
    if (tr.tool === 'weather_fetcher' && r.weather) {
      responseText += ' La météo à ' + r.city + ' : ' + r.weather + '.';
    }
    if (tr.tool === 'news_fetcher' && r.headlines?.length) {
      responseText += ' Voici les actualités : ' + r.headlines.slice(0, 2).join('. ') + '.';
    }
    if (tr.tool === 'contact_caller' && r.calling) {
      responseText = 'J\'appelle ' + r.calling + ' maintenant.';
    }
    if (tr.tool === 'medication_tracker' && r.message) {
      responseText = r.message + '.';
    }
  }

  understood.textContent = plan.understood || '';
  response.textContent = responseText;

  document.getElementById('card-progress').classList.add('hidden');
  card.classList.remove('hidden');
}

function showClarificationCard(question) {
  const card = document.getElementById('card-clarification');
  const qEl = document.getElementById('clarification-question');
  if (!card) return;
  qEl.textContent = question;
  document.getElementById('card-progress').classList.add('hidden');
  card.classList.remove('hidden');
  setMicState('idle');
}

/* ══════════════════════════════════════════
   EMERGENCY SCREEN
   ══════════════════════════════════════════ */
function showEmergencyScreen(symptoms) {
  const overlay = document.getElementById('emergency-overlay');
  const symptomsEl = document.getElementById('emergency-symptoms');
  const countdown = document.getElementById('emergency-countdown');
  if (!overlay) return;

  symptomsEl.textContent = symptoms ? 'Symptômes : ' + symptoms : '';
  overlay.classList.remove('hidden');

  let count = 3;
  countdown.textContent = 'Appel dans ' + count + '…';
  const timer = setInterval(() => {
    count--;
    if (count > 0) countdown.textContent = 'Appel dans ' + count + '…';
    else { countdown.textContent = 'Appel en cours…'; clearInterval(timer); }
  }, 1000);
}

/* ══════════════════════════════════════════
   PROACTIVE CHECK
   ══════════════════════════════════════════ */
function proactiveCheck() {
  const hour = new Date().getHours();
  const meds = getStore('medications');
  const log = getStore('medication_log');
  const appts = getStore('appointments');
  const today = new Date().toDateString();

  const timeMap = { matin: 8, midi: 12, soir: 18, nuit: 21 };

  Object.entries(timeMap).forEach(([period, h]) => {
    if (hour === h) {
      const due = meds.filter(m => (m.schedule || []).includes(period));
      if (due.length > 0) {
        const names = due.map(m => m.name).join(', ');
        showAlertBanner(' N\'oubliez pas vos médicaments de ' + period + ' : ' + names);
      }
    }
  });

  if (hour === 21) {
    const missed = meds.filter(m => {
      const takenToday = log.some(l =>
        l.medication === m.name &&
        new Date(l.taken_at).toDateString() === today &&
        l.status === 'taken'
     );
      return !takenToday;
    });
    if (missed.length > 0) {
      showAlertBanner(' Avez-vous pris votre ' + missed[0].name + ' aujourd\'hui ?');
    }
  }

  if (hour === 20) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toDateString();
    const tAppts = appts.filter(a => new Date(a.date).toDateString() === tomorrowStr);
    if (tAppts.length > 0) {
      showAlertBanner(' Rappel : ' + tAppts[0].title + ' demain à ' + (tAppts[0].time || ''));
    }
  }
}

function showAlertBanner(message) {
  const banner = document.getElementById('alert-banner');
  const text = document.getElementById('alert-text');
  if (!banner) return;
  text.textContent = message;
  banner.classList.remove('hidden');
  speak(message);
}

/* ══════════════════════════════════════════
   SAVE INTERACTION TO HISTORY
   ══════════════════════════════════════════ */
function saveInteraction(transcript, plan, toolResults) {
  const history = getStore('history');
  history.unshift({
    id: Date.now(),
    timestamp: new Date().toISOString(),
    transcript,
    understood: plan.understood || '',
    response: plan.response_voice || '',
    tools: (plan.tools_to_call || []).map(t => t.tool),
    confidence: plan.confidence || 0
  });
  if (history.length > 100) history.pop();
  setStore('history', history);
}

/* ══════════════════════════════════════════
   DASHBOARD RENDER
   ══════════════════════════════════════════ */
function renderDashboard() {
  renderDashMeds();
  renderDashApts();
  renderDashHistory();
}

function renderDashMeds() {
  const meds = getStore('medications');
  const log = getStore('medication_log');
  const today = new Date().toDateString();
  const hour = new Date().getHours();
  const timeMap = { matin: 8, midi: 12, soir: 18, nuit: 21 };
  const container = document.getElementById('dash-meds-list');
  if (!container) return;

  const rows = [];
  meds.forEach(med => {
    (med.schedule || []).forEach(period => {
      const takenToday = log.some(l =>
        l.medication === med.name &&
        new Date(l.taken_at).toDateString() === today &&
        l.status === 'taken'
     );
      const periodHour = timeMap[period] || 0;
      const isOverdue = !takenToday && hour > periodHour + 1;
      rows.push({ med, period, takenToday, isOverdue });
    });
  });

  if (rows.length === 0) {
    container.innerHTML = '<div class="empty-state"><span class="empty-state-icon"></span><div class="empty-state-text">Aucun médicament enregistré</div></div>';
    return;
  }

  container.innerHTML = rows.map(({ med, period, takenToday, isOverdue }) => `
    <div class="med-row ${takenToday ? 'taken' : isOverdue ? 'overdue' : ''}"
         onclick="toggleMedTaken('${escHtml(med.name)}', '${period}')">
      <div class="med-row-info">
        <div class="med-row-name">${escHtml(med.name)} ${med.dose ? '— ' + escHtml(med.dose) : ''}</div>
        <div class="med-row-detail">${period.charAt(0).toUpperCase() + period.slice(1)} (${timeMap[period]}h)</div>
      </div>
      <div class="med-row-status">${takenToday ? '' : isOverdue ? '' : '⭕'}</div>
    </div>`).join('');
}

function toggleMedTaken(medName, period) {
  const log = getStore('medication_log');
  const today = new Date().toDateString();
  const existing = log.find(l =>
    l.medication === medName &&
    new Date(l.taken_at).toDateString() === today &&
    l.status === 'taken'
 );
  if (existing) {
    setStore('medication_log', log.filter(l => l !== existing));
    showToast(medName + ' marqué comme non pris');
  } else {
    log.push({ medication: medName, taken_at: new Date().toISOString(), status: 'taken', period });
    setStore('medication_log', log);
    showToast(medName + '  pris');
  }
  renderDashMeds();
  renderMedications();
}

function renderDashApts() {
  const apts = getStore('appointments');
  const today = new Date().toISOString().split('T')[0];
  const upcoming = apts.filter(a => a.date >= today).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 3);
  const container = document.getElementById('dash-apts-list');
  if (!container) return;

  if (upcoming.length === 0) {
    container.innerHTML = '<div class="empty-state"><span class="empty-state-icon"></span><div class="empty-state-text">Aucun rendez-vous à venir</div></div>';
    return;
  }

  container.innerHTML = upcoming.map(a => {
    const d = new Date(a.date);
    const day = d.getDate();
    const month = d.toLocaleDateString('fr-FR', { month: 'short' });
    return `
      <div class="apt-row">
        <div class="apt-date-badge">
          <div class="apt-date-day">${day}</div>
          <div class="apt-date-month">${month}</div>
        </div>
        <div class="apt-info">
          <div class="apt-title">${escHtml(a.title)}</div>
          <div class="apt-detail">${a.time ? a.time + ' — ' : ''}${a.doctor ? 'Dr. ' + escHtml(a.doctor) : ''}</div>
        </div>
      </div>`;
  }).join('');
}

function renderDashHistory() {
  const history = getStore('history').slice(0, 5);
  const container = document.getElementById('dash-history-list');
  if (!container) return;

  if (history.length === 0) {
    container.innerHTML = '<div class="empty-state"><span class="empty-state-icon"></span><div class="empty-state-text">Aucune activité récente</div></div>';
    return;
  }

  const actionLabels = {
    reminder_manager: ' Rappel', contact_caller: ' Appel',
    weather_fetcher: ' Météo', news_fetcher: ' Actualités',
    medication_tracker: ' Médicament', emergency_responder: ' Urgence',
    whatsapp_sender: ' WhatsApp', calendar_manager: ' Agenda'
  };

  container.innerHTML = history.map(item => {
    const tool = (item.tools || [])[0];
    const badge = tool ? (actionLabels[tool] || '') : '';
    const badgeClass = tool ? 'badge-' + tool.split('_')[0] : 'badge-unknown';
    return `
      <div class="activity-item">
        <span class="action-badge ${badgeClass}">${badge}</span>
        <span class="activity-text">${escHtml(item.understood || item.transcript || '')}</span>
        <span class="activity-time">${formatRelativeTime(item.timestamp)}</span>
      </div>`;
  }).join('');
}

/* ══════════════════════════════════════════
   CONTACTS RENDER
   ══════════════════════════════════════════ */
function renderContacts() {
  const contacts = getStore('contacts');
  const container = document.getElementById('contacts-list');
  if (!container) return;

  if (contacts.length === 0) {
    container.innerHTML = '<div class="empty-state"><span class="empty-state-icon"></span><div class="empty-state-text">Aucun contact enregistré.<br>Ajoutez vos proches !</div></div>';
    return;
  }

  container.innerHTML = contacts.map(c => {
    const initial = c.name.charAt(0).toUpperCase();
    return `
      <div class="contact-card">
        <div class="contact-avatar">${initial}</div>
        <div class="contact-info">
          <div class="contact-name">
            ${escHtml(c.name)}
            ${c.is_emergency ? '<span class="emergency-star"></span>' : ''}
          </div>
          ${c.nickname ? `<div class="contact-nick">${escHtml(c.nickname)}</div>` : ''}
          <div class="contact-phone">${escHtml(c.phone)}</div>
        </div>
        <div class="contact-actions">
          <button class="contact-btn contact-btn-call" onclick="callContact(${c.id})" title="Appeler"></button>
          <button class="contact-btn contact-btn-wa" onclick="waContact(${c.id})" title="WhatsApp"></button>
          <button class="contact-btn contact-btn-edit" onclick="editContact(${c.id})" title="Modifier"></button>
          <button class="contact-btn contact-btn-del" onclick="deleteContact(${c.id})" title="Supprimer"></button>
        </div>
      </div>`;
  }).join('');
}

function callContact(id) {
  const c = getStore('contacts').find(x => x.id === id);
  if (c) window.location.href = 'tel:' + c.phone;
}

function waContact(id) {
  const c = getStore('contacts').find(x => x.id === id);
  if (!c) return;
  let phone = c.phone.replace(/\D/g, '');
  if (phone.startsWith('0')) phone = '216' + phone.slice(1);
  window.open('https://wa.me/' + phone, '_blank');
}

function deleteContact(id) {
  if (!confirm('Supprimer ce contact ?')) return;
  setStore('contacts', getStore('contacts').filter(c => c.id !== id));
  renderContacts();
  showToast('Contact supprimé');
}

function editContact(id) {
  const c = getStore('contacts').find(x => x.id === id);
  if (!c) return;
  openModal('Modifier le contact', `
    <input type="text" class="form-input" id="modal-con-name" placeholder="Prénom" value="${escHtml(c.name)}">
    <input type="text" class="form-input" id="modal-con-nick" placeholder="Surnom arabe" value="${escHtml(c.nickname || '')}" dir="auto">
    <input type="tel" class="form-input" id="modal-con-phone" placeholder="Téléphone" value="${escHtml(c.phone)}">
    <label class="ob-check ob-emergency-check">
      <input type="checkbox" id="modal-con-emergency" ${c.is_emergency ? 'checked' : ''}>  Contact d'urgence
    </label>
    <button class="modal-save-btn" onclick="saveEditContact(${id})"> Enregistrer</button>
  `);
}

function saveEditContact(id) {
  const contacts = getStore('contacts');
  const idx = contacts.findIndex(c => c.id === id);
  if (idx === -1) return;
  contacts[idx].name = document.getElementById('modal-con-name').value.trim() || contacts[idx].name;
  contacts[idx].nickname = document.getElementById('modal-con-nick').value.trim();
  contacts[idx].phone = document.getElementById('modal-con-phone').value.trim() || contacts[idx].phone;
  contacts[idx].is_emergency = document.getElementById('modal-con-emergency').checked;
  setStore('contacts', contacts);
  closeModal();
  renderContacts();
  showToast('Contact mis à jour ');
}

function openAddContactModal() {
  openModal('Ajouter un contact', `
    <input type="text" class="form-input" id="modal-con-name" placeholder="Prénom (ex: Mohamed)">
    <input type="text" class="form-input" id="modal-con-nick" placeholder="Surnom arabe (ex: ولدي)" dir="auto">
    <input type="tel" class="form-input" id="modal-con-phone" placeholder="Téléphone (ex: +21698000000)">
    <label class="ob-check ob-emergency-check">
      <input type="checkbox" id="modal-con-emergency">  Contact d'urgence
    </label>
    <button class="modal-save-btn" onclick="saveNewContact()">+ Ajouter</button>
  `);
}

function saveNewContact() {
  const name = document.getElementById('modal-con-name').value.trim();
  const phone = document.getElementById('modal-con-phone').value.trim();
  if (!name || !phone) { showToast('Nom et téléphone requis', true); return; }
  const contacts = getStore('contacts');
  contacts.push({
    id: Date.now(),
    name,
    nickname: document.getElementById('modal-con-nick').value.trim(),
    phone,
    is_emergency: document.getElementById('modal-con-emergency').checked,
    created: new Date().toISOString()
  });
  setStore('contacts', contacts);
  closeModal();
  renderContacts();
  showToast(name + ' ajouté ');
}

/* ══════════════════════════════════════════
   MEDICATIONS RENDER
   ══════════════════════════════════════════ */
function renderMedications() {
  renderMedsToday();
  renderMedsAll();
  renderMedsHistory();
}

function renderMedsToday() {
  const meds = getStore('medications');
  const log = getStore('medication_log');
  const today = new Date().toDateString();
  const timeMap = { matin: 8, midi: 12, soir: 18, nuit: 21 };
  const container = document.getElementById('meds-today-list');
  if (!container) return;

  const rows = [];
  meds.forEach(med => {
    (med.schedule || []).forEach(period => {
      const takenEntry = log.find(l =>
        l.medication === med.name &&
        new Date(l.taken_at).toDateString() === today &&
        l.status === 'taken'
     );
      rows.push({ med, period, takenEntry });
    });
  });

  if (rows.length === 0) {
    container.innerHTML = '<div class="empty-state"><span class="empty-state-icon"></span><div class="empty-state-text">Aucun médicament pour aujourd\'hui</div></div>';
    return;
  }

  container.innerHTML = rows.map(({ med, period, takenEntry }) => `
    <div class="med-card">
      <div class="med-card-icon"></div>
      <div class="med-card-info">
        <div class="med-card-name">${escHtml(med.name)} ${med.dose ? '— ' + escHtml(med.dose) : ''}</div>
        <div class="med-card-detail">${period.charAt(0).toUpperCase() + period.slice(1)} (${timeMap[period]}h)
          ${takenEntry ? ' — Pris à ' + new Date(takenEntry.taken_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : ''}
        </div>
      </div>
      <div class="med-card-actions">
        <button class="med-taken-btn ${takenEntry ? 'taken' : ''}"
          onclick="toggleMedTaken('${escHtml(med.name)}', '${period}')">
          ${takenEntry ? ' Pris' : '⭕ À prendre'}
        </button>
      </div>
    </div>`).join('');
}

function renderMedsAll() {
  const meds = getStore('medications');
  const container = document.getElementById('meds-all-list');
  if (!container) return;

  if (meds.length === 0) {
    container.innerHTML = '<div class="empty-state"><span class="empty-state-icon"></span><div class="empty-state-text">Aucun médicament enregistré</div></div>';
    return;
  }

  container.innerHTML = meds.map(m => `
    <div class="med-card">
      <div class="med-card-icon"></div>
      <div class="med-card-info">
        <div class="med-card-name">${escHtml(m.name)} ${m.dose ? '— ' + escHtml(m.dose) : ''}</div>
        <div class="med-card-detail">${(m.schedule || []).join(', ')}</div>
      </div>
      <div class="med-card-actions">
        <button class="med-edit-btn" onclick="editMed(${m.id})"></button>
        <button class="med-del-btn" onclick="deleteMed(${m.id})"></button>
      </div>
    </div>`).join('');
}

function renderMedsHistory() {
  const log = getStore('medication_log');
  const container = document.getElementById('meds-history-list');
  if (!container) return;

  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toDateString();
    const taken = log.filter(l => new Date(l.taken_at).toDateString() === dateStr && l.status === 'taken').length;
    const total = getStore('medications').reduce((sum, m) => sum + (m.schedule || []).length, 0);
    days.push({ date: d, taken, total });
  }

  container.innerHTML = days.map(({ date, taken, total }) => {
    const pct = total > 0 ? Math.round((taken / total) * 100) : 0;
    const label = date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
    return `
      <div class="med-history-day">
        <div class="med-history-date">${label}</div>
        <div class="med-history-bar"><div class="med-history-fill" style="width:${pct}%"></div></div>
        <div class="med-history-count">${taken}/${total}</div>
      </div>`;
  }).join('');
}

function deleteMed(id) {
  if (!confirm('Supprimer ce médicament ?')) return;
  setStore('medications', getStore('medications').filter(m => m.id !== id));
  renderMedications();
  showToast('Médicament supprimé');
}

function editMed(id) {
  const m = getStore('medications').find(x => x.id === id);
  if (!m) return;
  openModal('Modifier le médicament', `
    <input type="text" class="form-input" id="modal-med-name" placeholder="Nom" value="${escHtml(m.name)}">
    <input type="text" class="form-input" id="modal-med-dose" placeholder="Dose" value="${escHtml(m.dose || '')}">
    <div class="ob-schedule-row">
      <label class="ob-check"><input type="checkbox" id="modal-med-matin" ${(m.schedule||[]).includes('matin')?'checked':''}> Matin</label>
      <label class="ob-check"><input type="checkbox" id="modal-med-midi" ${(m.schedule||[]).includes('midi')?'checked':''}> Midi</label>
      <label class="ob-check"><input type="checkbox" id="modal-med-soir" ${(m.schedule||[]).includes('soir')?'checked':''}> Soir</label>
      <label class="ob-check"><input type="checkbox" id="modal-med-nuit" ${(m.schedule||[]).includes('nuit')?'checked':''}> Nuit</label>
    </div>
    <button class="modal-save-btn" onclick="saveEditMed(${id})"> Enregistrer</button>
  `);
}

function saveEditMed(id) {
  const meds = getStore('medications');
  const idx = meds.findIndex(m => m.id === id);
  if (idx === -1) return;
  const schedule = [];
  if (document.getElementById('modal-med-matin').checked) schedule.push('matin');
  if (document.getElementById('modal-med-midi').checked) schedule.push('midi');
  if (document.getElementById('modal-med-soir').checked) schedule.push('soir');
  if (document.getElementById('modal-med-nuit').checked) schedule.push('nuit');
  meds[idx].name = document.getElementById('modal-med-name').value.trim() || meds[idx].name;
  meds[idx].dose = document.getElementById('modal-med-dose').value.trim();
  meds[idx].schedule = schedule;
  setStore('medications', meds);
  closeModal();
  renderMedications();
  showToast('Médicament mis à jour ');
}

function openAddMedModal() {
  openModal('Ajouter un médicament', `
    <input type="text" class="form-input" id="modal-med-name" placeholder="Nom (ex: Amlor)">
    <input type="text" class="form-input" id="modal-med-dose" placeholder="Dose (ex: 5mg)">
    <div class="ob-schedule-row">
      <label class="ob-check"><input type="checkbox" id="modal-med-matin"> Matin</label>
      <label class="ob-check"><input type="checkbox" id="modal-med-midi"> Midi</label>
      <label class="ob-check"><input type="checkbox" id="modal-med-soir"> Soir</label>
      <label class="ob-check"><input type="checkbox" id="modal-med-nuit"> Nuit</label>
    </div>
    <button class="modal-save-btn" onclick="saveNewMed()">+ Ajouter</button>
  `);
}

function saveNewMed() {
  const name = document.getElementById('modal-med-name').value.trim();
  if (!name) { showToast('Entrez le nom du médicament', true); return; }
  const schedule = [];
  if (document.getElementById('modal-med-matin').checked) schedule.push('matin');
  if (document.getElementById('modal-med-midi').checked) schedule.push('midi');
  if (document.getElementById('modal-med-soir').checked) schedule.push('soir');
  if (document.getElementById('modal-med-nuit').checked) schedule.push('nuit');
  const meds = getStore('medications');
  meds.push({ id: Date.now(), name, dose: document.getElementById('modal-med-dose').value.trim(), schedule, created: new Date().toISOString() });
  setStore('medications', meds);
  closeModal();
  renderMedications();
  showToast(name + ' ajouté ');
}

/* ══════════════════════════════════════════
   HISTORY RENDER
   ══════════════════════════════════════════ */
let historyFilter = 'all';

function renderHistory() {
  const history = getStore('history');
  const container = document.getElementById('history-list');
  if (!container) return;

  const toolActionMap = {
    reminder_manager: 'reminder', contact_caller: 'call',
    whatsapp_sender: 'call', medication_tracker: 'medication',
    calendar_manager: 'reminder', weather_fetcher: 'weather',
    news_fetcher: 'news', smart_home_controller: 'smart_home',
    emergency_responder: 'emergency'
  };

  const filtered = historyFilter === 'all' ? history : history.filter(item => {
    const tool = (item.tools || [])[0];
    return tool && toolActionMap[tool] === historyFilter;
  });

  if (filtered.length === 0) {
    container.innerHTML = '<div class="empty-state"><span class="empty-state-icon"></span><div class="empty-state-text">Aucun historique pour le moment.<br>Commencez par parler à Nour !</div></div>';
    return;
  }

  const actionLabels = {
    reminder_manager: ' Rappel', contact_caller: ' Appel',
    whatsapp_sender: ' WhatsApp', medication_tracker: ' Médicament',
    calendar_manager: ' Agenda', weather_fetcher: ' Météo',
    news_fetcher: ' Actualités', smart_home_controller: ' Maison',
    emergency_responder: ' Urgence'
  };

  container.innerHTML = filtered.map(item => {
    const tool = (item.tools || [])[0];
    const badge = tool ? (actionLabels[tool] || '') : '';
    const badgeClass = tool ? 'badge-' + (toolActionMap[tool] || 'unknown') : 'badge-unknown';
    const isRtl = /[\u0600-\u06FF]/.test(item.transcript || '') ? 'rtl' : '';
    return `
      <div class="history-item">
        <div class="history-item-top">
          <span class="action-badge ${badgeClass}">${badge}</span>
          <span class="history-time">${formatRelativeTime(item.timestamp)}</span>
        </div>
        <div class="history-understood">${escHtml(item.understood || '')}</div>
        <div class="history-transcript ${isRtl}">"${escHtml(item.transcript || '')}"</div>
        ${(item.tools || []).length > 0 ? `
          <div class="history-tools">
            ${item.tools.map(t => `<span class="tool-tag">${t}</span>`).join('')}
          </div>` : ''}
      </div>`;
  }).join('');
}

function clearHistory() {
  if (!confirm('Effacer tout l\'historique ?')) return;
  setStore('history', []);
  renderHistory();
  showToast('Historique effacé');
}

/* ══════════════════════════════════════════
   SETTINGS SCREEN
   ══════════════════════════════════════════ */
function loadSettingsScreen() {
  const user = getStore('user');
  const keys = getStore('api_keys');
  const prefs = getStore('preferences');
  const ha = getStore('ha_config');

  const nameEl = document.getElementById('settings-name');
  if (nameEl) nameEl.value = user?.name || '';



  const speedEl = document.getElementById('settings-speed');
  if (speedEl) speedEl.value = prefs?.voice_speed || 0.82;

  const haUrlEl = document.getElementById('settings-ha-url');
  if (haUrlEl) haUrlEl.value = ha?.url || '';

  const haTokenEl = document.getElementById('settings-ha-token');
  if (haTokenEl) haTokenEl.value = ha?.token || '';
}

function saveAllSettings() {
  const name = document.getElementById('settings-name')?.value.trim();
  if (name) {
    const user = getStore('user') || {};
    user.name = name;
    setStore('user', user);
    updateGreeting();
  }



  const speed = parseFloat(document.getElementById('settings-speed')?.value || '0.82');
  setStore('preferences', { ...getStore('preferences'), voice_speed: speed });

  const haUrl = document.getElementById('settings-ha-url')?.value.trim();
  const haToken = document.getElementById('settings-ha-token')?.value.trim();
  if (haUrl && haToken) setStore('ha_config', { url: haUrl, token: haToken });
  else if (!haUrl) setStore('ha_config', null);

  showToast('Paramètres enregistrés ');
  speak('Paramètres enregistrés.');
}


function testVoice() {
  const speed = parseFloat(document.getElementById('settings-speed')?.value || '0.82');
  setStore('preferences', { ...getStore('preferences'), voice_speed: speed });
  speak('Bonjour ! Je suis Nour, votre assistante. Comment puis-je vous aider aujourd\'hui ?');
}

function resetAllData() {
  if (!confirm('Êtes-vous sûr de vouloir effacer toutes les données ? Cette action est irréversible.')) return;
  const keys = ['contacts','medications','appointments','reminders','history','medication_log','preferences','user','ha_config','api_keys','onboarded'];
  keys.forEach(k => localStorage.removeItem('sv_' + k));
  showToast('Données effacées. Rechargement…');
  setTimeout(() => location.reload(), 1500);
}

/* ══════════════════════════════════════════
   MODAL SYSTEM
   ══════════════════════════════════════════ */
function openModal(title, bodyHtml) {
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-body').innerHTML = bodyHtml;
  document.getElementById('modal-overlay').classList.remove('hidden');
}

function closeModal() {
  document.getElementById('modal-overlay').classList.add('hidden');
}

/* ══════════════════════════════════════════
   TOAST
   ══════════════════════════════════════════ */
function showToast(message, isError = false) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.className = 'toast visible' + (isError ? ' error' : '');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('visible'), 3500);
}

/* ══════════════════════════════════════════
   UTILITIES
   ══════════════════════════════════════════ */
function escHtml(text) {
  if (!text) return '';
  const d = document.createElement('div');
  d.textContent = String(text);
  return d.innerHTML;
}

function formatRelativeTime(iso) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    const now = new Date();
    const diff = Math.floor((now - d) / 1000);
    if (diff < 60) return 'À l\'instant';
    if (diff < 3600) return 'Il y a ' + Math.floor(diff / 60) + ' min';
    if (diff < 86400) return 'Il y a ' + Math.floor(diff / 3600) + 'h';
    if (diff < 172800) return 'Hier';
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  } catch { return ''; }
}

/* ══════════════════════════════════════════
   QUICK ACTIONS (Dashboard)
   ══════════════════════════════════════════ */
async function quickAction(type) {
  showScreen('screen-main');
  setMicState('processing');
  showAgentProgress();

  const memory = {
    name: getStore('user')?.name,
    contacts: getStore('contacts'),
    medications: getStore('medications'),
    appointments: getStore('appointments'),
    history: [],
    preferences: getStore('preferences')
  };

  let toolName, params, responseText;

  switch (type) {
    case 'call': {
      const emergency = getStore('contacts').find(c => c.is_emergency);
      if (!emergency) {
        speak('Aucun contact d\'urgence configuré. Ajoutez un contact dans la section Contacts.');
        setMicState('idle');
        return;
      }
      toolName = 'contact_caller';
      params = { contact_name: emergency.name };
      responseText = 'J\'appelle ' + emergency.name + '.';
      break;
    }
    case 'weather':
      toolName = 'weather_fetcher';
      params = { city: 'Tunis' };
      responseText = 'Je vérifie la météo…';
      break;
    case 'news':
      toolName = 'news_fetcher';
      params = { category: 'general' };
      responseText = 'Je cherche les actualités…';
      break;
    case 'meds':
      toolName = 'medication_tracker';
      params = { action: 'list_due' };
      responseText = 'Voici vos médicaments du moment.';
      break;
  }

  updateToolProgress(toolName, 'running');
  try {
    const result = await executeTool(toolName, params);
    updateToolProgress(toolName, 'done');

    if (type === 'weather' && result.weather) responseText = 'La météo à Tunis : ' + result.weather;
    if (type === 'news' && result.headlines?.length) responseText = 'Actualités : ' + result.headlines.slice(0, 2).join('. ');
    if (type === 'meds' && result.due_medications?.length) {
      responseText = 'Médicaments à prendre maintenant : ' + result.due_medications.map(m => m.name).join(', ');
    } else if (type === 'meds') {
      responseText = 'Aucun médicament à prendre en ce moment.';
    }
  } catch (e) {
    updateToolProgress(toolName, 'error');
    responseText = 'Une erreur est survenue.';
  }

  speak(responseText, () => setMicState('idle'));
  setMicState('speaking');

  const plan = { understood: responseText, response_voice: responseText, tools_to_call: [{ tool: toolName }] };
  showResultCard(plan, []);
}

/* ══════════════════════════════════════════
   INIT
   ══════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {

  // Check onboarding
  const onboarded = getStore('onboarded');
  if (!onboarded) {
    showScreen('screen-onboarding');
    initOnboarding();
  } else {
    showScreen('screen-main');
    updateGreeting();
    proactiveCheck();
    setInterval(proactiveCheck, 3600000);
  }

  // Mic button
  document.getElementById('mic-btn')?.addEventListener('click', toggleRecording);

  // Bottom nav
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', () => showScreen(tab.dataset.screen));
  });

  // Topbar settings button
  document.getElementById('btn-topbar-settings')?.addEventListener('click', () => showScreen('screen-settings'));

  // Alert banner dismiss
  document.getElementById('alert-dismiss')?.addEventListener('click', () => {
    document.getElementById('alert-banner').classList.add('hidden');
  });

  // Result card buttons
  document.getElementById('btn-confirm')?.addEventListener('click', () => {
    document.getElementById('card-result').classList.add('hidden');
    setMicState('idle');
  });
  document.getElementById('btn-retry')?.addEventListener('click', () => {
    hideCards();
    setMicState('idle');
  });

  // Clarification card
  document.getElementById('btn-mic-clarify')?.addEventListener('click', () => {
    document.getElementById('card-clarification').classList.add('hidden');
    startRecording();
  });
  document.getElementById('btn-type-clarify')?.addEventListener('click', () => {
    const input = document.getElementById('clarification-input');
    const text = input?.value.trim();
    if (text) {
      document.getElementById('card-clarification').classList.add('hidden');
      input.value = '';
      runAgent(text);
    }
  });
  document.getElementById('clarification-input')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('btn-type-clarify').click();
  });

  // Emergency cancel
  document.getElementById('emergency-cancel')?.addEventListener('click', () => {
    document.getElementById('emergency-overlay').classList.add('hidden');
    window.speechSynthesis.cancel();
    setMicState('idle');
  });

  // Modal close
  document.getElementById('modal-close')?.addEventListener('click', closeModal);
  document.getElementById('modal-overlay')?.addEventListener('click', e => {
    if (e.target === document.getElementById('modal-overlay')) closeModal();
  });

  // Contacts screen
  document.getElementById('btn-add-contact')?.addEventListener('click', openAddContactModal);

  // Medications screen
  document.getElementById('btn-add-med')?.addEventListener('click', openAddMedModal);

  // History screen
  document.getElementById('btn-clear-history')?.addEventListener('click', clearHistory);
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      historyFilter = btn.dataset.filter;
      renderHistory();
    });
  });

  // Settings screen
  document.getElementById('btn-save-settings')?.addEventListener('click', saveAllSettings);
  document.getElementById('btn-save-profile')?.addEventListener('click', saveAllSettings);

  document.getElementById('btn-test-voice')?.addEventListener('click', testVoice);
  document.getElementById('btn-reset-all')?.addEventListener('click', resetAllData);

  // Show/hide key buttons in settings
  document.querySelectorAll('.show-key-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = document.getElementById(btn.dataset.target);
      if (input) input.type = input.type === 'password' ? 'text' : 'password';
    });
  });

  // Dashboard quick actions
  document.getElementById('qa-call')?.addEventListener('click', () => quickAction('call'));
  document.getElementById('qa-weather')?.addEventListener('click', () => quickAction('weather'));
  document.getElementById('qa-news')?.addEventListener('click', () => quickAction('news'));
  document.getElementById('qa-meds')?.addEventListener('click', () => quickAction('meds'));
});
