import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { createHash, randomBytes } from 'node:crypto'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (req.method !== 'POST') {
      return Response.json({ message: 'Metodo no permitido.' }, { status: 405, headers: corsHeaders })
    }

    const authorization = req.headers.get('Authorization') || ''
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') || ''
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authorization } },
    })

    const {
      data: { user },
      error: authError,
    } = await authClient.auth.getUser()

    if (authError || !user) {
      return Response.json({ message: 'No autorizado.' }, { status: 401, headers: corsHeaders })
    }

    const body = await req.json()
    const reservationId = body?.reservation_id

    if (!reservationId || typeof reservationId !== 'string') {
      return Response.json({ message: 'reservation_id es obligatorio.' }, { status: 400, headers: corsHeaders })
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey)

    const { data: reservation, error: reservationError } = await adminClient
      .from('reservations')
      .select('id, account_id, check_in, check_out, adults, children, preregistro_completado, preregistro_token_raw')
      .eq('id', reservationId)
      .maybeSingle()

    if (reservationError || !reservation) {
      return Response.json({ message: 'Reserva no encontrada.' }, { status: 404, headers: corsHeaders })
    }

    const { data: membership, error: membershipError } = await adminClient
      .from('account_users')
      .select('account_id')
      .eq('user_id', user.id)
      .eq('account_id', reservation.account_id)
      .maybeSingle()

    if (membershipError || !membership) {
      return Response.json({ message: 'No autorizado para esta reserva.' }, { status: 403, headers: corsHeaders })
    }

    // Calcular expiración: fin del día después del check_out
    const expiryDate = new Date(reservation.check_out)
    expiryDate.setUTCDate(expiryDate.getUTCDate() + 1)
    expiryDate.setUTCHours(23, 59, 59, 999)
    const tokenExpiry = expiryDate.toISOString()

    // Idempotente: si ya existe un raw token, reusar pero actualizar expiración
    // Si se llama intencionalmente para regenerar, se genera uno nuevo
    const forceRegenerate = Boolean(body?.regenerate)
    let rawToken: string

    if (reservation.preregistro_token_raw && !forceRegenerate) {
      rawToken = reservation.preregistro_token_raw
      // Actualizar solo la expiración (puede haber cambiado el check_out)
      await adminClient
        .from('reservations')
        .update({ preregistro_token_expiry: tokenExpiry })
        .eq('account_id', reservation.account_id)
        .eq('id', reservation.id)
    } else {
      rawToken = randomBytes(32).toString('hex')
      const hashedToken = createHash('sha256').update(rawToken).digest('hex')

      const { error: updateError } = await adminClient
        .from('reservations')
        .update({
          preregistro_token: hashedToken,
          preregistro_token_raw: rawToken,
          preregistro_token_expiry: tokenExpiry,
        })
        .eq('account_id', reservation.account_id)
        .eq('id', reservation.id)

      if (updateError) {
        return Response.json({ message: updateError.message }, { status: 400, headers: corsHeaders })
      }
    }

    return Response.json(
      { checkin_url: `/prerregistro/${rawToken}` },
      { headers: corsHeaders }
    )
  } catch (error) {
    return Response.json(
      { message: error instanceof Error ? error.message : 'Error inesperado.' },
      { status: 500, headers: corsHeaders }
    )
  }
})
