export interface Choice {
    text: string;
    nextNodeId: number;
}

export interface AdventureNode {
    id: number;
    text: string;
    choices: Choice[];
    isEnding: boolean;
}
