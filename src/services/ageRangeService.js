import { supabase } from './supabase'

const DEFAULT_SETTINGS = {
  minors_active: true,
  minors_min_age: 10,
  minors_price_pct: 80,
  children_active: true,
  children_min_age: 2,
  children_max_age: 9,
  children_price_pct: 60,
  infants_active: true,
  infants_max_age: 2,
  infants_price_pct: 0,
}

export async function getAgeCategorySettings(accountId) {
  const { data, error } = await supabase
    .from('age_category_settings')
    .select('*')
    .eq('account_id', accountId)
    .maybeSingle()

  if (error) throw error
  return data ? { ...DEFAULT_SETTINGS, ...data } : { ...DEFAULT_SETTINGS, account_id: accountId }
}

export async function saveAgeCategorySettings(accountId, settings) {
  const payload = {
    account_id: accountId,
    minors_active: settings.minors_active,
    minors_min_age: Number(settings.minors_min_age),
    minors_price_pct: Number(settings.minors_price_pct),
    children_active: settings.children_active,
    children_min_age: Number(settings.children_min_age),
    children_max_age: Number(settings.children_max_age),
    children_price_pct: Number(settings.children_price_pct),
    infants_active: settings.infants_active,
    infants_max_age: Number(settings.infants_max_age),
    infants_price_pct: Number(settings.infants_price_pct),
    updated_at: new Date().toISOString(),
  }

  const { error } = await supabase
    .from('age_category_settings')
    .upsert(payload, { onConflict: 'account_id' })

  if (error) throw error
}

export function getAgeRangeLabels(settings) {
  const s = { ...DEFAULT_SETTINGS, ...settings }
  return {
    minors: `Menores (${s.minors_min_age} a 17 años)`,
    children: `Niños (${s.children_min_age} a ${s.children_max_age} años)`,
    infants: `Bebés (0 a ${s.infants_max_age} años)`,
  }
}
