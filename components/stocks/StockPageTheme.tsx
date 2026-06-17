'use client'

import { useEffect } from 'react'

export default function StockPageTheme() {
  useEffect(() => {
    const root = document.documentElement
    const previousTheme = root.getAttribute('data-theme')
    root.setAttribute('data-theme', 'light')

    return () => {
      if (previousTheme) {
        root.setAttribute('data-theme', previousTheme)
        return
      }
      root.removeAttribute('data-theme')
    }
  }, [])

  return null
}
