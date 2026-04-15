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
    label: 'Moderno',
    description: 'Limpio, sans-serif, sin bordes',
    header: {
      size: 'md',
      layout: 'logo-left',
      style: 'filled',
      borderRadius: '0px',
      padding: '20px 32px',
    },
    footer: {
      style: 'filled',
      padding: '12px 32px',
    },
    body: {
      fontFamily: 'Inter, sans-serif',
      sectionStyle: 'line',
      dataStyle: 'list',
      borderRadius: '0px',
      tableStyle: 'clean',
    }
  },

  clasico: {
    label: 'Clásico',
    description: 'Serif, formal, con bordes y cajas',
    header: {
      size: 'lg',
      layout: 'centered',
      style: 'bordered',
      borderRadius: '0px',
      padding: '28px 32px',
    },
    footer: {
      style: 'bordered',
      padding: '16px 32px',
    },
    body: {
      fontFamily: 'Georgia, serif',
      sectionStyle: 'box',
      dataStyle: 'table',
      borderRadius: '4px',
      tableStyle: 'bordered',
    }
  },

  minimal: {
    label: 'Minimal',
    description: 'Máximo espacio, líneas sutiles',
    header: {
      size: 'sm',
      layout: 'logo-left',
      style: 'line-top',
      borderRadius: '0px',
      padding: '16px 32px',
    },
    footer: {
      style: 'line-top',
      padding: '12px 32px',
    },
    body: {
      fontFamily: 'Inter, sans-serif',
      sectionStyle: 'space',
      dataStyle: 'list',
      borderRadius: '0px',
      tableStyle: 'minimal',
    }
  },

  bold: {
    label: 'Bold',
    description: 'Header y footer oscuros, alto contraste',
    header: {
      size: 'lg',
      layout: 'logo-left',
      style: 'filled-dark',
      borderRadius: '0px',
      padding: '24px 32px',
    },
    footer: {
      style: 'filled-dark',
      padding: '14px 32px',
    },
    body: {
      fontFamily: 'Inter, sans-serif',
      sectionStyle: 'accent-line',
      dataStyle: 'list',
      borderRadius: '0px',
      tableStyle: 'striped',
    }
  },

  soft: {
    label: 'Soft',
    description: 'Redondeado, suave, amigable',
    header: {
      size: 'md',
      layout: 'centered',
      style: 'filled-light',
      borderRadius: '12px 12px 0px 0px',
      padding: '20px 32px',
    },
    footer: {
      style: 'filled-light',
      borderRadius: '0px 0px 12px 12px',
      padding: '14px 32px',
    },
    body: {
      fontFamily: 'Inter, sans-serif',
      sectionStyle: 'rounded-box',
      dataStyle: 'list',
      borderRadius: '8px',
      tableStyle: 'rounded',
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

export const HEADER_SETTINGS_META_KEY = '__document_header_settings'

export const DEFAULT_DOCUMENT_SETTINGS = {
  color_theme: 'tekmi',
  color_primary: DOCUMENT_THEMES.tekmi.primary,
  color_accent: DOCUMENT_THEMES.tekmi.accent,
  color_background: DOCUMENT_THEMES.tekmi.background,
  header_show_logo: true,
  header_text_align_x: 'left',
  header_text_align_y: 'top',
  header_logo_shape: 'square',
  header_logo_bg_color: 'transparent',
  header_logo_size_px: 60,
  header_logo_size: 'medium',
  header_fields: { ...DEFAULT_HEADER_FIELDS },
  header_extra_text: '',
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

const normalizeLegacyLogoSize = (legacySize) => {
  if (legacySize === 'small') return 40
  if (legacySize === 'large') return 80
  return 60
}

const normalizeLogoSizePx = (value, fallbackLegacySize) => {
  const parsed = Number(value)
  if (Number.isFinite(parsed)) {
    return Math.min(160, Math.max(40, Math.round(parsed)))
  }
  return normalizeLegacyLogoSize(fallbackLegacySize)
}

const normalizeLogoShape = (value) => {
  if (value === 'round' || value === 'rectangular' || value === 'square') return value
  return 'square'
}

const normalizeLogoBackground = (value) => {
  if (value === 'transparent') return 'transparent'
  if (typeof value === 'string' && /^#[0-9A-Fa-f]{6}$/.test(value)) return value
  return 'transparent'
}

const getLegacyHeaderSettings = (value = {}) => {
  const raw = value?.header_fields?.[HEADER_SETTINGS_META_KEY]
  return raw && typeof raw === 'object' ? raw : {}
}

const normalizeHeaderTextAlignX = (value, presetKey) => {
  if (value === 'left' || value === 'center' || value === 'right') return value
  const preset = DOCUMENT_PRESETS[presetKey] || DOCUMENT_PRESETS[DEFAULT_DOCUMENT_SETTINGS.preset]
  return preset?.header?.layout === 'centered' ? 'center' : 'left'
}

const normalizeHeaderTextAlignY = (value) => {
  if (value === 'top' || value === 'middle' || value === 'bottom') return value
  return 'top'
}

export const normalizeDocumentSettings = (value = {}) => ({
  ...DEFAULT_DOCUMENT_SETTINGS,
  ...value,
  header_text_align_x: normalizeHeaderTextAlignX(value.header_text_align_x ?? getLegacyHeaderSettings(value).text_align_x, value.preset),
  header_text_align_y: normalizeHeaderTextAlignY(value.header_text_align_y ?? getLegacyHeaderSettings(value).text_align_y),
  header_logo_shape: normalizeLogoShape(value.header_logo_shape ?? getLegacyHeaderSettings(value).logo_shape),
  header_logo_bg_color: normalizeLogoBackground(value.header_logo_bg_color ?? getLegacyHeaderSettings(value).logo_bg_color),
  header_logo_size_px: normalizeLogoSizePx(value.header_logo_size_px ?? getLegacyHeaderSettings(value).logo_size_px, value.header_logo_size),
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

export const getPresetConfig = (presetKey) => {
  return DOCUMENT_PRESETS[presetKey] || DOCUMENT_PRESETS[DEFAULT_DOCUMENT_SETTINGS.preset]
}

export const resolvePresetColors = (presetKey, themeTokens) => {
  // For the new preset structure, we derive colors from header/footer styles
  // This maps preset styles to color configurations
  const preset = getPresetConfig(presetKey)
  
  let headerBg = themeTokens.primary
  let headerText = '#FFFFFF'
  let footerBg = themeTokens.background
  let footerText = '#1F2937'
  
  // Resolve header style
  if (preset.header?.style === 'filled') {
    headerBg = themeTokens.primary
    headerText = '#FFFFFF'
  } else if (preset.header?.style === 'filled-dark') {
    headerBg = themeTokens.primaryDark || chroma(themeTokens.primary).darken(1).hex()
    headerText = '#FFFFFF'
  } else if (preset.header?.style === 'filled-light') {
    headerBg = chroma(themeTokens.primary).alpha(0.12).css()
    headerText = themeTokens.primary
  } else if (preset.header?.style === 'bordered') {
    headerBg = '#FFFFFF'
    headerText = themeTokens.primary
  } else if (preset.header?.style === 'line-top') {
    headerBg = '#FFFFFF'
    headerText = themeTokens.primary
  }
  
  // Resolve footer style
  if (preset.footer?.style === 'filled') {
    footerBg = themeTokens.primary
    footerText = '#FFFFFF'
  } else if (preset.footer?.style === 'filled-dark') {
    footerBg = themeTokens.primaryDark || chroma(themeTokens.primary).darken(1).hex()
    footerText = '#FFFFFF'
  } else if (preset.footer?.style === 'filled-light') {
    footerBg = chroma(themeTokens.primary).alpha(0.12).css()
    footerText = themeTokens.primary
  } else if (preset.footer?.style === 'bordered') {
    footerBg = '#FFFFFF'
    footerText = '#1F2937'
  } else if (preset.footer?.style === 'line-top') {
    footerBg = '#FFFFFF'
    footerText = '#1F2937'
  }

  return {
    headerBg,
    headerText,
    bodyBg: '#FFFFFF',
    bodyText: '#111827',
    footerBg,
    footerText,
    accentColor: themeTokens.accent,
    darkColor: themeTokens.primaryDark || chroma(themeTokens.primary).darken(1).hex()
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