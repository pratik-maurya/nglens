import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { CycleDetector } from './cycle-detector.js';
import { TemplateParser } from './template-parser.js';
import { NgAnalyzer } from './ng-analyzer.js';

test('CycleDetector should detect direct circular dependency A -> B -> A', () => {
  const detector = new CycleDetector();
  detector.addEdge('CompA', 'CompB');
  detector.addEdge('CompB', 'CompA');

  const result = detector.detectCycles();
  assert.equal(result.hasCycles, true);
  assert.equal(result.cycles.length, 1);
  assert.deepEqual(result.cycles[0], ['CompA', 'CompB', 'CompA']);
  assert.equal(result.cyclicNodeIds.has('CompA'), true);
  assert.equal(result.cyclicNodeIds.has('CompB'), true);
});

test('CycleDetector should detect 3-node cycle A -> B -> C -> A', () => {
  const detector = new CycleDetector();
  detector.addEdge('CompA', 'CompB');
  detector.addEdge('CompB', 'CompC');
  detector.addEdge('CompC', 'CompA');
  detector.addEdge('CompC', 'CompD'); // non-cyclic branch

  const result = detector.detectCycles();
  assert.equal(result.hasCycles, true);
  assert.equal(result.cyclicNodeIds.has('CompD'), false);
  assert.equal(result.cyclicNodeIds.has('CompA'), true);
});

test('TemplateParser should extract child components, inputs, outputs, and signal reads', () => {
  const parser = new TemplateParser();
  const templateHtml = `
    <header class="app-header">
      <app-nav-bar [theme]="activeTheme()" (logout)="onLogout()"></app-nav-bar>
    </header>
    <main>
      @if (isLoading()) {
        <app-spinner [size]="'large'"></app-spinner>
      }
      <app-user-profile [(user)]="currentUser" (updated)="refresh()"></app-user-profile>
    </main>
  `;

  const analysis = parser.parse(templateHtml);

  assert.equal(analysis.renderedTags.includes('app-nav-bar'), true);
  assert.equal(analysis.renderedTags.includes('app-spinner'), true);
  assert.equal(analysis.renderedTags.includes('app-user-profile'), true);

  // Check signals invoked in template: activeTheme(), isLoading()
  assert.equal(analysis.invokedSignals.includes('activeTheme'), true);
  assert.equal(analysis.invokedSignals.includes('isLoading'), true);

  // Check element bindings
  const navBar = analysis.elements.find(e => e.tagName === 'app-nav-bar');
  assert.ok(navBar);
  assert.equal(navBar.inputs[0].propName, 'theme');
  assert.equal(navBar.outputs[0].eventName, 'logout');

  const profile = analysis.elements.find(e => e.tagName === 'app-user-profile');
  assert.ok(profile);
  assert.equal(profile.twoWay[0].propName, 'user');
});

test('NgAnalyzer should analyze Angular components, signals, DI and detect circular imports', () => {
  // Create temporary mock Angular project
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nglens-test-'));

  try {
    // 1. AuthService
    fs.writeFileSync(path.join(tmpDir, 'auth.service.ts'), `
      import { Injectable } from '@angular/core';

      @Injectable({ providedIn: 'root' })
      export class AuthService {
        currentUser = 'Alice';
      }
    `);

    // 2. ChildComponent
    fs.writeFileSync(path.join(tmpDir, 'child.component.ts'), `
      import { Component, input, output, computed } from '@angular/core';

      @Component({
        selector: 'app-child',
        standalone: true,
        template: '<p>Child {{ doubleCount() }}</p>'
      })
      export class ChildComponent {
        userId = input.required<string>();
        count = input<number>(0);
        doubleCount = computed(() => this.count() * 2);
        select = output<string>();
      }
    `);

    // 3. ParentComponent (renders ChildComponent, injects AuthService)
    fs.writeFileSync(path.join(tmpDir, 'parent.component.ts'), `
      import { Component, signal, inject } from '@angular/core';
      import { ChildComponent } from './child.component';
      import { AuthService } from './auth.service';

      @Component({
        selector: 'app-parent',
        standalone: true,
        imports: [ChildComponent],
        template: '<div><app-child [userId]="id()" [count]="itemsCount()"></app-child></div>'
      })
      export class ParentComponent {
        authService = inject(AuthService);
        id = signal('123');
        itemsCount = signal(5);
      }
    `);

    const analyzer = new NgAnalyzer({ projectRoot: tmpDir });
    const result = analyzer.analyze();

    assert.equal(result.components.length, 2);
    assert.equal(result.services.length, 1);

    const parent = result.components.find(c => c.className === 'ParentComponent');
    assert.ok(parent);
    assert.equal(parent.standalone, true);
    assert.equal(parent.signals.length, 2);
    assert.equal(parent.injectedServices.length, 1);
    assert.equal(parent.injectedServices[0].tokenName, 'AuthService');
    assert.equal(parent.renderedChildrenSelectors.includes('app-child'), true);

    const child = result.components.find(c => c.className === 'ChildComponent');
    assert.ok(child);
    assert.equal(child.inputs.length, 2);
    assert.equal(child.inputs[0].name, 'userId');
    assert.equal(child.inputs[0].isRequired, true);
    assert.equal(child.signals.some(s => s.name === 'doubleCount' && s.type === 'computed'), true);

    // Verify Graph Edges
    const renderEdge = result.edges.find(e => e.type === 'renders');
    assert.ok(renderEdge);
    assert.equal(renderEdge.source, parent.id);
    assert.equal(renderEdge.target, child.id);

    const injectEdge = result.edges.find(e => e.type === 'injects');
    assert.ok(injectEdge);
    assert.equal(injectEdge.source, parent.id);

    // Verify Metrics
    assert.equal(result.metrics.totalComponents, 2);
    assert.equal(result.metrics.standaloneComponents, 2);
    assert.equal(result.metrics.totalServices, 1);
    assert.equal(result.metrics.signalAdoptionRatePercent > 50, true);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
