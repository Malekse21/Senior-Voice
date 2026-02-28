import React, { useState } from 'react'
import { cn } from '../lib/utils'
import { Button } from '../components/ui'
import { setStore } from '../services/storage'
import { Hand, Pill, Users, Calendar, Home, ArrowRight, ArrowLeft, Plus, X, Star } from 'lucide-react'

export default function OnboardingPage({ onComplete }) {
  const [obStep, setObStep] = useState(1)
  const [obName, setObName] = useState('')
  const [obMeds, setObMeds] = useState([])
  const [obContacts, setObContacts] = useState([])
  const [obAppts, setObAppts] = useState([])
  const [obHa, setObHa] = useState({ url: '', token: '' })

  const handleObNext = () => {
    if (obStep === 1 && !obName.trim()) return
    if (obStep < 5) {
      setObStep(obStep + 1)
    } else {
      setStore('user', { name: obName })
      setStore('medications', obMeds)
      setStore('contacts', obContacts)
      setStore('appointments', obAppts)
      if (obHa.url && obHa.token) {
        setStore('ha_config', { url: obHa.url, token: obHa.token })
      }
      setStore('onboarded', true)
      onComplete(obName)
    }
  }

  const handleObBack = () => {
    if (obStep > 1) setObStep(obStep - 1)
  }

  const stepIcons = [
    { icon: Hand, label: 'Bienvenue' },
    { icon: Pill, label: 'Médicaments' },
    { icon: Users, label: 'Contacts' },
    { icon: Calendar, label: 'Rendez-vous' },
    { icon: Home, label: 'Maison' },
  ]

  return (
    <div className="min-h-screen bg-[#fefcf8] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg border border-[#e8ecf2] p-8 w-full max-w-md">
        {/* Progress */}
        <div className="flex justify-center gap-3 mb-8">
          {stepIcons.map((s, i) => {
            const Icon = s.icon
            return (
              <div
                key={i}
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300',
                  i + 1 === obStep
                    ? 'bg-[#1e3a5f] text-white scale-110 shadow-md'
                    : i + 1 < obStep
                    ? 'bg-[#c9a227] text-white'
                    : 'bg-[#f5f7fa] text-[#9aa5b6]'
                )}
              >
                <Icon size={18} />
              </div>
            )
          })}
        </div>

        {/* Step 1: Name */}
        {obStep === 1 && (
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-[#f5f7fa] flex items-center justify-center mx-auto mb-5">
              <Hand size={28} className="text-[#c9a227]" />
            </div>
            <h1 className="font-heading text-2xl text-[#1e3a5f] mb-2">Bienvenue !</h1>
            <p className="text-[#6b7a8d] mb-6">Comment vous appelez-vous ?</p>
            <input
              type="text"
              value={obName}
              onChange={e => setObName(e.target.value)}
              placeholder="Votre prénom"
              className="w-full px-4 py-3 border-2 border-[#e8ecf2] rounded-xl text-center text-lg mb-5 focus:border-[#c9a227] outline-none transition-colors text-[#1e3a5f]"
            />
          </div>
        )}

        {/* Step 2: Medications */}
        {obStep === 2 && (
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-[#f5f7fa] flex items-center justify-center mx-auto mb-5">
              <Pill size={28} className="text-[#c9a227]" />
            </div>
            <h1 className="font-heading text-2xl text-[#1e3a5f] mb-2">Vos médicaments</h1>
            <p className="text-[#6b7a8d] mb-4">Ajoutez vos médicaments</p>
            
            {obMeds.map((med, i) => (
              <div key={i} className="bg-[#f5f7fa] rounded-xl p-3 mb-2 flex justify-between items-center">
                <span className="font-medium text-[#1e3a5f]">{med.name} {med.dose}</span>
                <button onClick={() => setObMeds(obMeds.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600">
                  <X size={16} />
                </button>
              </div>
            ))}
            
            <div className="space-y-2 mb-4">
              <input id="med-name" placeholder="Nom (ex: Amlor)" className="w-full px-4 py-2.5 border border-[#e8ecf2] rounded-xl text-[#1e3a5f] focus:border-[#c9a227] outline-none" />
              <input id="med-dose" placeholder="Dose (ex: 5mg)" className="w-full px-4 py-2.5 border border-[#e8ecf2] rounded-xl text-[#1e3a5f] focus:border-[#c9a227] outline-none" />
              <div className="flex gap-3 justify-center py-1">
                {['matin', 'midi', 'soir', 'nuit'].map(t => (
                  <label key={t} className="flex items-center gap-1 text-sm text-[#6b7a8d]">
                    <input type="checkbox" className="med-schedule rounded border-[#dde2ea] text-[#1e3a5f] focus:ring-[#c9a227]" value={t} /> {t}
                  </label>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const name = document.getElementById('med-name').value
                  const dose = document.getElementById('med-dose').value
                  const schedule = Array.from(document.querySelectorAll('.med-schedule:checked')).map(c => c.value)
                  if (name) {
                    setObMeds([...obMeds, { name, dose, schedule }])
                    document.getElementById('med-name').value = ''
                    document.getElementById('med-dose').value = ''
                  }
                }}
                className="w-full"
              >
                <Plus size={16} className="mr-1" /> Ajouter
              </Button>
            </div>
            <button onClick={handleObNext} className="text-[#6b7a8d] hover:text-[#1e3a5f] transition-colors text-sm">
              Passer cette étape <ArrowRight size={14} className="inline ml-1" />
            </button>
          </div>
        )}

        {/* Step 3: Contacts */}
        {obStep === 3 && (
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-[#f5f7fa] flex items-center justify-center mx-auto mb-5">
              <Users size={28} className="text-[#c9a227]" />
            </div>
            <h1 className="font-heading text-2xl text-[#1e3a5f] mb-2">Vos contacts</h1>
            <p className="text-[#6b7a8d] mb-4">Ajoutez vos proches</p>
            
            {obContacts.map((c, i) => (
              <div key={i} className="bg-[#f5f7fa] rounded-xl p-3 mb-2 flex justify-between items-center">
                <span className="text-[#1e3a5f]">
                  {c.name} {c.nickname && `(${c.nickname})`} {c.is_emergency && <Star size={14} className="inline text-[#c9a227] fill-[#c9a227]" />}
                </span>
                <button onClick={() => setObContacts(obContacts.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600">
                  <X size={16} />
                </button>
              </div>
            ))}
            
            <div className="space-y-2 mb-4">
              <input id="con-name" placeholder="Prénom" className="w-full px-4 py-2.5 border border-[#e8ecf2] rounded-xl text-[#1e3a5f] focus:border-[#c9a227] outline-none" />
              <input id="con-nick" placeholder="Surnom (ex: ولدي)" className="w-full px-4 py-2.5 border border-[#e8ecf2] rounded-xl text-[#1e3a5f] focus:border-[#c9a227] outline-none" dir="auto" />
              <input id="con-phone" placeholder="Téléphone" className="w-full px-4 py-2.5 border border-[#e8ecf2] rounded-xl text-[#1e3a5f] focus:border-[#c9a227] outline-none" />
              <label className="flex items-center gap-2 text-sm text-[#6b7a8d]">
                <input type="checkbox" id="con-emergency" className="rounded border-[#dde2ea] text-[#c9a227] focus:ring-[#c9a227]" />
                Contact d'urgence
                <Star size={14} className="text-[#c9a227]" />
              </label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const name = document.getElementById('con-name').value
                  const nickname = document.getElementById('con-nick').value
                  const phone = document.getElementById('con-phone').value
                  const is_emergency = document.getElementById('con-emergency').checked
                  if (name && phone) {
                    setObContacts([...obContacts, { name, nickname, phone, is_emergency }])
                    document.getElementById('con-name').value = ''
                    document.getElementById('con-nick').value = ''
                    document.getElementById('con-phone').value = ''
                    document.getElementById('con-emergency').checked = false
                  }
                }}
                className="w-full"
              >
                <Plus size={16} className="mr-1" /> Ajouter
              </Button>
            </div>
            <button onClick={handleObNext} className="text-[#6b7a8d] hover:text-[#1e3a5f] transition-colors text-sm">
              Suivant <ArrowRight size={14} className="inline ml-1" />
            </button>
          </div>
        )}

        {/* Step 4: Appointments */}
        {obStep === 4 && (
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-[#f5f7fa] flex items-center justify-center mx-auto mb-5">
              <Calendar size={28} className="text-[#c9a227]" />
            </div>
            <h1 className="font-heading text-2xl text-[#1e3a5f] mb-2">Vos rendez-vous</h1>
            
            {obAppts.map((a, i) => (
              <div key={i} className="bg-[#f5f7fa] rounded-xl p-3 mb-2 flex justify-between items-center">
                <span className="text-[#1e3a5f]">{a.title} - {a.date} à {a.time}</span>
                <button onClick={() => setObAppts(obAppts.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600">
                  <X size={16} />
                </button>
              </div>
            ))}
            
            <div className="space-y-2 mb-4">
              <input id="apt-title" placeholder="Titre (ex: Cardiologue)" className="w-full px-4 py-2.5 border border-[#e8ecf2] rounded-xl text-[#1e3a5f] focus:border-[#c9a227] outline-none" />
              <input id="apt-date" type="date" className="w-full px-4 py-2.5 border border-[#e8ecf2] rounded-xl text-[#1e3a5f] focus:border-[#c9a227] outline-none" />
              <input id="apt-time" type="time" className="w-full px-4 py-2.5 border border-[#e8ecf2] rounded-xl text-[#1e3a5f] focus:border-[#c9a227] outline-none" />
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const title = document.getElementById('apt-title').value
                  const date = document.getElementById('apt-date').value
                  const time = document.getElementById('apt-time').value
                  if (title && date && time) {
                    setObAppts([...obAppts, { title, date, time }])
                    document.getElementById('apt-title').value = ''
                  }
                }}
                className="w-full"
              >
                <Plus size={16} className="mr-1" /> Ajouter
              </Button>
            </div>
            <button onClick={handleObNext} className="text-[#6b7a8d] hover:text-[#1e3a5f] transition-colors text-sm">
              Passer cette étape <ArrowRight size={14} className="inline ml-1" />
            </button>
          </div>
        )}

        {/* Step 5: Smart Home */}
        {obStep === 5 && (
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-[#f5f7fa] flex items-center justify-center mx-auto mb-5">
              <Home size={28} className="text-[#c9a227]" />
            </div>
            <h1 className="font-heading text-2xl text-[#1e3a5f] mb-2">Maison connectée</h1>
            <p className="text-[#6b7a8d] mb-4">Optionnel</p>
            
            <div className="space-y-3 mb-6">
              <input
                type="url"
                value={obHa.url}
                onChange={e => setObHa({ ...obHa, url: e.target.value })}
                placeholder="URL Home Assistant"
                className="w-full px-4 py-2.5 border border-[#e8ecf2] rounded-xl text-[#1e3a5f] focus:border-[#c9a227] outline-none"
              />
              <input
                type="password"
                value={obHa.token}
                onChange={e => setObHa({ ...obHa, token: e.target.value })}
                placeholder="Token"
                className="w-full px-4 py-2.5 border border-[#e8ecf2] rounded-xl text-[#1e3a5f] focus:border-[#c9a227] outline-none"
              />
            </div>
            
            <Button variant="gold" onClick={handleObNext} className="w-full">
              Commencer <ArrowRight size={16} className="ml-2" />
            </Button>
          </div>
        )}

        {/* Navigation */}
        {obStep < 5 && (
          <div className="flex gap-3 mt-6">
            {obStep > 1 && (
              <Button variant="outline" onClick={handleObBack} className="flex-1">
                <ArrowLeft size={16} className="mr-1" /> Retour
              </Button>
            )}
            <Button onClick={handleObNext} className="flex-1">
              Suivant <ArrowRight size={16} className="ml-1" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
