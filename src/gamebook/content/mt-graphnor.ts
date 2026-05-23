import { Adventure } from "../model.ts";

export const mtGraphnorAdventure: Adventure = {
  id: "mt-graphnor",
  title: "Mt. Graphnor",
  startPassageId: "entrance",
  attribution: [
    "Uses original adventure content and SRD 5.1-compatible mechanics concepts.",
    "Dungeons & Dragons System Reference Document 5.1 is licensed under Creative Commons Attribution 4.0 International.",
  ],
  passages: [
    {
      id: "entrance",
      title: "Entrance And Guardian",
      body:
        "The prototype begins at a sealed mountain door watched by a nervous guard. This prose is placeholder copy for mechanics testing.",
      tags: ["start", "room-1"],
      choices: [
        {
          id: "fight-guard",
          text: "Force a way through",
          targetId: "guardian-clash",
          effects: { setFlags: ["challenged-guardian"] },
        },
        {
          id: "sneak-guard",
          text: "Slip past the guard",
          check: {
            kind: "skill",
            skill: "stealth",
            ability: "dexterity",
            dc: 12,
            onSuccess: "keyboard-room",
            onFailure: "guardian-clash",
          },
        },
        {
          id: "parley-guard",
          text: "Talk the guard into standing aside",
          check: {
            kind: "skill",
            skill: "persuasion",
            ability: "charisma",
            dc: 11,
            onSuccess: "keyboard-room",
            onFailure: "guardian-clash",
          },
        },
      ],
    },
    {
      id: "guardian-clash",
      title: "Guardian Clash",
      body:
        "A short blocker encounter records combat intent without requiring the full combat loop yet.",
      tags: ["room-1", "combat"],
      encounterId: "door-guardian",
      choices: [
        {
          id: "win-guardian",
          text: "Resolve the clash and enter",
          targetId: "keyboard-room",
          effects: { setFlags: ["guardian-resolved"], damage: 2 },
        },
        {
          id: "retreat-early",
          text: "Retreat before the dungeon claims more of you",
          targetId: "ending-retreat",
        },
      ],
    },
    {
      id: "keyboard-room",
      title: "Keyboard Room",
      body:
        "A puzzle mechanism waits in a chamber of labelled keys. The final riddle text belongs in the later narrative pass.",
      tags: ["room-2", "puzzle"],
      choices: [
        {
          id: "answer-puzzle",
          text: "Enter the correct answer",
          targetId: "trap-hall",
          effects: { setFlags: ["puzzle-solved"], addItems: ["brass-key"] },
        },
        {
          id: "investigate-puzzle",
          text: "Search for a clue",
          check: {
            kind: "skill",
            skill: "investigation",
            ability: "intelligence",
            dc: 12,
            onSuccess: "keyboard-room-clue",
            onFailure: "trap-hall",
          },
        },
        {
          id: "force-puzzle",
          text: "Force the mechanism",
          targetId: "trap-hall",
          effects: { damage: 1, setFlags: ["forced-puzzle"] },
        },
      ],
    },
    {
      id: "keyboard-room-clue",
      title: "Keyboard Room Clue",
      body:
        "The search path teaches that a puzzle can have more than one route through the graph.",
      tags: ["room-2", "puzzle"],
      choices: [
        {
          id: "use-clue",
          text: "Use the clue and move on",
          targetId: "trap-hall",
          effects: { setFlags: ["puzzle-solved"], addItems: ["brass-key"] },
        },
      ],
    },
    {
      id: "trap-hall",
      title: "Closing Wall",
      body:
        "The setback room applies damage, flags, or an item solution before allowing the route to continue.",
      tags: ["room-3", "trap"],
      choices: [
        {
          id: "dodge-trap",
          text: "Dive through the gap",
          check: {
            kind: "savingThrow",
            ability: "dexterity",
            dc: 13,
            onSuccess: "climax",
            onFailure: "trap-hit",
          },
        },
        {
          id: "use-key",
          text: "Jam the wall gears with the brass key",
          targetId: "climax",
          requires: { itemsAll: ["brass-key"] },
          effects: { setFlags: ["trap-disabled"], removeItems: ["brass-key"] },
        },
        {
          id: "take-the-hit",
          text: "Brace yourself and keep moving",
          targetId: "climax",
          effects: { damage: 3, setFlags: ["trap-triggered"] },
        },
      ],
    },
    {
      id: "trap-hit",
      title: "Trap Consequence",
      body:
        "The failed save route keeps the adventure moving while preserving consequences in state.",
      tags: ["room-3", "trap"],
      choices: [
        {
          id: "continue-injured",
          text: "Continue injured",
          targetId: "climax",
          effects: { damage: 4, setFlags: ["trap-triggered"] },
        },
        {
          id: "fail-in-trap",
          text: "Lose your nerve in the closing passage",
          targetId: "ending-failure",
        },
      ],
    },
    {
      id: "climax",
      title: "Climax Guardian",
      body:
        "The final obstacle is scaled for a level-one prototype: dangerous enough to test combat, not a full dragon fight.",
      tags: ["room-4", "combat"],
      encounterId: "ember-statue",
      choices: [
        {
          id: "fight-climax",
          text: "Stand and fight",
          targetId: "reward",
          effects: { setFlags: ["climax-defeated"], damage: 3 },
        },
        {
          id: "use-puzzle-knowledge",
          text: "Exploit what the puzzle taught you",
          targetId: "reward",
          requires: { flagsAll: ["puzzle-solved"] },
          effects: { setFlags: ["climax-bypassed"] },
        },
        {
          id: "retreat-climax",
          text: "Retreat with what you learned",
          targetId: "ending-retreat",
        },
      ],
    },
    {
      id: "reward",
      title: "Reward And Twist",
      body:
        "The reward room records a victory and leaves a hook for the final narrative pass.",
      tags: ["room-5", "reward"],
      choices: [
        {
          id: "claim-reward",
          text: "Claim the reward",
          targetId: "ending-victory",
          effects: { addItems: ["graphnor-map"], setFlags: ["reward-claimed"] },
        },
        {
          id: "leave-hook",
          text: "Leave with only the strange map",
          targetId: "ending-cliffhanger",
          effects: { addItems: ["graphnor-map"] },
        },
      ],
    },
    {
      id: "ending-victory",
      title: "Victory",
      body: "Victory ending placeholder.",
      ending: "victory",
      choices: [],
    },
    {
      id: "ending-failure",
      title: "Failure",
      body: "Failure ending placeholder.",
      ending: "failure",
      choices: [],
    },
    {
      id: "ending-retreat",
      title: "Retreat",
      body: "Retreat or partial-success ending placeholder.",
      ending: "retreat",
      choices: [],
    },
    {
      id: "ending-cliffhanger",
      title: "Cliffhanger",
      body: "Cliffhanger ending placeholder.",
      ending: "cliffhanger",
      choices: [],
    },
  ],
};
