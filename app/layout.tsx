import type { Metadata } from 'next'
import { Space_Grotesk } from 'next/font/google'
import './globals.css'

const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], weight: ['400','500','600','700'] })

export const metadata: Metadata = {
  title: 'Who knows me best?',
  description: 'Le quiz entre potes',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={spaceGrotesk.className}>
      <body style={{ minHeight: '100vh', background: '#06060f', color: '#fff' }}>
        {/* Aurora backdrop — fixed, z-index 0 */}
        <div style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none' }}>
          {/* Mesh gradients */}
          <div style={{
            position: 'absolute', inset: 0,
            background: `
              radial-gradient(ellipse 800px 600px at 15% 20%, rgba(139,92,246,0.22), transparent 60%),
              radial-gradient(ellipse 700px 500px at 85% 80%, rgba(236,72,153,0.18), transparent 60%),
              radial-gradient(ellipse 600px 400px at 80% 15%, rgba(245,158,11,0.10), transparent 60%),
              radial-gradient(ellipse 500px 400px at 20% 85%, rgba(34,197,94,0.08), transparent 60%)
            `,
          }} />
          {/* Drifting orbs */}
          <div className="orb orb-1" />
          <div className="orb orb-2" />
          <div className="orb orb-3" />
          <div className="orb orb-4" />
          {/* Dot grid */}
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
            maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
            WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
          }} />
        </div>
        {/* Page content — above aurora */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          {children}
        </div>
      </body>
    </html>
  )
}
