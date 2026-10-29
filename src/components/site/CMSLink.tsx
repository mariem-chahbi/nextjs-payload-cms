import Link from 'next/link'
import type { CSSProperties, ReactNode } from 'react'

import type { LocaleCode } from '@/i18n/locales'
import { isExternalHref, linkHref, type LinkData } from '@/utilities/links'

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'link'
export type ButtonSize = 'sm' | 'md' | 'lg'

type CMSLinkProps = {
  link: LinkData | null | undefined
  locale: LocaleCode
  homePageId?: number | string | null
  children: ReactNode
  /** Render as a button-styled link. */
  variant?: ButtonVariant | null
  size?: ButtonSize | null
  className?: string
  style?: CSSProperties
}

export const buttonClass = (variant?: ButtonVariant | null, size?: ButtonSize | null) =>
  ['btn', `btn-${variant ?? 'primary'}`, `btn-${size ?? 'md'}`].join(' ')

/** A link from a CMS link group: internal pages follow the current locale; external links are plain anchors. */
export function CMSLink({ link, locale, homePageId, children, variant, size, className, style }: CMSLinkProps) {
  const href = linkHref(link, locale, homePageId)
  const classes = [variant ? buttonClass(variant, size) : '', className].filter(Boolean).join(' ') || undefined
  if (!href) return <span className={classes} style={style}>{children}</span>

  const newTab = Boolean(link?.newTab)
  const props = { className: classes, style, ...(newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {}) }
  if (isExternalHref(href) || href.startsWith('#')) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    )
  }
  return (
    <Link href={href} {...props}>
      {children}
    </Link>
  )
}

type ButtonData = LinkData & { id?: string | null; label?: string | null; variant?: ButtonVariant | null; size?: ButtonSize | null }

export function ButtonGroup({
  buttons,
  locale,
  homePageId,
  className,
}: {
  buttons: ButtonData[] | null | undefined
  locale: LocaleCode
  homePageId?: number | string | null
  className?: string
}) {
  if (!buttons?.length) return null
  return (
    <div className={['button-group', className].filter(Boolean).join(' ')}>
      {buttons.map((button, i) => (
        <CMSLink key={button.id ?? i} link={button} locale={locale} homePageId={homePageId} variant={button.variant ?? 'primary'} size={button.size}>
          {button.label}
        </CMSLink>
      ))}
    </div>
  )
}
