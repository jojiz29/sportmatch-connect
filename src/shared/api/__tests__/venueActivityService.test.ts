// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { useAuthStore } from "@/entities/user/useAuth";
import {
  createVenueActivity,
  getVenueActivities,
  joinVenueActivity,
} from "@/shared/api/venueActivityService";

describe("venue activity service demo persistence", () => {
  beforeEach(() => {
    localStorage.removeItem("sportmatch_demo_venue_activities");
    useAuthStore.setState({ isDemoMode: true });
  });

  it("publishes and restores an open player search for a venue", async () => {
    await createVenueActivity({
      venueId: "venue-a",
      creatorId: "user-a",
      sport: "Tenis",
      activityType: "PLAYER_CHALLENGE",
      requiredPlayers: 4,
    });

    const activities = await getVenueActivities(["venue-a"]);

    expect(activities).toHaveLength(1);
    expect(activities[0]).toMatchObject({
      venue_id: "venue-a",
      creator_id: "user-a",
      activity_type: "PLAYER_CHALLENGE",
      status: "open",
      required_players: 4,
    });
  });

  it("keeps the search open until all required players join", async () => {
    const activity = await createVenueActivity({
      venueId: "venue-a",
      creatorId: "user-a",
      sport: "Tenis",
      activityType: "PLAYER_CHALLENGE",
      requiredPlayers: 3,
    });

    const joined = await joinVenueActivity(activity.id, "user-b");
    expect(joined).toMatchObject({
      participant_id: "user-b",
      participant_ids: ["user-b"],
      status: "open",
    });

    const completed = await joinVenueActivity(activity.id, "user-c");
    expect(completed).toMatchObject({
      participant_ids: ["user-b", "user-c"],
      status: "matched",
    });
    expect(await getVenueActivities(["venue-a"])).toHaveLength(1);
  });

  it("does not allow the creator to join their own activity", async () => {
    const activity = await createVenueActivity({
      venueId: "venue-a",
      creatorId: "user-a",
      sport: "Tenis",
      activityType: "TEAM_CHALLENGE",
      squadId: "squad-a",
      requiredPlayers: 2,
    });

    await expect(joinVenueActivity(activity.id, "user-a")).rejects.toThrow(
      "La actividad ya no está disponible o ya te uniste.",
    );
  });
});
