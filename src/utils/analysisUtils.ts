import type { Character } from "@/types";
import type { RelationshipLink } from "@/types/characterGraph";
import type { AnalysisResultData } from "@/types/analysisResult";
import type { AnalysisDiff } from "@/types/analysisTypes";

/**
 * Compare current project data with analysis result to generate a diff report.
 */
export function calculateAnalysisDiff(
  currentCharacters: Character[],
  currentLinks: RelationshipLink[],
  analysisResult: AnalysisResultData,
): AnalysisDiff {
  const newCharacters: Character[] = [];
  const updatedCharacters: { id: string; changes: string[] }[] = [];
  const newRelations: RelationshipLink[] = [];
  const updatedRelations: { id: string; changes: string[] }[] = [];
  const removedRelations: string[] = [];

  // Helper to find existing character by name (case-insensitive)
  const findCharacter = (name: string) =>
    currentCharacters.find(
      (c) => c.profile.name.toLowerCase() === name.toLowerCase(),
    );

  // 1. Process Characters
  analysisResult.characters.forEach((backendChar) => {
    const existing = findCharacter(backendChar.name);

    // Convert BackendCharacter to partial frontend Character for comparison/display
    // Note: We don't have full Character structure from BackendCharacter usually,
    // but we can construct enough for the Diff.
    // Assuming backendChar has name, role, etc. matching BackendCharacter interface.

    if (!existing) {
      // Create a temporary Character object for the "New" display
      const newChar: Character = {
        _id: `temp-${Date.now()}-${Math.random()}`,
        projectId: "temp",
        role: backendChar.role || "supporting",
        profile: {
          characterId: "",
          name: backendChar.name,
          age: backendChar.age,
          gender: backendChar.gender || "unknown",
          race: backendChar.race || "unknown",
          personality: {
            coreTraits: backendChar.personality?.core_traits || [],
            flaws: backendChar.personality?.flaws || [],
            values: backendChar.personality?.values || [],
          },
          backstory: backendChar.backstory || "",
          faction: {
            name: backendChar.faction?.name || null,
            social: {
              rank: backendChar.faction?.social?.rank || "",
              influence: backendChar.faction?.social?.influence || 0,
              factionReputation: {},
            },
          },
          mbti: null,
        },
        personality: {
          coreTraits: backendChar.personality?.core_traits || [],
          flaws: backendChar.personality?.flaws || [],
          values: backendChar.personality?.values || [],
        },
        appearance: {
          physique: backendChar.appearance?.physique || "",
          hairColor: backendChar.appearance?.hair_color || "",
          hairStyle: backendChar.appearance?.hair_style || "",
          eyes: backendChar.appearance?.eyes || "",
          attire: backendChar.appearance?.attire || [],
          expression: backendChar.appearance?.expression || "",
          skinTone: "",
          nose: "",
          mouth: "",
          scarsTattoos: [],
          styleContext: { artStyle: "realistic" },
        },
        status: "active",
        aliases: [],
        relations: { graph: [], eventRefs: [], locationContext: "" },
        currentMood: { emotion: "neutral", intensity: 0, trigger: null },
        inventory: [],
        meta: {
          createdAt: "",
          updatedAt: "",
          dataVersion: "1.0",
          lockVersion: 0,
        },
        imageUrl: undefined,
      };
      newCharacters.push(newChar);
    } else {
      // Check for updates
      const changes: string[] = [];

      // Check basic fields
      if (backendChar.role && backendChar.role !== existing.role) {
        changes.push(`Role changed: ${existing.role} -> ${backendChar.role}`);
      }
      if (
        backendChar.backstory &&
        existing.profile.backstory &&
        !existing.profile.backstory.includes(
          backendChar.backstory.substring(0, 20),
        )
      ) {
        // Simple heuristic check or exact match
        // Text comparison is tricky. Maybe length check or simple diff?
        // For now, let's skip deep textual diff unless logic is improved.
      }

      if (changes.length > 0) {
        updatedCharacters.push({ id: existing._id, changes });
      }
    }
  });

  // 2. Process Relationships
  analysisResult.relationships.forEach((rel) => {
    // Relationships in AnalysisResult are (Source Name, Target Name).
    // Use Names to find IDs.
    const sourceChar = findCharacter(rel.source);
    const targetChar = findCharacter(rel.target);

    if (sourceChar && targetChar) {
      // Find existing link
      const existingLink = currentLinks.find(
        (link) =>
          (link.source === sourceChar._id && link.target === targetChar._id) ||
          (rel.bidirectional &&
            link.source === targetChar._id &&
            link.target === sourceChar._id),
      );

      if (!existingLink) {
        // New Relation
        newRelations.push({
          id: `new-rel-${Date.now()}-${Math.random()}`,
          source: sourceChar._id,
          target: targetChar._id,
          type: rel.relation_type,
          strength: rel.strength,
          description: rel.description,
          curvature: 0.2,
        });
      } else {
        // Update check
        const changes: string[] = [];
        if (rel.relation_type !== existingLink.type) {
          changes.push(`Type: ${existingLink.type} -> ${rel.relation_type}`);
        }
        if (Math.abs(rel.strength - existingLink.strength) > 1) {
          // Threshold 1
          changes.push(`Strength: ${existingLink.strength} -> ${rel.strength}`);
        }

        if (changes.length > 0) {
          updatedRelations.push({ id: existingLink.id, changes });
        }
      }
    }
  });

  return {
    newCharacters,
    updatedCharacters,
    newRelations,
    updatedRelations,
    removedRelations,
  };
}
