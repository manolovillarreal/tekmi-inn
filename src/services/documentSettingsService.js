import { supabase } from './supabase'
import { DEFAULT_DOCUMENT_SETTINGS, HEADER_SETTINGS_META_KEY, normalizeDocumentSettings } from '../utils/documentThemes'

const OPTIONAL_DOCUMENT_SETTINGS_COLUMNS = new Set([
  'header_text_align_x',
  'header_text_align_y',
  'header_logo_shape',
  'header_logo_bg_color',
  'header_logo_size_px',
])

const extractMissingSchemaColumn = (error) => {
  const message = String(error?.message || '')
  const match = message.match(/Could not find the '([^']+)' column/)
  return match?.[1] || ''
}

const buildDocumentSettingsPayload = (accountId, normalized, excludedColumns = new Set()) => {
  const headerFields = {
    ...(normalized.header_fields || {}),
    [HEADER_SETTINGS_META_KEY]: {
      text_align_x: normalized.header_text_align_x,
      text_align_y: normalized.header_text_align_y,
      logo_shape: normalized.header_logo_shape,
      logo_bg_color: normalized.header_logo_bg_color,
      logo_size_px: normalized.header_logo_size_px,
    },
  }

  const payload = {
    account_id: accountId,
    preset: normalized.preset,
    color_theme: normalized.color_theme,
    color_primary: normalized.color_primary,
    color_accent: normalized.color_accent,
    color_background: normalized.color_background,
    header_layout: normalized.header_layout,
    header_show_logo: normalized.header_show_logo,
    header_logo_size: normalized.header_logo_size,
    header_fields: headerFields,
    header_extra_text: normalized.header_extra_text || null,
    footer_layout: normalized.footer_layout,
    footer_fields: normalized.footer_fields,
    footer_free_text: normalized.footer_free_text || null,
    show_conditions: normalized.show_conditions,
    custom_field_label: normalized.custom_field_label || null,
    custom_field_content: normalized.custom_field_content || null,
  }

  if (!excludedColumns.has('header_text_align_x')) {
    payload.header_text_align_x = normalized.header_text_align_x
  }

  if (!excludedColumns.has('header_text_align_y')) {
    payload.header_text_align_y = normalized.header_text_align_y
  }

  if (!excludedColumns.has('header_logo_shape')) {
    payload.header_logo_shape = normalized.header_logo_shape
  }

  if (!excludedColumns.has('header_logo_bg_color')) {
    payload.header_logo_bg_color = normalized.header_logo_bg_color
  }

  if (!excludedColumns.has('header_logo_size_px')) {
    payload.header_logo_size_px = normalized.header_logo_size_px
  }

  return payload
}

export const getDocumentSettings = async (accountId) => {
  const { data, error } = await supabase
    .from('document_settings')
    .select('*')
    .eq('account_id', accountId)
    .maybeSingle()

  if (error) throw error

  if (!data) {
    return {
      ...DEFAULT_DOCUMENT_SETTINGS,
      account_id: accountId,
    }
  }

  return normalizeDocumentSettings(data)
}

export const saveDocumentSettings = async (accountId, payload) => {
  const normalized = normalizeDocumentSettings(payload)

  const excludedColumns = new Set()
  let lastError = null

  while (excludedColumns.size <= OPTIONAL_DOCUMENT_SETTINGS_COLUMNS.size) {
    const upsertPayload = buildDocumentSettingsPayload(accountId, normalized, excludedColumns)

    const { data, error } = await supabase
      .from('document_settings')
      .upsert(upsertPayload, { onConflict: 'account_id' })
      .select('*')
      .single()

    if (!error) {
      return normalizeDocumentSettings(data)
    }

    lastError = error
    const missingColumn = extractMissingSchemaColumn(error)
    if (!OPTIONAL_DOCUMENT_SETTINGS_COLUMNS.has(missingColumn) || excludedColumns.has(missingColumn)) {
      break
    }

    excludedColumns.add(missingColumn)
  }

  throw lastError
}
