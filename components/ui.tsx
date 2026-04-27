'use client'
import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

export const AVATAR_COLORS = ['#8b5cf6','#ec4899','#f59e0b','#10b981','#3b82f6','#f97316','#06b6d4','#a855f7']
export const avatarColor = (i: number) => AVATAR_COLORS[i % AVATAR_COLORS.length]

export const T = {
  bg:        '#06060f',
  surface:   'rgba(255,255,255,0.04)',
  border:    'rgba(255,255,255,0.08)',
  purple:    '#8b5cf6',
  purpleDim: 'rgba(139,92,246,0.15)',
  yellow:    '#f59e0b',
  green:     '#22c55e',
  greenDim:  'rgba(34,197,94,0.15)',
  pink:      '#ec4899',
  muted:     'rgba(255,255,255,0.45)',
  faint:     'rgba(255,255,255,0.2)',
  radius:    20,
  radiusSm:  12,
}

export function Avatar({ name, index, size = 36, ring }: { name: string; index: number; size?: number; ring?: string }) {
  const c = avatarColor(index)
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: `linear-gradient(135deg, ${c}, ${c}cc)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 800, fontSize: size * 0.38, color: '#fff',
      boxShadow: ring ? `0 0 0 3px ${ring}, 0 4px 16px ${c}55` : `0 4px 16px ${c}44`,
      border: ring ? `2px solid ${ring}` : 'none',
    }}>
      {name?.[0]?.toUpperCase() ?? '?'}
    </div>
  )
}


export function GlassPanel({ children, style, glow, className }: { children: React.ReactNode; style?: React.CSSProperties; glow?: string; className?: string }) {
  return (
    <div className={className} style={{
      background: 'rgba(255,255,255,0.04)',
      backdropFilter: 'blur(20px) saturate(140%)',
      WebkitBackdropFilter: 'blur(20px) saturate(140%)',
      border: `1px solid ${glow ? glow + '55' : 'rgba(255,255,255,0.09)'}`,
      borderRadius: 24,
      padding: 24,
      boxShadow: glow
        ? `0 0 48px ${glow}22, inset 0 1px 0 rgba(255,255,255,0.06)`
        : '0 20px 48px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.06)',
      ...style,
    }}>
      {children}
    </div>
  )
}

export function Btn({ children, onClick, disabled, variant = 'primary', style }: {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  variant?: 'primary' | 'yellow' | 'green' | 'pink' | 'ghost' | 'danger'
  style?: React.CSSProperties
}) {
  const variants: Record<string, { bg: string; color: string; shadow?: string; border?: string }> = {
    primary: { bg: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)', color: '#fff', shadow: '0 8px 24px rgba(139,92,246,0.4)' },
    yellow:  { bg: 'linear-gradient(135deg, #f59e0b 0%, #fb923c 100%)', color: '#1a0a00', shadow: '0 8px 24px rgba(245,158,11,0.4)' },
    green:   { bg: 'linear-gradient(135deg, #22c55e 0%, #10b981 100%)', color: '#001a08', shadow: '0 8px 24px rgba(34,197,94,0.35)' },
    pink:    { bg: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)', color: '#fff', shadow: '0 8px 24px rgba(236,72,153,0.4)' },
    ghost:   { bg: 'rgba(255,255,255,0.06)', color: '#fff', border: '1px solid rgba(255,255,255,0.14)' },
    danger:  { bg: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' },
  }
  const v = variants[variant]
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileTap={disabled ? undefined : { scale: 0.96 }}
      whileHover={disabled ? undefined : { y: -2 }}
      transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
      style={{
        width: '100%', padding: '16px 20px',
        minHeight: 56,
        borderRadius: 28,
        border: v.border ?? 'none',
        background: disabled ? 'rgba(255,255,255,0.08)' : v.bg,
        color: disabled ? T.muted : v.color,
        fontWeight: 700, fontSize: 17,
        fontFamily: 'inherit',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        boxShadow: !disabled && v.shadow ? v.shadow : 'none',
        ...style,
      }}
    >
      {children}
    </motion.button>
  )
}

export function Inp({ placeholder, value, onChange, onKeyDown, mono, autoFocus, id, inputRef, maxLength }: {
  placeholder?: string; value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void
  mono?: boolean; autoFocus?: boolean; id?: string
  inputRef?: React.RefObject<HTMLInputElement | null>
  maxLength?: number
}) {
  return (
    <input
      id={id}
      ref={inputRef}
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      onKeyDown={onKeyDown}
      autoFocus={autoFocus}
      maxLength={maxLength}
      style={{
        width: '100%', padding: '14px 18px',
        borderRadius: T.radiusSm,
        border: `1.5px solid rgba(255,255,255,0.10)`,
        background: 'rgba(255,255,255,0.05)',
        color: '#fff',
        fontFamily: mono ? 'monospace' : 'inherit',
        fontSize: mono ? 22 : 16, fontWeight: 600,
        letterSpacing: mono ? '0.15em' : 'normal',
        boxSizing: 'border-box' as const,
        transition: 'border-color 0.2s',
      }}
    />
  )
}

export function Label({ children, style, color }: { children: React.ReactNode; style?: React.CSSProperties; color?: string }) {
  return (
    <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: color ?? T.purple, margin: 0, ...style }}>
      {children}
    </p>
  )
}

export function Badge({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span style={{
      background: `${color}22`, border: `1px solid ${color}44`,
      color, borderRadius: 100, padding: '3px 12px', fontSize: 11, fontWeight: 700,
    }}>
      {children}
    </span>
  )
}

export function ProgressBar({ value, max, color = T.purple }: { value: number; max: number; color?: string }) {
  const pct = Math.min(100, (value / max) * 100)
  return (
    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 100, height: 6, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 100, transition: 'width 0.4s ease' }} />
    </div>
  )
}

export function PulsingDot({ color = T.green }: { color?: string }) {
  return <span className="pulsing" style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: color }} />
}

export function BigLogo() {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 14 }}>
      <div className="wobble" style={{
        width: 64, height: 64, borderRadius: 18,
        background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 32, flexShrink: 0,
        boxShadow: '0 12px 40px rgba(139,92,246,0.5)',
      }}>🧠</div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontWeight: 900, fontSize: 22, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1 }}>
          Who knows me best?
        </span>
        <span style={{ fontSize: 12, color: T.purple, fontWeight: 600, marginTop: 4 }}>
          Le quiz entre potes
        </span>
      </div>
    </div>
  )
}

type ShapeItem = { id: number; type: string; top: number; left: number; size: number; color: string; duration: number; delay: number; rotate: number }

export function FloatingShapes({ density = 'normal' }: { density?: 'sparse' | 'normal' | 'dense' }) {
  const [shapes, setShapes] = useState<ShapeItem[]>([])
  useEffect(() => {
    const count = density === 'sparse' ? 4 : density === 'dense' ? 12 : 8
    setShapes(Array.from({ length: count }, (_, i) => ({
      id: i,
      type: ['circle', 'square', 'ring', 'triangle'][i % 4],
      top: 8 + Math.random() * 84,
      left: 5 + Math.random() * 90,
      size: 14 + Math.random() * 36,
      color: ['#8b5cf6', '#ec4899', '#f59e0b', '#22c55e'][i % 4],
      duration: 18 + Math.random() * 18,
      delay: Math.random() * 8,
      rotate: Math.random() * 360,
    })))
  }, [density])

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none', overflow: 'hidden' }}>
      {shapes.map(s => (
        <div key={s.id} style={{
          position: 'absolute', top: `${s.top}%`, left: `${s.left}%`,
          width: s.size, height: s.size, opacity: 0.18,
          transform: `rotate(${s.rotate}deg)`,
          animation: `float ${s.duration}s ease-in-out ${s.delay}s infinite`,
        }}>
          {s.type === 'circle' && <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: s.color, filter: `blur(0.5px)` }} />}
          {s.type === 'square' && <div style={{ width: '100%', height: '100%', borderRadius: 4, background: s.color, transform: 'rotate(15deg)' }} />}
          {s.type === 'ring' && <div style={{ width: '100%', height: '100%', borderRadius: '50%', border: `2px solid ${s.color}` }} />}
          {s.type === 'triangle' && <div style={{ width: 0, height: 0, borderLeft: `${s.size / 2}px solid transparent`, borderRight: `${s.size / 2}px solid transparent`, borderBottom: `${s.size}px solid ${s.color}` }} />}
        </div>
      ))}
    </div>
  )
}

type ConfettiPiece = { id: number; left: number; delay: number; duration: number; color: string; size: number; rotate: number; shape: string }

export function Confetti({ count = 60 }: { count?: number }) {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([])
  useEffect(() => {
    setPieces(Array.from({ length: count }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 3,
      duration: 4 + Math.random() * 4,
      color: ['#8b5cf6', '#ec4899', '#f59e0b', '#22c55e', '#3b82f6', '#fff'][Math.floor(Math.random() * 6)],
      size: 6 + Math.random() * 6,
      rotate: Math.random() * 360,
      shape: Math.random() > 0.5 ? 'square' : 'circle',
    })))
  }, [count])
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 5 }}>
      {pieces.map(p => (
        <div key={p.id} style={{
          position: 'absolute', top: '-20px', left: `${p.left}%`,
          width: p.size, height: p.size, background: p.color,
          borderRadius: p.shape === 'circle' ? '50%' : '2px',
          transform: `rotate(${p.rotate}deg)`,
          animation: `confetti-fall ${p.duration}s linear ${p.delay}s infinite`,
        }} />
      ))}
    </div>
  )
}

type SparkleItem = { id: number; top: number; left: number; size: number; delay: number; duration: number; color: string }

export function Sparkles({ count = 16 }: { count?: number }) {
  const [sparkles, setSparkles] = useState<SparkleItem[]>([])
  useEffect(() => {
    setSparkles(Array.from({ length: count }, (_, i) => ({
      id: i,
      top: Math.random() * 100,
      left: Math.random() * 100,
      size: 1 + Math.random() * 3,
      delay: Math.random() * 4,
      duration: 3 + Math.random() * 4,
      color: ['#fff', '#fff', '#f59e0b', '#ec4899', '#8b5cf6'][Math.floor(Math.random() * 5)],
    })))
  }, [count])
  return (
    <>
      {sparkles.map(s => (
        <div key={s.id} style={{
          position: 'absolute',
          top: `${s.top}%`, left: `${s.left}%`,
          width: s.size, height: s.size, borderRadius: '50%',
          background: s.color,
          boxShadow: `0 0 ${s.size * 3}px ${s.color}`,
          animation: `twinkle ${s.duration}s ease-in-out ${s.delay}s infinite`,
          pointerEvents: 'none',
        }} />
      ))}
    </>
  )
}
