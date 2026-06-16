// ============================================================
// useBookingsStore.ts — Store Zustand para reservas
// SCRUM-186
// ============================================================

import { create } from "zustand";
import * as bookingsApi from "../api/bookingsApi";
import type { Booking, CourtAvailability } from "../api/bookingsApi";
import { toast } from "sonner";

interface BookingsState {
  myBookings: Booking[];
  availability: CourtAvailability[];
  loading: boolean;
  saving: boolean;
  error: string | null;

  // Acciones
  loadMyBookings: () => Promise<void>;
  loadAvailability: (courtId: string, fromDate: string, toDate: string) => Promise<void>;
  createBooking: (input: bookingsApi.CreateBookingInput) => Promise<Booking | null>;
  cancelBooking: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useBookingsStore = create<BookingsState>((set, get) => ({
  myBookings: [],
  availability: [],
  loading: false,
  saving: false,
  error: null,

  clearError: () => set({ error: null }),

  loadMyBookings: async () => {
    set({ loading: true, error: null });
    try {
      const bookings = await bookingsApi.listMyBookings();
      set({ myBookings: bookings, loading: false });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al cargar reservas";
      set({ error: msg, loading: false });
      toast.error(msg);
    }
  },

  loadAvailability: async (courtId, fromDate, toDate) => {
    set({ loading: true, error: null });
    try {
      const availability = await bookingsApi.getCourtAvailability(courtId, fromDate, toDate);
      set({ availability, loading: false });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al cargar disponibilidad";
      set({ error: msg, loading: false });
    }
  },

  createBooking: async (input) => {
    set({ saving: true, error: null });
    try {
      const booking = await bookingsApi.createBooking(input);
      // Refrescar mis reservas
      await get().loadMyBookings();
      set({ saving: false });
      toast.success("Reserva creada");
      return booking;
    } catch (err) {
      let msg = "Error al crear reserva";
      if (err instanceof Error) {
        msg = err.message.includes("duplicate") ? "Ese horario ya esta reservado" : err.message;
      }
      set({ error: msg, saving: false });
      toast.error(msg);
      return null;
    }
  },

  cancelBooking: async (id) => {
    set({ saving: true, error: null });
    try {
      await bookingsApi.cancelBooking(id);
      set((s) => ({
        myBookings: s.myBookings.filter((b) => b.id !== id),
        saving: false,
      }));
      toast.success("Reserva cancelada");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al cancelar";
      set({ error: msg, saving: false });
      toast.error(msg);
    }
  },
}));
