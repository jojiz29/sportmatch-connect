/* eslint-disable @typescript-eslint/no-unused-vars */
// ============================================================
// BookingCalendar.tsx — Calendario interactivo de reservas
// SCRUM-186
// Vista mes con day picker. Click en dia abre BookingSlotPicker.
// ============================================================

import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { Calendar, MapPin, X, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useBookingsStore } from "../model/useBookingsStore";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";
import { cn } from "@/lib/utils";

const TIME_SLOTS = [
  "08:00-09:00",
  "09:00-10:00",
  "10:00-11:00",
  "11:00-12:00",
  "12:00-13:00",
  "13:00-14:00",
  "14:00-15:00",
  "15:00-16:00",
  "16:00-17:00",
  "17:00-18:00",
  "18:00-19:00",
  "19:00-20:00",
  "20:00-21:00",
  "21:00-22:00",
];

interface BookingCalendarProps {
  courtId: string;
  courtName: string;
  courtPrice?: number;
  onBookingCreated?: () => void;
}

export function BookingCalendar({
  courtId,
  courtName,
  courtPrice = 50,
  onBookingCreated,
}: BookingCalendarProps) {
  const { t } = useTranslation();
  const {
    availability,
    loading,
    saving,
    loadAvailability,
    createBooking,
    cancelBooking,
    myBookings,
    loadMyBookings,
  } = useBookingsStore();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState(false);

  // Cargar disponibilidad del mes visible
  useEffect(() => {
    const now = new Date();
    const from = now.toISOString().slice(0, 10);
    const to = new Date(now.getTime() + 60 * 24 * 3600 * 1000).toISOString().slice(0, 10);
    loadAvailability(courtId, from, to);
    loadMyBookings();
  }, [courtId, loadAvailability, loadMyBookings]);

  const slotsForSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    const dateStr = selectedDate.toISOString().slice(0, 10);
    return availability
      .filter((a) => a.date === dateStr)
      .sort((a, b) => a.time_slot.localeCompare(b.time_slot));
  }, [selectedDate, availability]);

  const handleSlotClick = (slot: string) => {
    if (slotsForSelectedDate.find((s) => s.time_slot === slot && s.is_booked)) {
      return;
    }
    setSelectedSlot(slot);
  };

  const handleConfirm = async () => {
    if (!selectedDate || !selectedSlot) return;
    const dateStr = selectedDate.toISOString().slice(0, 10);
    const result = await createBooking({
      court_id: courtId,
      date: dateStr,
      time_slot: selectedSlot,
    });
    if (result) {
      setShowPicker(false);
      setSelectedSlot(null);
      onBookingCreated?.();
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm(t("bookings.confirm_cancel", "Cancelar esta reserva?"))) return;
    await cancelBooking(bookingId);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="rounded-2xl bg-card/60 backdrop-blur border border-border/40 p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-4">
          <Calendar className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-bold">{t("bookings.title", "Calendario de reservas")}</h3>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <MapPin className="h-4 w-4" />
          <span className="truncate">{courtName}</span>
        </div>

        {loading && availability.length === 0 ? (
          <div className="space-y-3">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : (
          <>
            <DayPicker
              mode="single"
              selected={selectedDate}
              onSelect={(d) => {
                setSelectedDate(d);
                setSelectedSlot(null);
              }}
              disabled={{ before: new Date() }}
              showOutsideDays
              classNames={{
                root: "rdp-custom",
                day_selected: "bg-primary text-primary-foreground",
                day_today: "font-bold border border-primary/30",
              }}
            />

            {selectedDate && (
              <motion.div
                key={selectedDate.toISOString()}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="mt-6"
              >
                <h4 className="text-sm font-semibold text-muted-foreground mb-3">
                  {t("bookings.slots_for", "Horarios disponibles")} —{" "}
                  {selectedDate.toLocaleDateString()}
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                  {slotsForSelectedDate.length === 0 ? (
                    <div className="col-span-full text-sm text-muted-foreground p-4 text-center rounded-lg border border-dashed">
                      {t("bookings.no_slots", "No hay horarios disponibles")}
                    </div>
                  ) : (
                    slotsForSelectedDate.map((slot) => {
                      const isBooked = slot.is_booked;
                      const isMyBooking =
                        slot.booked_by !== null &&
                        myBookings.some(
                          (b) =>
                            b.court_id === courtId &&
                            b.date === slot.date &&
                            b.time_slot === slot.time_slot,
                        );
                      return (
                        <button
                          key={slot.time_slot}
                          type="button"
                          disabled={isBooked && !isMyBooking}
                          onClick={() => handleSlotClick(slot.time_slot)}
                          className={cn(
                            "p-2.5 rounded-lg border text-sm font-medium transition-all min-h-[44px]",
                            isBooked && !isMyBooking
                              ? "bg-muted/30 border-border/20 text-muted-foreground cursor-not-allowed line-through"
                              : isMyBooking
                                ? "bg-green-500/20 border-green-500/40 text-green-700 dark:text-green-300 hover:bg-green-500/30"
                                : selectedSlot === slot.time_slot
                                  ? "bg-primary text-primary-foreground border-primary shadow-glow"
                                  : "bg-background border-border/40 hover:border-primary/50 active:scale-95",
                          )}
                          aria-label={`${slot.time_slot} ${isBooked ? "reservado" : "disponible"}`}
                        >
                          {slot.time_slot}
                          {isMyBooking && (
                            <span className="block text-[10px] mt-0.5">Tu reserva</span>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>

                {selectedSlot && (
                  <div className="mt-4 p-4 rounded-xl bg-primary/5 border border-primary/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="text-sm">
                      <div className="font-semibold">
                        {t("bookings.confirm_title", "Confirmar reserva")}
                      </div>
                      <div className="text-muted-foreground">
                        {selectedDate.toLocaleDateString()} a las {selectedSlot}
                      </div>
                      <div className="text-xs text-primary mt-1">
                        {t("bookings.price", "Precio")}: {courtPrice} FitCoins
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedSlot(null)}
                        className="min-h-[44px]"
                      >
                        {t("common.cancel", "Cancelar")}
                      </Button>
                      <Button onClick={handleConfirm} disabled={saving} className="min-h-[44px]">
                        {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                        {t("bookings.confirm", "Reservar")}
                      </Button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </>
        )}
      </div>

      {myBookings.length > 0 && (
        <div className="rounded-2xl bg-card/60 backdrop-blur border border-border/40 p-4 sm:p-6">
          <h3 className="text-lg font-bold mb-3">
            {t("bookings.my_bookings", "Mis reservas")} ({myBookings.length})
          </h3>
          <div className="space-y-2">
            {myBookings.slice(0, 5).map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between p-3 rounded-lg bg-background/40 border border-border/40"
              >
                <div className="text-sm">
                  <div className="font-semibold">{b.court?.name ?? "Cancha"}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(b.date).toLocaleDateString()} - {b.time_slot}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleCancelBooking(b.id)}
                  className="text-muted-foreground hover:text-destructive"
                  aria-label="Cancelar reserva"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
