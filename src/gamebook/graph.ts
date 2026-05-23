import { Adventure, Choice, Passage, PassageId } from "./model.ts";

export type GraphIssueCode =
  | "missing-start"
  | "duplicate-passage"
  | "duplicate-item"
  | "duplicate-discovery"
  | "duplicate-encounter"
  | "missing-target"
  | "missing-encounter"
  | "missing-item"
  | "missing-discovery"
  | "targetless-choice"
  | "empty-non-ending"
  | "unreachable-passage"
  | "unreachable-ending";

export interface GraphIssue {
  code: GraphIssueCode;
  message: string;
  passageId?: PassageId;
  choiceId?: string;
  targetId?: PassageId;
  encounterId?: string;
  itemId?: string;
  discoveryId?: string;
}

export interface GraphValidation {
  valid: boolean;
  issues: GraphIssue[];
  reachablePassageIds: Set<PassageId>;
}

export function createPassageMap(passages: Passage[]): Map<PassageId, Passage> {
  return new Map(passages.map((passage) => [passage.id, passage]));
}

export function choiceTargets(choice: Choice): PassageId[] {
  const targets: PassageId[] = [];
  if (choice.targetId) {
    targets.push(choice.targetId);
  }
  if (choice.check) {
    targets.push(choice.check.onSuccess, choice.check.onFailure);
  }
  if (choice.combat) {
    targets.push(
      choice.combat.onVictory,
      choice.combat.onDefeat,
      choice.combat.onContinue,
    );
  }
  return targets;
}

export function getReachablePassageIds(adventure: Adventure): Set<PassageId> {
  const passages = createPassageMap(adventure.passages);
  const reachable = new Set<PassageId>();
  const queue: PassageId[] = [adventure.startPassageId];

  while (queue.length > 0) {
    const passageId = queue.shift()!;
    if (reachable.has(passageId)) {
      continue;
    }

    const passage = passages.get(passageId);
    if (!passage) {
      continue;
    }

    reachable.add(passageId);
    for (const choice of passage.choices) {
      for (const targetId of choiceTargets(choice)) {
        if (!reachable.has(targetId)) {
          queue.push(targetId);
        }
      }
    }
  }

  return reachable;
}

export function validateAdventure(adventure: Adventure): GraphValidation {
  const issues: GraphIssue[] = [];
  const passages = createPassageMap(adventure.passages);
  const encounterIds = new Set((adventure.encounters ?? []).map((encounter) => encounter.id));
  const itemIds = new Set((adventure.items ?? []).map((item) => item.id));
  const discoveryIds = new Set(
    (adventure.discoveries ?? []).map((discovery) => discovery.id),
  );
  const seen = new Set<PassageId>();

  addDuplicateIssues(
    issues,
    (adventure.items ?? []).map((item) => item.id),
    "duplicate-item",
    (id) => `Item "${id}" is defined more than once.`,
  );
  addDuplicateIssues(
    issues,
    (adventure.discoveries ?? []).map((discovery) => discovery.id),
    "duplicate-discovery",
    (id) => `Discovery "${id}" is defined more than once.`,
  );
  addDuplicateIssues(
    issues,
    (adventure.encounters ?? []).map((encounter) => encounter.id),
    "duplicate-encounter",
    (id) => `Encounter "${id}" is defined more than once.`,
  );

  for (const passage of adventure.passages) {
    if (seen.has(passage.id)) {
      issues.push({
        code: "duplicate-passage",
        passageId: passage.id,
        message: `Passage "${passage.id}" is defined more than once.`,
      });
    }
    seen.add(passage.id);
  }

  if (!passages.has(adventure.startPassageId)) {
    issues.push({
      code: "missing-start",
      targetId: adventure.startPassageId,
      message: `Start passage "${adventure.startPassageId}" does not exist.`,
    });
  }

  for (const passage of adventure.passages) {
    if (!passage.ending && passage.choices.length === 0) {
      issues.push({
        code: "empty-non-ending",
        passageId: passage.id,
        message: `Non-ending passage "${passage.id}" has no choices.`,
      });
    }

    for (const choice of passage.choices) {
      if (choiceTargets(choice).length === 0) {
        issues.push({
          code: "targetless-choice",
          passageId: passage.id,
          choiceId: choice.id,
          message:
            `Choice "${choice.id}" in passage "${passage.id}" has no target, check, or combat outcome.`,
        });
      }
      if (choice.combat && !encounterIds.has(choice.combat.encounterId)) {
        issues.push({
          code: "missing-encounter",
          passageId: passage.id,
          choiceId: choice.id,
          encounterId: choice.combat.encounterId,
          message:
            `Choice "${choice.id}" in passage "${passage.id}" references missing encounter "${choice.combat.encounterId}".`,
        });
      }
      for (const itemId of itemReferences(choice)) {
        if (!itemIds.has(itemId)) {
          issues.push({
            code: "missing-item",
            passageId: passage.id,
            choiceId: choice.id,
            itemId,
            message:
              `Choice "${choice.id}" in passage "${passage.id}" references missing item "${itemId}".`,
          });
        }
      }
      for (const discoveryId of discoveryReferences(choice)) {
        if (!discoveryIds.has(discoveryId)) {
          issues.push({
            code: "missing-discovery",
            passageId: passage.id,
            choiceId: choice.id,
            discoveryId,
            message:
              `Choice "${choice.id}" in passage "${passage.id}" references missing discovery "${discoveryId}".`,
          });
        }
      }
      for (const targetId of choiceTargets(choice)) {
        if (!passages.has(targetId)) {
          issues.push({
            code: "missing-target",
            passageId: passage.id,
            choiceId: choice.id,
            targetId,
            message:
              `Choice "${choice.id}" in passage "${passage.id}" targets missing passage "${targetId}".`,
          });
        }
      }
    }
  }

  const reachablePassageIds = getReachablePassageIds(adventure);
  for (const passage of adventure.passages) {
    if (!reachablePassageIds.has(passage.id)) {
      issues.push({
        code: "unreachable-passage",
        passageId: passage.id,
        message: `Passage "${passage.id}" is not reachable from the start.`,
      });
    }
    if (passage.ending && !reachablePassageIds.has(passage.id)) {
      issues.push({
        code: "unreachable-ending",
        passageId: passage.id,
        message: `Ending passage "${passage.id}" cannot be reached.`,
      });
    }
  }

  return {
    valid: issues.length === 0,
    issues,
    reachablePassageIds,
  };
}

function addDuplicateIssues(
  issues: GraphIssue[],
  values: string[],
  code: GraphIssueCode,
  message: (id: string) => string,
): void {
  const seen = new Set<string>();
  const reported = new Set<string>();
  for (const value of values) {
    if (!seen.has(value)) {
      seen.add(value);
      continue;
    }
    if (reported.has(value)) {
      continue;
    }
    reported.add(value);
    issues.push({ code, message: message(value) });
  }
}

function itemReferences(choice: Choice): string[] {
  return [
    ...(choice.requires?.itemsAll ?? []),
    ...(choice.effects?.addItems ?? []),
    ...(choice.effects?.removeItems ?? []),
  ];
}

function discoveryReferences(choice: Choice): string[] {
  return [
    ...(choice.requires?.flagsAll ?? []),
    ...(choice.requires?.flagsNone ?? []),
    ...(choice.effects?.setFlags ?? []),
  ];
}

export function exportMermaid(adventure: Adventure): string {
  const lines = ["flowchart TD"];
  for (const passage of adventure.passages) {
    lines.push(`  ${nodeId(passage.id)}["${escapeMermaid(passage.title)}"]`);
    for (const choice of passage.choices) {
      for (const targetId of choiceTargets(choice)) {
        lines.push(
          `  ${nodeId(passage.id)} -->|"${escapeMermaid(choice.text)}"| ${
            nodeId(targetId)
          }`,
        );
      }
    }
  }
  return `${lines.join("\n")}\n`;
}

function nodeId(passageId: PassageId): string {
  return `p_${passageId.replace(/[^a-zA-Z0-9_]/g, "_")}`;
}

function escapeMermaid(text: string): string {
  return text.replace(/"/g, "'");
}
