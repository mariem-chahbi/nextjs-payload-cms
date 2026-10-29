'use client'

import { useState, type FormEvent, type ReactNode } from 'react'

export type ClientField = {
  blockType: string
  name: string
  label: string
  required: boolean
  width?: number
  defaultValue?: string | boolean
  options?: { label: string; value: string }[]
  message?: ReactNode
}

/** Posts to /api/form-submissions; the form builder stores it and sends the configured emails. */
export function FormClient({
  formId,
  fields,
  submitLabel,
  confirmation,
  redirectURL,
  labels,
}: {
  formId: number | string
  fields: ClientField[]
  submitLabel: string
  confirmation?: ReactNode
  redirectURL?: string
  labels: { required: string; error: string; sending: string }
}) {
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const submissionData = fields
      .filter((f) => f.blockType !== 'message')
      .map((f) => ({
        field: f.name,
        value: f.blockType === 'checkbox' ? String(data.get(f.name) === 'on') : String(data.get(f.name) ?? ''),
      }))
    setStatus('sending')
    try {
      const res = await fetch('/api/form-submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ form: formId, submissionData }),
      })
      if (!res.ok) throw new Error(String(res.status))
      if (redirectURL) {
        window.location.href = redirectURL
        return
      }
      setStatus('done')
    } catch {
      setStatus('error')
    }
  }

  if (status === 'done') return <div className="form-confirmation" role="status">{confirmation}</div>

  return (
    <form className="cms-form" onSubmit={onSubmit} noValidate={false}>
      {fields.map((field) => {
        const style = field.width ? { flexBasis: `calc(${field.width}% - var(--space-md))` } : undefined
        const id = `f-${formId}-${field.name}`
        if (field.blockType === 'message') {
          return (
            <div key={id} className="form-message" style={style}>
              {field.message}
            </div>
          )
        }
        const common = { id, name: field.name, required: field.required, title: field.required ? labels.required : undefined }
        return (
          <div key={id} className={`form-field form-${field.blockType}`} style={style}>
            {field.blockType === 'checkbox' ? (
              <label htmlFor={id} className="form-check">
                <input type="checkbox" {...common} defaultChecked={Boolean(field.defaultValue)} />
                <span>{field.label}</span>
              </label>
            ) : (
              <>
                <label htmlFor={id}>
                  {field.label}
                  {field.required ? <span aria-hidden> *</span> : null}
                </label>
                {field.blockType === 'textarea' ? (
                  <textarea {...common} rows={5} defaultValue={field.defaultValue as string | undefined} />
                ) : field.blockType === 'select' ? (
                  <select {...common} defaultValue={(field.defaultValue as string | undefined) ?? ''}>
                    <option value="" disabled>
                      —
                    </option>
                    {field.options?.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    {...common}
                    type={field.blockType === 'email' ? 'email' : field.blockType === 'number' ? 'number' : 'text'}
                    defaultValue={field.defaultValue as string | undefined}
                    dir={field.blockType === 'email' ? 'ltr' : undefined}
                  />
                )}
              </>
            )}
          </div>
        )
      })}
      {status === 'error' ? (
        <p className="form-error" role="alert">
          {labels.error}
        </p>
      ) : null}
      <div className="form-actions">
        <button type="submit" className="btn btn-primary btn-md" disabled={status === 'sending'}>
          {status === 'sending' ? labels.sending : submitLabel}
        </button>
      </div>
    </form>
  )
}
