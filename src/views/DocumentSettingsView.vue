<template>
  <div v-if="can('settings', 'edit')" class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-semibold tracking-tight text-gray-900">Documentos</h1>
        <p class="text-sm text-gray-500">Personaliza vouchers y cotizaciones con vista previa en tiempo real.</p>
      </div>
      <div class="flex items-center gap-2">
        <button
          type="button"
          class="btn-secondary text-sm"
          :disabled="saving || loading"
          @click="restoreDefaults"
        >
          Restaurar
        </button>
        <button
          type="button"
          class="btn-primary text-sm"
          :disabled="saving || loading"
          @click="saveSettings"
        >
          Guardar
        </button>
        <button type="button" class="btn-secondary text-sm" @click="goBack">Volver a configuracion</button>
      </div>
    </div>

    <div v-if="!isDesktop" class="rounded-xl border border-gray-200 bg-white p-1">
      <div class="grid grid-cols-2 gap-1">
        <button
          type="button"
          class="rounded-lg px-3 py-2 text-sm font-semibold transition"
          :class="activeTab === 'edit' ? 'bg-primary/10 text-primary-dark' : 'text-gray-600 hover:bg-gray-50'"
          @click="activeTab = 'edit'"
        >
          Editar
        </button>
        <button
          type="button"
          class="rounded-lg px-3 py-2 text-sm font-semibold transition"
          :class="activeTab === 'preview' ? 'bg-primary/10 text-primary-dark' : 'text-gray-600 hover:bg-gray-50'"
          @click="activeTab = 'preview'"
        >
          Vista previa
        </button>
      </div>
    </div>

    <div :class="isDesktop ? 'doc-editor-shell' : 'space-y-4'">
      <div v-show="isDesktop || activeTab === 'edit'" class="doc-config-panel">
        <div class="card space-y-6">
          <AppFormSection title="Estilos predefinidos" :divider="false" :collapsible="true" :defaultOpen="true">
            <div class="grid grid-cols-1 gap-3">
              <button
                v-for="(preset, key) in presetOptions"
                :key="key"
                type="button"
                class="rounded-xl border p-4 text-left transition"
                :class="form.preset === key ? 'border-primary bg-primary/10' : 'border-gray-200 hover:border-primary/30'"
                @click="form.preset = key"
              >
                <div class="flex items-start justify-between gap-3">
                  <div class="flex-1">
                    <p class="text-sm font-semibold text-gray-900">{{ preset.label }}</p>
                    <p class="text-xs text-gray-500">{{ preset.description }}</p>
                  </div>
                  <span v-if="form.preset === key" class="flex-shrink-0 text-xs font-semibold text-primary-dark">Activo</span>
                </div>
              </button>
            </div>
          </AppFormSection>

          <AppFormSection title="Tema de color" :divider="false" :collapsible="true" :defaultOpen="true">
            <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
              <button
                v-for="option in themeOptions"
                :key="option.key"
                type="button"
                class="rounded-lg border p-3 text-left transition"
                :class="form.color_theme === option.key ? 'border-primary bg-primary/10' : 'border-gray-200 hover:border-primary/30'"
                @click="selectTheme(option.key)"
              >
                <p class="text-sm font-semibold text-gray-900">{{ option.label }}</p>
                <div class="mt-2 flex items-center gap-2">
                  <span class="h-4 w-4 rounded-full border border-gray-200" :style="{ backgroundColor: option.primary || form.color_primary }"></span>
                  <span class="h-4 w-4 rounded-full border border-gray-200" :style="{ backgroundColor: option.accent || form.color_accent }"></span>
                  <span class="h-4 w-4 rounded-full border border-gray-200" :style="{ backgroundColor: option.background || form.color_background }"></span>
                </div>
              </button>
            </div>

            <div class="grid grid-cols-1 gap-3 md:grid-cols-3">
              <label class="text-xs font-medium text-gray-600">
                Color primario
                <input v-model="form.color_primary" type="color" class="mt-1 h-12 w-full rounded-md border border-gray-300" :disabled="!isCustomTheme">
              </label>
              <label class="text-xs font-medium text-gray-600">
                Color acento
                <input v-model="form.color_accent" type="color" class="mt-1 h-12 w-full rounded-md border border-gray-300" :disabled="!isCustomTheme">
              </label>
              <label class="text-xs font-medium text-gray-600">
                Color fondo
                <input v-model="form.color_background" type="color" class="mt-1 h-12 w-full rounded-md border border-gray-300" :disabled="!isCustomTheme">
              </label>
            </div>
            <p class="text-xs text-gray-500">Los colores solo son editables cuando el tema es Personalizada.</p>
          </AppFormSection>

          <AppFormSection title="Header" description="Configura logo y campos visibles." :collapsible="true" :defaultOpen="true">
            <AppToggle v-model="form.header_show_logo" label="Mostrar logo" size="sm" />

            <AppFieldGroup v-if="form.header_show_logo" title="Logo" compact>
              <div class="space-y-3">
                <div class="flex flex-wrap items-start gap-4">
                  <div
                    class="flex items-center justify-center overflow-hidden border border-gray-200"
                    :style="logoPreviewFrameStyle"
                  >
                    <img
                      v-if="logoPreviewUrl"
                      :src="logoPreviewUrl"
                      alt="Logo cuenta"
                      class="h-full w-full object-contain"
                    >
                    <div v-else class="px-2 text-center text-[10px] text-gray-400">Sin logo</div>
                  </div>

                  <div class="space-y-2">
                    <input
                      ref="logoInputRef"
                      type="file"
                      accept="image/png,image/jpeg,image/svg+xml,image/webp"
                      class="hidden"
                      @change="onLogoSelected"
                    >
                    <button type="button" class="btn-secondary min-h-[40px] px-3 text-sm" @click="openLogoPicker">Cambiar logo</button>
                    <button
                      v-if="logoPreviewUrl"
                      type="button"
                      class="text-xs font-medium text-gray-500 hover:text-gray-700"
                      @click="clearSelectedLogo"
                    >
                      Quitar logo
                    </button>
                    <AppFieldHint message="Maximo 2MB. Formatos permitidos: PNG, JPG, JPEG, SVG y WEBP." />
                  </div>
                </div>

                <AppInlineAlert v-if="logoError" type="error" :message="logoError" />

                <div class="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <AppSelect
                    v-model="form.header_logo_shape"
                    label="Forma"
                    :options="logoShapeOptions"
                  />

                  <label class="text-xs font-medium text-gray-600">
                    Color de fondo
                    <input
                      v-model="form.header_logo_bg_color"
                      type="color"
                      class="mt-1 h-11 w-full rounded-md border border-gray-300"
                      :disabled="logoBackgroundIsTransparent"
                    >
                  </label>

                  <AppToggle
                    v-model="logoBackgroundIsTransparent"
                    label="Fondo transparente"
                    size="sm"
                  />
                </div>

                <label class="block text-xs font-medium text-gray-600">
                  Tamaño logo: {{ form.header_logo_size_px }}px
                  <input
                    v-model.number="form.header_logo_size_px"
                    type="range"
                    min="40"
                    max="160"
                    step="2"
                    class="mt-2 h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200"
                  >
                  <span class="mt-1 block text-[11px] text-gray-500">Rango 40px a 160px</span>
                </label>
              </div>
            </AppFieldGroup>

            <AppFieldGroup title="Alineacion de texto" compact>
              <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <p class="mb-1 text-xs font-medium text-gray-600">Horizontal</p>
                  <div class="inline-flex rounded-lg border border-gray-200 bg-white p-1">
                    <button
                      type="button"
                      class="rounded-md p-2 transition"
                      :class="form.header_text_align_x === 'left' ? 'bg-primary/10 text-primary-dark' : 'text-gray-500 hover:bg-gray-100'"
                      title="Alinear a la izquierda"
                      aria-label="Alinear a la izquierda"
                      @click="form.header_text_align_x = 'left'"
                    >
                      <svg viewBox="0 0 20 20" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                        <path d="M3 5h14M3 9h9M3 13h14M3 17h9" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      class="rounded-md p-2 transition"
                      :class="form.header_text_align_x === 'center' ? 'bg-primary/10 text-primary-dark' : 'text-gray-500 hover:bg-gray-100'"
                      title="Centrar"
                      aria-label="Centrar"
                      @click="form.header_text_align_x = 'center'"
                    >
                      <svg viewBox="0 0 20 20" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                        <path d="M3 5h14M5.5 9h9M3 13h14M5.5 17h9" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      class="rounded-md p-2 transition"
                      :class="form.header_text_align_x === 'right' ? 'bg-primary/10 text-primary-dark' : 'text-gray-500 hover:bg-gray-100'"
                      title="Alinear a la derecha"
                      aria-label="Alinear a la derecha"
                      @click="form.header_text_align_x = 'right'"
                    >
                      <svg viewBox="0 0 20 20" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                        <path d="M3 5h14M8 9h9M3 13h14M8 17h9" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div>
                  <p class="mb-1 text-xs font-medium text-gray-600">Vertical</p>
                  <div class="inline-flex rounded-lg border border-gray-200 bg-white p-1">
                    <button
                      type="button"
                      class="rounded-md p-2 transition"
                      :class="form.header_text_align_y === 'top' ? 'bg-primary/10 text-primary-dark' : 'text-gray-500 hover:bg-gray-100'"
                      title="Alinear arriba"
                      aria-label="Alinear arriba"
                      @click="form.header_text_align_y = 'top'"
                    >
                      <svg viewBox="0 0 20 20" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                        <path d="M4 4h12M10 6v10M7 9l3-3 3 3" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      class="rounded-md p-2 transition"
                      :class="form.header_text_align_y === 'middle' ? 'bg-primary/10 text-primary-dark' : 'text-gray-500 hover:bg-gray-100'"
                      title="Alinear al centro"
                      aria-label="Alinear al centro"
                      @click="form.header_text_align_y = 'middle'"
                    >
                      <svg viewBox="0 0 20 20" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                        <path d="M4 10h12M10 5v10M7 8l3-3 3 3M7 12l3 3 3-3" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      class="rounded-md p-2 transition"
                      :class="form.header_text_align_y === 'bottom' ? 'bg-primary/10 text-primary-dark' : 'text-gray-500 hover:bg-gray-100'"
                      title="Alinear abajo"
                      aria-label="Alinear abajo"
                      @click="form.header_text_align_y = 'bottom'"
                    >
                      <svg viewBox="0 0 20 20" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                        <path d="M4 16h12M10 4v10M7 11l3 3 3-3" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </AppFieldGroup>

            <AppFieldGroup title="Campos visibles" compact>
              <div class="grid grid-cols-2 gap-3">
                <AppToggle
                  v-for="field in profileFields"
                  :key="`header-${field.key}`"
                  v-model="form.header_fields[field.key]"
                  :label="field.label"
                  size="sm"
                />
              </div>
            </AppFieldGroup>

            <AppTextarea v-model="form.header_extra_text" label="Texto adicional (opcional)" :rows="2" :autoResize="true" placeholder="Cualquier texto adicional para el header..." />
          </AppFormSection>

          <AppFormSection title="Footer" description="Configura campos visibles del pie de página." :collapsible="true" :defaultOpen="true">
            <AppFieldGroup title="Campos visibles" compact>
              <div class="grid grid-cols-2 gap-3">
                <AppToggle
                  v-for="field in profileFields"
                  :key="`footer-${field.key}`"
                  v-model="form.footer_fields[field.key]"
                  :label="field.label"
                  size="sm"
                />
              </div>
            </AppFieldGroup>

            <AppTextarea v-model="form.footer_free_text" label="Texto adicional (opcional)" :rows="2" :autoResize="true" placeholder="Cualquier texto adicional para el footer..." />
          </AppFormSection>

          <AppFormSection title="Secciones opcionales" description="Controla campos adicionales en el documento." :collapsible="true" :defaultOpen="true">
            <AppToggle v-model="form.show_conditions" label="Incluir condiciones del alojamiento" size="sm" />
            <RouterLink to="/configuracion" class="text-sm font-medium text-primary hover:text-primary-dark">Editar condiciones</RouterLink>
            <AppInput v-model="form.custom_field_label" label="Etiqueta campo personalizado" placeholder="Informacion adicional" />
            <AppTextarea v-model="form.custom_field_content" label="Contenido campo personalizado" :rows="4" :autoResize="true" />
          </AppFormSection>

        </div>
      </div>

      <div v-show="isDesktop || activeTab === 'preview'" class="doc-preview-panel">
        <div class="card h-full space-y-3">
          <div class="flex items-center justify-between">
            <h2 class="text-sm font-semibold uppercase tracking-wide text-gray-700">Preview en tiempo real</h2>
            <span class="text-xs text-gray-500">Vista tipo voucher</span>
          </div>

          <div ref="previewCanvasRef" class="doc-preview-canvas">
            <div class="doc-preview-frame" :style="previewFrameStyle">
              <div class="doc-preview-scale" :style="previewScaleStyle">
              <DocumentTemplate
                :settings="previewSettings"
                :profile="previewProfile"
                type="voucher"
                :previewMode="true"
              >
                <section class="doc-content-section border-b pb-4">
                  <h1 class="doc-content-title text-2xl font-semibold">Comprobante de Reserva</h1>
                  <p class="mt-2 text-base font-semibold text-gray-900">Codigo de reserva: REF-AB12CD</p>
                  <div class="mt-3 grid grid-cols-1 gap-1 text-sm text-gray-700 md:grid-cols-3 md:gap-3">
                    <p><span class="font-semibold">Reserva:</span> RSV-202603-0012</p>
                    <p><span class="font-semibold">Codigo:</span> AB12CD</p>
                    <p><span class="font-semibold">Emitido:</span> {{ issuedAtPreview }}</p>
                  </div>
                </section>

                <section class="doc-content-section border-b py-4">
                  <h2 class="doc-content-subtitle text-sm font-semibold uppercase tracking-wide">Datos de la reserva</h2>
                  <div class="mt-3 grid grid-cols-1 gap-2 text-sm text-gray-700 md:grid-cols-2">
                    <p><span class="font-semibold">Unidad:</span> Suite 301</p>
                    <p><span class="font-semibold">Origen:</span> Directo</p>
                    <p><span class="font-semibold">Check-in:</span> 22/03/2026</p>
                    <p><span class="font-semibold">Check-out:</span> 25/03/2026</p>
                    <p><span class="font-semibold">Noches:</span> 3</p>
                    <p><span class="font-semibold">Adultos:</span> 2 · <span class="font-semibold">Ninos:</span> 1</p>
                  </div>
                </section>

                <section class="doc-content-section py-4">
                  <h2 class="doc-content-subtitle text-sm font-semibold uppercase tracking-wide">Resumen financiero</h2>
                  <div class="mt-3 space-y-1 text-sm text-gray-700">
                    <p class="flex justify-between gap-3"><span>Precio por noche:</span> <span class="font-medium">$320.000</span></p>
                    <p class="flex justify-between gap-3"><span>Total reserva:</span> <span class="font-medium">$960.000</span></p>
                  </div>
                </section>
              </DocumentTemplate>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div v-else class="card border-amber-200 bg-amber-50/40">
    <h2 class="text-sm font-semibold uppercase tracking-wide text-amber-900">Sin acceso</h2>
    <p class="mt-2 text-sm text-amber-800">No tienes permisos para editar configuracion de documentos.</p>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import DocumentTemplate from '../components/documents/DocumentTemplate.vue'
import { supabase } from '../services/supabase'
import { useAccountStore } from '../stores/account'
import { usePermissions } from '../composables/usePermissions'
import { useToast } from '../composables/useToast'
import { getDocumentSettings, saveDocumentSettings } from '../services/documentSettingsService'
import { useBreakpoint } from '../composables/useBreakpoint'
import {
  DOCUMENT_PRESETS,
  DOCUMENT_THEMES,
  DEFAULT_DOCUMENT_SETTINGS,
  deriveThemeTokens,
  getDocumentThemeColors,
  normalizeDocumentSettings,
} from '../utils/documentThemes'
import {
  AppInput,
  AppSelect,
  AppTextarea,
  AppToggle,
  AppFieldHint,
  AppFieldGroup,
  AppFormSection,
  AppInlineAlert,
} from '@/components/ui/forms'

const accountStore = useAccountStore()
const router = useRouter()
const { can } = usePermissions()
const { isMobile, isDesktop } = useBreakpoint()
const toast = useToast()

const loading = ref(true)
const saving = ref(false)
const activeTab = ref('edit')
const profile = ref({})
const voucherConditions = ref('')
const logoInputRef = ref(null)
const selectedLogoFile = ref(null)
const selectedLogoPreviewUrl = ref('')
const removedLogo = ref(false)
const logoError = ref('')
const previewCanvasRef = ref(null)
const previewScale = ref(0.56)

const PREVIEW_DOC_WIDTH = 816
const PREVIEW_DOC_HEIGHT = 1056
const PREVIEW_CANVAS_PADDING = 24

let previewResizeObserver = null

const ALLOWED_LOGO_TYPES = new Set(['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'])
const MAX_LOGO_BYTES = 2 * 1024 * 1024

const goBack = () => {
  if (window.history.state?.back) {
    router.back()
    return
  }
  router.push('/configuracion')
}

const form = ref(normalizeDocumentSettings(DEFAULT_DOCUMENT_SETTINGS))

const themeOptions = computed(() => Object.entries(DOCUMENT_THEMES).map(([key, value]) => ({
  key,
  label: value.label,
  primary: value.primary,
  accent: value.accent,
  background: value.background,
})))

const presetOptions = computed(() => DOCUMENT_PRESETS)

const previewTokens = computed(() => {
  const colors = getDocumentThemeColors(form.value)
  return deriveThemeTokens(colors.primary, colors.accent, colors.background)
})

const isCustomTheme = computed(() => form.value.color_theme === 'custom')

const profileFields = [
  { key: 'nombre_comercial', label: 'Nombre comercial' },
  { key: 'nit', label: 'NIT' },
  { key: 'razon_social', label: 'Razón social' },
  { key: 'telefono', label: 'Teléfono' },
  { key: 'email', label: 'Email' },
  { key: 'ciudad', label: 'Ciudad' },
  { key: 'direccion', label: 'Dirección' },
  { key: 'website', label: 'Website' },
  { key: 'slogan', label: 'Slogan' },
]

const logoShapeOptions = [
  { value: 'round', label: 'Redondo' },
  { value: 'square', label: 'Cuadrado' },
  { value: 'rectangular', label: 'Rectangular' },
]

const logoPreviewUrl = computed(() => {
  if (removedLogo.value) return ''
  return selectedLogoPreviewUrl.value || profile.value.logo_url || ''
})

const logoBackgroundIsTransparent = computed({
  get: () => form.value.header_logo_bg_color === 'transparent',
  set: (enabled) => {
    form.value.header_logo_bg_color = enabled ? 'transparent' : '#ffffff'
  }
})

const logoPreviewFrameStyle = computed(() => {
  const shape = form.value.header_logo_shape || 'square'
  const size = Number(form.value.header_logo_size_px) || 60
  const width = shape === 'rectangular' ? Math.round(size * 1.6) : size
  const borderRadius = shape === 'round' ? '9999px' : shape === 'rectangular' ? '8px' : '4px'
  const background = form.value.header_logo_bg_color || 'transparent'

  return {
    width: `${width}px`,
    height: `${size}px`,
    borderRadius,
    background,
  }
})

const previewSettings = computed(() => ({
  ...form.value,
  conditions_text: voucherConditions.value,
}))

const previewProfile = computed(() => ({
  ...profile.value,
  logo_url: logoPreviewUrl.value || '',
}))

const previewFrameStyle = computed(() => ({
  width: `${Math.round(PREVIEW_DOC_WIDTH * previewScale.value)}px`,
  height: `${Math.round(PREVIEW_DOC_HEIGHT * previewScale.value)}px`,
}))

const previewScaleStyle = computed(() => ({
  transform: `scale(${previewScale.value})`,
  transformOrigin: 'top left',
}))

const issuedAtPreview = computed(() => new Intl.DateTimeFormat('es-CO', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
}).format(new Date()))

const selectTheme = (themeKey) => {
  if (themeKey === form.value.color_theme) return

  if (themeKey === 'custom' && form.value.color_theme !== 'custom') {
    const previousTheme = DOCUMENT_THEMES[form.value.color_theme]
    if (previousTheme) {
      form.value.color_primary = previousTheme.primary
      form.value.color_accent = previousTheme.accent
      form.value.color_background = previousTheme.background
    }
  }

  form.value.color_theme = themeKey
  applyThemePalette(themeKey)
}

const applyThemePalette = (themeKey) => {
  const selectedTheme = DOCUMENT_THEMES[themeKey]
  if (!selectedTheme || themeKey === 'custom') return

  form.value.color_primary = selectedTheme.primary
  form.value.color_accent = selectedTheme.accent
  form.value.color_background = selectedTheme.background
}

const updatePreviewScale = () => {
  const canvas = previewCanvasRef.value
  if (!canvas) return

  const availableWidth = canvas.clientWidth - PREVIEW_CANVAS_PADDING
  const availableHeight = canvas.clientHeight - PREVIEW_CANVAS_PADDING
  if (availableWidth <= 0 || availableHeight <= 0) return

  const fittedScale = Math.min(
    availableWidth / PREVIEW_DOC_WIDTH,
    availableHeight / PREVIEW_DOC_HEIGHT,
    1
  )

  previewScale.value = Math.max(0.2, Number(fittedScale.toFixed(3)))
}

const restoreDefaults = () => {
  form.value = normalizeDocumentSettings(DEFAULT_DOCUMENT_SETTINGS)
  form.value.header_logo_size_px = Math.min(160, Math.max(40, Number(form.value.header_logo_size_px) || 60))
  removedLogo.value = false
  selectedLogoFile.value = null
  logoError.value = ''
  revokeSelectedLogoPreview()
  toast.success('Valores restaurados. Recuerda guardar para aplicar los cambios.')
}

const openLogoPicker = () => {
  logoInputRef.value?.click()
}

const revokeSelectedLogoPreview = () => {
  if (selectedLogoPreviewUrl.value) {
    URL.revokeObjectURL(selectedLogoPreviewUrl.value)
    selectedLogoPreviewUrl.value = ''
  }
}

const onLogoSelected = (event) => {
  const file = event.target.files?.[0]
  if (!file) return
  logoError.value = ''

  if (!ALLOWED_LOGO_TYPES.has(file.type)) {
    logoError.value = 'Formato de logo no permitido. Usa PNG, JPG, JPEG, SVG o WEBP.'
    event.target.value = ''
    return
  }

  if (file.size > MAX_LOGO_BYTES) {
    logoError.value = 'El logo supera 2MB. Selecciona un archivo mas liviano.'
    event.target.value = ''
    return
  }

  removedLogo.value = false
  selectedLogoFile.value = file
  revokeSelectedLogoPreview()
  selectedLogoPreviewUrl.value = URL.createObjectURL(file)
}

const clearSelectedLogo = () => {
  removedLogo.value = true
  selectedLogoFile.value = null
  revokeSelectedLogoPreview()
  logoError.value = ''
}

const parseStoragePath = (url) => {
  if (!url) return ''
  const marker = '/object/public/account-assets/'
  const markerIndex = url.indexOf(marker)
  if (markerIndex === -1) return ''
  return decodeURIComponent(url.slice(markerIndex + marker.length))
}

const removePreviousLogo = async (accountId, url) => {
  const explicitPath = parseStoragePath(url)
  if (explicitPath) {
    await supabase.storage.from('account-assets').remove([explicitPath])
    return
  }

  const candidates = ['png', 'jpg', 'jpeg', 'svg', 'webp'].map((ext) => `accounts/${accountId}/logo.${ext}`)
  await supabase.storage.from('account-assets').remove(candidates)
}

const uploadLogoIfNeeded = async (accountId) => {
  if (removedLogo.value) {
    await removePreviousLogo(accountId, profile.value.logo_url)
    return ''
  }

  if (!selectedLogoFile.value) return profile.value.logo_url || ''

  const file = selectedLogoFile.value
  const extension = (file.name.split('.').pop() || 'png').toLowerCase()
  const storagePath = `accounts/${accountId}/logo.${extension}`

  await removePreviousLogo(accountId, profile.value.logo_url)

  const { error: uploadError } = await supabase.storage
    .from('account-assets')
    .upload(storagePath, file, { upsert: true, contentType: file.type })

  if (uploadError) throw uploadError

  const { data } = supabase.storage.from('account-assets').getPublicUrl(storagePath)
  return data?.publicUrl || ''
}

const loadData = async () => {
  if (!can('settings', 'edit')) return

  loading.value = true
  try {
    const accountId = accountStore.getRequiredAccountId()

    const [{ data: profileData }, { data: settingsData }, settings] = await Promise.all([
      supabase
        .from('account_profile')
        .select('*')
        .eq('account_id', accountId)
        .maybeSingle(),
      supabase
        .from('settings')
        .select('voucher_conditions')
        .eq('account_id', accountId)
        .maybeSingle(),
      getDocumentSettings(accountId),
    ])

    profile.value = profileData || {}
    voucherConditions.value = String(settingsData?.voucher_conditions || '').trim()
    form.value = normalizeDocumentSettings(settings)
    form.value.header_logo_size_px = Math.min(160, Math.max(40, Number(form.value.header_logo_size_px) || 60))
    applyThemePalette(form.value.color_theme)
    selectedLogoFile.value = null
    removedLogo.value = false
    logoError.value = ''
    revokeSelectedLogoPreview()
  } catch (error) {
    toast.error(error.message || 'No se pudo cargar la configuracion de documentos.')
  } finally {
    loading.value = false
  }
}

const saveSettings = async () => {
  if (!can('settings', 'edit')) return

  saving.value = true
  try {
    const accountId = accountStore.getRequiredAccountId()
    const logoUrl = await uploadLogoIfNeeded(accountId)

    if (removedLogo.value || selectedLogoFile.value) {
      const { error: profileError } = await supabase
        .from('account_profile')
        .upsert(
          {
            account_id: accountId,
            logo_url: logoUrl || null,
          },
          { onConflict: 'account_id' }
        )

      if (profileError) throw profileError
      profile.value = {
        ...profile.value,
        logo_url: logoUrl || '',
      }
      selectedLogoFile.value = null
      removedLogo.value = false
      logoError.value = ''
      revokeSelectedLogoPreview()
    }

    const saved = await saveDocumentSettings(accountId, form.value)
    form.value = normalizeDocumentSettings(saved)
    toast.success('Configuracion de documentos guardada.')
  } catch (error) {
    toast.error(error.message || 'No se pudo guardar la configuracion de documentos.')
  } finally {
    saving.value = false
  }
}

onBeforeUnmount(() => {
  revokeSelectedLogoPreview()
  previewResizeObserver?.disconnect()
  previewResizeObserver = null
})

watch(
  () => [activeTab.value, isDesktop.value],
  async () => {
    await nextTick()
    updatePreviewScale()
  }
)

onMounted(async () => {
  await loadData()
  await nextTick()

  if (typeof ResizeObserver !== 'undefined' && previewCanvasRef.value) {
    previewResizeObserver = new ResizeObserver(() => {
      updatePreviewScale()
    })
    previewResizeObserver.observe(previewCanvasRef.value)
  }

  updatePreviewScale()
})
</script>

<style scoped>
.doc-editor-shell {
  display: flex;
  gap: 16px;
  min-height: calc(100vh - 220px);
}

.doc-config-panel {
  width: 380px;
  flex: 0 0 380px;
  max-height: calc(100vh - 220px);
  overflow-y: auto;
  padding-right: 4px;
}

.doc-preview-panel {
  flex: 1;
  min-width: 0;
  min-height: calc(100vh - 220px);
}

.doc-preview-canvas {
  display: flex;
  flex: 1;
  min-height: 0;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  padding: 12px;
}

.doc-preview-scale {
  width: 816px;
  height: 1056px;
  flex-shrink: 0;
}

.doc-preview-frame {
  display: block;
  flex-shrink: 0;
  overflow: hidden;
}

.doc-preview-panel :deep(.card) {
  display: flex;
  min-height: calc(100vh - 220px);
  flex-direction: column;
}

.doc-content-title,
.doc-content-subtitle {
  color: var(--doc-accent);
}

.doc-content-section {
  break-inside: avoid;
  page-break-inside: avoid;
}

@media (max-width: 1023px) {
  .doc-config-panel,
  .doc-preview-panel {
    width: 100%;
    max-height: none;
  }

  .doc-preview-panel {
    min-height: auto;
  }

  .doc-preview-panel :deep(.card) {
    min-height: 70vh;
  }
}
</style>
