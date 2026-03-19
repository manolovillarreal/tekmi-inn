<template>
  <div v-if="can('settings', 'edit')" class="space-y-6">
    <div class="flex items-center justify-between gap-3">
      <div>
        <h1 class="text-3xl font-semibold tracking-tight text-gray-900">Perfil</h1>
        <p class="text-sm text-gray-500">Configura la informacion comercial y de contacto de tu cuenta.</p>
      </div>
      <RouterLink to="/configuracion" class="btn-secondary text-sm">Volver a configuracion</RouterLink>
    </div>

    <div class="card">
      <form class="space-y-6" @submit.prevent="saveProfile">
        <section class="space-y-3">
          <h3 class="text-sm font-semibold uppercase tracking-wide text-gray-700">Informacion comercial</h3>
          <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label class="text-sm text-gray-700">
              Nombre comercial
              <input v-model="profileForm.commercial_name" type="text" class="mt-1 block w-full rounded-md border-gray-300 text-sm">
            </label>
            <label class="text-sm text-gray-700">
              Razon social
              <input v-model="profileForm.legal_name" type="text" class="mt-1 block w-full rounded-md border-gray-300 text-sm">
            </label>
            <label class="text-sm text-gray-700 md:col-span-1">
              NIT
              <input
                v-model="profileForm.nit"
                type="text"
                inputmode="numeric"
                class="mt-1 block w-full rounded-md border-gray-300 text-sm"
                placeholder="900123456"
                @input="onNitInput"
              >
            </label>
            <div class="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
              <p><span class="font-medium text-gray-900">Digito de verificacion:</span> {{ nitDigitPreview ?? '-' }}</p>
              <p class="mt-1"><span class="font-medium text-gray-900">Vista previa:</span> {{ nitFormattedPreview || '-' }}</p>
            </div>
            <label class="text-sm text-gray-700 md:col-span-2">
              Slogan
              <input v-model="profileForm.slogan" type="text" class="mt-1 block w-full rounded-md border-gray-300 text-sm">
            </label>
          </div>
        </section>

        <section class="space-y-3">
          <h3 class="text-sm font-semibold uppercase tracking-wide text-gray-700">Contacto</h3>
          <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
            <label class="text-sm text-gray-700">
              Telefono
              <input v-model="profileForm.phone" type="text" class="mt-1 block w-full rounded-md border-gray-300 text-sm">
            </label>
            <label class="text-sm text-gray-700">
              Email
              <input v-model="profileForm.email" type="email" class="mt-1 block w-full rounded-md border-gray-300 text-sm">
            </label>
            <label class="text-sm text-gray-700">
              Website
              <input v-model="profileForm.website" type="text" class="mt-1 block w-full rounded-md border-gray-300 text-sm" placeholder="https://...">
            </label>
          </div>
        </section>

        <section class="space-y-3">
          <h3 class="text-sm font-semibold uppercase tracking-wide text-gray-700">Ubicacion</h3>
          <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label class="text-sm text-gray-700 md:col-span-2">
              Direccion
              <input v-model="profileForm.address" type="text" class="mt-1 block w-full rounded-md border-gray-300 text-sm">
            </label>
            <label class="text-sm text-gray-700">
              Ciudad
              <input v-model="profileForm.city" type="text" class="mt-1 block w-full rounded-md border-gray-300 text-sm">
            </label>
            <label class="text-sm text-gray-700">
              Departamento
              <input v-model="profileForm.department" type="text" class="mt-1 block w-full rounded-md border-gray-300 text-sm">
            </label>
            <label class="text-sm text-gray-700 md:col-span-2">
              Pais
              <input v-model="profileForm.country" type="text" class="mt-1 block w-full rounded-md border-gray-300 text-sm">
            </label>
          </div>
        </section>

        <section class="space-y-3">
          <h3 class="text-sm font-semibold uppercase tracking-wide text-gray-700">Logo</h3>
          <div class="flex flex-wrap items-start gap-4 rounded-md border border-gray-200 bg-gray-50 p-3">
            <div class="h-24 w-24 overflow-hidden rounded-md border border-gray-200 bg-white">
              <img
                v-if="logoPreviewUrl"
                :src="logoPreviewUrl"
                alt="Logo cuenta"
                class="h-full w-full object-contain"
              >
              <div v-else class="flex h-full items-center justify-center text-xs text-gray-400">Sin logo</div>
            </div>
            <div class="space-y-2">
              <input
                ref="logoInputRef"
                type="file"
                accept="image/png,image/jpeg,image/svg+xml,image/webp"
                class="hidden"
                @change="onLogoSelected"
              >
              <button type="button" class="btn-secondary text-sm" @click="openLogoPicker">Cambiar logo</button>
              <p class="text-xs text-gray-500">Maximo 2MB. Formatos: PNG, JPG, JPEG, SVG, WEBP.</p>
            </div>
          </div>
        </section>

        <section class="space-y-2 rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
          <p><span class="font-semibold">Tu prefijo de referencia:</span> {{ profilePrefix }}</p>
          <p><span class="font-semibold">Ejemplo de codigo:</span> {{ sampleReferenceCode }}</p>
        </section>

        <div class="flex justify-end">
          <button class="btn-primary" type="submit" :disabled="savingProfile || loadingProfile">
            {{ savingProfile ? 'Guardando...' : loadingProfile ? 'Cargando...' : 'Guardar perfil' }}
          </button>
        </div>
      </form>
    </div>
  </div>

  <div v-else class="card border-amber-200 bg-amber-50/40">
    <h2 class="text-sm font-semibold uppercase tracking-wide text-amber-900">Sin acceso</h2>
    <p class="mt-2 text-sm text-amber-800">No tienes permisos para editar el perfil.</p>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { supabase } from '../services/supabase'
import { useAccountStore } from '../stores/account'
import { usePermissions } from '../composables/usePermissions'
import { useToast } from '../composables/useToast'
import { calculateNitDigit, formatNit } from '../utils/nitUtils'
import { generateReferenceCode } from '../utils/referenceUtils'

const accountStore = useAccountStore()
const { can } = usePermissions()
const toast = useToast()

const loadingProfile = ref(false)
const savingProfile = ref(false)
const logoInputRef = ref(null)
const selectedLogoFile = ref(null)
const selectedLogoPreviewUrl = ref('')

const profileForm = ref({
  commercial_name: '',
  legal_name: '',
  nit: '',
  nit_digit: null,
  address: '',
  city: '',
  department: '',
  country: 'Colombia',
  phone: '',
  email: '',
  website: '',
  slogan: '',
  logo_url: '',
  reference_prefix: '',
})

const MAX_LOGO_BYTES = 2 * 1024 * 1024
const ALLOWED_LOGO_TYPES = new Set(['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'])

const sampleReferenceCode = ref('')

const profilePrefix = computed(() => {
  const raw = String(profileForm.value.reference_prefix || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')

  return raw || 'TEKM'
})

const nitDigitPreview = computed(() => {
  if (!profileForm.value.nit) return null
  return calculateNitDigit(profileForm.value.nit)
})

const nitFormattedPreview = computed(() => {
  if (!profileForm.value.nit) return ''
  return formatNit(profileForm.value.nit, nitDigitPreview.value)
})

const logoPreviewUrl = computed(() => selectedLogoPreviewUrl.value || profileForm.value.logo_url || '')

watch(
  () => profileForm.value.reference_prefix,
  () => {
    sampleReferenceCode.value = generateReferenceCode()
  },
  { immediate: true }
)

const setProfileForm = (data = {}) => {
  profileForm.value = {
    commercial_name: data.commercial_name || '',
    legal_name: data.legal_name || '',
    nit: String(data.nit || '').replace(/\D/g, ''),
    nit_digit: Number.isInteger(data.nit_digit) ? data.nit_digit : null,
    address: data.address || '',
    city: data.city || '',
    department: data.department || '',
    country: data.country || 'Colombia',
    phone: data.phone || '',
    email: data.email || '',
    website: data.website || '',
    slogan: data.slogan || '',
    logo_url: data.logo_url || '',
    reference_prefix: data.reference_prefix || '',
  }
}

const loadProfile = async () => {
  if (!can('settings', 'edit')) return

  loadingProfile.value = true
  try {
    const accountId = accountStore.getRequiredAccountId()
    const { data, error } = await supabase
      .from('account_profile')
      .select('*')
      .eq('account_id', accountId)
      .maybeSingle()

    if (error) throw error
    setProfileForm(data || {})
  } catch (err) {
    toast.error(err.message || 'No se pudo cargar el perfil de la cuenta.')
  } finally {
    loadingProfile.value = false
  }
}

const onNitInput = () => {
  profileForm.value.nit = String(profileForm.value.nit || '').replace(/\D/g, '')
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

  if (!ALLOWED_LOGO_TYPES.has(file.type)) {
    toast.error('Formato de logo no permitido. Usa PNG, JPG, JPEG, SVG o WEBP.')
    event.target.value = ''
    return
  }

  if (file.size > MAX_LOGO_BYTES) {
    toast.error('El logo supera 2MB. Selecciona un archivo mas liviano.')
    event.target.value = ''
    return
  }

  selectedLogoFile.value = file
  revokeSelectedLogoPreview()
  selectedLogoPreviewUrl.value = URL.createObjectURL(file)
}

const parseStoragePath = (url) => {
  if (!url) return ''
  const marker = '/object/public/account-assets/'
  const markerIndex = url.indexOf(marker)
  if (markerIndex === -1) return ''
  return decodeURIComponent(url.slice(markerIndex + marker.length))
}

const removePreviousLogo = async (accountId) => {
  const explicitPath = parseStoragePath(profileForm.value.logo_url)
  if (explicitPath) {
    await supabase.storage.from('account-assets').remove([explicitPath])
    return
  }

  const candidates = ['png', 'jpg', 'jpeg', 'svg', 'webp'].map((ext) => `accounts/${accountId}/logo.${ext}`)
  await supabase.storage.from('account-assets').remove(candidates)
}

const uploadLogoIfNeeded = async (accountId) => {
  if (!selectedLogoFile.value) return profileForm.value.logo_url || null

  const file = selectedLogoFile.value
  const extension = (file.name.split('.').pop() || 'png').toLowerCase()
  const storagePath = `accounts/${accountId}/logo.${extension}`

  await removePreviousLogo(accountId)

  const { error: uploadError } = await supabase.storage
    .from('account-assets')
    .upload(storagePath, file, { upsert: true, contentType: file.type })

  if (uploadError) throw uploadError

  const { data } = supabase.storage.from('account-assets').getPublicUrl(storagePath)
  return data?.publicUrl || null
}

const saveProfile = async () => {
  if (!can('settings', 'edit')) return

  savingProfile.value = true
  try {
    const accountId = accountStore.getRequiredAccountId()
    const nitValue = String(profileForm.value.nit || '').replace(/\D/g, '')
    const nitDigit = nitValue ? calculateNitDigit(nitValue) : null
    const logoUrl = await uploadLogoIfNeeded(accountId)

    const payload = {
      account_id: accountId,
      commercial_name: profileForm.value.commercial_name || null,
      legal_name: profileForm.value.legal_name || null,
      nit: nitValue || null,
      nit_digit: nitDigit,
      address: profileForm.value.address || null,
      city: profileForm.value.city || null,
      department: profileForm.value.department || null,
      country: profileForm.value.country || 'Colombia',
      phone: profileForm.value.phone || null,
      email: profileForm.value.email || null,
      website: profileForm.value.website || null,
      slogan: profileForm.value.slogan || null,
      logo_url: logoUrl,
      reference_prefix: profilePrefix.value,
    }

    const { error } = await supabase
      .from('account_profile')
      .upsert(payload, { onConflict: 'account_id' })

    if (error) throw error

    profileForm.value.logo_url = logoUrl || ''
    profileForm.value.nit_digit = nitDigit

    if (logoInputRef.value) logoInputRef.value.value = ''
    selectedLogoFile.value = null
    revokeSelectedLogoPreview()

    toast.success('Perfil actualizado correctamente.')
  } catch (err) {
    toast.error(err.message || 'No se pudo guardar el perfil.')
  } finally {
    savingProfile.value = false
  }
}

onBeforeUnmount(() => {
  revokeSelectedLogoPreview()
})

onMounted(loadProfile)
</script>
