import React, { useState } from 'react'
import { cn } from '../lib/utils'
import { Button, Card, Input, Label, BottomNav } from '../components/ui'
import { getStore, setStore } from '../services/storage'
import { Users, Phone, MessageCircle, Star, Plus, X } from 'lucide-react'

function AddContactModal({ open, onClose, onAdd }) {
  const [name, setName] = useState('')
  const [nickname, setNickname] = useState('')
  const [phone, setPhone] = useState('')
  const [isEmergency, setIsEmergency] = useState(false)

  if (!open) return null

  const handleSubmit = () => {
    if (name && phone) {
      onAdd({ name, nickname, phone, is_emergency: isEmergency })
      setName(''); setNickname(''); setPhone(''); setIsEmergency(false)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#1e3a5f]/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-in">
        <div className="flex justify-between items-center mb-5">
          <h2 className="font-heading text-xl text-[#1e3a5f] font-bold">Nouveau contact</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-[#f5f7fa] hover:bg-[#e8ecf2] flex items-center justify-center transition-colors">
            <X size={16} className="text-[#6b7a8d]" />
          </button>
        </div>
        <div className="space-y-3">
          <div>
            <Label>Prénom</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Ahmed" />
          </div>
          <div>
            <Label>Surnom (optionnel)</Label>
            <Input value={nickname} onChange={e => setNickname(e.target.value)} placeholder="Ex: ولدي" dir="auto" />
          </div>
          <div>
            <Label>Téléphone</Label>
            <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Ex: 98 123 456" type="tel" />
          </div>
          <label className="flex items-center gap-2 text-sm text-[#6b7a8d] cursor-pointer py-1">
            <input
              type="checkbox"
              checked={isEmergency}
              onChange={e => setIsEmergency(e.target.checked)}
              className="rounded border-[#dde2ea] text-[#c9a227] focus:ring-[#c9a227]"
            />
            Contact d'urgence
            <Star size={14} className="text-[#c9a227]" />
          </label>
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

export default function ContactsPage({ screen, setScreen }) {
  const [showModal, setShowModal] = useState(false)
  const contacts = getStore('contacts') || []

  const handleAdd = (contact) => {
    const newContacts = [...contacts, contact]
    setStore('contacts', newContacts)
  }

  return (
    <div className="min-h-screen bg-[#fefcf8] pb-24">
      <header className="bg-[#1e3a5f] text-white sticky top-0 z-50">
        <div className="max-w-md mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center">
              <Users size={18} className="text-[#c9a227]" />
            </div>
            <h1 className="font-heading text-lg font-bold tracking-wide">Contacts</h1>
          </div>
          <Button size="sm" onClick={() => setShowModal(true)} className="bg-white/15 hover:bg-white/25 text-white shadow-none">
            <Plus size={16} className="mr-1" /> Ajouter
          </Button>
        </div>
      </header>
      
      <div className="max-w-md mx-auto p-4">
        {contacts.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-[#f5f7fa] flex items-center justify-center mx-auto mb-4">
              <Users size={28} className="text-[#9aa5b6]" />
            </div>
            <p className="text-[#9aa5b6] font-medium">Aucun contact ajouté</p>
          </div>
        ) : (
          contacts.map((c, i) => (
            <Card key={i} className="p-4 mb-3 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#1e3a5f] text-white flex items-center justify-center text-lg font-bold flex-shrink-0">
                {c.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-[#1e3a5f]">{c.name}</p>
                {c.nickname && <p className="text-sm text-[#9aa5b6]" dir="rtl">{c.nickname}</p>}
                <p className="text-sm text-[#9aa5b6]">{c.phone}</p>
              </div>
              {c.is_emergency && <Star size={18} className="text-[#c9a227] fill-[#c9a227] flex-shrink-0" />}
              <div className="flex gap-1 flex-shrink-0">
                <button 
                  onClick={() => { window.location.href = 'tel:' + c.phone }}
                  className="w-10 h-10 rounded-xl bg-[#f5f7fa] hover:bg-[#e8ecf2] flex items-center justify-center transition-colors"
                >
                  <Phone size={16} className="text-[#1e3a5f]" />
                </button>
                <button 
                  onClick={() => { 
                    let phone = c.phone.replace(/\D/g, '')
                    if (phone.startsWith('0')) phone = '216' + phone.slice(1)
                    window.open('https://wa.me/' + phone)
                  }}
                  className="w-10 h-10 rounded-xl bg-[#f5f7fa] hover:bg-[#e8ecf2] flex items-center justify-center transition-colors"
                >
                  <MessageCircle size={16} className="text-[#2d6a4f]" />
                </button>
              </div>
            </Card>
          ))
        )}
      </div>

      <AddContactModal open={showModal} onClose={() => setShowModal(false)} onAdd={handleAdd} />
      <BottomNav screen={screen} setScreen={setScreen} />
    </div>
  )
}
