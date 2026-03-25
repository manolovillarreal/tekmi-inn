<template>
  <div v-if="can('settings', 'edit')" class="space-y-6">
    <div class="flex items-center justify-between gap-3">
      <button type="button" class="btn-secondary text-sm" @click="goBack">Volver</button>
      <h1 class="text-2xl font-semibold tracking-tight text-gray-900">Editor de mensaje</h1>
      <button v-if="message" type="button" class="btn-secondary text-sm sm:hidden" @click="showDrawer = true">Variables</button>
      <div class="hidden w-[72px] sm:block"></div>
    </div>

    <div v-if="loading" class="card text-sm text-gray-600">Cargando mensaje...</div>

    <div v-else-if="!message" class="card border-amber-200 bg-amber-50/40">
      <h2 class="text-sm font-semibold uppercase tracking-wide text-amber-900">Mensaje no encontrado</h2>
      <p class="mt-2 text-sm text-amber-800">No se encontró el mensaje solicitado para esta cuenta.</p>
    </div>

    <div v-else class="grid grid-cols-1 gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
      <!-- Panel izquierdo — oculto en mobile -->
      <aside class="hidden sm:block card space-y-5">
        <div>
          <h2 class="text-xs font-semibold uppercase tracking-wide text-gray-500">Variables</h2>
          <p class="mt-1 text-xs text-gray-500">Haz clic para insertar en la posición actual del cursor.</p>
        </div>

        <div class="space-y-4">
          <section v-for="group in variableGroups" :key="group.title" class="space-y-2">
            <h3 class="text-sm font-semibold text-gray-900">{{ group.title }}</h3>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="item in group.items"
                :key="item.token"
                type="button"
                class="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 transition hover:bg-indigo-100"
                @click="insertVariable(item.token)"
              >{{ item.label }}</button>
            </div>
          </section>
        </div>

        <div class="space-y-3 border-t border-gray-200 pt-4">
          <h2 class="text-xs font-semibold uppercase tracking-wide text-gray-500">Emojis</h2>
          <section v-for="group in emojiGroups" :key="group.title" class="space-y-1.5">
            <h3 class="text-xs font-medium text-gray-500">{{ group.title }}</h3>
            <div class="grid grid-cols-6 gap-1">
              <button
                v-for="emoji in group.emojis"
                :key="emoji"
                type="button"
                class="flex items-center justify-center rounded p-1 text-xl leading-none transition hover:bg-gray-100"
                @click="insertText(emoji)"
              >{{ emoji }}</button>
            </div>
          </section>
        </div>

        <section v-if="isSystemMessage" class="space-y-3 border-t border-gray-200 pt-4">
          <h3 class="text-sm font-semibold text-gray-900">Bloques condicionales</h3>
          <AppToggle v-model="systemForm.show_unit_count" label="Mostrar numero de unidades" />
          <AppToggle v-model="systemForm.show_unit_name" label="Mostrar nombre de unidad" />
          <AppToggle v-model="systemForm.show_unit_description" label="Mostrar descripcion por unidad" />
        </section>
      </aside>

      <!-- Panel editor -->
      <section class="card space-y-4">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p class="text-xs uppercase tracking-wide text-gray-500">{{ message.type === 'system' ? 'Sistema' : 'Personalizado' }}</p>
            <h2 class="text-xl font-semibold text-gray-900">{{ message.name }}</h2>
          </div>
          <button type="button" class="btn-primary text-sm" :disabled="saving" @click="saveMessage">
            {{ saving ? 'Guardando...' : 'Guardar' }}
          </button>
        </div>

        <!-- Encabezado de contexto para preview -->
        <div class="flex items-center justify-between gap-3 rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
          <div class="min-w-0">
            <div class="flex items-center gap-2">
              <span class="text-xs text-gray-500">Preview con:</span>
              <span v-if="contextInfo.isMock" class="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">Mock</span>
            </div>
            <p class="truncate text-sm font-medium text-gray-900">{{ contextInfo.guestName }}</p>
            <p class="truncate text-xs text-gray-500">{{ contextInfo.dates }} · {{ contextInfo.reference }}</p>
          </div>
          <div class="flex shrink-0 items-center gap-1">
            <button
              type="button"
              class="rounded px-1.5 py-1 text-sm text-gray-500 transition hover:bg-white hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-40"
              :disabled="!canPrev"
              @click="prevContext"
            >←</button>
            <span class="min-w-[44px] text-center text-xs text-gray-500">
              {{ usingMock ? 'mock' : (contextIndex + 1) + '/' + activeContextList.length }}
            </span>
            <button
              type="button"
              class="rounded px-1.5 py-1 text-sm text-gray-500 transition hover:bg-white hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-40"
              :disabled="!canNext"
              @click="nextContext"
            >→</button>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button
            type="button"
            class="rounded-md px-3 py-1.5 text-sm font-medium transition"
            :class="viewMode === 'raw' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
            @click="viewMode = 'raw'"
          >
            Raw
          </button>
          <button
            type="button"
            class="rounded-md px-3 py-1.5 text-sm font-medium transition"
            :class="viewMode === 'render' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
            @click="viewMode = 'render'"
          >
            Render
          </button>
        </div>

        <textarea
          v-if="viewMode === 'raw'"
          ref="textareaRef"
          v-model="body"
          rows="16"
          class="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
          placeholder="Escribe el mensaje con variables como {{nombre_huesped}}"
          @click="syncCursor"
          @keyup="syncCursor"
          @select="syncCursor"
          @input="syncCursor"
        ></textarea>

        <div v-else class="min-h-[320px] whitespace-pre-wrap rounded-md border border-gray-200 bg-gray-50 p-3 text-sm text-gray-800">
          {{ renderedPreview.text }}
        </div>

        <p v-if="viewMode === 'render' && renderedPreview.missing.length" class="text-xs text-amber-700">
          Faltan variables: {{ renderedPreview.missing.join(', ') }}
        </p>
      </section>
    </div>

    <!-- Drawer mobile -->
    <Teleport to="body">
      <div v-if="showDrawer" class="fixed inset-0 z-50 flex sm:hidden">
        <div class="absolute inset-0 bg-black/40" @click="showDrawer = false"></div>
        <div class="relative z-10 flex h-full w-2/3 max-w-xs flex-col overflow-hidden bg-white shadow-xl">
          <div class="flex shrink-0 items-center justify-between border-b border-gray-200 p-4">
            <h2 class="font-semibold text-gray-900">Variables y emojis</h2>
            <button type="button" class="text-xl leading-none text-gray-500 hover:text-gray-900" @click="showDrawer = false">✕</button>
          </div>
          <div class="flex-1 space-y-5 overflow-y-auto p-4">
            <div>
              <h2 class="text-xs font-semibold uppercase tracking-wide text-gray-500">Variables</h2>
              <p class="mt-1 text-xs text-gray-500">Toca para insertar.</p>
            </div>

            <div class="space-y-4">
              <section v-for="group in variableGroups" :key="'d-' + group.title" class="space-y-2">
                <h3 class="text-sm font-semibold text-gray-900">{{ group.title }}</h3>
                <div class="flex flex-wrap gap-2">
                  <button
                    v-for="item in group.items"
                    :key="'d-' + item.token"
                    type="button"
                    class="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 transition hover:bg-indigo-100"
                    @click="insertVariable(item.token, true)"
                  >{{ item.label }}</button>
                </div>
              </section>
            </div>

            <div class="space-y-3 border-t border-gray-200 pt-4">
              <h2 class="text-xs font-semibold uppercase tracking-wide text-gray-500">Emojis</h2>
              <section v-for="group in emojiGroups" :key="'d-' + group.title" class="space-y-1.5">
                <h3 class="text-xs font-medium text-gray-500">{{ group.title }}</h3>
                <div class="grid grid-cols-6 gap-1">
                  <button
                    v-for="emoji in group.emojis"
                    :key="'d-' + emoji"
                    type="button"
                    class="flex items-center justify-center rounded p-1 text-xl leading-none transition hover:bg-gray-100"
                    @click="insertText(emoji, true)"
                  >{{ emoji }}</button>
                </div>
              </section>
            </div>

            <section v-if="isSystemMessage" class="space-y-3 border-t border-gray-200 pt-4">
              <h3 class="text-sm font-semibold text-gray-900">Bloques condicionales</h3>
              <AppToggle v-model="systemForm.show_unit_count" label="Mostrar numero de unidades" />
              <AppToggle v-model="systemForm.show_unit_name" label="Mostrar nombre de unidad" />
              <AppToggle v-model="systemForm.show_unit_description" label="Mostrar descripcion por unidad" />
            </section>
          </div>
        </div>
      </div>
    </Teleport>
  </div>

  <div v-else class="card border-amber-200 bg-amber-50/40">
    <h2 class="text-sm font-semibold uppercase tracking-wide text-amber-900">Sin acceso</h2>
    <p class="mt-2 text-sm text-amber-800">No tienes permisos para gestionar mensajes.</p>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '../services/supabase'
import { usePermissions } from '../composables/usePermissions'
import { useToast } from '../composables/useToast'
import { useAccountStore } from '../stores/account'
import AppToggle from '../components/ui/forms/AppToggle.vue'
import {
  DEFAULT_MESSAGE_SETTINGS,
  getMessageSettings,
  saveMessageSettings,
  savePredefinedMessage,
} from '../services/messageSettingsService'
import { buildGlobalVariables, resolveTemplate } from '../utils/messageUtils'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const accountStore = useAccountStore()
const { can } = usePermissions()

const loading = ref(true)
const saving = ref(false)
const message = ref(null)
const body = ref('')
const viewMode = ref('raw')
const textareaRef = ref(null)
const selectionStart = ref(0)
const selectionEnd = ref(0)
const showDrawer = ref(false)

const profile = ref({})
const accountSettings = ref({})
const systemForm = ref({ ...DEFAULT_MESSAGE_SETTINGS })
const inquiryList = ref([])
const reservationList = ref([])
const contextIndex = ref(0)

const variableGroups = [
  {
    title: 'Alojamiento',
    items: [
      { label: 'Nombre', token: 'nombre_alojamiento' },
      { label: 'Telefono', token: 'telefono' },
      { label: 'Ubicacion', token: 'ubicacion' },
      { label: 'Descripcion', token: 'descripcion_alojamiento' },
    ],
  },
  {
    title: 'Huesped',
    items: [
      { label: 'Nombre huesped', token: 'nombre_huesped' },
      { label: 'Telefono huesped', token: 'telefono_huesped' },
    ],
  },
  {
    title: 'Reserva / Consulta',
    items: [
      { label: 'Fechas', token: 'fechas' },
      { label: 'Noches', token: 'noches' },
      { label: 'Personas', token: 'personas' },
      { label: 'Codigo', token: 'codigo_referencia' },
      { label: 'Precio', token: 'precio_noche' },
      { label: 'Vigencia', token: 'fecha_vigencia' },
    ],
  },
]

const emojiGroups = [
  {
    title: 'Saludos y cortesía',
    emojis: ['👋', '😊', '🙏', '✨', '🌟', '💫', '😄', '🤗', '😍', '🥰', '💝', '🎊'],
  },
  {
    title: 'Confirmación y positivo',
    emojis: ['✅', '🎉', '👍', '💯', '🔑', '🏆', '🥳', '🎁', '👏', '💪', '🌈', '⭐'],
  },
  {
    title: 'Información y datos',
    emojis: ['📋', '📅', '📍', '💰', '🏠', '📞', '📱', '💬', '📝', '🗓️', '🔐', '📎'],
  },
  {
    title: 'Viajes y alojamiento',
    emojis: ['🏡', '🛏️', '🛁', '🏊', '🌴', '🌊', '🏖️', '🗺️', '🧳', '✈️', '🚗', '🌅'],
  },
  {
    title: 'Comida y servicios',
    emojis: ['☕', '🍽️', '🥂', '🍾', '🧹', '🔧', '🛒️', '🌿', '🕯️', '🎶', '🌙', '🌞'],
  },
  {
    title: 'Alertas y recordatorios',
    emojis: ['⚠️', '⏰', '📌', '🔔', '❗', '❓', '🔴', '🟡', '🟢', '📣', '🚨', '💡'],
  },
  {
    title: 'Corazones y sentimientos',
    emojis: ['❤️', '🧡', '📛', '💚', '💙', '💜', '🖤', '🤍', '💕', '💞', '💓', '💗'],
  },
]

const isSystemMessage = computed(() => message.value?.type === 'system')
const isQuotationMessage = computed(() => message.value?.key === 'quotation')

const activeContextList = computed(() =>
  isQuotationMessage.value ? inquiryList.value : reservationList.value
)

const activeRecord = computed(() => {
  if (activeContextList.value.length === 0) return null
  return activeContextList.value[contextIndex.value] ?? null
})

const usingMock = computed(() => activeContextList.value.length === 0)
const canPrev = computed(() => !usingMock.value && contextIndex.value > 0)
const canNext = computed(() => !usingMock.value && contextIndex.value < activeContextList.value.length - 1)

const prevContext = () => { if (canPrev.value) contextIndex.value -= 1 }
const nextContext = () => { if (canNext.value) contextIndex.value += 1 }

const moneyFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

const longDateFormatter = new Intl.DateTimeFormat('es-CO', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

const toDate = (value) => {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

const formatDateRange = (checkIn, checkOut, fallback = '-') => {
  const start = toDate(checkIn)
  const end = toDate(checkOut)
  if (!start || !end) return fallback
  return `${longDateFormatter.format(start)} al ${longDateFormatter.format(end)}`
}

const diffNights = (checkIn, checkOut) => {
  const start = toDate(checkIn)
  const end = toDate(checkOut)
  if (!start || !end) return 0
  const diff = (end.getTime() - start.getTime()) / 86400000
  return diff > 0 ? Math.ceil(diff) : 0
}

const contextInfo = computed(() => {
  if (usingMock.value) {
    return isQuotationMessage.value
      ? { guestName: 'Maria Garcia', dates: '15 al 20 de abril', reference: 'INQ-202604-0001', isMock: true }
      : { guestName: 'Carlos Suarez', dates: '10 al 15 de mayo', reference: 'RES-202605-0012', isMock: true }
  }
  const record = activeRecord.value
  if (!record) return { guestName: '-', dates: '-', reference: '-', isMock: false }
  return {
    guestName: record.guest_name || '-',
    dates: formatDateRange(record.check_in, record.check_out),
    reference: record.reference_code || record.reservation_number || '-',
    isMock: false,
  }
})

const quoteContext = computed(() => {
  const inquiry = activeRecord.value
  if (inquiry) {
    return {
      nombre_huesped: inquiry.guest_name || '-',
      telefono_huesped: inquiry.guest_phone || '-',
      fechas: formatDateRange(inquiry.check_in, inquiry.check_out),
      noches: diffNights(inquiry.check_in, inquiry.check_out),
      personas: Number(inquiry.adults || 0) + Number(inquiry.children || 0),
      codigo_referencia: inquiry.reference_code || 'INQ-0000',
      precio_noche: moneyFormatter.format(Number(inquiry.price_per_night || 0)),
      fecha_vigencia: inquiry.quote_expires_at ? longDateFormatter.format(new Date(inquiry.quote_expires_at)) : '-',
    }
  }

  return {
    nombre_huesped: 'Maria Garcia',
    telefono_huesped: '-',
    fechas: '15 al 20 de abril',
    noches: 5,
    personas: 3,
    codigo_referencia: 'INQ-202604-0001',
    precio_noche: '$210,000',
    fecha_vigencia: '20 de abril de 2026',
  }
})

const reservationContext = computed(() => {
  const reservation = activeRecord.value
  if (reservation) {
    return {
      nombre_huesped: reservation.guest_name || '-',
      telefono_huesped: reservation.guest_phone || '-',
      fechas: formatDateRange(reservation.check_in, reservation.check_out),
      noches: diffNights(reservation.check_in, reservation.check_out),
      personas: Number(reservation.adults || 0) + Number(reservation.children || 0),
      codigo_referencia: reservation.reference_code || reservation.reservation_number || 'RES-0000',
      precio_noche: moneyFormatter.format(Number(reservation.price_per_night || 0)),
      fecha_vigencia: '-',
    }
  }

  return {
    nombre_huesped: 'Carlos Suarez',
    telefono_huesped: '-',
    fechas: '10 al 15 de mayo',
    noches: 5,
    personas: 4,
    codigo_referencia: 'RES-202605-0012',
    precio_noche: '$250,000',
    fecha_vigencia: '-',
  }
})

const buildSystemTemplateFromSettings = (key, settings) => {
  if (!settings || (key !== 'quotation' && key !== 'voucher')) return ''

  if (key === 'quotation') {
    return [
      String(settings.quotation_greeting || '').trim(),
      String(settings.quotation_intro || '').trim(),
      String(settings.quotation_closing || '').trim(),
      String(settings.quotation_signature || '').trim(),
    ].filter(Boolean).join('\n\n')
  }

  return [
    String(settings.voucher_greeting || '').trim(),
    String(settings.voucher_intro || '').trim(),
    String(settings.voucher_closing || '').trim(),
    String(settings.voucher_signature || '').trim(),
  ].filter(Boolean).join('\n\n')
}

const previewVariables = computed(() => {
  const context = isQuotationMessage.value ? quoteContext.value : reservationContext.value
  const record = activeRecord.value

  const globalVars = buildGlobalVariables({
    profile: profile.value,
    accountSettings: accountSettings.value,
    context: {
      guest_name: context.nombre_huesped,
      check_in: record?.check_in,
      check_out: record?.check_out,
      nights: context.noches,
      personas: context.personas,
      reference: context.codigo_referencia,
      total: isQuotationMessage.value
        ? Number(record?.price_per_night || 0) * Number(context.noches || 0)
        : Number(record?.total_amount || 0),
      paid: Number(record?.paid_amount || 0),
      balance: Math.max(0, Number(record?.total_amount || 0) - Number(record?.paid_amount || 0)),
    },
  })

  return {
    ...globalVars,
    ...context,
  }
})

const renderedPreview = computed(() => resolveTemplate(body.value, previewVariables.value))

const goBack = () => {
  router.push('/mensajes')
}

const syncCursor = () => {
  const node = textareaRef.value
  if (!node) return
  selectionStart.value = node.selectionStart ?? 0
  selectionEnd.value = node.selectionEnd ?? selectionStart.value
}

const insertText = async (text, closeDrawer = false) => {
  if (viewMode.value !== 'raw') {
    viewMode.value = 'raw'
    await nextTick()
  }

  const node = textareaRef.value

  if (!node) {
    body.value = `${body.value}${text}`
    if (closeDrawer) showDrawer.value = false
    return
  }

  const start = node.selectionStart ?? selectionStart.value
  const end = node.selectionEnd ?? selectionEnd.value

  body.value = `${body.value.slice(0, start)}${text}${body.value.slice(end)}`

  await nextTick()
  const nextPos = start + text.length
  node.focus()
  node.setSelectionRange(nextPos, nextPos)
  selectionStart.value = nextPos
  selectionEnd.value = nextPos

  if (closeDrawer) showDrawer.value = false
}

const insertVariable = (token, closeDrawer = false) => insertText(`{{${token}}}`, closeDrawer)

const saveMessage = async () => {
  if (!message.value) return

  saving.value = true
  try {
    const accountId = accountStore.getRequiredAccountId()

    const trimmedBody = String(body.value || '').trim()

    if (trimmedBody || message.value.type !== 'system') {
      await savePredefinedMessage(accountId, {
        id: message.value.id,
        name: message.value.name,
        body: body.value,
        type: message.value.type,
        key: message.value.key,
        sort_order: message.value.sort_order,
      })
    }

    if (isSystemMessage.value) {
      systemForm.value = await saveMessageSettings(accountId, {
        ...systemForm.value,
        show_unit_count: Boolean(systemForm.value.show_unit_count),
        show_unit_name: Boolean(systemForm.value.show_unit_name),
        show_unit_description: Boolean(systemForm.value.show_unit_description),
      })
    }

    toast.success('Mensaje guardado.')
  } catch (err) {
    toast.error(err.message || 'No se pudo guardar el mensaje.')
  } finally {
    saving.value = false
  }
}

const loadData = async () => {
  if (!can('settings', 'edit')) {
    loading.value = false
    return
  }

  loading.value = true
  try {
    const accountId = accountStore.getRequiredAccountId()
    const messageId = String(route.params.id || '')

    const [
      { data: row, error: messageError },
      { data: profileData, error: profileError },
      { data: settingsData, error: settingsError },
      { data: inquiriesData, error: inquiryError },
      { data: reservationsData, error: reservationError },
      messageSettings,
    ] = await Promise.all([
      supabase
        .from('predefined_messages')
        .select('*')
        .eq('account_id', accountId)
        .eq('id', messageId)
        .maybeSingle(),
      supabase
        .from('account_profile')
        .select('*')
        .eq('account_id', accountId)
        .maybeSingle(),
      supabase
        .from('settings')
        .select('property_name, price_general_min, voucher_conditions')
        .eq('account_id', accountId)
        .maybeSingle(),
      supabase
        .from('inquiries')
        .select('id, guest_name, guest_phone, check_in, check_out, adults, children, reference_code, price_per_night, quote_expires_at, created_at')
        .eq('account_id', accountId)
        .order('created_at', { ascending: false })
        .limit(10),
      supabase
        .from('reservations')
        .select('id, guest_name, guest_phone, check_in, check_out, adults, children, reference_code, reservation_number, price_per_night, total_amount, paid_amount, created_at')
        .eq('account_id', accountId)
        .order('created_at', { ascending: false })
        .limit(10),
      getMessageSettings(accountId),
    ])

    if (messageError) throw messageError
    if (profileError) throw profileError
    if (settingsError) throw settingsError
    if (inquiryError) throw inquiryError
    if (reservationError) throw reservationError

    message.value = row || null
    profile.value = profileData || {}
    accountSettings.value = settingsData || {}
    inquiryList.value = inquiriesData || []
    reservationList.value = reservationsData || []
    contextIndex.value = 0
    systemForm.value = { ...DEFAULT_MESSAGE_SETTINGS, ...messageSettings }

    const persistedBody = String(row?.body || '')
    if (persistedBody.trim()) {
      body.value = persistedBody
    } else if (row?.type === 'system') {
      body.value = buildSystemTemplateFromSettings(row.key, systemForm.value)
    } else {
      body.value = ''
    }
  } catch (err) {
    toast.error(err.message || 'No se pudo cargar el editor de mensajes.')
  } finally {
    loading.value = false
  }
}

onMounted(loadData)
</script>
