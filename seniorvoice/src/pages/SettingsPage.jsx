import React, { useState } from 'react'
import { cn } from '../lib/utils'
import { Button, Card, Input, Label, Slider, BottomNav } from '../components/ui'
import { getStore, setStore } from '../services/storage'
import { speak } from '../services/speech'
import { Settings, User, Volume2, AlertTriangle, Trash2 } from 'lucide-react'

export default function SettingsPage({ screen, setScreen }) {
  const [speed, setSpeed] = useState(getStore('preferences')?.voice_speed || 0.82)

  return (
    <div className="min-h-screen bg-[#fefcf8] pb-24">
      <header className="bg-[#1e3a5f] text-white sticky top-0 z-50">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center">
            <Settings size={18} className="text-[#c9a227]" />
          </div>
          <h1 className="font-heading text-lg font-bold tracking-wide">Réglages</h1>
        </div>
      </header>
      
      <div className="max-w-md mx-auto p-4 space-y-4">
        {/* Profile */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <User size={18} className="text-[#c9a227]" />
            <h2 className="font-heading font-bold text-[#1e3a5f]">Profil</h2>
          </div>
          <div className="space-y-3">
            <div>
              <Label>Votre prénom</Label>
              <Input 
                value={getStore('user')?.name || ''} 
                onChange={e => {
                  setStore('user', { name: e.target.value })
                }}
                placeholder="Entrez votre prénom"
              />
            </div>
          </div>
        </Card>

        {/* Voice */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Volume2 size={18} className="text-[#c9a227]" />
            <h2 className="font-heading font-bold text-[#1e3a5f]">Voix</h2>
          </div>
          <div className="space-y-4">
            <div>
              <Label>Vitesse : {speed}</Label>
              <Slider 
                min="0.6" 
                max="1.2" 
                step="0.05" 
                value={speed}
                onChange={e => {
                  setSpeed(e.target.value)
                  setStore('preferences', { ...getStore('preferences'), voice_speed: parseFloat(e.target.value) })
                }}
              />
              <div className="flex justify-between text-xs text-[#9aa5b6] mt-1">
                <span>Lent</span>
                <span>Rapide</span>
              </div>
            </div>
            <Button 
              variant="outline"
              onClick={() => speak('Bonjour! Je suis Sama, votre assistante personnelle.')}
              className="w-full"
            >
              <Volume2 size={16} className="mr-2" /> Tester la voix
            </Button>
          </div>
        </Card>

        {/* Danger zone */}
        <Card className="p-5 border-red-200">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={18} className="text-red-500" />
            <h2 className="font-heading font-bold text-red-600">Zone de danger</h2>
          </div>
          <p className="text-sm text-[#6b7a8d] mb-4">
            Cette action supprimera définitivement toutes vos données, contacts, médicaments et paramètres.
          </p>
          <Button 
            variant="destructive"
            onClick={() => {
              if (confirm('Êtes-vous sûr ? Toutes les données seront perdues.')) {
                localStorage.clear()
                window.location.reload()
              }
            }}
            className="w-full"
          >
            <Trash2 size={16} className="mr-2" /> Réinitialiser toutes les données
          </Button>
        </Card>
      </div>

      <BottomNav screen={screen} setScreen={setScreen} />
    </div>
  )
}
