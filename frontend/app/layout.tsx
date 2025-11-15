import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Survey Sensei - AI-Powered Personalized Surveys',
  description: 'GenAI-powered hyper-custom survey builder that adapts to each user\'s unique experience',
  keywords: ['survey', 'AI', 'GenAI', 'personalized', 'reviews', 'e-commerce'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
