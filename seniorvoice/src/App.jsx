import React, { useState, useEffect } from 'react'
import { getStore } from './services/storage'
import { speak } from './services/speech'
import { proactiveCheck } from './services/tools'
import OnboardingPage from './pages/OnboardingPage'
import MainPage from './pages/MainPage'
import DashboardPage from './pages/DashboardPage'
import ContactsPage from './pages/ContactsPage'
import MedicationsPage from './pages/MedicationsPage'
import SettingsPage from './pages/SettingsPage'

export default function App() {
  const [screen, setScreen] = useState('onboarding')

  useEffect(() => {
    const onboarded = getStore('onboarded')
    if (onboarded) {
      setScreen('main')
    }

    const timer = setInterval(() => {
      proactiveCheck(msg => {
        speak(msg)
      })
    }, 3600000)

    return () => clearInterval(timer)
  }, [])

  const handleOnboardingComplete = (name) => {
    setScreen('main')
  }

  return (
    <>
      {screen === 'onboarding' && <OnboardingPage onComplete={handleOnboardingComplete} />}
      {screen === 'main' && <MainPage screen={screen} setScreen={setScreen} />}
      {screen === 'dashboard' && <DashboardPage screen={screen} setScreen={setScreen} />}
      {screen === 'contacts' && <ContactsPage screen={screen} setScreen={setScreen} />}
      {screen === 'medications' && <MedicationsPage screen={screen} setScreen={setScreen} />}
      {screen === 'settings' && <SettingsPage screen={screen} setScreen={setScreen} />}
    </>
  )
}
