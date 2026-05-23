import { Adventure, EndingKind, PassageTag } from "../model.ts";

export type FiveRoomTag = Extract<
  PassageTag,
  "room-1" | "room-2" | "room-3" | "room-4" | "room-5"
>;

export interface FiveRoomTemplateRoom {
  conceptPayoffs: string[];
  mechanicalRole: string;
  requiredFeatures: string[];
  tag: FiveRoomTag;
  title: string;
}

export interface FiveRoomTemplateIssue {
  code: "missing-room" | "missing-ending";
  message: string;
  roomTag?: FiveRoomTag;
  ending?: EndingKind;
}

export const FIVE_ROOM_TEMPLATE: FiveRoomTemplateRoom[] = [
  {
    tag: "room-1",
    title: "Entrance And Guardian",
    mechanicalRole: "First branching obstacle with a blocker or guardian.",
    requiredFeatures: ["fight route", "sneak route", "parley route"],
    conceptPayoffs: ["branching choices", "ability checks", "early consequences"],
  },
  {
    tag: "room-2",
    title: "Puzzle Or Roleplaying Challenge",
    mechanicalRole: "Non-combat challenge with more than one valid solution.",
    requiredFeatures: ["answer route", "investigation route", "force route"],
    conceptPayoffs: ["flags", "puzzle gates", "alternate solutions"],
  },
  {
    tag: "room-3",
    title: "Trick Or Setback",
    mechanicalRole: "Trap or setback that changes state without always ending the run.",
    requiredFeatures: ["saving throw", "item solution", "damage consequence"],
    conceptPayoffs: ["state transitions", "damage", "persistent consequences"],
  },
  {
    tag: "room-4",
    title: "Climax",
    mechanicalRole: "Final obstacle that can be fought, bypassed, or retreated from.",
    requiredFeatures: ["combat route", "bypass route", "retreat route"],
    conceptPayoffs: ["combat loop", "encounter state", "multiple endings"],
  },
  {
    tag: "room-5",
    title: "Reward And Twist",
    mechanicalRole: "Ending resolver that pays off victory or sets up a hook.",
    requiredFeatures: ["reward route", "twist route"],
    conceptPayoffs: ["endings", "replay paths", "persistent choices"],
  },
];

export const FIVE_ROOM_REQUIRED_ENDINGS: EndingKind[] = [
  "victory",
  "failure",
  "retreat",
  "cliffhanger",
];

export function validateFiveRoomTemplate(adventure: Adventure): FiveRoomTemplateIssue[] {
  const tags = new Set(adventure.passages.flatMap((passage) => passage.tags ?? []));
  const endings = new Set(
    adventure.passages.flatMap((passage) => passage.ending ? [passage.ending] : []),
  );
  const issues: FiveRoomTemplateIssue[] = [];

  for (const room of FIVE_ROOM_TEMPLATE) {
    if (!tags.has(room.tag)) {
      issues.push({
        code: "missing-room",
        message: `Adventure is missing ${room.tag}: ${room.title}.`,
        roomTag: room.tag,
      });
    }
  }

  for (const ending of FIVE_ROOM_REQUIRED_ENDINGS) {
    if (!endings.has(ending)) {
      issues.push({
        code: "missing-ending",
        message: `Adventure is missing a ${ending} ending.`,
        ending,
      });
    }
  }

  return issues;
}
