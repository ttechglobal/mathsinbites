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
          href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Baloo+2:wght@700;800;900&family=Fredoka+One&family=Syne:wght@700;800&family=Bangers&display=swap"
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