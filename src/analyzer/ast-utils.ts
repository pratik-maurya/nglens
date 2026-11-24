import ts from 'typescript';
import {
  SignalDetail,
  SignalType,
  InputDetail,
  OutputDetail,
  InjectedDependency
} from './types.js';

export class AstUtils {
  /**
   * Find all class declarations in a TypeScript source file.
   */
  public static findClassDeclarations(sourceFile: ts.SourceFile): ts.ClassDeclaration[] {
    const classes: ts.ClassDeclaration[] = [];
    const visit = (node: ts.Node) => {
      if (ts.isClassDeclaration(node)) {
        classes.push(node);
      }
      ts.forEachChild(node, visit);
    };
    visit(sourceFile);
    return classes;
  }

  /**
   * Get decorators attached to a class or property, compatible with TS 4 & 5.
   */
  public static getDecorators(node: ts.Node): ts.Decorator[] {
    // In TS 5+, decorators are part of node.modifiers
    if (ts.canHaveDecorators(node)) {
      const decorators = ts.getDecorators(node);
      if (decorators) {
        return Array.from(decorators);
      }
    }
    return [];
  }

  /**
   * Check if a class has a decorator with given name (e.g. 'Component' or 'Injectable').
   */
  public static getDecoratorNamed(node: ts.Node, decoratorName: string): ts.Decorator | undefined {
    const decorators = this.getDecorators(node);
    return decorators.find(d => {
      if (ts.isCallExpression(d.expression)) {
        const expr = d.expression.expression;
        if (ts.isIdentifier(expr)) {
          return expr.text === decoratorName;
        }
      }
      return false;
    });
  }

  /**
   * Extract arguments object literal from a decorator like @Component({ ... }).
   */
  public static getDecoratorArgumentObject(decorator: ts.Decorator): ts.ObjectLiteralExpression | undefined {
    if (ts.isCallExpression(decorator.expression) && decorator.expression.arguments.length > 0) {
      const arg = decorator.expression.arguments[0];
      if (ts.isObjectLiteralExpression(arg)) {
        return arg;
      }
    }
    return undefined;
  }

  /**
   * Read a property assignment from an ObjectLiteralExpression.
   */
  public static getObjectProperty(
    obj: ts.ObjectLiteralExpression,
    propName: string
  ): ts.ObjectLiteralElementLike | undefined {
    return obj.properties.find(p => {
      if (ts.isPropertyAssignment(p) && ts.isIdentifier(p.name)) {
        return p.name.text === propName;
      }
      return false;
    });
  }

  /**
   * Get string value of a property in an object literal.
   */
  public static getStringProperty(obj: ts.ObjectLiteralExpression, propName: string): string | undefined {
    const prop = this.getObjectProperty(obj, propName);
    if (prop && ts.isPropertyAssignment(prop)) {
      if (ts.isStringLiteral(prop.initializer) || ts.isNoSubstitutionTemplateLiteral(prop.initializer)) {
        return prop.initializer.text;
      }
    }
    return undefined;
  }

  /**
   * Get boolean value of a property in an object literal.
   */
  public static getBooleanProperty(obj: ts.ObjectLiteralExpression, propName: string): boolean | undefined {
    const prop = this.getObjectProperty(obj, propName);
    if (prop && ts.isPropertyAssignment(prop)) {
      if (prop.initializer.kind === ts.SyntaxKind.TrueKeyword) return true;
      if (prop.initializer.kind === ts.SyntaxKind.FalseKeyword) return false;
    }
    return undefined;
  }

  /**
   * Extract array of identifier names from property like imports: [CommonModule, UserCardComponent].
   */
  public static getArrayIdentifiers(obj: ts.ObjectLiteralExpression, propName: string): string[] {
    const prop = this.getObjectProperty(obj, propName);
    const identifiers: string[] = [];
    if (prop && ts.isPropertyAssignment(prop) && ts.isArrayLiteralExpression(prop.initializer)) {
      for (const el of prop.initializer.elements) {
        if (ts.isIdentifier(el)) {
          identifiers.push(el.text);
        } else if (ts.isPropertyAccessExpression(el)) {
          identifiers.push(el.getText());
        }
      }
    }
    return identifiers;
  }

  /**
   * Parse Signals, modern inputs/outputs, and DI inside a class declaration.
   */
  public static parseClassMembers(
    classDecl: ts.ClassDeclaration,
    sourceFile: ts.SourceFile
  ): {
    signals: SignalDetail[];
    inputs: InputDetail[];
    outputs: OutputDetail[];
    injectedServices: InjectedDependency[];
  } {
    const signals: SignalDetail[] = [];
    const inputs: InputDetail[] = [];
    const outputs: OutputDetail[] = [];

    // Parse constructor DI first
    const injectedServices = this.parseConstructorDI(classDecl, sourceFile);

    // Parse class property declarations
    for (const member of classDecl.members) {
      if (ts.isPropertyDeclaration(member) && member.name && ts.isIdentifier(member.name)) {
        const propName = member.name.text;
        const line = sourceFile.getLineAndCharacterOfPosition(member.getStart(sourceFile)).line + 1;

        // Check for modern signal/computed/model/input calls: prop = signal(0), prop = computed(() => ...)
        if (member.initializer && ts.isCallExpression(member.initializer)) {
          const callText = this.getCallExpressionName(member.initializer);
          
          if (callText === 'input' || callText === 'input.required') {
            inputs.push({
              name: propName,
              isSignal: true,
              isRequired: callText === 'input.required',
              line,
              typeText: member.type ? member.type.getText(sourceFile) : undefined
            });
            // Also treat input signal as a signal node
            signals.push({
              name: propName,
              type: 'input',
              line,
              dependencies: []
            });
            continue;
          }

          if (callText === 'output') {
            outputs.push({
              name: propName,
              isSignal: true,
              line,
              typeText: member.type ? member.type.getText(sourceFile) : undefined
            });
            continue;
          }

          if (callText === 'inject') {
            const firstArg = member.initializer.arguments[0];
            if (firstArg && ts.isIdentifier(firstArg)) {
              injectedServices.push({
                tokenName: firstArg.text,
                kind: 'inject-function',
                line
              });
            }
            continue;
          }

          if (
            callText === 'signal' ||
            callText === 'computed' ||
            callText === 'model' ||
            callText === 'model.required' ||
            callText === 'effect' ||
            callText === 'toSignal' ||
            callText === 'toObservable'
          ) {
            const sigType: SignalType =
              callText === 'model.required' ? 'model' : (callText as SignalType);

            const deps = this.findSignalDependencies(member.initializer, sourceFile);

            signals.push({
              name: propName,
              type: sigType,
              line,
              initialValueSnippet: member.initializer.arguments[0]?.getText(sourceFile),
              dependencies: deps
            });
            continue;
          }
        }

        // Check classic decorators: @Input(), @Output()
        const inputDecorator = this.getDecoratorNamed(member, 'Input');
        if (inputDecorator) {
          inputs.push({
            name: propName,
            isSignal: false,
            isRequired: false,
            line,
            typeText: member.type ? member.type.getText(sourceFile) : undefined
          });
        }

        const outputDecorator = this.getDecoratorNamed(member, 'Output');
        if (outputDecorator) {
          outputs.push({
            name: propName,
            isSignal: false,
            line,
            typeText: member.type ? member.type.getText(sourceFile) : undefined
          });
        }
      }
    }

    return {
      signals,
      inputs,
      outputs,
      injectedServices
    };
  }

  /**
   * Parse DI from constructor parameters: constructor(private auth: AuthService, ...)
   */
  private static parseConstructorDI(
    classDecl: ts.ClassDeclaration,
    sourceFile: ts.SourceFile
  ): InjectedDependency[] {
    const deps: InjectedDependency[] = [];
    const ctor = classDecl.members.find(ts.isConstructorDeclaration);
    if (!ctor) return deps;

    for (const param of ctor.parameters) {
      if (param.type && ts.isTypeReferenceNode(param.type)) {
        if (ts.isIdentifier(param.type.typeName)) {
          const line = sourceFile.getLineAndCharacterOfPosition(param.getStart(sourceFile)).line + 1;
          deps.push({
            tokenName: param.type.typeName.text,
            kind: 'constructor',
            line
          });
        }
      }
    }
    return deps;
  }

  /**
   * Helper to get call name like 'signal', 'computed', 'input.required', 'inject'
   */
  private static getCallExpressionName(callExpr: ts.CallExpression): string {
    const expr = callExpr.expression;
    if (ts.isIdentifier(expr)) {
      return expr.text;
    }
    if (ts.isPropertyAccessExpression(expr)) {
      return expr.getText();
    }
    return '';
  }

  /**
   * Find identifiers called as functions inside a computed/effect expression, e.g. this.count() or user()
   */
  private static findSignalDependencies(node: ts.Node, sourceFile: ts.SourceFile): string[] {
    const deps = new Set<string>();
    const visit = (n: ts.Node) => {
      if (ts.isCallExpression(n)) {
        if (ts.isPropertyAccessExpression(n.expression)) {
          if (n.expression.expression.kind === ts.SyntaxKind.ThisKeyword) {
            deps.add(n.expression.name.text);
          }
        } else if (ts.isIdentifier(n.expression)) {
          // e.g. counter()
          deps.add(n.expression.text);
        }
      }
      ts.forEachChild(n, visit);
    };
    visit(node);
    return Array.from(deps);
  }
}
