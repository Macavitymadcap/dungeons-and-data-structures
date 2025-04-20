import { AdventureNode } from "./model.ts";

export class AdventureGraph {
    private nodes: Map<number, AdventureNode> = new Map();
    private currentNodeId: number;

    constructor(startingNodeId: number) {
        this.currentNodeId = startingNodeId;
    }

    addNode(node: AdventureNode): void {
        this.nodes.set(node.id, node);
    }

    getCurrentNode(): AdventureNode | undefined {
        return this.nodes.get(this.currentNodeId);
    }

    makeChoice(choiceId: number): boolean {
        const currentNode = this.getCurrentNode();
        const choiceIds = currentNode?.choices.map(choice => choice.nextNodeId)
        if (!currentNode || !choiceIds?.includes(choiceId)) {
            return false;
        }

        this.currentNodeId = choiceId;
        return true;
    }

    isAtEnding(): boolean {
        const currentNode = this.getCurrentNode();
        return currentNode ? currentNode.isEnding : false;
    }

    validateGraph(): boolean {
        for (const node of this.nodes.values()) {
            for (const choice of node.choices) {
                if (!this.nodes.has(choice.nextNodeId)) {
                    console.error(`Node ${node.id} has invalid choice to ${choice.nextNodeId}`);
                    return false;
                }
            }
        }
        return true;
    }
}