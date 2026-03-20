<template>
  <div v-if="can('settings', 'edit')" class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-semibold tracking-tight text-gray-900">Documentos</h1>
        <p class="text-sm text-gray-500">Personaliza vouchers y cotizaciones con vista previa en tiempo real.</p>
      </div>
      <RouterLink to="/configuracion" class="btn-secondary text-sm">Volver a configuracion</RouterLink>
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
          <AppFormSection title="Estilos predefinidos" :divider="false" :collapsible="isMobile" :defaultOpen="true">
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

          <AppFormSection title="Tema de color" :divider="false" :collapsible="isMobile" :defaultOpen="true">
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

          <AppFormSection title="Header" description="Configura logo y campos visibles." :collapsible="isMobile" :defaultOpen="!isMobile">
            <AppToggle v-model="form.header_show_logo" label="Mostrar logo" size="sm" />

            <AppSelect
              v-if="form.header_show_logo"
              v-model="form.header_logo_size"
              label="Tamaño de logo"
              :options="logoSizeOptions"
            />

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

          <AppFormSection title="Footer" description="Configura campos visibles del pie de página." :collapsible="isMobile" :defaultOpen="!isMobile">
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

          <AppFormSection title="Secciones opcionales" description="Controla campos adicionales en el documento." :collapsible="isMobile" :defaultOpen="!isMobile">
            <AppToggle v-model="form.show_conditions" label="Incluir condiciones del alojamiento" size="sm" />
            <RouterLink to="/configuracion" class="text-sm font-medium text-primary hover:text-primary-dark">Editar condiciones</RouterLink>
            <AppInput v-model="form.custom_field_label" label="Etiqueta campo personalizado" placeholder="Informacion adicional" />
            <AppTextarea v-model="form.custom_field_content" label="Contenido campo personalizado" :rows="4" :autoResize="true" />
          </AppFormSection>

          <AppFormActions
            submit-label="Guardar configuracion"
            cancel-label="Recargar"
            :loading="saving || loading"
            :submit-disabled="saving || loading"
            @submit="saveSettings"
            @cancel="loadData"
          />
        </div>
      </div>

      <div v-show="isDesktop || activeTab === 'preview'" class="doc-preview-panel">
        <div class="card h-full space-y-3">
          <div class="flex items-center justify-between">
            <h2 class="text-sm font-semibold uppercase tracking-wide text-gray-700">Preview en tiempo real</h2>
            <span class="text-xs text-gray-500">Vista tipo voucher</span>
          </div>

          <div class="doc-preview-canvas">
            <div :class="isDesktop ? 'doc-preview-scale' : ''">
              <DocumentTemplate
                :settings="previewSettings"
                :profile="profile"
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

  <div v-else class="card border-amber-200 bg-amber-50/40">
    <h2 class="text-sm font-semibold uppercase tracking-wide text-amber-900">Sin acceso</h2>
    <p class="mt-2 text-sm text-amber-800">No tienes permisos para editar configuracion de documentos.</p>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
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
  AppFieldGroup,
  AppFormSection,
  AppFormActions,
} from '@/components/ui/forms'

const accountStore = useAccountStore()
const { can } = usePermissions()
const { isMobile, isDesktop } = useBreakpoint()
const toast = useToast()

const loading = ref(true)
const saving = ref(false)
const activeTab = ref('edit')
const profile = ref({})
const voucherConditions = ref('')

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

const logoSizeOptions = [
  { value: 'small', label: 'Pequeño' },
  { value: 'medium', label: 'Mediano' },
  { value: 'large', label: 'Grande' },
]

const previewSettings = computed(() => ({
  ...form.value,
  conditions_text: voucherConditions.value,
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
    applyThemePalette(form.value.color_theme)
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
    const saved = await saveDocumentSettings(accountId, form.value)
    form.value = normalizeDocumentSettings(saved)
    toast.success('Configuracion de documentos guardada.')
  } catch (error) {
    toast.error(error.message || 'No se pudo guardar la configuracion de documentos.')
  } finally {
    saving.value = false
  }
}

onMounted(loadData)
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
}

.doc-preview-canvas {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  overflow: auto;
  padding: 10px 8px 30px;
}

.doc-preview-scale {
  transform: scale(0.65);
  transform-origin: top center;
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

  .doc-preview-scale {
    transform: none;
  }
}
</style>
