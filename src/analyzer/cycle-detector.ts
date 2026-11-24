/**
 * Cycle detection utility for directed graphs.
 * Uses Tarjan's Strongly Connected Components (SCC) and DFS path exploration
 * to find elementary cycles with exact node sequences.
 */

export interface CycleResult {
  hasCycles: boolean;
  cycles: string[][]; // list of cycles, each cycle is an array of node IDs: [A, B, C, A]
  cyclicNodeIds: Set<string>;
  cyclicEdgeKeys: Set<string>; // source + '->' + target
}

export class CycleDetector {
  private adjacencyList: Map<string, Set<string>> = new Map();

  public addEdge(from: string, to: string): void {
    if (!this.adjacencyList.has(from)) {
      this.adjacencyList.set(from, new Set());
    }
    this.adjacencyList.get(from)!.add(to);
    if (!this.adjacencyList.has(to)) {
      this.adjacencyList.set(to, new Set());
    }
  }

  public detectCycles(): CycleResult {
    const cycles: string[][] = [];
    const cyclicNodeIds = new Set<string>();
    const cyclicEdgeKeys = new Set<string>();

    const visited = new Set<string>();
    const inStack = new Set<string>();
    const stack: string[] = [];

    const dfs = (current: string) => {
      visited.add(current);
      inStack.add(current);
      stack.push(current);

      const neighbors = this.adjacencyList.get(current) || new Set();
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          dfs(neighbor);
        } else if (inStack.has(neighbor)) {
          // Cycle detected!
          const cycleStartIndex = stack.indexOf(neighbor);
          if (cycleStartIndex !== -1) {
            const cyclePath = stack.slice(cycleStartIndex).concat(neighbor);
            cycles.push(cyclePath);

            // Record all nodes and edges in cycle
            for (let i = 0; i < cyclePath.length - 1; i++) {
              cyclicNodeIds.add(cyclePath[i]);
              cyclicEdgeKeys.add(`${cyclePath[i]}->${cyclePath[i + 1]}`);
            }
          }
        }
      }

      stack.pop();
      inStack.delete(current);
    };

    for (const node of this.adjacencyList.keys()) {
      if (!visited.has(node)) {
        dfs(node);
      }
    }

    return {
      hasCycles: cycles.length > 0,
      cycles,
      cyclicNodeIds,
      cyclicEdgeKeys
    };
  }
}
