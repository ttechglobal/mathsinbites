import './globals.css'
import { ModeProvider } from '@/lib/ModeContext'

export const metadata = {
  title: 'MathsInBites',
  description: 'Learn maths. One bite at a time.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Nunito:ital,wght@0,400;0,600;0,700;0,800;0,900;1,800&family=Space+Grotesk:wght@400;500;600;700&family=Noto+Sans:wght@400;500;600;700&family=Baloo+2:wght@700;800;900&family=Fredoka+One&family=Sora:wght@400;500;600;700&family=Syne:wght@700;800&family=Bangers&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning>
        <ModeProvider>
          {children}
        </ModeProvider>
      </body>
    </html>
  )
}