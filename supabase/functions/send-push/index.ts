import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import webpush from 'npm:web-push'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ------------------------------------------------------------
// Tipos
// ------------------------------------------------------------
type PushPayload = {
  account_id: string
  type: string
  title: string
  message: string | null
  related_type: string | null
  related_id: string | null
  notification_id?: string
}

type PushSubscription = {
  id: string
  endpoint: string
  p256dh: string
  auth: string
}

// Configuración por defecto (espejo de DEFAULT_NOTIFICATION_SETTINGS en el cliente)
const DEFAULT_ENABLED_TYPES = new Set([
  'nueva_consulta', 'nueva_reserva', 'reserva_cancelada',
  'inquiry_expiring_soon', 'inquiry_no_activity',
  'preregistro_completado', 'preregistro_pending',
  'checkin_del_dia', 'checkin_realizado',
  'checkout_del_dia', 'checkout_vencido',
  'anticipo_registrado', 'balance_pending', 'reservation_no_payment',
])

serve(async (req: Request) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // ------------------------------------------------------------
  // Variables de entorno VAPID (configuradas en Supabase Secrets)
  // Generar una sola vez con: npx web-push generate-vapid-keys
  // ------------------------------------------------------------
  const VAPID_PUBLIC_KEY  = Deno.env.get('VAPID_PUBLIC_KEY')
  const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')
  const VAPID_SUBJECT     = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:soporte@tekmi.app'

  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.error('[send-push] VAPID keys not configured')
    return new Response(JSON.stringify({ error: 'VAPID keys not configured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  let payload: PushPayload
  try {
    payload = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const { account_id, type, title, message, related_type, related_id } = payload

  if (!account_id || !type || !title) {
    return new Response(JSON.stringify({ error: 'Missing required fields: account_id, type, title' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // ------------------------------------------------------------
  // Supabase admin client (acceso sin RLS para leer settings/subs)
  // SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son automáticos en Edge Functions
  // ------------------------------------------------------------
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  // ------------------------------------------------------------
  // 1. Verificar que el tipo de notificación está habilitado
  //    en la configuración de la cuenta
  // ------------------------------------------------------------
  const { data: settingsRow } = await supabase
    .from('notification_settings')
    .select('settings')
    .eq('account_id', account_id)
    .maybeSingle()

  const accountSettings: Record<string, { enabled?: boolean }> = settingsRow?.settings ?? {}

  // Usar settings de la cuenta si existe la fila; sino usar defaults
  const typeEnabled = type in accountSettings
    ? accountSettings[type]?.enabled !== false
    : DEFAULT_ENABLED_TYPES.has(type)

  if (!typeEnabled) {
    return new Response(JSON.stringify({ skipped: true, reason: 'type disabled in settings' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // ------------------------------------------------------------
  // 2. Obtener suscripciones push activas de la cuenta
  // ------------------------------------------------------------
  const { data: subscriptions, error: subsError } = await supabase
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .eq('account_id', account_id)

  if (subsError) {
    console.error('[send-push] Error fetching subscriptions:', subsError.message)
    return new Response(JSON.stringify({ error: 'Failed to fetch subscriptions' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  if (!subscriptions || subscriptions.length === 0) {
    return new Response(JSON.stringify({ sent: 0, failed: 0, reason: 'no subscriptions' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // ------------------------------------------------------------
  // 3. Configurar VAPID y enviar a cada suscripción
  // ------------------------------------------------------------
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)

  const notificationPayload = JSON.stringify({
    title,
    body: message ?? '',
    icon: '/icons/pwa-192.png',
    badge: '/icons/pwa-192.png',
    data: { related_type, related_id },
  })

  const staleSubscriptionIds: string[] = []
  let sent = 0
  let failed = 0

  const results = await Promise.allSettled(
    (subscriptions as PushSubscription[]).map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          notificationPayload,
        )
        sent++
      } catch (err: unknown) {
        const e = err as { statusCode?: number; message?: string }
        // ------------------------------------------------------------
        // 4. Error 410 (Gone) = dispositivo ya no está suscrito.
        //    Marcar para limpieza automática.
        // ------------------------------------------------------------
        if (e?.statusCode === 410) {
          console.info(`[send-push] Subscription gone (410), marking for removal: ${sub.id}`)
          staleSubscriptionIds.push(sub.id)
        } else {
          console.warn(`[send-push] Failed to send to ${sub.id}: ${e?.statusCode} ${e?.message}`)
        }
        failed++
      }
    })
  )

  // ------------------------------------------------------------
  // 5. Limpiar suscripciones obsoletas (410)
  // ------------------------------------------------------------
  if (staleSubscriptionIds.length > 0) {
    const { error: deleteError } = await supabase
      .from('push_subscriptions')
      .delete()
      .in('id', staleSubscriptionIds)

    if (deleteError) {
      console.warn('[send-push] Failed to delete stale subscriptions:', deleteError.message)
    } else {
      console.info(`[send-push] Removed ${staleSubscriptionIds.length} stale subscription(s)`)
    }
  }

  console.info(`[send-push] Done — sent: ${sent}, failed: ${failed}`)

  return new Response(JSON.stringify({ sent, failed }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
