export const adventureNodes = [
    {
    id: 1,
    text: `You stand at the entrance of the dungeon. A goblin guards the doorway, eyeing you suspiciously.`,
    choices: [
      { text: `Attack the goblin`, nextNodeId: 2 },
      { text: `Try to sneak past while it's distracted`, nextNodeId: 2 },
      { text: `Offer gold to pass`, nextNodeId: 2 }
    ],
    isEnding: false
  },
  {
    id: 2,
    text: `You enter a chamber with a stone pedestal in the center. There's a riddle inscribed: 'I speak without a mouth and hear without ears. I have no body, but I come alive with wind.'`,
    choices: [
      { text: `Answer 'Echo'`, nextNodeId: 3 },
      { text: `Smash the pedestal`, nextNodeId: 5 }
    ],
    isEnding: false
  },
 { 
    id: 3,
    text: `The pedestal slides away, revealing a hidden compartment with a glittering treasure chest.`,
    choices: [
      { text: `Take the treasure`, nextNodeId: 4 },
      { text: `Leave it and proceed`, nextNodeId: 5 }
    ],
    isEnding: false
  },
  {
    id: 4,
    text: `As you lift the treasure, you hear a click. The floor beneath you begins to crumble, revealing spikes!`,
    choices: [
      { text: `Try to disarm the trap`, nextNodeId: 5 },
      { text: `Jump but fail to escape`, nextNodeId: 6 }
    ],
    isEnding: false
  },
  {
    id: 5,
    text: `You enter a massive chamber with ancient columns. A dragon sleeps on a pile of gold in the center.`,
    choices: [
      { text: `Fight the dragon`, nextNodeId: 7 },
      { text: `Flee the dungeon`, nextNodeId: 8 }
    ],
    isEnding: false
  },
  {
    id: 6,
    text: `The spikes impale you. Your adventure ends here.`,
    choices: [],
    isEnding: true
  },
  {
    id: 7,
    text: `After a fierce battle, you defeat the dragon and claim its hoard. You are victorious!`,
    choices: [],
    isEnding: true
  },
  {
    id: 8,
    text: `You escape the dungeon with your life, if not your pride. Perhaps another day you'll return better prepared.`,
    choices: [],
    isEnding: true
  }
];