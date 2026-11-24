import cytoscape, { Core, NodeSingular, EdgeSingular } from 'cytoscape';
import dagre from 'cytoscape-dagre';
import { AnalysisResult, GraphNode, GraphEdge, DiagnosticIssue } from '../analyzer/types.js';

// Register dagre layout extension
cytoscape.use(dagre);

declare global {
  interface Window {
    __NGLENS_DATA__?: AnalysisResult;
    acquireVsCodeApi?: () => { postMessage: (msg: any) => void };
  }
}

class NgLensUI {
  private cy!: Core;
  private data: AnalysisResult;
  private currentMode: 'tree' | 'signals' | 'services' | 'all' = 'all';
  private selectedNodeId: string | null = null;
  private vscodeApi?: { postMessage: (msg: any) => void };

  constructor() {
    if (typeof window.acquireVsCodeApi === 'function') {
      try {
        this.vscodeApi = window.acquireVsCodeApi();
      } catch {
        // Already acquired or not in vscode
      }
    }

    this.data = window.__NGLENS_DATA__ || this.getFallbackMockData();
    this.initDOM();
    this.initCytoscape();
    this.renderMetrics();
    this.bindEvents();
    this.listenForVsCodeMessages();
  }

  private initDOM(): void {
    const titleEl = document.getElementById('project-name');
    if (titleEl && this.data.projectRoot) {
      const parts = this.data.projectRoot.replace(/\\/g, '/').split('/');
      titleEl.textContent = parts[parts.length - 1] || 'Angular App';
    }
  }

  private initCytoscape(): void {
    const elements = this.buildCytoscapeElements();

    this.cy = cytoscape({
      container: document.getElementById('cy'),
      elements,
      style: [
        // Node defaults
        {
          selector: 'node',
          style: {
            'label': 'data(label)',
            'color': '#f0f4f8',
            'font-size': '13px',
            'font-weight': 600,
            'text-valign': 'center',
            'text-halign': 'center',
            'text-wrap': 'wrap',
            'text-max-width': '130px',
            'width': 140,
            'height': 56,
            'shape': 'round-rectangle',
            'border-width': 2,
            'border-color': '#26334d',
            'background-color': '#182030',
            'transition-property': 'background-color, border-color, opacity',
            'transition-duration': 0.2
          } as any
        },
        // Component Nodes
        {
          selector: 'node[type = "component"]',
          style: {
            'background-color': '#161e2e',
            'border-color': '#e0234e',
            'border-width': 2
          }
        },
        // Service Nodes
        {
          selector: 'node[type = "service"]',
          style: {
            'background-color': '#1b1b32',
            'border-color': '#8b5cf6',
            'shape': 'round-rectangle',
            'border-style': 'solid',
            'width': 140,
            'height': 56
          }
        },
        // Cyclic Nodes
        {
          selector: 'node[?isCircular]',
          style: {
            'border-color': '#f43f5e',
            'border-width': 3,
            'background-color': '#2d1520'
          }
        },
        // Orphan / Unused Nodes
        {
          selector: 'node[?isOrphan]',
          style: {
            'border-color': '#f59e0b',
            'border-style': 'dashed',
            'border-width': 2
          }
        },
        // Edge defaults
        {
          selector: 'edge',
          style: {
            'width': 2,
            'line-color': '#334155',
            'target-arrow-color': '#334155',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'arrow-scale': 1.1,
            'font-size': '10px',
            'color': '#94a3b8',
            'text-rotation': 'autorotate',
            'text-margin-y': -8
          }
        },
        // Renders edge
        {
          selector: 'edge[type = "renders"]',
          style: {
            'line-color': '#e0234e',
            'target-arrow-color': '#e0234e',
            'width': 2.5
          }
        },
        // Injects edge
        {
          selector: 'edge[type = "injects"]',
          style: {
            'line-color': '#8b5cf6',
            'target-arrow-color': '#8b5cf6',
            'line-style': 'dashed'
          }
        },
        // Circular edge
        {
          selector: 'edge[?isCircular]',
          style: {
            'line-color': '#f43f5e',
            'target-arrow-color': '#f43f5e',
            'width': 3.5,
            'line-style': 'dashed'
          }
        },
        // Highlighted / Selected
        {
          selector: 'node.highlighted',
          style: {
            'border-color': '#38bdf8',
            'border-width': 4,
            'underlay-color': '#38bdf8',
            'underlay-padding': 4,
            'underlay-opacity': 0.4
          } as any
        },
        {
          selector: 'edge.highlighted',
          style: {
            'line-color': '#38bdf8',
            'target-arrow-color': '#38bdf8',
            'width': 4
          }
        },
        {
          selector: '.dimmed',
          style: {
            'opacity': 0.15
          }
        }
      ],
      layout: this.getDagreLayout()
    });

    this.cy.on('tap', 'node', (evt) => {
      const node = evt.target as NodeSingular;
      this.handleNodeClick(node);
    });

    this.cy.on('mouseover', 'node, edge', () => {
      const container = document.getElementById('cy');
      if (container) container.style.cursor = 'pointer';
    });

    this.cy.on('mouseout', 'node, edge', () => {
      const container = document.getElementById('cy');
      if (container) container.style.cursor = 'default';
    });

    this.cy.on('tap', (evt) => {
      if (evt.target === this.cy) {
        this.resetHighlights();
        this.closeInspector();
      }
    });

    window.addEventListener('resize', () => {
      this.cy.resize();
    });
  }

  private getDagreLayout(): any {
    return {
      name: 'dagre',
      rankDir: 'TB',
      nodeSep: 60,
      rankSep: 80,
      padding: 50,
      animate: true,
      animationDuration: 400
    };
  }

  private buildCytoscapeElements(): any[] {
    const elements: any[] = [];
    const cyclicNodeIds = new Set(
      this.data.diagnostics
        .filter(d => d.code === 'CIRCULAR_DEPENDENCY')
        .flatMap(d => d.relatedNodes || [])
    );
    const orphanNodeIds = new Set(
      this.data.diagnostics
        .filter(d => d.code === 'UNUSED_COMPONENT')
        .flatMap(d => d.relatedNodes || [])
    );

    // Filter nodes and edges by current mode
    for (const n of this.data.nodes) {
      if (this.currentMode === 'tree' && n.type === 'service') continue;
      if (this.currentMode === 'services' && n.type !== 'service' && n.type !== 'component') continue;

      elements.push({
        data: {
          id: n.id,
          label: n.label,
          type: n.type,
          isCircular: cyclicNodeIds.has(n.id),
          isOrphan: orphanNodeIds.has(n.id),
          meta: n.metadata
        }
      });
    }

    const validNodeIds = new Set(elements.map(e => e.data.id));

    for (const e of this.data.edges) {
      if (!validNodeIds.has(e.source) || !validNodeIds.has(e.target)) continue;
      if (this.currentMode === 'tree' && e.type !== 'renders' && e.type !== 'imports') continue;
      if (this.currentMode === 'services' && e.type !== 'injects') continue;

      elements.push({
        data: {
          id: e.id,
          source: e.source,
          target: e.target,
          type: e.type,
          label: e.label || '',
          isCircular: e.isCircular || false
        }
      });
    }

    return elements;
  }

  private handleNodeClick(node: NodeSingular): void {
    const id = node.id();
    this.selectedNodeId = id;

    // Highlight node and direct neighbors
    this.cy.batch(() => {
      this.cy.elements().removeClass('highlighted dimmed');
      const neighborhood = node.closedNeighborhood();
      this.cy.elements().difference(neighborhood).addClass('dimmed');
      neighborhood.addClass('highlighted');
    });

    this.openInspector(node.data('label'), node.data('type'), node.data('meta'));
  }

  private resetHighlights(): void {
    this.selectedNodeId = null;
    this.cy.elements().removeClass('highlighted dimmed');
  }

  private openInspector(label: string, type: string, meta: any): void {
    const drawer = document.getElementById('inspector-drawer');
    const titleEl = document.getElementById('inspector-name');
    const typeEl = document.getElementById('inspector-type');
    const contentEl = document.getElementById('inspector-content');

    if (!drawer || !titleEl || !typeEl || !contentEl) return;

    titleEl.textContent = label;
    typeEl.textContent = meta.selector ? `<${meta.selector}>` : type.toUpperCase();

    let html = `
      <div class="detail-section">
        <div class="section-title">File Details</div>
        <div style="font-size: 11px; color: #94a3b8; word-break: break-all; margin-bottom: 4px;">
          ${meta.relativePath || 'unknown'}
        </div>
        ${meta.standalone !== undefined ? `
          <div style="margin-top: 6px; display: flex; gap: 6px;">
            <span class="item-badge ${meta.standalone ? 'badge-signal' : 'badge-output'}">
              ${meta.standalone ? 'Standalone' : 'NgModule'}
            </span>
            ${meta.changeDetection ? `<span class="item-badge badge-input">${meta.changeDetection}</span>` : ''}
          </div>
        ` : ''}
        ${meta.filePath ? `
          <div style="margin-top: 10px;">
            <button class="btn" id="btn-jump-file" style="width: 100%; justify-content: center;" data-path="${meta.filePath}">
              <span>⚡ Open in Editor</span>
            </button>
          </div>
        ` : ''}
      </div>
    `;

    // Signals Section
    if (meta.signals && meta.signals.length > 0) {
      html += `
        <div class="detail-section">
          <div class="section-title">
            <span>Signals & Reactivity</span>
            <span class="item-badge badge-signal">${meta.signals.length}</span>
          </div>
          <div class="item-list">
            ${meta.signals.map((s: any) => `
              <div class="item-card">
                <div>
                  <div class="item-name">${s.name}</div>
                  ${s.dependencies && s.dependencies.length > 0 ? `
                    <div style="font-size: 10px; color: #8e9db3; margin-top: 2px;">
                      Reads: ${s.dependencies.join(', ')}
                    </div>
                  ` : ''}
                </div>
                <span class="item-badge badge-${s.type}">${s.type}()</span>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    // Inputs & Outputs Section
    if ((meta.inputs && meta.inputs.length > 0) || (meta.outputs && meta.outputs.length > 0)) {
      html += `
        <div class="detail-section">
          <div class="section-title">Inputs & Outputs</div>
          <div class="item-list">
            ${(meta.inputs || []).map((inp: any) => `
              <div class="item-card">
                <span class="item-name">${inp.name}</span>
                <span class="item-badge badge-input">${inp.isSignal ? 'input()' : '@Input()'}</span>
              </div>
            `).join('')}
            ${(meta.outputs || []).map((out: any) => `
              <div class="item-card">
                <span class="item-name">${out.name}</span>
                <span class="item-badge badge-output">${out.isSignal ? 'output()' : '@Output()'}</span>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    // Injected Services
    if (meta.injectedServices && meta.injectedServices.length > 0) {
      html += `
        <div class="detail-section">
          <div class="section-title">
            <span>Injected Services</span>
            <span class="item-badge badge-service">${meta.injectedServices.length}</span>
          </div>
          <div class="item-list">
            ${meta.injectedServices.map((d: any) => `
              <div class="item-card">
                <span class="item-name">${d.tokenName}</span>
                <span class="item-badge badge-service">${d.kind}</span>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    contentEl.innerHTML = html;
    drawer.classList.remove('closed');

    const jumpBtn = document.getElementById('btn-jump-file');
    if (jumpBtn) {
      jumpBtn.addEventListener('click', () => {
        const filePath = jumpBtn.getAttribute('data-path');
        if (this.vscodeApi && filePath) {
          this.vscodeApi.postMessage({ command: 'openFile', filePath });
        }
      });
    }
  }

  private listenForVsCodeMessages(): void {
    window.addEventListener('message', (event) => {
      const message = event.data;
      if (message && message.command === 'updateData' && message.data) {
        this.data = message.data;
        this.renderMetrics();
        this.switchMode(this.currentMode);
      }
    });
  }

  private closeInspector(): void {
    const drawer = document.getElementById('inspector-drawer');
    if (drawer) drawer.classList.add('closed');
  }

  private renderMetrics(): void {
    const m = this.data.metrics;
    const diagCount = this.data.diagnostics.length;

    const compEl = document.getElementById('m-components');
    const sigEl = document.getElementById('m-signals');
    const servEl = document.getElementById('m-services');
    const rateEl = document.getElementById('m-rate');
    const diagBtn = document.getElementById('diag-btn-badge');

    if (compEl) compEl.textContent = `${m.totalComponents}`;
    if (sigEl) sigEl.textContent = `${m.totalSignals + m.totalComputed + m.totalSignalInputs}`;
    if (servEl) servEl.textContent = `${m.totalServices}`;
    if (rateEl) rateEl.textContent = `${m.signalAdoptionRatePercent}%`;
    if (diagBtn) {
      diagBtn.textContent = `${diagCount}`;
      diagBtn.style.display = diagCount > 0 ? 'inline-block' : 'none';
    }
  }

  private bindEvents(): void {
    // Mode tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.currentTarget as HTMLElement;
        const mode = target.getAttribute('data-mode') as any;
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        target.classList.add('active');
        this.switchMode(mode);
      });
    });

    // Search
    const searchInput = document.getElementById('search-input') as HTMLInputElement;
    if (searchInput) {
      searchInput.addEventListener('input', () => {
        const query = searchInput.value.toLowerCase().trim();
        if (!query) {
          this.resetHighlights();
          return;
        }
        this.cy.batch(() => {
          this.cy.elements().removeClass('highlighted dimmed');
          const matchingNodes = this.cy.nodes().filter(n => {
            const label = (n.data('label') || '').toLowerCase();
            const selector = (n.data('meta')?.selector || '').toLowerCase();
            return label.includes(query) || selector.includes(query);
          });
          if (matchingNodes.length > 0) {
            this.cy.elements().difference(matchingNodes).addClass('dimmed');
            matchingNodes.addClass('highlighted');
            this.cy.center(matchingNodes);
          }
        });
      });
    }

    // Canvas Controls
    document.getElementById('btn-zoom-in')?.addEventListener('click', () => {
      this.cy.zoom(this.cy.zoom() * 1.25);
    });
    document.getElementById('btn-zoom-out')?.addEventListener('click', () => {
      this.cy.zoom(this.cy.zoom() * 0.8);
    });
    document.getElementById('btn-fit')?.addEventListener('click', () => {
      this.cy.fit(undefined, 40);
    });
    document.getElementById('btn-export-png')?.addEventListener('click', () => {
      const png64 = this.cy.png({ bg: '#0a0d14', full: true, scale: 2 });
      const a = document.createElement('a');
      a.href = png64;
      a.download = `nglens-architecture-${Date.now()}.png`;
      a.click();
    });

    // Inspector close button
    document.getElementById('close-inspector')?.addEventListener('click', () => {
      this.closeInspector();
      this.resetHighlights();
    });

    // Health Diagnostics Modal
    const modal = document.getElementById('audit-modal');
    document.getElementById('btn-audit')?.addEventListener('click', () => {
      this.renderAuditModal();
      modal?.classList.remove('hidden');
    });
    document.getElementById('close-audit')?.addEventListener('click', () => {
      modal?.classList.add('hidden');
    });
  }

  private switchMode(mode: 'tree' | 'signals' | 'services' | 'all'): void {
    this.currentMode = mode;
    this.cy.elements().remove();
    this.cy.add(this.buildCytoscapeElements());
    this.cy.layout(this.getDagreLayout()).run();
    this.cy.fit(undefined, 40);
  }

  private renderAuditModal(): void {
    const listEl = document.getElementById('audit-list');
    if (!listEl) return;

    if (this.data.diagnostics.length === 0) {
      listEl.innerHTML = `
        <div style="text-align: center; padding: 40px 0; color: #10b981;">
          <div style="font-size: 32px; margin-bottom: 8px;">✨</div>
          <div style="font-size: 16px; font-weight: 700;">Clean Bill of Health!</div>
          <div style="font-size: 13px; color: #8e9db3; margin-top: 4px;">
            Zero circular dependencies, broken imports, or orphan components detected.
          </div>
        </div>
      `;
      return;
    }

    listEl.innerHTML = this.data.diagnostics.map(d => `
      <div class="diag-card diag-${d.severity}" style="cursor: pointer;" data-related="${(d.relatedNodes || []).join(',')}" title="Click to highlight in graph">
        <div class="diag-title">
          <span>${d.severity === 'error' ? '🚨' : '⚠️'}</span>
          <span>${d.title}</span>
          <span style="font-size: 11px; margin-left: auto; color: #94a3b8;">Click to locate ➔</span>
        </div>
        <div class="diag-desc">${d.message}</div>
      </div>
    `).join('');

    listEl.querySelectorAll('.diag-card').forEach(card => {
      card.addEventListener('click', () => {
        const relatedStr = card.getAttribute('data-related');
        if (!relatedStr) return;
        const nodeIds = relatedStr.split(',').filter(Boolean);
        const modal = document.getElementById('audit-modal');
        modal?.classList.add('hidden');

        this.cy.batch(() => {
          this.cy.elements().removeClass('highlighted dimmed');
          const targetNodes = this.cy.nodes().filter(n => nodeIds.includes(n.id()));
          if (targetNodes.length > 0) {
            this.cy.elements().difference(targetNodes).addClass('dimmed');
            targetNodes.addClass('highlighted');
            this.cy.center(targetNodes);
            this.cy.zoom(1.2);
          }
        });
      });
    });
  }

  private getFallbackMockData(): AnalysisResult {
    return {
      projectRoot: '/mock-angular-app',
      analyzedAt: new Date().toISOString(),
      components: [],
      services: [],
      nodes: [
        {
          id: 'app.component.ts:AppComponent',
          label: 'AppComponent',
          type: 'component',
          metadata: { selector: 'app-root', standalone: true, signals: [{ name: 'count', type: 'signal', line: 12, dependencies: [] }] }
        },
        {
          id: 'header.component.ts:HeaderComponent',
          label: 'HeaderComponent',
          type: 'component',
          metadata: { selector: 'app-header', standalone: true, inputs: [{ name: 'title', isSignal: true, isRequired: true, line: 8 }] }
        }
      ],
      edges: [
        {
          id: 'app-to-header',
          source: 'app.component.ts:AppComponent',
          target: 'header.component.ts:HeaderComponent',
          type: 'renders',
          label: '<app-header>'
        }
      ],
      diagnostics: [],
      metrics: {
        totalComponents: 2,
        standaloneComponents: 2,
        legacyComponents: 0,
        totalServices: 1,
        totalSignals: 1,
        totalComputed: 0,
        totalClassicInputs: 0,
        totalSignalInputs: 1,
        signalAdoptionRatePercent: 100,
        circularDependencyCyclesCount: 0,
        unusedComponentsCount: 0
      }
    };
  }
}

// Bootstrap when DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
  new NgLensUI();
});
