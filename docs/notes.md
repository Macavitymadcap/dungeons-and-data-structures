# notes

## Graphs

- a graph is a set of vertices (nodes) and edges (connections between nodes). 
- a complete graph is a graph in which every pair of nodes is connected by an edge
- a node is a point in the graph
- an edge is a line connecting two nodes. 
- a directed graph has edges that have a direction
- a cyclic graph is a graph that has cycles
- a directed acyclic graph (DAG) is a directed graph with no cycles.
- an undirected graph does not not have a direction
- a weighted graph has edges that have a weight
- an unweighted graph does not have a weight

### Trees
Trees are;
    1. connected and acyclic
    2. removing a edge disconnects the graph
    3. adding an edge creates a cycle 

## examples of nodes
- a walking route in a grid
- sudoku
- a social network
- a chess board
- a maze
- a game of tic-tac-toe

## Adjancency List

a list of all the nodes in the graph and their neighbours, e.g.:
```
A = [B, C]
B = [A, D]
C = [A, D]
D = [B, C]
```

## Adjacency Matrix
an array of arrays, e.g.:
```
A = [0, 1, 1, 0]
B = [1, 0, 0, 1]
C = [1, 0, 0, 1]
D = [0, 1, 1, 0]
```
where the rows and columns are the nodes in the graph. The value at row i and column j is 1 if there is an edge between node i and node j, and 0 otherwise.

## Glossary
- *Neighbours*: two vertices are neighbours if they are connected by an edge.
- *Degree*: the degree of a vertex is the number of edges connected to it.
- *Path*: a path is a sequence of vertices connected by edges.
- *Cycle*: a cycle is a path that starts and ends at the same vertex.
- *Connectivity*: a graph is connected if there is a path between every pair of vertices. | a graph is connected all vertices are reachable from any other vertex.
- *Connected Component*: A subset of vertices that is connected and not connected to any other vertices in the graph.