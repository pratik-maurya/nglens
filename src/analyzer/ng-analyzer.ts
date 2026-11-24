import fs from 'fs';
import path from 'path';
import ts from 'typescript';
import {
  AnalysisResult,
  ComponentMetadata,
  ServiceMetadata,
  GraphNode,
  GraphEdge,
  DiagnosticIssue,
  ProjectMetrics
} from './types.js';
import { AstUtils } from './ast-utils.js';
import { TemplateParser } from './template-parser.js';
import { CycleDetector } from './cycle-detector.js';

export interface AnalyzerOptions {
  projectRoot: string;
  tsConfigPath?: string;
  excludePatterns?: string[];
}

export class NgAnalyzer {
  private projectRoot: string;
  private templateParser = new TemplateParser();

  constructor(options: AnalyzerOptions) {
    this.projectRoot = path.resolve(options.projectRoot);
  }

  /**
   * Scan project and return complete AST analysis, graph nodes/edges, and diagnostics.
   */
  public analyze(): AnalysisResult {
    const tsFiles = this.findTypeScriptFiles(this.projectRoot);
    const components: ComponentMetadata[] = [];
    const services: ServiceMetadata[] = [];
    const selectorToComponentMap = new Map<string, ComponentMetadata>();
    const classNameToComponentMap = new Map<string, ComponentMetadata>();
    const classNameToServiceMap = new Map<string, ServiceMetadata>();

    // 1. First Pass: Parse all TypeScript source files into AST
    for (const filePath of tsFiles) {
      const code = fs.readFileSync(filePath, 'utf-8');
      const sourceFile = ts.createSourceFile(
        filePath,
        code,
        ts.ScriptTarget.Latest,
        true
      );

      const classes = AstUtils.findClassDeclarations(sourceFile);
      const relativePath = path.relative(this.projectRoot, filePath).replace(/\\/g, '/');

      for (const classDecl of classes) {
        const className = classDecl.name ? classDecl.name.text : 'AnonymousClass';
        const componentDecorator = AstUtils.getDecoratorNamed(classDecl, 'Component');
        const injectableDecorator = AstUtils.getDecoratorNamed(classDecl, 'Injectable');

        // Analyze @Component
        if (componentDecorator) {
          const compMeta = this.parseComponent(classDecl, componentDecorator, sourceFile, filePath, relativePath);
          components.push(compMeta);
          selectorToComponentMap.set(compMeta.selector, compMeta);
          classNameToComponentMap.set(className, compMeta);
        }

        // Analyze @Injectable
        if (injectableDecorator) {
          const servMeta = this.parseService(classDecl, injectableDecorator, sourceFile, filePath, relativePath);
          services.push(servMeta);
          classNameToServiceMap.set(className, servMeta);
        }
      }
    }

    // 2. Second Pass: Link templates and resolve child components
    const knownSelectors = new Set(selectorToComponentMap.keys());
    for (const comp of components) {
      let templateContent = comp.templateContent || '';

      if (comp.templateSource === 'external' && comp.templateUrl) {
        const componentDir = path.dirname(comp.filePath);
        const resolvedTemplatePath = path.resolve(componentDir, comp.templateUrl);
        if (fs.existsSync(resolvedTemplatePath)) {
          templateContent = fs.readFileSync(resolvedTemplatePath, 'utf-8');
          comp.templateContent = templateContent;
        }
      }

      if (templateContent) {
        const templateAnalysis = this.templateParser.parse(templateContent, knownSelectors);
        comp.renderedChildrenSelectors = templateAnalysis.renderedTags;
      }
    }

    // 3. Build Graph Nodes and Edges
    const { nodes, edges } = this.buildGraph(components, services, selectorToComponentMap, classNameToComponentMap);

    // 4. Run Health Diagnostics (Cycle detection, unused components, missing imports)
    const diagnostics = this.runDiagnostics(components, services, edges, selectorToComponentMap, classNameToComponentMap);

    // 5. Compute Metrics
    const metrics = this.computeMetrics(components, services, diagnostics);

    return {
      projectRoot: this.projectRoot,
      analyzedAt: new Date().toISOString(),
      components,
      services,
      nodes,
      edges,
      diagnostics,
      metrics
    };
  }

  private parseComponent(
    classDecl: ts.ClassDeclaration,
    decorator: ts.Decorator,
    sourceFile: ts.SourceFile,
    filePath: string,
    relativePath: string
  ): ComponentMetadata {
    const className = classDecl.name ? classDecl.name.text : 'AnonymousComponent';
    const argObj = AstUtils.getDecoratorArgumentObject(decorator);

    let selector = className.toLowerCase();
    let standalone = true; // Angular 19+ default is true
    let templateSource: 'inline' | 'external' = 'inline';
    let templateUrl: string | undefined;
    let templateContent: string | undefined;
    let declaredImports: string[] = [];
    let changeDetection: 'OnPush' | 'Default' | undefined;

    if (argObj) {
      const parsedSelector = AstUtils.getStringProperty(argObj, 'selector');
      if (parsedSelector) selector = parsedSelector;

      const explicitStandalone = AstUtils.getBooleanProperty(argObj, 'standalone');
      if (explicitStandalone !== undefined) {
        standalone = explicitStandalone;
      }

      const inlineTemplate = AstUtils.getStringProperty(argObj, 'template');
      if (inlineTemplate !== undefined) {
        templateSource = 'inline';
        templateContent = inlineTemplate;
      } else {
        const parsedTemplateUrl = AstUtils.getStringProperty(argObj, 'templateUrl');
        if (parsedTemplateUrl) {
          templateSource = 'external';
          templateUrl = parsedTemplateUrl;
        }
      }

      declaredImports = AstUtils.getArrayIdentifiers(argObj, 'imports');

      const cdProp = AstUtils.getObjectProperty(argObj, 'changeDetection');
      if (cdProp) {
        changeDetection = cdProp.getText().includes('OnPush') ? 'OnPush' : 'Default';
      }
    }

    const { signals, inputs, outputs, injectedServices } = AstUtils.parseClassMembers(classDecl, sourceFile);

    const lineCount = sourceFile.getLineAndCharacterOfPosition(classDecl.getEnd()).line -
      sourceFile.getLineAndCharacterOfPosition(classDecl.getStart()).line + 1;

    return {
      id: `${relativePath}:${className}`,
      className,
      selector,
      filePath,
      relativePath,
      standalone,
      changeDetection,
      templateSource,
      templateUrl,
      templateContent,
      declaredImports,
      renderedChildrenSelectors: [],
      signals,
      inputs,
      outputs,
      injectedServices,
      lineCount,
      hasTemplate: !!templateContent || !!templateUrl
    };
  }

  private parseService(
    classDecl: ts.ClassDeclaration,
    decorator: ts.Decorator,
    sourceFile: ts.SourceFile,
    filePath: string,
    relativePath: string
  ): ServiceMetadata {
    const className = classDecl.name ? classDecl.name.text : 'AnonymousService';
    const argObj = AstUtils.getDecoratorArgumentObject(decorator);

    let providedIn: string | undefined;
    if (argObj) {
      providedIn = AstUtils.getStringProperty(argObj, 'providedIn');
    }

    const { injectedServices } = AstUtils.parseClassMembers(classDecl, sourceFile);

    const lineCount = sourceFile.getLineAndCharacterOfPosition(classDecl.getEnd()).line -
      sourceFile.getLineAndCharacterOfPosition(classDecl.getStart()).line + 1;

    return {
      id: `${relativePath}:${className}`,
      className,
      filePath,
      relativePath,
      providedIn,
      injectedTokens: injectedServices.map(s => s.tokenName),
      lineCount
    };
  }

  private buildGraph(
    components: ComponentMetadata[],
    services: ServiceMetadata[],
    selectorMap: Map<string, ComponentMetadata>,
    classMap: Map<string, ComponentMetadata>
  ): { nodes: GraphNode[]; edges: GraphEdge[] } {
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];
    const edgeKeySet = new Set<string>();

    const addEdgeSafe = (edge: GraphEdge) => {
      const key = `${edge.source}->${edge.target}:${edge.type}`;
      if (!edgeKeySet.has(key) && edge.source !== edge.target) {
        edgeKeySet.add(key);
        edges.push(edge);
      }
    };

    // Component Nodes
    for (const comp of components) {
      nodes.push({
        id: comp.id,
        label: comp.className,
        type: 'component',
        metadata: {
          selector: comp.selector,
          filePath: comp.filePath,
          relativePath: comp.relativePath,
          standalone: comp.standalone,
          changeDetection: comp.changeDetection,
          signalCount: comp.signals.length,
          inputCount: comp.inputs.length,
          outputCount: comp.outputs.length,
          serviceCount: comp.injectedServices.length,
          signals: comp.signals,
          inputs: comp.inputs,
          outputs: comp.outputs,
          injectedServices: comp.injectedServices
        }
      });

      // Edges: Rendered children (Parent -> Child)
      for (const childSelector of comp.renderedChildrenSelectors) {
        const childComp = selectorMap.get(childSelector);
        if (childComp) {
          addEdgeSafe({
            id: `${comp.id}-renders-${childComp.id}`,
            source: comp.id,
            target: childComp.id,
            type: 'renders',
            label: `<${childSelector}>`
          });
        }
      }

      // Edges: Declared imports (CompA -> CompB)
      for (const importedName of comp.declaredImports) {
        const targetComp = classMap.get(importedName);
        if (targetComp) {
          addEdgeSafe({
            id: `${comp.id}-imports-${targetComp.id}`,
            source: comp.id,
            target: targetComp.id,
            type: 'imports',
            label: 'imports'
          });
        }
      }
    }

    // Service Nodes
    for (const serv of services) {
      nodes.push({
        id: serv.id,
        label: serv.className,
        type: 'service',
        metadata: {
          filePath: serv.filePath,
          relativePath: serv.relativePath,
          providedIn: serv.providedIn
        }
      });
    }

    // Edges: Dependency Injection (Component -> Service)
    const serviceClassMap = new Map(services.map(s => [s.className, s]));
    for (const comp of components) {
      for (const dep of comp.injectedServices) {
        const targetServ = serviceClassMap.get(dep.tokenName);
        if (targetServ) {
          addEdgeSafe({
            id: `${comp.id}-injects-${targetServ.id}`,
            source: comp.id,
            target: targetServ.id,
            type: 'injects',
            label: dep.kind === 'inject-function' ? 'inject()' : 'constructor'
          });
        }
      }
    }

    // Edges: Service -> Service DI
    for (const serv of services) {
      for (const token of serv.injectedTokens) {
        const targetServ = serviceClassMap.get(token);
        if (targetServ) {
          addEdgeSafe({
            id: `${serv.id}-injects-${targetServ.id}`,
            source: serv.id,
            target: targetServ.id,
            type: 'injects',
            label: 'injects'
          });
        }
      }
    }

    return { nodes, edges };
  }

  private runDiagnostics(
    components: ComponentMetadata[],
    services: ServiceMetadata[],
    edges: GraphEdge[],
    selectorMap: Map<string, ComponentMetadata>,
    classMap: Map<string, ComponentMetadata>
  ): DiagnosticIssue[] {
    const diagnostics: DiagnosticIssue[] = [];

    // 1. Detect Circular Dependencies using CycleDetector
    const cycleDetector = new CycleDetector();
    for (const edge of edges) {
      cycleDetector.addEdge(edge.source, edge.target);
    }
    const cycleResult = cycleDetector.detectCycles();

    if (cycleResult.hasCycles) {
      for (let i = 0; i < cycleResult.cycles.length; i++) {
        const cycle = cycleResult.cycles[i];
        const displayPath = cycle.map(id => id.split(':').pop()).join(' ➔ ');
        diagnostics.push({
          id: `diag-cycle-${i}`,
          severity: 'error',
          code: 'CIRCULAR_DEPENDENCY',
          title: 'Circular Dependency Detected',
          message: `Circular reference detected in component/service hierarchy: ${displayPath}`,
          relatedNodes: cycle
        });
      }

      // Mark cyclic edges
      for (const edge of edges) {
        if (cycleResult.cyclicEdgeKeys.has(`${edge.source}->${edge.target}`)) {
          edge.isCircular = true;
        }
      }
    }

    // 2. Detect Unused / Orphan Components
    const incomingEdgeTargets = new Set(edges.map(e => e.target));
    for (const comp of components) {
      const isRootComponent =
        comp.className.includes('App') ||
        comp.selector === 'app-root' ||
        comp.relativePath.includes('app.component');

      if (!isRootComponent && !incomingEdgeTargets.has(comp.id)) {
        diagnostics.push({
          id: `diag-orphan-${comp.id}`,
          severity: 'warning',
          code: 'UNUSED_COMPONENT',
          title: 'Unused / Orphan Component',
          message: `Component '${comp.className}' (${comp.selector}) is never rendered in any template and never imported by other components.`,
          filePath: comp.filePath,
          relatedNodes: [comp.id]
        });
      }
    }

    // 3. Detect Missing Template Imports (Used in template, but missing in imports: [...])
    for (const comp of components) {
      if (comp.standalone) {
        const importedClassNames = new Set(comp.declaredImports);
        for (const childTag of comp.renderedChildrenSelectors) {
          const childComp = selectorMap.get(childTag);
          if (childComp && childComp.id !== comp.id) {
            if (!importedClassNames.has(childComp.className)) {
              diagnostics.push({
                id: `diag-missing-import-${comp.id}-${childComp.id}`,
                severity: 'warning',
                code: 'MISSING_TEMPLATE_IMPORT',
                title: 'Missing Standalone Import',
                message: `Template uses tag '<${childTag}>', but component '${childComp.className}' is missing in '${comp.className}' imports array.`,
                filePath: comp.filePath,
                relatedNodes: [comp.id, childComp.id]
              });
            }
          }
        }
      }
    }

    return diagnostics;
  }

  private computeMetrics(
    components: ComponentMetadata[],
    services: ServiceMetadata[],
    diagnostics: DiagnosticIssue[]
  ): ProjectMetrics {
    const standaloneCount = components.filter(c => c.standalone).length;
    let totalSignals = 0;
    let totalComputed = 0;
    let totalClassicInputs = 0;
    let totalSignalInputs = 0;

    for (const comp of components) {
      for (const sig of comp.signals) {
        if (sig.type === 'computed') totalComputed++;
        else totalSignals++;
      }
      for (const inp of comp.inputs) {
        if (inp.isSignal) totalSignalInputs++;
        else totalClassicInputs++;
      }
    }

    const totalStatePrimitives = totalSignals + totalComputed + totalClassicInputs + totalSignalInputs;
    const signalStatePrimitives = totalSignals + totalComputed + totalSignalInputs;
    const signalAdoptionRatePercent = totalStatePrimitives > 0
      ? Math.round((signalStatePrimitives / totalStatePrimitives) * 100)
      : 0;

    const circularCycles = diagnostics.filter(d => d.code === 'CIRCULAR_DEPENDENCY').length;
    const unusedCount = diagnostics.filter(d => d.code === 'UNUSED_COMPONENT').length;

    return {
      totalComponents: components.length,
      standaloneComponents: standaloneCount,
      legacyComponents: components.length - standaloneCount,
      totalServices: services.length,
      totalSignals,
      totalComputed,
      totalClassicInputs,
      totalSignalInputs,
      signalAdoptionRatePercent,
      circularDependencyCyclesCount: circularCycles,
      unusedComponentsCount: unusedCount
    };
  }

  private findTypeScriptFiles(dir: string): string[] {
    const files: string[] = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (
          entry.name === 'node_modules' ||
          entry.name === 'dist' ||
          entry.name === '.git' ||
          entry.name === '.angular' ||
          entry.name === 'coverage'
        ) {
          continue;
        }
        files.push(...this.findTypeScriptFiles(fullPath));
      } else if (
        entry.isFile() &&
        entry.name.endsWith('.ts') &&
        !entry.name.endsWith('.spec.ts') &&
        !entry.name.endsWith('.d.ts')
      ) {
        files.push(fullPath);
      }
    }
    return files;
  }
}
