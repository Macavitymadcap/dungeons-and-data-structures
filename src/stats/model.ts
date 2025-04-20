export type Size = 'Tiny' | 'Small' | 'Medium' | 'Large' | 'Huge' | 'Gargantuan';

export type Ability = 'strength' | 
'dexterity' | 
'constitution' | 
'intelligence' | 
'wisdom' | 
'charisma';

export type DamageType = 
'bludgeoning' | 
'piercing' | 
'slashing' | 
'fire' | 
'cold' | 
'lightning' | 
'acid' | 
'poison' | 
'necrotic' | 
'radiant' | 
'force' | 
'psychic';

export type Condition = 
'blinded' | 
'charmed' | 
'deafened' | 
'frightened' | 
'grappled' | 
'incapacitated' | 
'paralyzed' | 
'petrified' | 
'poisoned' | 
'prone' | 
'restrained' | 
'stunned' | 
'unconscious';

export type Speed = { 
    walk?: number; 
    fly?: number; 
    swim?: number; 
    climb?: number; 
    burrow?: number; 
}

type Dice = `${number | ''}d${number}`;

type Modifier = `${'+' | '-'} ${Dice | number}`

export type Roll =`${Dice}${Modifier | ''}`;

export type Damage = {
    type: DamageType;
    roll: Roll | number;
    description?: string;
}

export type Attack = {
    name: string;
    modifier: number;
    damage?: Damage[];
    description?: string;
}

export type SavingThrow = {
    name: string;
    ability: Ability;
    dc: number;
    damage?: Damage[];
    description?: string;
}

export type Trait = {
    name: string;
    description: string;
}

export type ActionsArray = (Trait | Attack | SavingThrow)[];

export type Item = {
    name: string;
    weight?: number;
    description?: string;
    properties?: string[];
}

export type DialogueOption = {
    text: string;
    key: string;
}