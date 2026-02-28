import React from 'react'
import { cn } from '../lib/utils'
import { Mic, LayoutDashboard, Users, Pill, Settings } from 'lucide-react'

// ═══════════════════════════════════════════════════════
// BUTTONS
// ═══════════════════════════════════════════════════════
export const Button = React.forwardRef(({ className, variant = 'default', size = 'default', ...props }, ref) => {
  const variants = {
    default: 'bg-[#1e3a5f] text-white hover:bg-[#2a4d7a] shadow-md hover:shadow-lg',
    destructive: 'bg-red-600 text-white hover:bg-red-700 shadow-md',
    outline: 'border-2 border-[#1e3a5f] text-[#1e3a5f] bg-transparent hover:bg-[#1e3a5f]/5',
    secondary: 'bg-[#f5f7fa] text-[#1e3a5f] hover:bg-[#e8ecf2]',
    ghost: 'text-[#1e3a5f] hover:bg-[#f5f7fa]',
    gold: 'bg-[#c9a227] text-white hover:bg-[#b8921f] shadow-md',
    link: 'text-[#1e3a5f] underline-offset-4 hover:underline',
  }
  const sizes = {
    default: 'h-11 px-5 py-2.5',
    sm: 'h-9 rounded-lg px-4 text-sm',
    lg: 'h-12 rounded-xl px-8 text-base',
    icon: 'h-11 w-11',
  }
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a227] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        sizes[size],
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Button.displayName = 'Button'

// ═══════════════════════════════════════════════════════
// CARD
// ═══════════════════════════════════════════════════════
export const Card = ({ className, ...props }) => (
  <div
    className={cn(
      'rounded-2xl border border-[#e8ecf2] bg-white text-[#1e3a5f] shadow-sm card-hover',
      className
    )}
    {...props}
  />
)
Card.displayName = 'Card'

// ═══════════════════════════════════════════════════════
// INPUT
// ═══════════════════════════════════════════════════════
export const Input = React.forwardRef(({ className, type, ...props }, ref) => (
  <input
    type={type}
    className={cn(
      'flex h-11 w-full rounded-xl border border-[#dde2ea] bg-white px-4 py-2.5 text-sm text-[#1e3a5f] placeholder:text-[#9aa5b6] transition-colors focus:border-[#c9a227] focus:outline-none focus:ring-2 focus:ring-[#c9a227]/20 disabled:cursor-not-allowed disabled:opacity-50',
      className
    )}
    ref={ref}
    {...props}
  />
))
Input.displayName = 'Input'

// ═══════════════════════════════════════════════════════
// LABEL
// ═══════════════════════════════════════════════════════
export const Label = React.forwardRef(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn('text-sm font-semibold text-[#1e3a5f] leading-none mb-1.5 block', className)}
    {...props}
  />
))
Label.displayName = 'Label'

// ═══════════════════════════════════════════════════════
// CHECKBOX
// ═══════════════════════════════════════════════════════
export const Checkbox = React.forwardRef(({ className, ...props }, ref) => (
  <input
    type="checkbox"
    className={cn('h-4 w-4 rounded border-[#dde2ea] text-[#1e3a5f] focus:ring-[#c9a227]', className)}
    ref={ref}
    {...props}
  />
))
Checkbox.displayName = 'Checkbox'

// ═══════════════════════════════════════════════════════
// SLIDER
// ═══════════════════════════════════════════════════════
export const Slider = React.forwardRef(({ className, ...props }, ref) => (
  <input
    type="range"
    className={cn('w-full h-2 bg-[#e8ecf2] rounded-lg appearance-none cursor-pointer accent-[#1e3a5f]', className)}
    ref={ref}
    {...props}
  />
))
Slider.displayName = 'Slider'

// ═══════════════════════════════════════════════════════
// BOTTOM NAVIGATION
// ═══════════════════════════════════════════════════════
const navItems = [
  { id: 'main', icon: Mic, label: 'Sama' },
  { id: 'dashboard', icon: LayoutDashboard, label: 'Tableau' },
  { id: 'contacts', icon: Users, label: 'Contacts' },
  { id: 'medications', icon: Pill, label: 'Santé' },
  { id: 'settings', icon: Settings, label: 'Réglages' },
]

export const BottomNav = ({ screen, setScreen }) => (
  <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#e8ecf2] shadow-[0_-4px_20px_rgba(30,58,95,0.06)] z-50">
    <div className="max-w-md mx-auto flex justify-around py-2 px-2">
      {navItems.map(tab => {
        const Icon = tab.icon
        const isActive = screen === tab.id
        return (
          <button
            key={tab.id}
            onClick={() => setScreen(tab.id)}
            className={cn(
              'flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all duration-200 min-w-[56px]',
              isActive
                ? 'text-[#1e3a5f] bg-[#f5f7fa]'
                : 'text-[#9aa5b6] hover:text-[#1e3a5f]'
            )}
          >
            <div className="relative">
              <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
              {isActive && (
                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-[#c9a227]" />
              )}
            </div>
            <span className={cn('text-[10px] mt-1', isActive ? 'font-bold' : 'font-medium')}>
              {tab.label}
            </span>
          </button>
        )
      })}
    </div>
  </nav>
)
