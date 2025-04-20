import { AdventureGraph } from "./adventure-graph.ts";
import { adventureNodes } from "./adventure-nodes.ts";
import { runGame } from "./run-game.ts";

if (import.meta.main) {
    const dungeon = new AdventureGraph(1);
    // Add the nodes
    adventureNodes.forEach(node => dungeon.addNode(node));
    
    // Validate the graph
    if (!dungeon.validateGraph()) {
        Deno.exit(1)
    }

    runGame(dungeon);
}
