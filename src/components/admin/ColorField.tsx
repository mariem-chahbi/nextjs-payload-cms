'use client'

import { FieldDescription, FieldError, FieldLabel, useField } from '@payloadcms/ui'
import type { TextFieldClientComponent } from 'payload'
import React from 'react'

import { THEME_COLOR_TOKENS } from '@/fields/colorTokens'

const SWATCH_PREVIEW: Record<string, string> = {
  primary: 'var(--theme-success-500)',
  secondary: 'var(--theme-elevation-600)',
  accent: 'var(--theme-warning-500)',
  background: 'var(--theme-bg)',
  surface: 'var(--theme-elevation-50)',
  text: 'var(--theme-text)',
  muted: 'var(--theme-elevation-400)',
}

const isHex = (value: unknown): value is string => typeof value === 'string' && /^#[0-9a-fA-F]{6}/.test(value)

/** Theme swatches + native color picker + hex input. Stores "theme:<token>" or "#rrggbb". */
export const ColorField: TextFieldClientComponent = (props) => {
  const { field, path, readOnly } = props
  const hexOnly = Boolean((props as { hexOnly?: boolean }).hexOnly)
  const { value, setValue, showError, errorMessage } = useField<string | null>({ path })

  const current = typeof value === 'string' ? value : ''
  const description = field.admin?.description

  return (
    <div className="field-type text" style={{ marginBottom: 'var(--spacing-field, 1rem)' }}>
      <FieldLabel label={field.label} path={path} required={field.required} localized={field.localized} />
      <FieldError path={path} showError={showError} message={errorMessage} />
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
        {!hexOnly &&
          THEME_COLOR_TOKENS.map((token) => {
            const tokenValue = `theme:${token}`
            const active = current === tokenValue
            return (
              <button
                key={token}
                type="button"
                disabled={readOnly}
                onClick={() => setValue(tokenValue)}
                title={`Theme: ${token}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 10px',
                  borderRadius: 999,
                  border: active ? '2px solid var(--theme-text)' : '1px solid var(--theme-elevation-150)',
                  background: 'var(--theme-input-bg)',
                  color: 'var(--theme-text)',
                  cursor: readOnly ? 'default' : 'pointer',
                  fontSize: 12,
                }}
              >
                <span
                  aria-hidden
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: 999,
                    background: SWATCH_PREVIEW[token],
                    border: '1px solid var(--theme-elevation-200)',
                  }}
                />
                {token}
              </button>
            )
          })}
        <input
          type="color"
          aria-label="Custom color"
          disabled={readOnly}
          value={isHex(current) ? current.slice(0, 7) : '#000000'}
          onChange={(e) => setValue(e.target.value)}
          style={{ width: 36, height: 32, padding: 0, border: 'none', background: 'none' }}
        />
        <input
          type="text"
          disabled={readOnly}
          value={current}
          placeholder={hexOnly ? '#1e40af' : 'theme:primary or #1e40af'}
          onChange={(e) => setValue(e.target.value || null)}
          style={{
            width: 170,
            padding: '6px 10px',
            border: '1px solid var(--theme-elevation-150)',
            borderRadius: 'var(--style-radius-s)',
            background: 'var(--theme-input-bg)',
            color: 'var(--theme-text)',
            direction: 'ltr',
          }}
        />
        {current && !readOnly && (
          <button
            type="button"
            onClick={() => setValue(null)}
            style={{ border: 'none', background: 'none', color: 'var(--theme-elevation-500)', cursor: 'pointer' }}
          >
            ✕
          </button>
        )}
      </div>
      {description && <FieldDescription description={description} path={path} />}
    </div>
  )
}
