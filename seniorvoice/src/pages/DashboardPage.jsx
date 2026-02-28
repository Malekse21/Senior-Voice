import React from 'react'
import { cn } from '../lib/utils'
import { Button, Card, BottomNav } from '../components/ui'
import { getStore } from '../services/storage'
import { Pill, Calendar, Zap, Phone, CloudSun, Newspaper, Clock } from 'lucide-react'

export default function DashboardPage({ screen, setScreen }) {
  const meds = getStore('medications') || []
  const appts = getStore('appointments') || []
  const history = getStore('history') || []

  return (
    <div className="min-h-screen bg-[#fefcf8] pb-24">
      <header className="bg-[#1e3a5f] text-white sticky top-0 z-50">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center">
            <Zap size={18} className="text-[#c9a227]" />
          </div>
          <h1 className="font-heading text-lg font-bold tracking-wide">Tableau de bord</h1>
        </div>
      </header>
      
      <div className="max-w-md mx-auto p-4 space-y-4">
        {/* Today's meds */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Pill size={18} className="text-[#c9a227]" />
            <h2 className="font-heading font-bold text-[#1e3a5f]">Médicaments d'aujourd'hui</h2>
          </div>
          {meds.length === 0 ? (
            <p className="text-[#9aa5b6] text-sm">Aucun médicament ajouté</p>
          ) : (
            meds.map((m, i) => (
              <div key={i} className="flex justify-between items-center py-3 border-b border-[#f0f2f5] last:border-0">
                <div>
                  <p className="font-semibold text-[#1e3a5f]">{m.name}</p>
                  <p className="text-sm text-[#9aa5b6]">{m.dose}</p>
                </div>
                <div className="w-8 h-8 rounded-full border-2 border-[#dde2ea] flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-[#dde2ea]" />
                </div>
              </div>
            ))
          )}
        </Card>

        {/* Upcoming appointments */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Calendar size={18} className="text-[#c9a227]" />
            <h2 className="font-heading font-bold text-[#1e3a5f]">Prochains rendez-vous</h2>
          </div>
          {appts.length === 0 ? (
            <p className="text-[#9aa5b6] text-sm">Aucun rendez-vous</p>
          ) : (
            appts.slice(0, 3).map((a, i) => (
              <div key={i} className="py-3 border-b border-[#f0f2f5] last:border-0">
                <p className="font-semibold text-[#1e3a5f]">{a.title}</p>
                <p className="text-sm text-[#9aa5b6]">{a.date} à {a.time}</p>
              </div>
            ))
          )}
        </Card>

        {/* Quick actions */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Zap size={18} className="text-[#c9a227]" />
            <h2 className="font-heading font-bold text-[#1e3a5f]">Actions rapides</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="secondary" onClick={() => setScreen('contacts')} className="justify-start gap-2">
              <Phone size={16} className="text-[#c9a227]" /> Famille
            </Button>
            <Button variant="secondary" onClick={() => setScreen('main')} className="justify-start gap-2">
              <CloudSun size={16} className="text-[#c9a227]" /> Météo
            </Button>
            <Button variant="secondary" onClick={() => setScreen('main')} className="justify-start gap-2">
              <Newspaper size={16} className="text-[#c9a227]" /> Actualités
            </Button>
            <Button variant="secondary" onClick={() => setScreen('medications')} className="justify-start gap-2">
              <Pill size={16} className="text-[#c9a227]" /> Médicaments
            </Button>
          </div>
        </Card>

        {/* Recent activity */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={18} className="text-[#c9a227]" />
            <h2 className="font-heading font-bold text-[#1e3a5f]">Activité récente</h2>
          </div>
          {history.length === 0 ? (
            <p className="text-[#9aa5b6] text-sm">Aucune activité</p>
          ) : (
            history.slice(0, 5).map((h, i) => (
              <div key={i} className="py-3 border-b border-[#f0f2f5] last:border-0">
                <p className="text-sm text-[#4a5568]">{h.transcript}</p>
                <p className="text-xs text-[#9aa5b6] mt-1">{new Date(h.timestamp).toLocaleTimeString('fr-TN', { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            ))
          )}
        </Card>
      </div>

      <BottomNav screen={screen} setScreen={setScreen} />
    </div>
  )
}
