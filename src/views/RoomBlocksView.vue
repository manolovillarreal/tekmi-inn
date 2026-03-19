<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-3xl font-semibold tracking-tight text-gray-900">Bloqueos</h1>
      <button v-if="can('occupancies', 'create')" class="btn-primary" @click="openCreateModal">+ Nuevo bloqueo</button>
    </div>

    <div class="card !py-4 flex flex-wrap items-center gap-4 bg-white">
      <select v-model="selectedVenueId" class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm md:w-72">
        <option value="">Todas las sedes</option>
        <option v-for="venue in venues" :key="venue.id" :value="venue.id">{{ venue.name }}</option>
      </select>

      <input
        v-model="searchText"
        type="text"
        placeholder="Buscar por unidad o motivo..."
        class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm md:w-80"
      >

      <button v-if="searchText || selectedVenueId" class="text-sm font-medium text-gray-500 underline" @click="clearFilters">Limpiar filtros</button>
    </div>

    <div class="card overflow-hidden !p-0">
      <div class="overflow-x-auto">
        <table class="w-full border-collapse text-left text-sm">
          <thead class="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th class="px-6 py-4">Unidad</th>
              <th class="px-6 py-4">Sede</th>
              <th class="px-6 py-4">Fechas</th>
              <th class="px-6 py-4">Tipo</th>
              <th class="px-6 py-4">Motivo</th>
              <th class="px-6 py-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <tr v-if="store.loading">
              <td colspan="6" class="px-6 py-10 text-center text-gray-400">Cargando bloqueos...</td>
            </tr>
            <tr v-else-if="filteredBlocks.length === 0">
              <td colspan="6" class="px-6 py-10 text-center text-gray-500 italic">No hay bloqueos para mostrar.</td>
            </tr>
            <tr v-for="block in filteredBlocks" :key="block.id" class="hover:bg-gray-50">
              <td class="px-6 py-4 font-medium text-gray-900">{{ block.units?.name || '-' }}</td>
              <td class="px-6 py-4 text-gray-700">{{ block.units?.venues?.name || '-' }}</td>
              <td class="px-6 py-4 text-gray-700">
                <span class="block">{{ formatDate(block.start_date) }}</span>
                <span class="block text-xs text-gray-500">hasta {{ formatDate(block.end_date) }}</span>
              </td>
              <td class="px-6 py-4 text-gray-700">{{ formatOccupancyType(block.occupancy_type) }}</td>
              <td class="px-6 py-4 text-gray-700">{{ block.reason || '-' }}</td>
              <td class="px-6 py-4 text-right">
                <div class="inline-flex items-center gap-3" v-if="can('occupancies', 'edit') || can('occupancies', 'delete')">
                  <button v-if="can('occupancies', 'edit')" class="text-sm font-medium text-primary hover:text-primary-dark" @click="openEditModal(block)">Editar</button>
                  <button v-if="can('occupancies', 'delete')" class="text-sm font-medium text-red-600 hover:text-red-800" @click="openDeleteModal(block)">Eliminar</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <BaseModal :isOpen="showModal" :title="editingBlock ? 'Editar bloqueo' : 'Nuevo bloqueo'" @close="closeModal">
      <form class="space-y-5" @submit.prevent="submitForm">
        <AppFormSection title="Detalles del bloqueo" :divider="false">
          <AppSelect
            v-model="form.unit_id"
            label="Unidad"
            :options="unitOptions"
            placeholder="Seleccionar unidad"
            required
          />

          <AppSelect
            v-model="form.occupancy_type"
            label="Tipo de bloqueo"
            :options="blockTypeOptions"
            required
          />

          <AppFormGrid :columns="2">
            <AppDatePicker v-model="form.start_date" label="Fecha inicio" />
            <AppDatePicker v-model="form.end_date" label="Fecha fin" />
          </AppFormGrid>

          <p v-if="blockedDays > 0" class="text-sm text-[#6B7280]">{{ blockedDays }} días bloqueados</p>

          <AppTextarea v-model="form.notes" label="Notas o motivo" :rows="2" :autoResize="true" hint="Opcional" />
        </AppFormSection>

        <AppInlineAlert v-if="formError" type="error" :message="formError" />

        <AppFormActions
          :submit-label="editingBlock ? 'Actualizar bloqueo' : 'Guardar bloqueo'"
          cancel-label="Cancelar"
          :loading="submitting"
          :submit-disabled="submitting"
          @submit="submitForm"
          @cancel="closeModal"
        />
      </form>
    </BaseModal>

    <ConfirmActionModal
      :isOpen="showDeleteModal"
      title="Eliminar bloqueo"
      :message="`¿Deseas eliminar el bloqueo de ${blockToDelete?.units?.name || 'esta unidad'}?`"
      confirmLabel="Eliminar"
      :loading="deleting"
      :errorMessage="deleteError"
      @close="closeDeleteModal"
      @confirm="confirmDelete"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '../services/supabase'
import BaseModal from '../components/ui/BaseModal.vue'
import ConfirmActionModal from '../components/ui/ConfirmActionModal.vue'
import { useRoomBlocksStore } from '../stores/roomBlocks'
import { usePermissions } from '../composables/usePermissions'
import { useAccountStore } from '../stores/account'
import { useToast } from '../composables/useToast'
import {
  AppSelect,
  AppDatePicker,
  AppTextarea,
  AppFormSection,
  AppFormGrid,
  AppFormActions,
  AppInlineAlert
} from '@/components/ui/forms'

const route = useRoute()
const router = useRouter()
const store = useRoomBlocksStore()
const { can } = usePermissions()
const accountStore = useAccountStore()
const toast = useToast()

const venues = ref([])
const units = ref([])
const selectedVenueId = ref('')
const searchText = ref('')

const showModal = ref(false)
const editingBlock = ref(null)
const submitting = ref(false)
const formError = ref('')
const form = ref({
  unit_id: '',
  start_date: '',
  end_date: '',
  occupancy_type: 'maintenance',
  reason: '',
  notes: ''
})

const blockTypeOptions = [
  { value: 'maintenance', label: 'Mantenimiento' },
  { value: 'owner_use', label: 'Uso del propietario' },
  { value: 'inquiry_hold', label: 'Hold de consulta' },
  { value: 'external', label: 'Externo' },
]

const unitOptions = computed(() => {
  return units.value.map((unit) => ({
    value: unit.id,
    label: `${unit.name} - ${venueNameById(unit.venue_id)}`
  }))
})

const blockedDays = computed(() => {
  if (!form.value.start_date || !form.value.end_date) return 0
  const from = new Date(form.value.start_date)
  const to = new Date(form.value.end_date)
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return 0
  const diff = Math.ceil((to - from) / (1000 * 60 * 60 * 24))
  return diff > 0 ? diff : 0
})

const showDeleteModal = ref(false)
const blockToDelete = ref(null)
const deleting = ref(false)
const deleteError = ref('')

onMounted(async () => {
  await Promise.all([fetchMasterData(), store.fetchRoomBlocks()])
  openEditModalFromRoute(route.params.id)
})

const fetchMasterData = async () => {
  const accountId = accountStore.getRequiredAccountId()
  const [{ data: venuesData }, { data: unitsData }] = await Promise.all([
    supabase.from('venues').select('id, name').eq('account_id', accountId).order('name', { ascending: true }),
    supabase.from('units').select('id, name, venue_id').eq('account_id', accountId).eq('is_active', true).order('name', { ascending: true })
  ])

  venues.value = venuesData || []
  units.value = unitsData || []
}

const venueNameById = (venueId) => {
  return venues.value.find(venue => venue.id === venueId)?.name || 'Sin sede'
}

const filteredBlocks = computed(() => {
  const q = searchText.value.trim().toLowerCase()

  return store.roomBlocks.filter(block => {
    if (selectedVenueId.value && block.units?.venue_id !== selectedVenueId.value) return false

    if (q) {
      const haystack = `${block.units?.name || ''} ${block.reason || ''} ${block.notes || ''}`.toLowerCase()
      if (!haystack.includes(q)) return false
    }

    return true
  })
})

const clearFilters = () => {
  selectedVenueId.value = ''
  searchText.value = ''
}

const formatDate = (value) => {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' })
}

const formatOccupancyType = (type) => {
  return {
    maintenance: 'Mantenimiento',
    owner_use: 'Uso propietario',
    inquiry_hold: 'Hold consulta',
    external: 'Externo'
  }[type] || type
}

const openCreateModal = () => {
  editingBlock.value = null
  formError.value = ''
  form.value = {
    unit_id: '',
    start_date: '',
    end_date: '',
    occupancy_type: 'maintenance',
    reason: '',
    notes: ''
  }
  showModal.value = true
}

const openEditModal = (block) => {
  editingBlock.value = block
  formError.value = ''
  form.value = {
    unit_id: block.unit_id,
    start_date: block.start_date,
    end_date: block.end_date,
    occupancy_type: block.occupancy_type || 'maintenance',
    reason: block.reason || '',
    notes: block.notes || ''
  }
  showModal.value = true
}

const openEditModalFromRoute = (blockId) => {
  if (!blockId) return

  const block = store.roomBlocks.find(item => item.id === blockId)
  if (!block) {
    toast.error('No se encontró el bloqueo solicitado.')
    return
  }

  openEditModal(block)
}

const closeModal = () => {
  if (submitting.value) return
  showModal.value = false

  if (route.params.id) {
    router.replace({ name: 'bloqueos' })
  }
}

const submitForm = async () => {
  submitting.value = true
  formError.value = ''

  try {
    if (new Date(form.value.start_date) >= new Date(form.value.end_date)) {
      throw new Error('La fecha de fin debe ser posterior a la fecha de inicio.')
    }

    if (editingBlock.value) {
      await store.updateRoomBlock(editingBlock.value.id, form.value)
      toast.success('Bloqueo actualizado correctamente.')
    } else {
      await store.createRoomBlock(form.value)
      toast.success('Bloqueo creado correctamente.')
    }

    showModal.value = false

    if (route.params.id) {
      router.replace({ name: 'bloqueos' })
    }
  } catch (err) {
    formError.value = err.message
  } finally {
    submitting.value = false
  }
}

const openDeleteModal = (block) => {
  blockToDelete.value = block
  deleteError.value = ''
  showDeleteModal.value = true
}

const closeDeleteModal = () => {
  if (deleting.value) return
  showDeleteModal.value = false
}

const confirmDelete = async () => {
  if (!blockToDelete.value) return

  deleting.value = true
  deleteError.value = ''

  try {
    await store.deleteRoomBlock(blockToDelete.value.id)
    showDeleteModal.value = false
    toast.success('Bloqueo eliminado correctamente.')
  } catch (err) {
    deleteError.value = err.message
  } finally {
    deleting.value = false
  }
}

watch(
  () => route.params.id,
  (blockId) => {
    if (!store.roomBlocks.length) return
    openEditModalFromRoute(blockId)
  }
)

watch(
  () => store.roomBlocks,
  () => {
    if (route.params.id) {
      openEditModalFromRoute(route.params.id)
    }
  },
  { deep: true }
)
</script>
