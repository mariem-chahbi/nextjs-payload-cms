import type { CSSProperties } from 'react'

import type { RenderContext } from '@/blocks/types'
import { colorToCSS } from '@/fields/colorTokens'
import type { Footer as FooterData, SiteSetting } from '@/payload-types'

import { CMSLink } from './CMSLink'
import { RichText } from './RichText'

export function Footer({ footer, settings, ctx }: { footer: FooterData; settings: SiteSetting; ctx: RenderContext }) {
  const year = new Intl.DateTimeFormat(`${ctx.locale}-u-nu-${ctx.region?.numberFormat ?? 'latn'}`, { year: 'numeric' }).format(new Date())
  const style = {
    backgroundColor: colorToCSS(footer.background) ?? 'var(--color-surface)',
    color: colorToCSS(footer.textColor) ?? 'var(--color-text)',
  } as CSSProperties
  const contact = settings.contact

  return (
    <footer className="site-footer" style={style}>
      <div className="container footer-grid">
        <div className="footer-about">
          <p className="footer-brand">{settings.siteName}</p>
          <RichText data={footer.content} locale={ctx.locale} homePageId={ctx.homePageId} />
          {contact?.phone || contact?.email ? (
            <p className="footer-contact">
              {contact.phone ? (
                <a href={`tel:${contact.phone.replace(/[^\d+]/g, '')}`} dir="ltr">
                  {contact.phone}
                </a>
              ) : null}
              {contact.email ? (
                <a href={`mailto:${contact.email}`} dir="ltr">
                  {contact.email}
                </a>
              ) : null}
            </p>
          ) : null}
        </div>
        {(footer.columns ?? []).map((column, i) => (
          <div key={column.id ?? i} className="footer-column">
            {column.title ? <p className="footer-title">{column.title}</p> : null}
            <ul>
              {(column.links ?? []).map((link, j) => (
                <li key={link.id ?? j}>
                  <CMSLink link={link as never} locale={ctx.locale} homePageId={ctx.homePageId}>
                    {link.label}
                  </CMSLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="container footer-bottom">
        <p>{(footer.copyright ?? '').replace('{year}', year)}</p>
        {footer.social?.length ? (
          <ul className="social">
            {footer.social.map((item, i) => (
              <li key={item.id ?? i}>
                <a href={item.url ?? undefined} target="_blank" rel="noopener noreferrer">
                  {item.platform}
                </a>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </footer>
  )
}
