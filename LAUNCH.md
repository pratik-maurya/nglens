# 🚀 NgLens Social Launch Playbook

Use these ready-to-post templates across Reddit, Twitter/X, and LinkedIn to launch **NgLens / Super Angular**.

---

## 1. Reddit (`r/Angular2` & `r/javascript`)

**Title:**
> I built NgLens: An interactive visual component & signals graph for modern Angular (1-click circular dependency detection & signals flow)

**Post Body:**
```markdown
Hey r/Angular2! 👋

Over the past 4+ years working deeply with Angular, I’ve loved the modern renaissance—Standalone Components, Signals (`signal`, `computed`, `model`, `effect`), and new reactive primitives.

However, as applications grow, one thing became increasingly painful: **visualizing the mental model of your architecture**.

- How do Signals cascade from stores into child components?
- Are there sneaky circular dependencies lingering between components?
- Which standalone components are orphans/dead code that nobody imports anymore?

React has visual component tree tools, but Angular has had very few developer tools tailored specifically for our modern architecture.

So I built **NgLens** (Super Angular):
👉 **GitHub Repo**: [Link to your GitHub]
👉 **Zero-config trial**: `npx nglens demo`

### 🌟 Key Highlights:
1. **Interactive Architecture Tree**: Visual Dagre/Cytoscape tree of your app from root to leaf components.
2. **Signals & State Flow**: Traces `signal` ➔ `computed` ➔ template reads and shows real-time Signal adoption rates.
3. **1-Click Health Auditor**:
   - Detects circular dependencies with exact cyclic paths (e.g. `CompA ➔ CompB ➔ CompA`).
   - Identifies dead / orphan standalone components.
   - Detects missing imports when a child tag is used in a template.
4. **Standalone Offline Reports**: `npx nglens export` produces a 100% self-contained single-file HTML report (0 CDN dependencies) that you can attach to PRs.
5. **CI/CD Quality Gate**: `npx nglens audit` exits with code 1 if circular dependencies exist.
6. **VS Code Webview Extension**: Run side-by-side with your code with a 1-click "Open in Editor" jump.

### ⚡ Quick Start:
To test drive it immediately without needing an open repo:
`npx nglens demo`

Or run it in your Angular project:
`npx nglens`

Would love to hear your thoughts, feedback, and what features you’d like to see next!
```

---

## 2. Twitter / X Announcement Thread

**Tweet 1 (Hook + Video/GIF):**
> 🅰️ Introducing **NgLens**: An interactive visual component & signals graph for modern Angular!
> 
> Visualize your component trees, trace Angular Signals flow, and detect circular dependencies in 1 click.
> 
> Zero config. Try it now: `npx nglens demo` 🧵👇

**Tweet 2:**
> Modern Angular (v16–v19) with Standalone Components & Signals is incredible, but large architectures get hard to mentally track.
> 
> NgLens parses your TypeScript AST and templates to generate an interactive architecture graph of your app.

**Tweet 3:**
> 🩺 1-Click Health Auditor:
> • Flags circular dependencies with exact paths
> • Spots orphan standalone components
> • Identifies missing template imports
> • Computes your Modern Signal Adoption %

**Tweet 4:**
> 📦 Features:
> • CLI dev server (`npx nglens`)
> • CI/CD audit command (`npx nglens audit`)
> • Offline single-file HTML report export
> • VS Code Webview extension with "Jump to File"
> 
> Built for the Angular community: [GitHub Link]

---

## 3. LinkedIn Article / Post

```text
🚀 Excited to release NgLens: A Visual Architecture & Signals Graph for Modern Angular!

As someone with 4+ years of deep Angular development experience, I’ve been thrilled by the evolution of Angular v16–v19: Standalone Components, fine-grained Signals, and modern functional DI.

Yet, visualizing complex reactive flows and maintaining clean architecture remains a challenge on large teams.

To bridge this gap, I created NgLens:
✨ Interactive Parent ➔ Child component hierarchy
⚡ Signal dataflow tracing (signal, computed, model, effect, input)
💉 Dependency injection map (inject() & constructor DI)
🩺 1-click health audit: circular dependency detection, orphan components, missing imports
📁 Standalone single-file HTML export for CI & Pull Requests

You can test drive it in 5 seconds with zero setup:
👉 npx nglens demo

Check out the project on GitHub: [Link]
Feedback and stars are warmly welcome! 🙌
#Angular #WebDevelopment #TypeScript #JavaScript #OpenSource #SoftwareArchitecture
```
