export const config = {
  verify_jwt: false,
}

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { createHash, randomBytes } from 'node:crypto'

type GuestInput = {
  first_name?: string
  last_name?: string
  nationality?: string
  document_type?: 'CC' | 'CE' | 'PA' | 'PE' | 'PT' | 'DNI' | 'TI' | 'RC' | 'MS' | ''
  document_number?: string
  phone?: string
  phone_country_code?: string
  email?: string
  birth_date?: string
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const normalizeValue = (value: unknown) => {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}

// CAMBIO 7: used for OG HTML
const esc = (s: string | null | undefined) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const formatDateLongEs = (value: string | null) => {
  if (!value) return '-'
  const date = new Date(`${value}T00:00:00.000Z`)
  if (Number.isNaN(date.getTime())) return '-'
  return new Intl.DateTimeFormat('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date)
}

const sanitizeGuest = (guest: GuestInput) => {
  const documentType = normalizeValue(guest.document_type)
  const documentNumber = normalizeValue(guest.document_number)
  const birthDate = normalizeValue(guest.birth_date)

  return {
    first_name: normalizeValue(guest.first_name),
    last_name: normalizeValue(guest.last_name),
    nationality: normalizeValue(guest.nationality),
    document_type: documentType,
    document_number: documentNumber,
    phone: normalizeValue(guest.phone),
    phone_country_code: normalizeValue(guest.phone_country_code) || '+57',
    email: normalizeValue(guest.email),
    birth_date: birthDate,
  }
}

const getReservationByPrimaryTokenHash = async (
  client: ReturnType<typeof createClient>,
  tokenHash: string
) => {
  const { data, error } = await client
    .from('reservations')
    .select('id, account_id, status, check_in, check_out, adults, children, preregistro_completado, companion_token, companion_token_raw')
    .eq('preregistro_token', tokenHash)
    .maybeSingle()

  if (error) throw error
  return data
}

const getReservationByCompanionTokenHash = async (
  client: ReturnType<typeof createClient>,
  tokenHash: string
) => {
  const { data, error } = await client
    .from('reservations')
    .select('id, account_id, status, check_in, check_out, adults, children')
    .eq('companion_token', tokenHash)
    .maybeSingle()

  if (error) throw error
  return data
}

const getAccountProfile = async (
  client: ReturnType<typeof createClient>,
  accountId: string
) => {
  const { data } = await client
    .from('account_profile')
    .select('commercial_name, legal_name, phone, logo_url')
    .eq('account_id', accountId)
    .maybeSingle()
  return data
}

const countRegisteredCompanions = async (
  client: ReturnType<typeof createClient>,
  reservationId: string,
  accountId: string
) => {
  const { count, error } = await client
    .from('reservation_guests')
    .select('*', { count: 'exact', head: true })
    .eq('account_id', accountId)
    .eq('reservation_id', reservationId)
    .eq('is_primary', false)

  if (error) throw error
  return count ?? 0
}

const resolveGuest = async (
  client: ReturnType<typeof createClient>,
  accountId: string,
  payload: ReturnType<typeof sanitizeGuest>
) => {
  if (!payload.first_name) return null

  if (payload.document_type && payload.document_number) {
    const { data: existing, error: existingError } = await client
      .from('guests')
      .select('id, first_name, last_name, nationality, document_type, document_number, phone, phone_country_code, email, birth_date')
      .eq('account_id', accountId)
      .eq('document_type', payload.document_type)
      .eq('document_number', payload.document_number)
      .maybeSingle()

    if (existingError) throw existingError

    if (existing) {
      const updatePayload = {
        first_name: payload.first_name || existing.first_name,
        last_name: payload.last_name || existing.last_name,
        nationality: payload.nationality || existing.nationality,
        document_type: payload.document_type || existing.document_type,
        document_number: payload.document_number || existing.document_number,
        phone: payload.phone || existing.phone,
        phone_country_code: payload.phone_country_code || existing.phone_country_code || '+57',
        email: payload.email || existing.email,
        birth_date: payload.birth_date || existing.birth_date,
      }

      const { data: updated, error: updateError } = await client
        .from('guests')
        .update(updatePayload)
        .eq('account_id', accountId)
        .eq('id', existing.id)
        .select()
        .single()

      if (updateError) throw updateError
      return updated
    }
  }

  const { data: created, error: createError } = await client
    .from('guests')
    .insert({ ...payload, account_id: accountId })
    .select()
    .single()

  if (createError) throw createError
  return created
}

// CAMBIO 7: HTML with OG tags for companion link
interface CompanionRenderParams {
  businessName: string
  logoUrl: string | null
  primaryGuestName: string | null
  checkIn: string | null
  publicUrl: string
}

function renderCompanionHtml(p: CompanionRenderParams): string {
  const logoTag = p.logoUrl
    ? `<img src="${esc(p.logoUrl)}" alt="${esc(p.businessName)}" style="width:64px;height:64px;object-fit:contain;border-radius:12px;border:1px solid #e5e7eb;background:#fff;display:block;margin:0 auto 12px" />`
    : ''

  const desc = [
    p.primaryGuestName ? `Regístrate como acompañante de ${p.primaryGuestName}` : 'Regístrate como acompañante',
    p.checkIn ? `Check-in: ${formatDateLongEs(p.checkIn)}` : null,
  ].filter(Boolean).join('. ')

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="refresh" content="0;url=${esc(p.publicUrl)}" />
  <title>Pre-registro acompañantes · ${esc(p.businessName)}</title>

  <!-- Open Graph -->
  <meta property="og:type" content="website" />
  <meta property="og:title" content="Pre-registro acompañantes · ${esc(p.businessName)}" />
  <meta property="og:description" content="${esc(desc)}" />
  ${p.logoUrl ? `<meta property="og:image" content="${esc(p.logoUrl)}" />` : ''}
  <meta property="og:site_name" content="${esc(p.businessName)}" />
  <meta property="og:url" content="${esc(p.publicUrl)}" />

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary" />
  <meta name="twitter:title" content="Pre-registro acompañantes · ${esc(p.businessName)}" />
  <meta name="twitter:description" content="${esc(desc)}" />
  ${p.logoUrl ? `<meta name="twitter:image" content="${esc(p.logoUrl)}" />` : ''}
</head>
<body style="margin:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh">
  <div style="text-align:center;padding:40px">
    <div style="margin-bottom:16px">${logoTag}</div>
    <h1 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#111827">${esc(p.businessName)}</h1>
    <p style="margin:0;font-size:14px;color:#6b7280">Pre-registro de acompañantes</p>
  </div>
</body>
</html>`
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const adminClient = createClient(supabaseUrl, serviceRoleKey)

    // ---------------------------------------------------------------
    // GET: datos de la reserva por companion token + OG HTML para bots
    // ---------------------------------------------------------------
    if (req.method === 'GET') {
      const url = new URL(req.url)
      const companionToken = normalizeValue(url.searchParams.get('token'))
      const format = normalizeValue(url.searchParams.get('format'))

      if (!companionToken) {
        return Response.json({ message: 'token es requerido.' }, { status: 400, headers: corsHeaders })
      }

      const companionTokenHash = createHash('sha256').update(companionToken).digest('hex')
      const reservation = await getReservationByCompanionTokenHash(adminClient, companionTokenHash)

      if (!reservation) {
        if (format === 'json') {
          return Response.json({ message: 'Link inválido.' }, { status: 404, headers: corsHeaders })
        }
        return new Response('<html><body>Link inválido.</body></html>', {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' },
        })
      }

      const BLOCKED_STATUSES = ['completed', 'finalized', 'cancelled']
      if (BLOCKED_STATUSES.includes(reservation.status)) {
        return Response.json({ message: 'Este link ya no está disponible.' }, { status: 410, headers: corsHeaders })
      }

      const profile = await getAccountProfile(adminClient, reservation.account_id)
      const guestsCount = Number(reservation.adults || 0) + Number(reservation.children || 0)

      const { data: primaryGuestRow } = await adminClient
        .from('reservation_guests')
        .select('guests!reservation_guests_guest_id_fkey(first_name, last_name)')
        .eq('reservation_id', reservation.id)
        .eq('is_primary', true)
        .maybeSingle()

      // deno-lint-ignore no-explicit-any
      const pg = primaryGuestRow?.guests as any
      const primaryGuestName = pg
        ? [pg.first_name, pg.last_name].filter(Boolean).join(' ')
        : null

      // CAMBIO 7: return HTML with OG tags when not JSON format
      if (format !== 'json') {
        const businessName = profile?.commercial_name || profile?.legal_name || 'Alojamiento'
        const publicUrl = `https://inn.tekmi.co/prerregistro-acompanante/${companionToken}`
        const html = renderCompanionHtml({
          businessName,
          logoUrl: profile?.logo_url || null,
          primaryGuestName,
          checkIn: reservation.check_in,
          publicUrl,
        })
        return new Response(html, {
          headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' },
        })
      }

      return Response.json({
        reservation: {
          check_in: reservation.check_in,
          check_out: reservation.check_out,
          guests_count: guestsCount > 0 ? guestsCount : 1,
        },
        account: {
          name: profile?.commercial_name || profile?.legal_name || 'Alojamiento',
          phone: profile?.phone || '',
          logo_url: profile?.logo_url || null,
        },
        primary_guest_name: primaryGuestName,
      }, { headers: corsHeaders })
    }

    if (req.method !== 'POST') {
      return Response.json({ message: 'Metodo no permitido.' }, { status: 405, headers: corsHeaders })
    }

    const body = await req.json()
    const action = normalizeValue(body?.action)

    // ---------------------------------------------------------------
    // Acción: generate
    // ---------------------------------------------------------------
    if (action === 'generate') {
      const primaryToken = normalizeValue(body?.primary_token)
      if (!primaryToken) {
        return Response.json({ message: 'primary_token es requerido.' }, { status: 400, headers: corsHeaders })
      }

      const primaryTokenHash = createHash('sha256').update(primaryToken).digest('hex')
      const reservation = await getReservationByPrimaryTokenHash(adminClient, primaryTokenHash)

      if (!reservation) {
        return Response.json({ message: 'Link inválido.' }, { status: 404, headers: corsHeaders })
      }

      // CAMBIO 3: check companion capacity before generating link
      const totalGuests = Number(reservation.adults || 0) + Number(reservation.children || 0)
      const maxCompanions = Math.max(0, totalGuests - 1)
      if (maxCompanions === 0) {
        return Response.json(
          { message: 'Esta reserva no admite acompañantes.' },
          { status: 422, headers: corsHeaders }
        )
      }
      const currentCount = await countRegisteredCompanions(adminClient, reservation.id, reservation.account_id as string)
      if (currentCount >= maxCompanions) {
        return Response.json(
          { message: 'El límite de acompañantes ha sido alcanzado.' },
          { status: 422, headers: corsHeaders }
        )
      }

      // Idempotente: reusar token existente si ya fue generado
      let companionRawToken: string

      if (reservation.companion_token_raw) {
        companionRawToken = reservation.companion_token_raw
      } else {
        companionRawToken = randomBytes(32).toString('hex')
        const companionHashedToken = createHash('sha256').update(companionRawToken).digest('hex')

        const { error: updateError } = await adminClient
          .from('reservations')
          .update({
            companion_token: companionHashedToken,
            companion_token_raw: companionRawToken,
          })
          .eq('id', reservation.id)

        if (updateError) {
          return Response.json({ message: updateError.message }, { status: 400, headers: corsHeaders })
        }
      }

      const companionPath = `/prerregistro-acompanante/${companionRawToken}`

      return Response.json(
        { companion_url: companionPath },
        { headers: corsHeaders }
      )
    }

    // ---------------------------------------------------------------
    // Acción: register
    // ---------------------------------------------------------------
    if (action === 'register') {
      const companionToken = normalizeValue(body?.companion_token)
      const guestInput = (body?.guest || {}) as GuestInput

      if (!companionToken) {
        return Response.json({ message: 'companion_token es requerido.' }, { status: 400, headers: corsHeaders })
      }

      const companionTokenHash = createHash('sha256').update(companionToken).digest('hex')
      const reservation = await getReservationByCompanionTokenHash(adminClient, companionTokenHash)

      if (!reservation) {
        return Response.json({ message: 'Link inválido.' }, { status: 404, headers: corsHeaders })
      }

      const { data: profile } = await adminClient
        .from('account_profile')
        .select('phone')
        .eq('account_id', reservation.account_id)
        .maybeSingle()

      const accountId = reservation.account_id as string
      const totalGuests = Number(reservation.adults || 0) + Number(reservation.children || 0)
      const maxCompanions = Math.max(0, totalGuests - 1)

      const currentCompanions = await countRegisteredCompanions(adminClient, reservation.id, accountId)

      if (currentCompanions >= maxCompanions) {
        return Response.json(
          {
            message: 'El límite de acompañantes ha sido alcanzado.',
            contact_phone: profile?.phone || null,
          },
          { status: 422, headers: corsHeaders }
        )
      }

      const guestPayload = sanitizeGuest(guestInput)
      if (!guestPayload.first_name) {
        return Response.json({ message: 'El acompañante debe tener nombre.' }, { status: 400, headers: corsHeaders })
      }

      const savedGuest = await resolveGuest(adminClient, accountId, guestPayload)
      if (!savedGuest) {
        return Response.json({ message: 'No se pudo registrar el acompañante.' }, { status: 400, headers: corsHeaders })
      }

      // Verificar que este guest no esté ya registrado en esta reserva
      const { data: existingRelation } = await adminClient
        .from('reservation_guests')
        .select('id')
        .eq('account_id', accountId)
        .eq('reservation_id', reservation.id)
        .eq('guest_id', savedGuest.id)
        .maybeSingle()

      if (!existingRelation) {
        const { error: relationError } = await adminClient
          .from('reservation_guests')
          .insert({
            reservation_id: reservation.id,
            guest_id: savedGuest.id,
            is_primary: false,
            account_id: accountId,
          })

        if (relationError) throw relationError
      }

      const newCount = await countRegisteredCompanions(adminClient, reservation.id, accountId)
      const remaining = Math.max(0, maxCompanions - newCount)

      return Response.json(
        {
          success: true,
          companions_registered: newCount,
          companions_remaining: remaining,
          check_in: reservation.check_in,
        },
        { headers: corsHeaders }
      )
    }

    return Response.json({ message: 'Acción no reconocida.' }, { status: 400, headers: corsHeaders })
  } catch (error) {
    return Response.json(
      { message: error instanceof Error ? error.message : 'Error inesperado.' },
      { status: 500, headers: corsHeaders }
    )
  }
})
