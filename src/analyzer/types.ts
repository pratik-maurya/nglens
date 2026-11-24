/**
 * Core type definitions for NgLens - Angular Component & Signals Graph Analyzer
 */

export type SignalType = 'signal' | 'computed' | 'model' | 'effect' | 'toSignal' | 'toObservable' | 'input';

export interface SignalDetail {
  name: string;
  type: SignalType;
  line: number;
  initialValueSnippet?: string;
  dependencies: string[]; // Other signals read inside computed/effect
}

export interface InputDetail {
  name: string;
  alias?: string;
  isSignal: boolean; // input() or input.required()
  isRequired: boolean;
  typeText?: string;
  line: number;
}

export interface OutputDetail {
  name: string;
  alias?: string;
  isSignal: boolean; // output() vs @Output()
  typeText?: string;
  line: number;
}

export interface InjectedDependency {
  tokenName: string;
  kind: 'inject-function' | 'constructor';
  line: number;
}

export interface ComponentMetadata {
  id: string; // usually filePath:className or unique selector
  className: string;
  selector: string;
  filePath: string;
  relativePath: string;
  standalone: boolean;
  changeDetection?: 'OnPush' | 'Default';
  templateSource?: 'inline' | 'external';
  templateUrl?: string;
  templateContent?: string;
  
  // Imports declared in @Component({ imports: [...] })
  declaredImports: string[];
  
  // Child components actually rendered in template
  renderedChildrenSelectors: string[];
  
  // Reactive & State elements
  signals: SignalDetail[];
  inputs: InputDetail[];
  outputs: OutputDetail[];
  injectedServices: InjectedDependency[];
  
  // Metrics
  lineCount: number;
  hasTemplate: boolean;
}

export interface ServiceMetadata {
  id: string;
  className: string;
  filePath: string;
  relativePath: string;
  providedIn?: string; // 'root' | 'platform' | null
  injectedTokens: string[];
  lineCount: number;
}

export interface GraphNode {
  id: string;
  label: string;
  type: 'component' | 'service' | 'module' | 'signal';
  subType?: string;
  metadata: {
    selector?: string;
    filePath?: string;
    relativePath?: string;
    standalone?: boolean;
    changeDetection?: string;
    signalCount?: number;
    inputCount?: number;
    outputCount?: number;
    serviceCount?: number;
    isOrphan?: boolean;
    isCircular?: boolean;
    signals?: SignalDetail[];
    inputs?: InputDetail[];
    outputs?: OutputDetail[];
    injectedServices?: InjectedDependency[];
    [key: string]: any;
  };
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: 'renders' | 'imports' | 'injects' | 'signal-flow' | 'input-binding' | 'output-event';
  label?: string;
  isCircular?: boolean;
}

export interface DiagnosticIssue {
  id: string;
  severity: 'error' | 'warning' | 'info';
  code: 'CIRCULAR_DEPENDENCY' | 'UNUSED_COMPONENT' | 'MISSING_TEMPLATE_IMPORT' | 'MISSING_SIGNAL_READ' | 'DEEP_NESTING';
  title: string;
  message: string;
  filePath?: string;
  line?: number;
  relatedNodes?: string[];
}

export interface ProjectMetrics {
  totalComponents: number;
  standaloneComponents: number;
  legacyComponents: number;
  totalServices: number;
  totalSignals: number;
  totalComputed: number;
  totalClassicInputs: number;
  totalSignalInputs: number;
  signalAdoptionRatePercent: number;
  circularDependencyCyclesCount: number;
  unusedComponentsCount: number;
}

export interface AnalysisResult {
  projectRoot: string;
  analyzedAt: string;
  components: ComponentMetadata[];
  services: ServiceMetadata[];
  nodes: GraphNode[];
  edges: GraphEdge[];
  diagnostics: DiagnosticIssue[];
  metrics: ProjectMetrics;
}
