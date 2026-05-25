import { Adventure } from "../model.ts";
import { EQUIPMENT_RULES, gamebookRuleAttributions } from "../rules/srd.ts";

export const mtGraphnorAdventure: Adventure = {
  id: "mt-graphnor",
  title: "Mt. Graphnor",
  startPassageId: "entrance",
  attribution: gamebookRuleAttributions(),
  items: [
    EQUIPMENT_RULES.sword,
    EQUIPMENT_RULES.shield,
    EQUIPMENT_RULES.ration,
    EQUIPMENT_RULES.shortsword,
    EQUIPMENT_RULES["thieves-tools"],
    EQUIPMENT_RULES.staff,
    EQUIPMENT_RULES.spellbook,
    EQUIPMENT_RULES.mace,
    EQUIPMENT_RULES["holy-symbol"],
    EQUIPMENT_RULES["stone-token"],
    EQUIPMENT_RULES["lucky-charm"],
    EQUIPMENT_RULES["brass-key"],
    EQUIPMENT_RULES["graphnor-map"],
  ],
  discoveries: [
    { id: "challenged-guardian", name: "Challenged the door guardian" },
    { id: "puzzle-solved", name: "Solved the keyboard room" },
    { id: "forced-puzzle", name: "Forced the puzzle mechanism" },
    { id: "trap-disabled", name: "Disabled the closing wall" },
    { id: "trap-triggered", name: "Triggered the closing wall" },
    { id: "climax-bypassed", name: "Bypassed the ember statue" },
    { id: "reward-claimed", name: "Claimed Mt. Graphnor's reward" },
  ],
  encounters: [
    {
      id: "door-guardian",
      name: "Door Guardian",
      armourClass: 12,
      hitPoints: 6,
      attack: {
        name: "Club",
        attackBonus: 3,
        damage: { dice: 1, sides: 4, modifier: 1, type: "bludgeoning" },
      },
    },
    {
      id: "ember-statue",
      name: "Ember Statue",
      armourClass: 13,
      hitPoints: 8,
      attack: {
        name: "Ember Slam",
        attackBonus: 4,
        damage: { dice: 1, sides: 6, modifier: 1, type: "fire" },
      },
    },
  ],
  passages: [
    {
      id: "entrance",
      title: "Entrance And Guardian",
      body:
        "A rain-dark path ends at a mountain door carved with five interlocking circles. A wary guard grips a cudgel under the lintel, more frightened than fierce, and blocks the way inside.",
      tags: ["start", "room-1", "roleplay"],
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
        "The guard loses nerve and swings first. Pebbles jump beneath your boots as the sealed door hums behind the scuffle.",
      tags: ["room-1", "combat"],
      encounterId: "door-guardian",
      choices: [
        {
          id: "win-guardian",
          text: "Trade blows with the guardian",
          combat: {
            encounterId: "door-guardian",
            onVictory: "keyboard-room",
            onDefeat: "ending-failure",
            onContinue: "guardian-clash",
          },
        },
        {
          id: "retreat-early",
          text: "Retreat before the dungeon claims more of you",
          targetId: "ending-retreat",
        },
        {
          id: "catch-breath-guardian",
          text: "Use a ration and catch your breath",
          targetId: "guardian-clash",
          requires: { hitPointsBelowMax: true, itemsAll: ["ration"] },
          effects: { removeItems: ["ration"], heal: 2 },
        },
      ],
    },
    {
      id: "keyboard-room",
      title: "Keyboard Room",
      body:
        "Beyond the door waits a low chamber lined with stone keys, each marked by a different angular rune. A brass plate reads: press the sign that opens a path without becoming one.",
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
          id: "use-tools-on-puzzle",
          text: "Probe the mechanism with thieves' tools",
          targetId: "keyboard-room-clue",
          requires: { itemsAll: ["thieves-tools"] },
          effects: { setFlags: ["puzzle-solved"] },
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
        "Dust around the keys has been disturbed in a neat little trail. The safest rune is not the brightest one, but the one worn smooth by earlier careful hands.",
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
        "The next passage narrows to a throat of black stone. Halfway through, hidden gears grind awake and the walls begin to close.",
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
        "Stone clips your shoulder and drives the breath from you. There is still a gap ahead, but panic is now as dangerous as the wall.",
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
        "A squat statue waits in the last vault, its stone jaws glowing with banked embers. When you cross the threshold, ash falls from its wings and its eyes open.",
      tags: ["room-4", "combat"],
      encounterId: "ember-statue",
      choices: [
        {
          id: "fight-climax",
          text: "Stand and fight",
          combat: {
            encounterId: "ember-statue",
            onVictory: "reward",
            onDefeat: "ending-failure",
            onContinue: "climax",
          },
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
        {
          id: "catch-breath-climax",
          text: "Use a ration and catch your breath",
          targetId: "climax",
          requires: { hitPointsBelowMax: true, itemsAll: ["ration"] },
          effects: { removeItems: ["ration"], heal: 2 },
        },
      ],
    },
    {
      id: "reward",
      title: "Reward And Twist",
      body:
        "The statue's alcove opens onto a dry chamber of old offerings. Among the coins lies a folded map of Mt. Graphnor, showing rooms that should not fit inside the mountain.",
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
      body:
        "You leave Mt. Graphnor with the strange map, a pocket of treasure, and the useful knowledge that the mountain can be survived. For now, that is victory enough.",
      ending: "victory",
      choices: [],
    },
    {
      id: "ending-failure",
      title: "Failure",
      body:
        "The dungeon does not kill you cleanly; it turns you around, empties your courage, and sends you stumbling back into the rain with nothing but bruises.",
      ending: "failure",
      choices: [],
    },
    {
      id: "ending-retreat",
      title: "Retreat",
      body:
        "You withdraw before the mountain can demand more. The door closes behind you, but you carry enough hard-won knowledge to return with a better plan.",
      ending: "retreat",
      choices: [],
    },
    {
      id: "ending-cliffhanger",
      title: "Cliffhanger",
      body:
        "You take only the map and leave the treasure untouched. By moonrise, one inked passage has moved, pointing toward a deeper door beneath the hill.",
      ending: "cliffhanger",
      choices: [],
    },
  ],
};
