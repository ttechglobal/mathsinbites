'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { MODES } from './modes'

const ModeContext = createContext(null)

export function ModeProvider({ children }) {
  const [modeId, setModeId] = useState('normal')

  // Persist mode to localStorage
  useEffect(() => {
    const saved = localStorage.getItem('mathsinbites_mode')
    if (saved && MODES[saved]) {
      setModeId(saved)
    }
  }, [])

  function setMode(id) {
    if (!MODES[id]) return
    setModeId(id)
    localStorage.setItem('mathsinbites_mode', id)
  }

  const M = MODES[modeId]

  return (
    <ModeContext.Provider value={{ M, mode: modeId, setMode, MODES }}>
      {children}
    </ModeContext.Provider>
  )
}

export function useMode() {
  const ctx = useContext(ModeContext)
  if (!ctx) throw new Error('useMode must be used inside ModeProvider')
  return ctx
}