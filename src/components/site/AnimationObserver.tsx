'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

/** Reveals blocks with a Style → Animation when they scroll into view (CSS does the motion). */
export function AnimationObserver() {
  const pathname = usePathname()
  useEffect(() => {
    const targets = document.querySelectorAll<HTMLElement>('[data-anim]:not([data-visible])')
    if (!('IntersectionObserver' in window)) {
      targets.forEach((el) => el.setAttribute('data-visible', ''))
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.setAttribute('data-visible', '')
            observer.unobserve(entry.target)
          }
        }
      },
      { rootMargin: '0px 0px -10% 0px' },
    )
    targets.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [pathname])
  return null
}
