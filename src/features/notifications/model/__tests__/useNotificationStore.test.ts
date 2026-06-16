/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useNotificationStore } from "../useNotificationStore";
import { useAuthStore } from "@/entities/user/useAuth";
import * as notificationService from "@/shared/api/notificationService";

vi.mock("@/shared/api/notificationService", () => ({
  getNotifications: vi.fn(),
  markNotificationRead: vi.fn(),
  markAllNotificationsRead: vi.fn(),
}));

describe("useNotificationStore Zustand Store", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useNotificationStore.setState({ notifications: [] });
    useAuthStore.setState({ user: { id: "user-123", email: "edwin@test.com" } as any });
  });

  it("debe agregar una notificación directamente y evitar duplicados", () => {
    const notif = {
      id: "notif-1",
      user_id: "user-123",
      type: "FOLLOW",
      title: "New Follower",
      body: "Edwin followed you",
      is_read: false,
      created_at: "2026-06-16T00:00:00Z",
    } as any;

    useNotificationStore.getState().addNotificationDirectly(notif);
    expect(useNotificationStore.getState().notifications.length).toBe(1);

    // Duplicado no debe agregarse
    useNotificationStore.getState().addNotificationDirectly(notif);
    expect(useNotificationStore.getState().notifications.length).toBe(1);
  });

  it("debe agregar una notificación y autocompletar campos por defecto", () => {
    const notif = {
      id: "notif-2",
      user_id: "user-123",
      type: "MATCH_ALERT",
      title: "Match Alert",
      body: "New match",
    } as any;

    const result = useNotificationStore.getState().addNotification(notif);
    expect(result.is_read).toBe(false);
    expect(result.created_at).toBeDefined();
    expect(useNotificationStore.getState().notifications[0].id).toBe("notif-2");
  });

  it("debe cargar notificaciones desde el servicio", async () => {
    const mockNotifs = [
      { id: "n1", is_read: false },
      { id: "n2", is_read: true },
    ] as any[];
    vi.mocked(notificationService.getNotifications).mockResolvedValue(mockNotifs);

    await useNotificationStore.getState().fetchNotifications("user-123");

    expect(notificationService.getNotifications).toHaveBeenCalledWith("user-123");
    expect(useNotificationStore.getState().notifications).toEqual(mockNotifs);
  });

  it("debe manejar errores al cargar notificaciones desde el servicio", async () => {
    vi.mocked(notificationService.getNotifications).mockRejectedValue(new Error("Fetch failed"));

    await expect(
      useNotificationStore.getState().fetchNotifications("user-123"),
    ).resolves.not.toThrow();
    expect(useNotificationStore.getState().notifications).toEqual([]);
  });

  it("debe marcar como leída local y remotamente", async () => {
    const notif = { id: "notif-1", is_read: false } as any;
    useNotificationStore.setState({ notifications: [notif] });

    await useNotificationStore.getState().markAsRead("notif-1");

    expect(useNotificationStore.getState().notifications[0].is_read).toBe(true);
    expect(notificationService.markNotificationRead).toHaveBeenCalledWith("notif-1");
  });

  it("debe marcar todas como leídas local y remotamente", async () => {
    const notifs = [
      { id: "n1", user_id: "user-123", is_read: false },
      { id: "n2", user_id: "user-123", is_read: false },
      { id: "n3", user_id: "other", is_read: false },
    ] as any[];
    useNotificationStore.setState({ notifications: notifs });

    await useNotificationStore.getState().markAllAsRead();

    const state = useNotificationStore.getState();
    expect(state.notifications.find((n) => n.id === "n1")?.is_read).toBe(true);
    expect(state.notifications.find((n) => n.id === "n2")?.is_read).toBe(true);
    expect(state.notifications.find((n) => n.id === "n3")?.is_read).toBe(false);
    expect(notificationService.markAllNotificationsRead).toHaveBeenCalledWith("user-123");
  });

  it("debe borrar una notificación de la lista", () => {
    const notifs = [{ id: "n1" }, { id: "n2" }] as any[];
    useNotificationStore.setState({ notifications: notifs });

    useNotificationStore.getState().deleteNotification("n1");

    expect(useNotificationStore.getState().notifications.length).toBe(1);
    expect(useNotificationStore.getState().notifications[0].id).toBe("n2");
  });
});
