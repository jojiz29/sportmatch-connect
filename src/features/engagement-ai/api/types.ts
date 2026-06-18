export type EngagementEventType =
  | "POST_CREATED"
  | "RECOMMENDATION_VIEWED"
  | "PLAYER_CONNECTED"
  | "PLAYER_DISMISSED"
  | "MATCH_JOINED"
  | "MATCH_COMPLETED"
  | "SPORT_SELECTED"
  | "DAILY_CHALLENGE_STARTED"
  | "CHALLENGE_COMPLETED"
  | "ACHIEVEMENT_SAVED"
  | "ACHIEVEMENT_UNLOCKED"
  | "SMART_NOTIFICATION_SAVED"
  | "TOUR_NARRATIVE_SAVED"
  | "ENGAGEMENT_CONTENT_SAVED"
  | "ENGAGEMENT_EMBEDDING_REBUILT"
  | "AI_RECOMMENDATION_GENERATED"
  | "AI_RECOMMENDATION_OPENED"
  | "AI_RECOMMENDATION_LIKED"
  | "AI_RECOMMENDATION_DISMISSED";

export interface EngagementEventInput {
  eventType: EngagementEventType;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  dedupeKey?: string;
}

export interface EngagementProfile {
  userId: string;
  generatedAt: string;
  sportAffinities: Array<{ sport: string; score: number }>;
  eventCounts: Record<string, number>;
  recentActivityAt: string | null;
  sampleSize: number;
  readyForEmbedding: boolean;
  embedding: EngagementEmbeddingSummary | null;
}

export interface EngagementEmbeddingSummary {
  provider: string;
  dimension: number;
  generatedAt: string;
  updatedAt?: string;
  sampleSize?: number;
}

export interface EngagementAnalytics {
  generatedAt: string;
  sampleSize: number;
  counts: Record<string, number>;
  funnel: {
    generated: number;
    opened: number;
    liked: number;
    dismissed: number;
    completedChallenges: number;
    savedSignals: number;
  };
  rates: {
    openRate: number;
    likeRate: number;
    dismissRate: number;
    challengeCompletionRate: number;
  };
  experiment: {
    variants: Record<string, number>;
    currentVariant: string;
    performance: Record<
      string,
      {
        generated: number;
        opened: number;
        liked: number;
        dismissed: number;
        openRate: number;
        likeRate: number;
        dismissRate: number;
      }
    >;
  };
  recentEvents: Array<{ eventType: string; createdAt: string }>;
}

export interface EngagementDiagnostics {
  generatedAt: string;
  status: "ok" | "warning";
  database: Record<
    string,
    {
      status: "ok" | "warning";
      count: number;
      message: string;
    }
  >;
  vertexAi: {
    status: "ok" | "warning";
    model: string;
    location: string;
    message: string;
  };
  nextRecommendedAction: string;
}

export type AiRecommendationType =
  | "overview"
  | "players"
  | "sports"
  | "challenges"
  | "achievements"
  | "content";

export interface AiRecommendationCard {
  id: string;
  type: "player" | "sport" | "challenge" | "achievement" | "content" | "venue";
  title: string;
  description: string;
  score: number;
  reasons: string[];
  actionLabel: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}

export interface AiRecommendationResponse {
  summary: string;
  recommendations: AiRecommendationCard[];
  dailyChallenge: {
    title: string;
    description: string;
    rewardHint: string;
  };
  achievementIdea: {
    name: string;
    description: string;
    unlockCondition: string;
  };
  weeklyBrief: string;
  tourNarrative: string;
  notificationDraft: {
    title: string;
    body: string;
  };
  metadata: {
    model: string;
    latencyMs: number;
    tokens: number;
    algorithmVersion: string;
    experimentVariant?: string;
    cacheStatus?: "hit" | "miss";
    snapshotId?: string;
    expiresAt?: string;
    generatedAt: string;
  };
}

export interface SmartNotificationInput {
  title: string;
  body: string;
  source?: string;
}

export interface SmartNotificationResult {
  id: string;
  user_id: string;
  type: "MATCH_ALERT";
  title: string;
  content: string;
  link?: string | null;
  is_read: boolean;
  created_at: string;
}

export interface EngagementChallengeInput {
  title: string;
  description: string;
  rewardHint?: string;
  metadata?: Record<string, unknown>;
}

export interface EngagementChallenge {
  id: string;
  user_id: string;
  title: string;
  description: string;
  reward_hint?: string | null;
  status: "started" | "completed" | "dismissed";
  source: string;
  metadata: Record<string, unknown>;
  started_at: string;
  completed_at?: string | null;
}

export type BusinessChallengeValidationStatus = "pending" | "approved" | "rejected";

export interface BusinessVenueChallenge {
  id: string;
  title: string;
  description: string;
  reward_hint?: string | null;
  status: EngagementChallenge["status"];
  validationStatus: BusinessChallengeValidationStatus;
  validationNote?: string | null;
  rewardFitcoins: number;
  started_at: string;
  completed_at?: string | null;
  metadata: Record<string, unknown>;
  user: {
    id: string;
    name?: string | null;
    avatar_url?: string | null;
    city?: string | null;
    level?: number | null;
    preferred_sports?: string[];
  } | null;
  venue: {
    id: string;
    name: string;
    sport?: string | null;
    district?: string | null;
    address?: string | null;
  };
}

export interface EngagementAchievementInput {
  name: string;
  description: string;
  unlockCondition?: string;
  metadata?: Record<string, unknown>;
}

export interface EngagementAchievement {
  id: string;
  user_id: string;
  name: string;
  description: string;
  unlock_condition?: string | null;
  status: "saved" | "unlocked" | "dismissed";
  source: string;
  metadata: Record<string, unknown>;
  saved_at: string;
  unlocked_at?: string | null;
}

export interface EngagementAchievementEvaluation {
  evaluated: number;
  unlockedCount: number;
  achievements: EngagementAchievement[];
}

export interface EngagementContentInput {
  contentType: "weekly_brief" | "tour_narrative";
  title: string;
  body: string;
  metadata?: Record<string, unknown>;
}

export interface EngagementContent {
  id: string;
  user_id: string;
  content_type: "weekly_brief" | "tour_narrative";
  title: string;
  body: string;
  source: string;
  metadata: Record<string, unknown>;
  saved_at: string;
  updated_at: string;
}
