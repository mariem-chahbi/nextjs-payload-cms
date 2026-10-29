import Link from 'next/link'
import type { CSSProperties } from 'react'

import { tr, type RenderContext } from '@/blocks/types'
import { colorToCSS } from '@/fields/colorTokens'
import type { Header as HeaderData, SiteSetting } from '@/payload-types'
import { linkHref } from '@/utilities/links'

import { CMSLink } from './CMSLink'
import { HeaderNav, type NavItem } from './HeaderNav'
import { Media } from './Media'
import { RegionLanguageSwitcher } from './RegionLanguageSwitcher'
import { buildSwitcherGroups } from './switcherOptions'

export function Header({
  header,
  settings,
  ctx,
  regions,
}: {
  header: HeaderData
  settings: SiteSetting
  ctx: RenderContext
  regions: unknown[]
}) {
  const nav: NavItem[] = (header.nav ?? []).map((item, i) => ({
    id: item.id ?? String(i),
    label: item.label ?? '',
    href: linkHref(item as never, ctx.locale, ctx.homePageId),
    newTab: Boolean(item.newTab),
    children: (item.children ?? []).map((child, j) => ({
      id: child.id ?? `${i}-${j}`,
      label: child.label ?? '',
      description: child.description ?? undefined,
      href: linkHref(child as never, ctx.locale, ctx.homePageId),
      newTab: Boolean(child.newTab),
    })),
  }))

  const groups = buildSwitcherGroups(regions as never[], ctx.locale)
  const current = `${ctx.region?.code ?? groups[0]?.regionCode}|${ctx.locale}`
  const style = {
    '--header-bg': colorToCSS(header.background) ?? 'var(--color-background)',
    '--header-fg': colorToCSS(header.textColor) ?? 'var(--color-text)',
    '--logo-h': `${header.logoHeight ?? 40}px`,
    '--logo-h-m': `${header.logoHeightMobile ?? 32}px`,
  } as CSSProperties

  return (
    <header
      className={[
        'site-header',
        header.sticky !== false && 'is-sticky',
        header.transparentOverHero && 'is-transparent',
        `logo-${header.logoPosition ?? 'start'}`,
      ]
        .filter(Boolean)
        .join(' ')}
      style={style}
    >
      <div className="container header-inner">
        <Link href={`/${ctx.locale}`} className="logo" aria-label={settings.siteName ?? 'Home'}>
          {header.logo && typeof header.logo === 'object' ? (
            <Media media={header.logo} alt={settings.siteName} sizes="240px" fit="contain" priority />
          ) : (
            <span className="logo-text">{settings.siteName}</span>
          )}
        </Link>
        <HeaderNav items={nav} menuLabel={tr(ctx, 'nav.menu', 'Menu')} closeLabel={tr(ctx, 'nav.close', 'Close')} />
        <div className="header-actions">
          {header.cta?.enabled && header.cta.label ? (
            <CMSLink link={header.cta as never} locale={ctx.locale} homePageId={ctx.homePageId} variant={header.cta.variant ?? 'primary'} size="sm">
              {header.cta.label}
            </CMSLink>
          ) : null}
          {header.showSwitcher !== false && groups.length > 0 ? (
            <RegionLanguageSwitcher groups={groups} current={current} label={tr(ctx, 'switcher.label', 'Region and language')} />
          ) : null}
        </div>
      </div>
    </header>
  )
}
