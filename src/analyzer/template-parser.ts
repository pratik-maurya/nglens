/**
 * Template parser for Angular HTML templates.
 * Extracts rendered child component tags, property/event bindings,
 * and signal invocations within template expressions.
 */

export interface ParsedTemplateElement {
  tagName: string;
  attributes: Record<string, string>;
  inputs: Array<{ propName: string; expression: string }>;
  outputs: Array<{ eventName: string; handler: string }>;
  twoWay: Array<{ propName: string; expression: string }>;
}

export interface TemplateAnalysisResult {
  renderedTags: string[]; // e.g. ['app-header', 'app-user-card', 'app-footer']
  elements: ParsedTemplateElement[];
  invokedSignals: string[]; // signal names called like count() or user().name
}

export class TemplateParser {
  /**
   * Parse an HTML template string to extract child selectors, bindings, and signal reads.
   */
  public parse(templateHtml: string, knownComponentSelectors?: Set<string>): TemplateAnalysisResult {
    const renderedTags = new Set<string>();
    const elements: ParsedTemplateElement[] = [];
    const invokedSignals = new Set<string>();

    if (!templateHtml || typeof templateHtml !== 'string') {
      return { renderedTags: [], elements: [], invokedSignals: [] };
    }

    // 1. Match HTML tags: <tagName attr1="val" [input]="exp" (output)="fn()">
    const tagRegex = /<([a-zA-Z0-9_-]+)([\s\S]*?)(\/?>)/g;
    let match: RegExpExecArray | null;

    // Standard HTML5 tags to ignore unless explicitly a known component selector
    const standardHtmlTags = new Set([
      'div', 'span', 'p', 'a', 'b', 'i', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'table', 'tr', 'td', 'th', 'tbody', 'thead', 'tfoot',
      'button', 'input', 'select', 'option', 'textarea', 'form', 'label',
      'header', 'footer', 'nav', 'section', 'article', 'aside', 'main',
      'img', 'svg', 'path', 'circle', 'rect', 'line', 'polygon',
      'ng-container', 'ng-template', 'ng-content'
    ]);

    while ((match = tagRegex.exec(templateHtml)) !== null) {
      const rawTagName = match[1].toLowerCase();
      const rawAttributes = match[2] || '';

      const isKnown = knownComponentSelectors && knownComponentSelectors.has(rawTagName);
      const isCustomElement = rawTagName.includes('-') && !rawTagName.startsWith('ng-');

      if (isKnown || isCustomElement) {
        renderedTags.add(rawTagName);
      }

      // Parse bindings in tag attributes
      const element: ParsedTemplateElement = {
        tagName: rawTagName,
        attributes: {},
        inputs: [],
        outputs: [],
        twoWay: []
      };

      // Two-way bindings: [(name)]="val"
      const twoWayRegex = /\[\(([a-zA-Z0-9_\-$]+)\)\]=["']([^"']*)["']/g;
      let twoWayMatch: RegExpExecArray | null;
      while ((twoWayMatch = twoWayRegex.exec(rawAttributes)) !== null) {
        element.twoWay.push({ propName: twoWayMatch[1], expression: twoWayMatch[2] });
        this.extractSignalCallsFromExpression(twoWayMatch[2], invokedSignals);
      }

      // Property bindings: [name]="val" (excluding [()])
      const inputRegex = /(?<!\()\[([a-zA-Z0-9_\-$]+)\](?!\))=["']([^"']*)["']/g;
      let inputMatch: RegExpExecArray | null;
      while ((inputMatch = inputRegex.exec(rawAttributes)) !== null) {
        element.inputs.push({ propName: inputMatch[1], expression: inputMatch[2] });
        this.extractSignalCallsFromExpression(inputMatch[2], invokedSignals);
      }

      // Event bindings: (event)="fn($event)"
      const outputRegex = /(?<!\[)\(([a-zA-Z0-9_\-$]+)\)(?!\])=["']([^"']*)["']/g;
      let outputMatch: RegExpExecArray | null;
      while ((outputMatch = outputRegex.exec(rawAttributes)) !== null) {
        element.outputs.push({ eventName: outputMatch[1], handler: outputMatch[2] });
        this.extractSignalCallsFromExpression(outputMatch[2], invokedSignals);
      }

      if (element.inputs.length > 0 || element.outputs.length > 0 || element.twoWay.length > 0) {
        elements.push(element);
      }
    }

    // 2. Extract signal calls in Interpolation: {{ count() }} or {{ user().name }}
    const interpolationRegex = /\{\{([\s\S]*?)\}\}/g;
    let interpMatch: RegExpExecArray | null;
    while ((interpMatch = interpolationRegex.exec(templateHtml)) !== null) {
      this.extractSignalCallsFromExpression(interpMatch[1], invokedSignals);
    }

    // 3. Extract signal calls in Angular 17+ control flow with balanced parens: @if (isLoading()), @for (x of items(); track x.id)
    const controlKeywords = ['@if', '@switch', '@case', '@for'];
    for (const kw of controlKeywords) {
      let pos = templateHtml.indexOf(kw);
      while (pos !== -1) {
        const openParen = templateHtml.indexOf('(', pos);
        if (openParen !== -1 && openParen - pos <= kw.length + 5) {
          let depth = 1;
          let i = openParen + 1;
          while (i < templateHtml.length && depth > 0) {
            if (templateHtml[i] === '(') depth++;
            else if (templateHtml[i] === ')') depth--;
            i++;
          }
          if (depth === 0) {
            const expr = templateHtml.substring(openParen + 1, i - 1);
            this.extractSignalCallsFromExpression(expr, invokedSignals);
          }
        }
        pos = templateHtml.indexOf(kw, pos + kw.length);
      }
    }

    return {
      renderedTags: Array.from(renderedTags),
      elements,
      invokedSignals: Array.from(invokedSignals)
    };
  }

  /**
   * Helper to detect signal getter invocations like mySignal() or user().name in expressions.
   */
  private extractSignalCallsFromExpression(expression: string, targetSet: Set<string>): void {
    if (!expression) return;
    // Match identifiers followed immediately by (): `mySignal()` or `user().id`
    const callRegex = /\b([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(\s*\)/g;
    let callMatch: RegExpExecArray | null;
    while ((callMatch = callRegex.exec(expression)) !== null) {
      const identifier = callMatch[1];
      // Exclude common JS / template builtins or math functions
      if (!['true', 'false', 'null', 'undefined', 'trackBy', '$event'].includes(identifier)) {
        targetSet.add(identifier);
      }
    }
  }
}
