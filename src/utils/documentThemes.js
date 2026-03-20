import chroma from 'chroma-js'

export const DOCUMENT_THEMES = {
  tekmi: {
    label: 'TekMi Inn',
    primary: '#2D1B69',
    accent: '#4C2FFF',
    background: '#F8F9FC'
  },
  slate: {
    label: 'Pizarra',
    primary: '#1E293B',
    accent: '#3B82F6',
    background: '#F8FAFC'
  },
  emerald: {
    label: 'Esmeralda',
    primary: '#064E3B',
    accent: '#10B981',
    background: '#F0FDF4'
  },
  warm: {
    label: 'Calido',
    primary: '#78350F',
    accent: '#F59E0B',
    background: '#FFFBEB'
  },
  rose: {
    label: 'Rosa',
    primary: '#881337',
    accent: '#F43F5E',
    background: '#FFF1F2'
  },
  custom: {
    label: 'Personalizada',
    primary: null,
    accent: null,
    background: null
  }
}

export const DOCUMENT_PRESETS = {
  moderno: {
    key: 'moderno',
    name: 'Moderno',
    header_layout: 1,
    footer_layout: 1,
    colors: {
      headerBg: 'primary',
      headerText: 'textOnPrimary',
      bodyBg: 'white',
      bodyText: '#111827',
      footerBg: 'background',
      footerText: 'primaryDark'
    }
  },
  clasico: {
    key: 'clasico',
    name: 'Clasico',
    header_layout: 3,
    footer_layout: 2,
    colors: {
      headerBg: 'white',
      headerText: 'primaryDark',
      bodyBg: 'white',
      bodyText: '#1F2937',
      footerBg: 'white',
      footerText: '#374151'
    }
  },
  minimal: {
    key: 'minimal',
    name: 'Minimal',
    header_layout: 2,
    footer_layout: 1,
    colors: {
      headerBg: 'background',
      headerText: 'primary',
      bodyBg: 'white',
      bodyText: '#111827',
      footerBg: 'background',
      footerText: '#4B5563'
    }
  },
  bold: {
    key: 'bold',
    name: 'Bold',
    header_layout: 1,
    footer_layout: 3,
    colors: {
      headerBg: 'accent',
      headerText: '#FFFFFF',
      bodyBg: 'white',
      bodyText: '#111827',
      footerBg: 'primaryDark',
      footerText: '#FFFFFF'
    }
  },
  soft: {
    key: 'soft',
    name: 'Soft',
    header_layout: 2,
    footer_layout: 1,
    colors: {
      headerBg: 'primaryLight',
      headerText: 'primaryDark',
      bodyBg: '#FFFFFF',
      bodyText: '#1F2937',
      footerBg: 'sectionBg',
      footerText: '#374151'
    }
  }
}

export const DOCUMENT_VARIABLES = {
  '{{nombre_comercial}}': 'Nombre comercial',
  '{{razon_social}}': 'Razon social',
  '{{nit}}': 'NIT formateado',
  '{{telefono}}': 'Telefono',
  '{{email}}': 'Email',
  '{{ciudad}}': 'Ciudad',
  '{{direccion}}': 'Direccion',
  '{{website}}': 'Sitio web',
  '{{slogan}}': 'Slogan',
  '{{logo}}': 'Logo'
}

export const DOCUMENT_VARIABLE_OPTIONS = Object.entries(DOCUMENT_VARIABLES).map(([token, label]) => ({
  token,
  label,
  key: token.replace(/[{}]/g, '')
}))

export const DEFAULT_HEADER_FIELDS = {
  nombre_comercial: true,
  nit: true,
  razon_social: false,
  telefono: true,
  email: true,
  ciudad: true,
  direccion: false,
  website: false,
  slogan: false
}

export const DEFAULT_FOOTER_FIELDS = {
  telefono: true,
  email: true,
  website: true,
  ciudad: true,
  direccion: false,
  nombre_comercial: false,
  slogan: false
}

export const DEFAULT_DOCUMENT_SETTINGS = {
  color_theme: 'tekmi',
  color_primary: DOCUMENT_THEMES.tekmi.primary,
  color_accent: DOCUMENT_THEMES.tekmi.accent,
  color_background: DOCUMENT_THEMES.tekmi.background,
  header_layout: 1,
  header_show_logo: true,
  header_logo_size: 'medium',
  header_fields: { ...DEFAULT_HEADER_FIELDS },
  header_extra_text: '',
  footer_layout: 1,
  footer_fields: { ...DEFAULT_FOOTER_FIELDS },
  footer_free_text: '',
  show_conditions: true,
  custom_field_label: '',
  custom_field_content: '',
  preset: 'moderno',
}

const normalizeFields = (value, defaults) => ({
  ...defaults,
  ...(value || {})
})

export const normalizeDocumentSettings = (value = {}) => ({
  ...DEFAULT_DOCUMENT_SETTINGS,
  ...value,
  header_fields: normalizeFields(value.header_fields, DEFAULT_HEADER_FIELDS),
  footer_fields: normalizeFields(value.footer_fields, DEFAULT_FOOTER_FIELDS),
  preset: DOCUMENT_PRESETS[value.preset] ? value.preset : DEFAULT_DOCUMENT_SETTINGS.preset,
})

const resolveTone = (value, themeTokens) => {
  if (!value) return undefined
  if (value === 'white') return '#FFFFFF'
  if (value === 'black') return '#111827'
  if (themeTokens[value]) return themeTokens[value]
  return value
}

export const resolvePresetColors = (presetKey, themeTokens) => {
  const preset = DOCUMENT_PRESETS[presetKey] || DOCUMENT_PRESETS[DEFAULT_DOCUMENT_SETTINGS.preset]
  const colors = preset.colors || {}

  return {
    headerBg: resolveTone(colors.headerBg, themeTokens) || themeTokens.primary,
    headerText: resolveTone(colors.headerText, themeTokens) || themeTokens.textOnPrimary,
    bodyBg: resolveTone(colors.bodyBg, themeTokens) || '#FFFFFF',
    bodyText: resolveTone(colors.bodyText, themeTokens) || '#111827',
    footerBg: resolveTone(colors.footerBg, themeTokens) || themeTokens.sectionBg,
    footerText: resolveTone(colors.footerText, themeTokens) || '#1F2937'
  }
}

export function deriveThemeTokens(primary, accent, background) {
  return {
    primary,
    accent,
    background,
    primaryLight: chroma(primary).brighten(2).hex(),
    primaryDark: chroma(primary).darken(1).hex(),
    accentLight: chroma(accent).brighten(2).hex(),
    textOnPrimary: chroma(primary).luminance() > 0.5 ? '#111827' : '#FFFFFF',
    textSecondary: chroma(primary).alpha(0.6).css(),
    borderColor: chroma(primary).alpha(0.15).css(),
    sectionBg: chroma(background).darken(0.1).hex(),
    hoverPrimary: chroma(primary).darken(0.6).hex(),
    hoverAccent: chroma(accent).darken(0.6).hex()
  }
}

export const getDocumentThemeColors = (documentSettings = {}) => {
  const normalized = normalizeDocumentSettings(documentSettings)
  if (normalized.color_theme === 'custom') {
    return {
      primary: normalized.color_primary,
      accent: normalized.color_accent,
      background: normalized.color_background
    }
  }

  const theme = DOCUMENT_THEMES[normalized.color_theme] || DOCUMENT_THEMES.tekmi
  return {
    primary: theme.primary,
    accent: theme.accent,
    background: theme.background
  }
}

export const getLogoHeightPx = (size) => {
  if (size === 'small') return 40
  if (size === 'large') return 80
  return 60
}

export function resolveVariables(template, profile = {}) {
  const logoTag = profile.logo_url
    ? `<img src="${profile.logo_url}" alt="Logo" style="height:${getLogoHeightPx('medium')}px;object-fit:contain;" />`
    : ''

  const map = {
    '{{logo}}': logoTag,
    '{{nombre_comercial}}': profile.commercial_name || profile.legal_name || '',
    '{{razon_social}}': profile.legal_name || '',
    '{{nit}}': profile.nit_display || profile.nit || '',
    '{{telefono}}': profile.phone || '',
    '{{email}}': profile.email || '',
    '{{ciudad}}': profile.city || '',
    '{{direccion}}': profile.address || '',
    '{{website}}': profile.website || '',
    '{{slogan}}': profile.slogan || ''
  }

  let output = String(template || '')
  Object.entries(map).forEach(([token, value]) => {
    output = output.replaceAll(token, value || '')
  })
  return output
}

export const replaceDocumentVariables = (text, profile = {}) => resolveVariables(text, profile).trim()

export const deriveDocumentTheme = (documentSettings = {}) => {
  const colors = getDocumentThemeColors(documentSettings)
  return deriveThemeTokens(colors.primary, colors.accent, colors.background)
}