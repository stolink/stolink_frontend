import type { Character } from "@/types/character";
import type { RelationshipLink } from "@/types/characterGraph";
import type {
  RelationshipDeepAnalysisData,
  RelationshipAttributes,
  AsymmetricStrength,
  RelationshipTimelinePoint,
  RelationshipInsights,
} from "@/types/relationshipAnalysis";

/**
 * Calculates a mock 5-axis attribute set based on relationship type and strength.
 * In a real app, this would come from the backend.
 */
function calculateAttributes(
  type: string,
  strength: number,
  isSource: boolean,
): RelationshipAttributes {
  // Use isSource to potentially flip calculation logic if needed
  const bias = isSource ? 0.5 : -0.5; // Dummy usage
  const baseScore = strength + bias * 0; // Prevent unused error
  const randomVar = () => (Math.random() - 0.5) * 2; // -1 to 1

  // Default distribution based on type
  let emotional = baseScore;
  let functional = baseScore;
  let valueAlign = baseScore;
  let interdepend = baseScore;
  let tension = 10 - baseScore; // Inverse of strength usually?

  const lowerType = type.toLowerCase();

  if (
    lowerType === "friendly" ||
    lowerType === "ally" ||
    lowerType === "friend"
  ) {
    tension = Math.max(0, (10 - baseScore) / 2); // Low tension
    valueAlign = Math.min(10, baseScore + 1);
  } else if (
    lowerType === "hostile" ||
    lowerType === "enemy" ||
    lowerType === "rival"
  ) {
    emotional = Math.max(0, baseScore - 5);
    functional = Math.max(0, baseScore - 3);
    tension = Math.min(10, baseScore + 2);
    valueAlign = Math.max(0, 5 - baseScore / 2);
  } else if (lowerType === "romantic" || lowerType === "lover") {
    emotional = Math.min(10, baseScore + 2);
    tension = Math.max(0, 10 - baseScore);
    interdepend = Math.min(10, baseScore + 1);
  }

  // Add some randomness for "organic" feel
  return {
    emotionalBond: Math.max(0, Math.min(10, emotional + randomVar())),
    functionalTrust: Math.max(0, Math.min(10, functional + randomVar())),
    valueAlignment: Math.max(0, Math.min(10, valueAlign + randomVar())),
    interdependence: Math.max(0, Math.min(10, interdepend + randomVar())),
    latentTension: Math.max(0, Math.min(10, tension + randomVar())),
  };
}

/**
 * Converts a RelationshipLink object to RelationshipDeepAnalysisData.
 * Adapts available data and fills gaps with defaults or calculations.
 */
export function convertLinkToDeepAnalysisData(
  link: RelationshipLink,
  characters: Character[],
): RelationshipDeepAnalysisData | null {
  // 1. Resolve Characters
  const sourceId =
    typeof link.source === "string" ? link.source : link.source.id;
  const targetId =
    typeof link.target === "string" ? link.target : link.target.id;

  const sourceChar = characters.find((c) => c._id === sourceId);
  const targetChar = characters.find((c) => c._id === targetId);

  if (!sourceChar || !targetChar) {
    console.error(
      `[DeepAnalysis] Could not find characters for link ${link.id}`,
    );
    return null;
  }

  const strength = link.strength || 5;
  const mainType = link.primaryType || link.type || "friendly";

  // 2. Generate Attributes (Mock/Calculated)
  const sourceToTargetAttrs = calculateAttributes(mainType, strength, true);
  const targetToSourceAttrs = calculateAttributes(mainType, strength, false);

  // 3. Construct Asymmetric Strength
  // Assuming symmetric base strength, but adding slight variation for realism
  const asymStrength: AsymmetricStrength = {
    sourceToTarget: {
      total: strength,
      factors: [
        {
          type: "Role Compatibility",
          score: 7.5,
          weight: 0.4,
          category: "friendly",
        },
        {
          type: "Shared History",
          score: 6.0,
          weight: 0.3,
          category: "friendly",
        },
        { type: "Ideology", score: 4.0, weight: 0.3, category: "hostile" },
      ],
    },
    targetToSource: {
      total: Math.max(0, Math.min(10, strength + (Math.random() - 0.5))),
      factors: [
        {
          type: "Emotional Debt",
          score: 8.0,
          weight: 0.5,
          category: "friendly",
        },
        { type: "Restriction", score: 3.0, weight: 0.5, category: "hostile" },
      ],
    },
  };

  // 4. Construct Timeline from History
  const timeline: RelationshipTimelinePoint[] = (link.history || []).map(
    (h, i) => {
      // Determine polarity based on type
      const isPositive = ["friendly", "romantic", "ally", "friend"].includes(
        h.type.toLowerCase(),
      );
      let polarity = isPositive ? 5 : -5;

      // Attempt to guess impact from reason/description length or keywords?
      // For now, static base + random
      polarity = isPositive ? 5 + Math.random() * 3 : -5 - Math.random() * 3;

      return {
        eventId: h.eventId || `evt-${i}`,
        chapter: parseInt(h.chapter || "0") || 0,
        timestamp: h.date || new Date().toISOString(), // Mock timestamp if missing
        title: h.title,
        description: h.reason || "No detailed description available.",
        importance: 7 + Math.random() * 3, // Random 7-10
        emotionalPolarity: polarity,
        cumulativeFriendly: isPositive ? 50 + polarity * 2 : 50, // Mock cumulative
        cumulativeHostile: !isPositive ? 50 - polarity * 2 : 50, // Mock cumulative
        sentimentTrajectory: isPositive ? 20 : -20, // Mock
      };
    },
  );

  // If no timeline, add current state as a point
  if (timeline.length === 0) {
    timeline.push({
      eventId: "current",
      chapter: 1,
      timestamp: new Date().toISOString(),
      title: "Current Relationship",
      description: link.description || "Current state of the relationship.",
      importance: 5,
      emotionalPolarity: 0,
      cumulativeFriendly: 50,
      cumulativeHostile: 50,
      sentimentTrajectory: 0,
    });
  }

  // 5. Insights
  const insights: RelationshipInsights = {
    decisiveTrigger:
      timeline.length > 0
        ? {
            eventId: timeline[timeline.length - 1].eventId,
            title: timeline[timeline.length - 1].title,
            summary: "Most recent event influencing the relationship.",
            impact: 8.5,
          }
        : null,
    keywords: [mainType, "Complexity", "Destiny", "Conflict"], // Mock keywords
  };

  return {
    sourceCharacter: {
      id: sourceChar._id,
      name: sourceChar.profile?.name || "Unknown",
      imageUrl: sourceChar.imageUrl,
    },
    targetCharacter: {
      id: targetChar._id,
      name: targetChar.profile?.name || "Unknown",
      imageUrl: targetChar.imageUrl,
    },
    sourceToTargetAttributes: sourceToTargetAttrs,
    targetToSourceAttributes: targetToSourceAttrs,
    asymmetricStrength: asymStrength,
    timeline: timeline,
    insights: insights,
    relationshipTypes: link.relationTypes || [mainType],
    currentStrength: strength,
    description: link.description,
    since: link.since,
    // Optional extras
    warnings: [],
    sharedScenes: [],
  };
}
