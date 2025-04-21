import { AdventureGraph } from "./adventure-graph.ts";
import { adventureNodes } from "./adventure-nodes.ts";
import { runGame } from "./run-game.ts";

export { AdventureGraph, adventureNodes, runGame };

if (import.meta.main) {
    const dungeon = new AdventureGraph(1);
    adventureNodes.forEach(node => dungeon.addNode(node));
    
    if (!dungeon.validateGraph()) {
        Deno.exit(1)
    }

    runGame(dungeon);
}
