import React, { useState } from 'react'
import { cn } from '../lib/utils'
import { Button, Card, Input, Label, BottomNav } from '../components/ui'
import { getStore, setStore } from '../services/storage'
import { executeTool } from '../services/tools'
import { Pill, CheckCircle, Plus, Clock, X } from 'lucide-react'

function AddMedicationModal({ open, onClose, onAdd }) {
  const [name, setName] = useState('')
  const [dose, setDose] = useState('')
  const [schedule, setSchedule] = useState([])

  if (!open) return null

  const toggleSchedule = (time) => {
    setSchedule(prev => prev.includes(time) ? prev.filter(t => t !== time) : [...prev, time])
  }

  const handleSubmit = () => {
    if (name) {
      onAdd({ name, dose, schedule })
      setName(''); setDose(''); setSchedule([])
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#1e3a5f]/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-in">
        <div className="flex justify-between items-center mb-5">
          <h2 className="font-heading text-xl text-[#1e3a5f] font-bold">Nouveau médicament</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-[#f5f7fa] hover:bg-[#e8ecf2] flex items-center justify-center transition-colors">
            <X size={16} className="text-[#6b7a8d]" />
          </button>
        </div>
        <div className="space-y-3">
          <div>
            <Label>Nom du médicament</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Amlor" />
          </div>
          <div>
            <Label>Dose</Label>
            <Input value={dose} onChange={e => setDose(e.target.value)} placeholder="Ex: 5mg" />
          </div>
          <div>
            <Label>Horaires</Label>
            <div className="flex gap-2 mt-1">
              {['matin', 'midi', 'soir', 'nuit'].map(t => (
                <button
                  key={t}
                  onClick={() => toggleSchedule(t)}
                  className={cn(
                    'flex-1 py-2 rounded-xl text-sm font-medium transition-all border',
                    schedule.includes(t)
                      ? 'bg-[#1e3a5f] text-white border-[#1e3a5f]'
                      : 'bg-[#f5f7fa] text-[#6b7a8d] border-[#e8ecf2] hover:border-[#1e3a5f]/30'
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <Button variant="outline" onClick={onClose} className="flex-1">Annuler</Button>
          <Button onClick={handleSubmit} className="flex-1">
            <Plus size={16} className="mr-1" /> Ajouter
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function MedicationsPage({ screen, setScreen }) {
  const [showModal, setShowModal] = useState(false)
  const meds = getStore('medications') || []
  const log = getStore('medication_log') || []

  const handleAdd = (med) => {
    const newMeds = [...meds, med]
    setStore('medications', newMeds)
  }

  return (
    <div className="min-h-screen bg-[#fefcf8] pb-24">
      <header className="bg-[#1e3a5f] text-white sticky top-0 z-50">
        <div className="max-w-md mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center">
              <Pill size={18} className="text-[#c9a227]" />
            </div>
            <h1 className="font-heading text-lg font-bold tracking-wide">Médicaments</h1>
          </div>
          <Button size="sm" onClick={() => setShowModal(true)} className="bg-white/15 hover:bg-white/25 text-white shadow-none">
            <Plus size={16} className="mr-1" /> Ajouter
          </Button>
        </div>
      </header>
      
      <div className="max-w-md mx-auto p-4">
        <div className="flex items-center gap-2 mb-4">
          <Clock size={16} className="text-[#c9a227]" />
          <h2 className="font-heading font-bold text-[#1e3a5f]">Aujourd'hui</h2>
        </div>
        
        {meds.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-[#f5f7fa] flex items-center justify-center mx-auto mb-4">
              <Pill size={28} className="text-[#9aa5b6]" />
            </div>
            <p className="text-[#9aa5b6] font-medium">Aucun médicament</p>
          </div>
        ) : (
          meds.map((m, i) => (
            <Card key={i} className="p-4 mb-3 flex justify-between items-center">
              <div>
                <p className="font-bold text-[#1e3a5f]">{m.name}</p>
                <p className="text-sm text-[#9aa5b6]">{m.dose}</p>
                {m.schedule?.length > 0 && (
                  <div className="flex gap-1.5 mt-2">
                    {m.schedule.map(s => (
                      <span key={s} className="text-xs bg-[#1e3a5f]/8 text-[#1e3a5f] px-2.5 py-1 rounded-lg font-medium">{s}</span>
                    ))}
                  </div>
                )}
              </div>
              <button 
                onClick={async () => {
                  await executeTool('medication_tracker', { action: 'taken', medication_name: m.name })
                  setStore('medication_log', [...log, { medication: m.name, taken_at: new Date().toISOString(), status: 'taken' }])
                }}
                className="w-12 h-12 rounded-full border-2 border-[#dde2ea] hover:border-[#2d6a4f] hover:bg-[#2d6a4f]/5 flex items-center justify-center transition-all"
              >
                <CheckCircle size={22} className="text-[#dde2ea]" />
              </button>
            </Card>
          ))
        )}
      </div>

      <AddMedicationModal open={showModal} onClose={() => setShowModal(false)} onAdd={handleAdd} />
      <BottomNav screen={screen} setScreen={setScreen} />
    </div>
  )
}
