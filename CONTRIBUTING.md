# Contributing to NgLens

Thank you for your interest in contributing to NgLens!

## Development Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/pratik/nglens.git
   cd nglens
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the project (bundles the UI and compiles TypeScript):
   ```bash
   npm run build
   ```

4. Run the automated tests:
   ```bash
   npm test
   ```

5. Test the demo visualizer:
   ```bash
   npm run demo
   ```

## Project Structure

- `src/analyzer/`: TypeScript Compiler API AST analysis, template parsing, and cycle detection.
- `src/ui/`: Cytoscape.js interactive visualization graph, inspector drawer, and health audit panel.
- `src/server/`: Lightweight local HTTP server serving the standalone visualizer.
- `src/cli/`: Commander-based CLI tool (`nglens`, `export`, `audit`, `demo`).
- `src/vscode/`: VS Code Webview extension entrypoint.
- `examples/`: Sample Angular project used for end-to-end testing.

## Submitting Pull Requests

1. Fork the repository and create a new feature branch.
2. Ensure all tests pass with `npm test`.
3. Verify that the build succeeds with `npm run build`.
4. Open a Pull Request with a clear description of your changes.
