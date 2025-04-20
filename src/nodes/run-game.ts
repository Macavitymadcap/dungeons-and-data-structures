import { AdventureGraph } from './adventure-graph.ts';

const getNextNodeId = (choiceIds: number[]): number => {
    let nextNodeId = undefined;

    while (!nextNodeId) {
        nextNodeId = prompt("Choose: ")

        if (!nextNodeId || !choiceIds.includes(parseInt(nextNodeId))) {
            console.log('Please choose from the listed numbers in square brackets');
            getNextNodeId(choiceIds);
        }
    }

    return parseInt(nextNodeId);
}

export const runGame = (graph: AdventureGraph) => {
    
    const currentNode = graph.getCurrentNode();
    
    if (!currentNode) {
        return
    }
    console.log(currentNode.text);

    if (graph.isAtEnding()) {
        return
    }

    if (currentNode.choices.length !== 0) {
        currentNode.choices.forEach((choice) => console.log(`[${choice.nextNodeId}]: ${choice.text}`));
    }

    const nextNodeId = getNextNodeId(currentNode.choices.map(choice => choice.nextNodeId));
    if (graph.makeChoice(nextNodeId)) {
        runGame(graph);
    }
}