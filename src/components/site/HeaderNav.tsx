'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

export type NavLink = { id: string; label: string; href?: string; newTab?: boolean; description?: string }
export type NavItem = NavLink & { children: NavLink[] }

const NavAnchor = ({ item, className }: { item: NavLink; className?: string }) =>
  item.href ? (
    <Link href={item.href} className={className} {...(item.newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
      {item.label}
      {item.description ? <small>{item.description}</small> : null}
    </Link>
  ) : (
    <span className={className}>{item.label}</span>
  )

/** Desktop: inline menu with hover/focus dropdowns. Mobile: toggle panel. Closes on navigation. */
export function HeaderNav({ items, menuLabel, closeLabel }: { items: NavItem[]; menuLabel: string; closeLabel: string }) {
  // The menu is "open for a path": navigating elsewhere closes it without an effect.
  const pathname = usePathname()
  const [openFor, setOpenFor] = useState<string | null>(null)
  const open = openFor === pathname

  if (items.length === 0) return <nav className="site-nav" />

  return (
    <nav className={`site-nav${open ? ' is-open' : ''}`} aria-label={menuLabel}>
      <button type="button" className="nav-toggle" aria-expanded={open} onClick={() => setOpenFor(open ? null : pathname)}>
        <span aria-hidden>{open ? '✕' : '☰'}</span>
        <span className="sr-only">{open ? closeLabel : menuLabel}</span>
      </button>
      <ul className="nav-list">
        {items.map((item) => (
          <li key={item.id} className={item.children.length ? 'has-children' : undefined}>
            <NavAnchor item={item} className="nav-link" />
            {item.children.length ? (
              <ul className="nav-dropdown">
                {item.children.map((child) => (
                  <li key={child.id}>
                    <NavAnchor item={child} className="nav-sublink" />
                  </li>
                ))}
              </ul>
            ) : null}
          </li>
        ))}
      </ul>
    </nav>
  )
}
