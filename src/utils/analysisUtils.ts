import type { Character, RelationType } from "@/types";
import type { RelationshipLink } from "@/types/characterGraph";
import type { AnalysisResultData } from "@/types/analysisResult";
import type { AnalysisDiff } from "@/types/analysisTypes";

/**
 * Compare current project data with analysis result to generate a diff report.
 */
import type { ChangeItem } from "@/types/analysisTypes";

/**
 * Compare current project data with analysis result to generate a diff report.
 */
export function calculateAnalysisDiff(
  currentCharacters: Character[],
  currentLinks: RelationshipLink[],
  analysisResult: AnalysisResultData,
): AnalysisDiff {
  const newCharacters: Character[] = [];
  const updatedCharacters: { id: string; changes: ChangeItem[] }[] = [];
  const newRelations: RelationshipLink[] = [];
  const updatedRelations: { id: string; changes: ChangeItem[] }[] = [];
  const removedRelations: { id: string; source: string; target: string }[] = [];

  // Helper to normalize names for comparison
  const normalizeName = (name: string) =>
    name.trim().toLowerCase().replace(/\s+/g, " ");

  // Helper to normalize relation types (e.g. "ALLY" -> "friendly")
  const normalizeValues = (val: string) => {
    if (!val) return "";
    return val.toLowerCase().trim();
  };

  // Helper to find existing character by name (case-insensitive, normalized)
  const findCharacter = (name: string) =>
    currentCharacters.find(
      (c) => normalizeName(c.profile.name) === normalizeName(name),
    );

  // 1. Process Characters
  analysisResult.characters.forEach((backendChar) => {
    const existing = findCharacter(backendChar.name);

    if (!existing) {
      // Create a temporary Character object for the "New" display
      const newChar: Character = {
        _id: `temp-${Date.now()}-${Math.random()}`,
        projectId: "temp",
        role: (backendChar.role || "supporting") as Character["role"],
        profile: {
          characterId: "",
          name: backendChar.name,
          age: backendChar.age ?? null,
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
      const changes: ChangeItem[] = [];

      // Check basic fields
      if (backendChar.role && backendChar.role !== existing.role) {
        changes.push({
          field: "role",
          oldValue: existing.role,
          newValue: backendChar.role,
          description: `Role changed: ${existing.role} -> ${backendChar.role}`,
        });
      }

      // Check Faction
      const newFaction = backendChar.faction?.name || "무소속";
      const oldFaction = existing.profile.faction?.name || "무소속";
      if (newFaction !== oldFaction) {
        changes.push({
          field: "faction",
          oldValue: oldFaction,
          newValue: newFaction,
          description: `Faction: ${oldFaction} -> ${newFaction}`,
        });
      }

      // Check Personality (Core Traits - Array comparison)
      const newTraits = backendChar.personality?.core_traits || [];
      const oldTraits = existing.personality.coreTraits || [];
      const traitsChanged =
        newTraits.length !== oldTraits.length ||
        !newTraits.every((t) => oldTraits.includes(t));

      if (traitsChanged && newTraits.length > 0) {
        changes.push({
          field: "personality",
          oldValue: oldTraits,
          newValue: newTraits,
          description: `Personality updated`,
        });
      }

      // Check Appearance (Key fields)
      if (backendChar.appearance) {
        const app = backendChar.appearance;
        const oldApp = existing.appearance;
        const appearanceChanges: string[] = [];

        if (app.physique && app.physique !== oldApp.physique)
          appearanceChanges.push("physique");
        if (app.hair_style && app.hair_style !== oldApp.hairStyle)
          appearanceChanges.push("hair");
        if (app.eyes && app.eyes !== oldApp.eyes)
          appearanceChanges.push("eyes");

        if (appearanceChanges.length > 0) {
          changes.push({
            field: "appearance",
            oldValue: "Various",
            newValue: appearanceChanges.join(", "),
            description: `Appearance updated: ${appearanceChanges.join(", ")}`,
          });
        }
      }

      if (changes.length > 0) {
        updatedCharacters.push({ id: existing._id, changes });
      }
    }
  });

  // 1.5. Detect Removed (Deleted) Relations
  // Iterate through current VALID links and check if they exist in the new analysis result
  currentLinks.forEach((link) => {
    // Skip invalid links or links with missing characters
    const sourceChar = currentCharacters.find((c) => c._id === link.source);
    const targetChar = currentCharacters.find((c) => c._id === link.target);

    if (!sourceChar || !targetChar) return;

    // Check if this relationship exists in the new analysis result
    const existsInResult = analysisResult.relationships.some((rel) => {
      const sName = normalizeName(rel.source);
      const tName = normalizeName(rel.target);
      const curSName = normalizeName(sourceChar.profile.name);
      const curTName = normalizeName(targetChar.profile.name);

      // Check both directions if bidirectional, or specific direction
      const matchForward = sName === curSName && tName === curTName;
      const matchReverse =
        rel.bidirectional && sName === curTName && tName === curSName;

      return matchForward || matchReverse;
    });

    if (!existsInResult) {
      // If it exists in current links but NOT in analysis result, mark as removed
      removedRelations.push({
        id: link.id || `${link.source}-${link.target}`,
        source:
          typeof link.source === "string"
            ? link.source
            : (link.source as { id: string }).id,
        target:
          typeof link.target === "string"
            ? link.target
            : (link.target as { id: string }).id,
      });
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
        newRelations.push(
          transformAnalysisRelationshipToLink(
            rel,
            sourceChar._id,
            targetChar._id,
          ),
        );
      } else {
        // Update check
        const changes: ChangeItem[] = [];

        // CASE SENSITIVE FIX: Normalize both sides
        const newType = normalizeValues(rel.relation_type);
        const oldType = normalizeValues(existingLink.type);

        // Map generic "ALLY" to "friendly" equivalent if needed, but project usually uses lowercase.
        // Assuming backend might send UPPERCASE, frontend uses lowercase.
        // Also handling 'ally' vs 'friendly' mapping if feasible, but normalization covers case.
        if (newType !== oldType) {
          // Double check for known aliases if needed (e.g. ALLY == friendly)
          // But simply lowercasing solves "ALLY" != "ally"
          changes.push({
            field: "type",
            oldValue: existingLink.type,
            newValue: rel.relation_type, // Keep original casing for display if desired, or normalized
            description: `Type: ${existingLink.type} -> ${rel.relation_type}`,
          });
        }

        if (Math.abs(rel.strength - existingLink.strength) > 1) {
          // Threshold 1
          changes.push({
            field: "strength",
            oldValue: existingLink.strength,
            newValue: rel.strength,
            description: `Strength: ${existingLink.strength} -> ${rel.strength}`,
          });
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

import { calculateContentHash } from "./hashUtils";
export { calculateContentHash };

/**
 * Snapshop-based Diff Calculation
 * Compares two sets of frontend data (Snapshot vs Current) to determine what changed.
 */
export function calculateDiffFromSnapshot(
  prevCharacters: Character[],
  prevLinks: RelationshipLink[],
  nextCharacters: Character[],
  nextLinks: RelationshipLink[],
): AnalysisDiff {
  const newCharacters: Character[] = [];
  const updatedCharacters: { id: string; changes: ChangeItem[] }[] = [];
  const newRelations: RelationshipLink[] = [];
  const updatedRelations: { id: string; changes: ChangeItem[] }[] = [];
  const removedRelations: { id: string; source: string; target: string }[] = [];

  // Helper to normalize names
  const normalizeName = (name: string) =>
    name.trim().toLowerCase().replace(/\s+/g, " ");

  // [FIX] 스냅샷의 links가 비어있으면 관계 diff를 계산하지 않음
  // EditorPage와 WorldPage의 links 데이터 소스가 다르기 때문에
  // 스냅샷이 비어있거나 첫 분석인 경우 모든 관계가 "새로운" 것으로 표시되는 것을 방지
  const shouldSkipRelationsDiff =
    prevLinks.length === 0 && nextLinks.length > 0;

  // 1. Process Characters
  // Check for New Characters
  nextCharacters.forEach((nextChar) => {
    // Try to find by ID first, then fallback to Name
    const prevChar =
      prevCharacters.find((p) => p._id === nextChar._id) ||
      prevCharacters.find(
        (p) =>
          normalizeName(p.profile.name) ===
          normalizeName(nextChar.profile.name),
      );

    if (!prevChar) {
      newCharacters.push(nextChar);
    } else {
      // Check for updates
      const changes: ChangeItem[] = [];

      // Check key fields
      if (prevChar.role !== nextChar.role) {
        changes.push({
          field: "role",
          oldValue: prevChar.role,
          newValue: nextChar.role,
          description: `Role changed: ${prevChar.role} -> ${nextChar.role}`,
        });
      }

      const prevFaction = prevChar.profile.faction?.name || "무소속";
      const nextFaction = nextChar.profile.faction?.name || "무소속";
      if (prevFaction !== nextFaction) {
        changes.push({
          field: "faction",
          oldValue: prevFaction,
          newValue: nextFaction,
          description: `Faction: ${prevFaction} -> ${nextFaction}`,
        });
      }

      // Personality (Array comparison)
      const prevTraits = prevChar.personality.coreTraits || [];
      const nextTraits = nextChar.personality.coreTraits || [];
      const traitsChanged =
        prevTraits.length !== nextTraits.length ||
        !nextTraits.every((t) => prevTraits.includes(t));
      if (traitsChanged) {
        changes.push({
          field: "personality",
          oldValue: prevTraits,
          newValue: nextTraits,
          description: `Personality updated`,
        });
      }

      // Appearance
      const prevApp = prevChar.appearance;
      const nextApp = nextChar.appearance;
      const appearanceChanges: string[] = [];
      if (prevApp.physique !== nextApp.physique)
        appearanceChanges.push("physique");
      if (prevApp.hairStyle !== nextApp.hairStyle)
        appearanceChanges.push("hair");
      if (prevApp.eyes !== nextApp.eyes) appearanceChanges.push("eyes");
      if (appearanceChanges.length > 0) {
        changes.push({
          field: "appearance",
          oldValue: "Various",
          newValue: appearanceChanges.join(", "),
          description: `Appearance updated: ${appearanceChanges.join(", ")}`,
        });
      }

      if (changes.length > 0) {
        updatedCharacters.push({ id: nextChar._id, changes });
      }
    }
  });

  // 2. Process Relationships
  // Helper to safely extract ID from source/target (D3 may convert to objects)
  const getLinkId = (
    val: string | { id?: string; _id?: string } | unknown,
  ): string => {
    if (typeof val === "string") return val;
    if (typeof val === "object" && val !== null) {
      const obj = val as { id?: string; _id?: string };
      return obj._id || obj.id || String(val);
    }
    return String(val);
  };

  // 0. Build global ID-to-Name maps for robust matching
  const allChars = [...prevCharacters, ...nextCharacters];
  const idToName = new Map<string, string>();
  allChars.forEach((c) => {
    const id = c._id;
    const name = normalizeName(c.profile.name);
    if (id && name) idToName.set(id, name);
  });

  // Helper to get name from ID (normalized)
  const getName = (id: string) => idToName.get(id) || id.toLowerCase();

  // Check for New & Updated Relations
  // [FIX] 스냅샷 links가 비어있으면 관계 diff를 스킵
  if (!shouldSkipRelationsDiff) {
    nextLinks.forEach((nextLink) => {
      const nextSource = getLinkId(nextLink.source);
      const nextTarget = getLinkId(nextLink.target);
      const nextSourceNm = getName(nextSource);
      const nextTargetNm = getName(nextTarget);

      // Find corresponding link in previous set
      // Relationships are identified by Source-Target pair (ID or Name)
      const prevLink = prevLinks.find((p) => {
        const prevSource = getLinkId(p.source);
        const prevTarget = getLinkId(p.target);
        const prevSourceNm = getName(prevSource);
        const prevTargetNm = getName(prevTarget);

        // 1. Match by ID
        const idMatch =
          (prevSource === nextSource && prevTarget === nextTarget) ||
          (prevSource === nextTarget && prevTarget === nextSource);

        if (idMatch) return true;

        // 2. Match by Name (Fallback for when IDs change but identity remains)
        const nameMatch =
          (prevSourceNm === nextSourceNm && prevTargetNm === nextTargetNm) ||
          (prevSourceNm === nextTargetNm && prevTargetNm === nextSourceNm);

        return nameMatch;
      });

      if (!prevLink) {
        newRelations.push(nextLink);
      } else {
        // ... (Check for updates logic remains same)
        const changes: ChangeItem[] = [];
        const nextType = (nextLink.type || "").toLowerCase().trim();
        const prevType = (prevLink.type || "").toLowerCase().trim();
        const normalizeRelation = (t: string) =>
          t === "ally" ? "friendly" : t;

        if (normalizeRelation(prevType) !== normalizeRelation(nextType)) {
          changes.push({
            field: "type",
            oldValue: prevLink.type,
            newValue: nextLink.type,
            description: `Type: ${prevLink.type} -> ${nextLink.type}`,
          });
        }
        if (Math.abs((prevLink.strength || 0) - (nextLink.strength || 0)) > 1) {
          changes.push({
            field: "strength",
            oldValue: prevLink.strength,
            newValue: nextLink.strength,
            description: `Strength: ${prevLink.strength} -> ${nextLink.strength}`,
          });
        }
        if (prevLink.description !== nextLink.description) {
          changes.push({
            field: "description",
            oldValue: prevLink.description,
            newValue: nextLink.description,
            description: "Description updated",
          });
        }

        if (changes.length > 0) {
          updatedRelations.push({ id: nextLink.id, changes });
        }
      }
    });

    // Check for Removed Relations
    // Use a Set to track "still exists" pairs to prevent duplicates
    const matchedPrevIds = new Set<string>();

    nextLinks.forEach((n) => {
      const nSource = getLinkId(n.source);
      const nTarget = getLinkId(n.target);
      const nSourceNm = getName(nSource);
      const nTargetNm = getName(nTarget);

      prevLinks.forEach((p) => {
        const pSource = getLinkId(p.source);
        const pTarget = getLinkId(p.target);
        const pSourceNm = getName(pSource);
        const pTargetNm = getName(pTarget);

        const isMatch =
          (nSource === pSource && nTarget === pTarget) ||
          (nSource === pTarget && nTarget === pSource) ||
          (nSourceNm === pSourceNm && nTargetNm === pTargetNm) ||
          (nSourceNm === pTargetNm && nTargetNm === pSourceNm);

        if (isMatch) {
          matchedPrevIds.add(p.id);
        }
      });
    });

    prevLinks.forEach((prevLink) => {
      if (!matchedPrevIds.has(prevLink.id)) {
        // Double check by pair to be extra safe
        const pSource = getLinkId(prevLink.source);
        const pTarget = getLinkId(prevLink.target);
        const pSourceNm = getName(pSource);
        const pTargetNm = getName(pTarget);

        const existsInNext = nextLinks.some((n) => {
          const nSource = getLinkId(n.source);
          const nTarget = getLinkId(n.target);
          const nSourceNm = getName(nSource);
          const nTargetNm = getName(nTarget);
          return (
            (nSource === pSource && nTarget === pTarget) ||
            (nSource === pTarget && nTarget === pSource) ||
            (nSourceNm === pSourceNm && nTargetNm === pTargetNm) ||
            (nSourceNm === pTargetNm && nTargetNm === pSourceNm)
          );
        });

        if (!existsInNext) {
          removedRelations.push({
            id: prevLink.id,
            source: pSource,
            target: pTarget,
          });
        }
      }
    });
  } // End of shouldSkipRelationsDiff check

  return {
    newCharacters,
    updatedCharacters,
    newRelations,
    updatedRelations,
    removedRelations,
  };
}

function transformAnalysisRelationshipToLink(
  rel: import("@/types").AnalysisBackendRelationship,
  sourceId: string,
  targetId: string,
): RelationshipLink {
  return {
    id: `new-rel-${Date.now()}-${Math.random()}`,
    source: sourceId,
    target: targetId,
    type: (rel.relation_type.toLowerCase() as RelationType) || "neutral",
    strength: rel.strength,
    description: rel.description,
    curvature: 0.2,
  };
}
