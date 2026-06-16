// ============================================================
// bookingsApi.ts — Cliente HTTP para reservas (bookings)
// SCRUM-186: Calendario interactivo
// ============================================================

import { supabase } from "@/shared/api/supabase";

export interface Booking {
  id: string;
  court_id: string;
  user_id: string;
  date: string; // ISO YYYY-MM-DD
  time_slot: string; // "HH:MM-HH:MM"
  precio_cancha: number;
  porcentaje_comision: number;
  monto_comision: number;
  total_cobrado: number;
  created_at: string;
  court?: {
    id: string;
    name: string;
    address?: string;
  };
}

export interface CourtAvailability {
  court_id: string;
  court_name: string;
  date: string; // YYYY-MM-DD
  time_slot: string;
  is_booked: boolean;
  booked_by: string | null;
  precio_cancha: number | null;
}

export interface CreateBookingInput {
  court_id: string;
  date: string; // YYYY-MM-DD
  time_slot: string;
}

/** Lista las reservas del usuario actual */
export async function listMyBookings(): Promise<Booking[]> {
  const { data, error } = await supabase
    .from("bookings")
    .select(
      `
      *,
      court:courts!bookings_court_id_fkey (id, name, address)
    `,
    )
    .order("date", { ascending: true });
  if (error) throw error;
  return (data || []) as Booking[];
}

/** Lista las reservas de una cancha entre dos fechas */
export async function listBookingsByCourt(
  courtId: string,
  fromDate: string,
  toDate: string,
): Promise<Booking[]> {
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("court_id", courtId)
    .gte("date", fromDate)
    .lte("date", toDate)
    .order("date", { ascending: true });
  if (error) throw error;
  return (data || []) as Booking[];
}

/** Disponibilidad por cancha y rango de fechas (vista SQL) */
export async function getCourtAvailability(
  courtId: string,
  fromDate: string,
  toDate: string,
): Promise<CourtAvailability[]> {
  const { data, error } = await supabase
    .from("v_court_availability")
    .select("*")
    .eq("court_id", courtId)
    .gte("date", fromDate)
    .lte("date", toDate)
    .order("date", { ascending: true });
  if (error) throw error;
  return (data || []) as CourtAvailability[];
}

/** Crea una nueva reserva */
export async function createBooking(input: CreateBookingInput): Promise<Booking> {
  const { data, error } = await supabase
    .from("bookings")
    .insert({
      court_id: input.court_id,
      date: input.date,
      time_slot: input.time_slot,
      user_id: (await supabase.auth.getUser()).data.user?.id,
    })
    .select()
    .single();
  if (error) throw error;
  return data as Booking;
}

/** Cancela una reserva (delete) */
export async function cancelBooking(bookingId: string): Promise<void> {
  const { error } = await supabase
    .from("bookings")
    .delete()
    .eq("id", bookingId);
  if (error) throw error;
}
