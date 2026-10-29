import type { Form } from '@payloadcms/plugin-form-builder/types'

import { RichText } from '@/components/site/RichText'
import type { FormBlock as FormBlockData } from '@/payload-types'

import type { RenderContext } from '../types'
import { tr } from '../types'
import { FormClient, type ClientField } from './FormClient'

/** Form from the form builder. Messages (rich text) are rendered on the server and handed to the client form. */
export function FormComponent({ block, ctx }: { block: FormBlockData; ctx: RenderContext }) {
  const form = (typeof block.form === 'object' ? block.form : undefined) as unknown as Form | undefined
  if (!form) return null

  const fields: ClientField[] = (form.fields ?? []).map((field) => {
    const f = field as unknown as Record<string, unknown>
    return {
      blockType: String(f.blockType),
      name: String(f.name ?? f.id ?? ''),
      label: (f.label as string) ?? '',
      required: Boolean(f.required),
      width: typeof f.width === 'number' ? f.width : undefined,
      defaultValue: f.defaultValue as string | boolean | undefined,
      options: Array.isArray(f.options) ? (f.options as { label: string; value: string }[]) : undefined,
      message: f.blockType === 'message' ? <RichText data={f.message} locale={ctx.locale} /> : undefined,
    }
  })

  return (
    <div className="form-block">
      {block.heading ? <h2 className="block-title">{block.heading}</h2> : null}
      <RichText data={block.intro} locale={ctx.locale} />
      <FormClient
        formId={form.id}
        fields={fields}
        submitLabel={form.submitButtonLabel || tr(ctx, 'form.submit', 'Send')}
        confirmation={form.confirmationType === 'message' ? <RichText data={form.confirmationMessage} locale={ctx.locale} /> : undefined}
        redirectURL={form.confirmationType === 'redirect' ? (form.redirect?.url ?? undefined) : undefined}
        labels={{
          required: tr(ctx, 'form.required', 'This field is required.'),
          error: tr(ctx, 'form.error', 'Something went wrong. Please try again.'),
          sending: tr(ctx, 'form.sending', 'Sending…'),
        }}
      />
    </div>
  )
}
