import { AnalysisResult } from '../analyzer/types.js';

export function getDemoAngularProjectData(): AnalysisResult {
  return {
    projectRoot: 'd:/demo/modern-angular-store',
    analyzedAt: new Date().toISOString(),
    components: [
      {
        id: 'src/app/app.component.ts:AppComponent',
        className: 'AppComponent',
        selector: 'app-root',
        filePath: 'd:/demo/modern-angular-store/src/app/app.component.ts',
        relativePath: 'src/app/app.component.ts',
        standalone: true,
        changeDetection: 'OnPush',
        templateSource: 'inline',
        declaredImports: ['NavbarComponent', 'ProductListComponent', 'CartDrawerComponent'],
        renderedChildrenSelectors: ['app-navbar', 'app-product-list', 'app-cart-drawer'],
        signals: [
          { name: 'isCartOpen', type: 'model', line: 15, dependencies: [] },
          { name: 'currentCategory', type: 'signal', line: 18, dependencies: [] }
        ],
        inputs: [],
        outputs: [],
        injectedServices: [{ tokenName: 'AnalyticsService', kind: 'inject-function', line: 14 }],
        lineCount: 42,
        hasTemplate: true
      },
      {
        id: 'src/app/navbar/navbar.component.ts:NavbarComponent',
        className: 'NavbarComponent',
        selector: 'app-navbar',
        filePath: 'd:/demo/modern-angular-store/src/app/navbar/navbar.component.ts',
        relativePath: 'src/app/navbar/navbar.component.ts',
        standalone: true,
        changeDetection: 'OnPush',
        templateSource: 'inline',
        declaredImports: ['CartBadgeComponent'],
        renderedChildrenSelectors: ['app-cart-badge'],
        signals: [
          { name: 'searchQuery', type: 'signal', line: 12, dependencies: [] },
          { name: 'isMenuOpen', type: 'signal', line: 14, dependencies: [] }
        ],
        inputs: [],
        outputs: [{ name: 'openCart', isSignal: true, line: 16 }],
        injectedServices: [
          { tokenName: 'AuthService', kind: 'inject-function', line: 10 },
          { tokenName: 'CartService', kind: 'constructor', line: 11 }
        ],
        lineCount: 50,
        hasTemplate: true
      },
      {
        id: 'src/app/products/product-list.component.ts:ProductListComponent',
        className: 'ProductListComponent',
        selector: 'app-product-list',
        filePath: 'd:/demo/modern-angular-store/src/app/products/product-list.component.ts',
        relativePath: 'src/app/products/product-list.component.ts',
        standalone: true,
        changeDetection: 'OnPush',
        templateSource: 'inline',
        declaredImports: ['ProductCardComponent'],
        renderedChildrenSelectors: ['app-product-card'],
        signals: [
          { name: 'products', type: 'signal', line: 20, dependencies: [] },
          { name: 'filter', type: 'signal', line: 22, dependencies: [] },
          {
            name: 'filteredProducts',
            type: 'computed',
            line: 25,
            dependencies: ['products', 'filter']
          }
        ],
        inputs: [],
        outputs: [],
        injectedServices: [{ tokenName: 'CartService', kind: 'inject-function', line: 16 }],
        lineCount: 65,
        hasTemplate: true
      },
      {
        id: 'src/app/products/product-card.component.ts:ProductCardComponent',
        className: 'ProductCardComponent',
        selector: 'app-product-card',
        filePath: 'd:/demo/modern-angular-store/src/app/products/product-card.component.ts',
        relativePath: 'src/app/products/product-card.component.ts',
        standalone: true,
        changeDetection: 'OnPush',
        templateSource: 'inline',
        declaredImports: [],
        renderedChildrenSelectors: [],
        signals: [
          { name: 'isFavorite', type: 'signal', line: 16, dependencies: [] },
          { name: 'product', type: 'input', line: 12, dependencies: [] },
          {
            name: 'formattedPrice',
            type: 'computed',
            line: 18,
            dependencies: ['product']
          }
        ],
        inputs: [{ name: 'product', isSignal: true, isRequired: true, line: 12 }],
        outputs: [{ name: 'addToCart', isSignal: true, line: 14 }],
        injectedServices: [],
        lineCount: 40,
        hasTemplate: true
      },
      {
        id: 'src/app/cart/cart-drawer.component.ts:CartDrawerComponent',
        className: 'CartDrawerComponent',
        selector: 'app-cart-drawer',
        filePath: 'd:/demo/modern-angular-store/src/app/cart/cart-drawer.component.ts',
        relativePath: 'src/app/cart/cart-drawer.component.ts',
        standalone: true,
        changeDetection: 'OnPush',
        templateSource: 'inline',
        declaredImports: ['CheckoutDialogComponent'],
        renderedChildrenSelectors: ['app-checkout-dialog'],
        signals: [
          { name: 'isOpen', type: 'model', line: 14, dependencies: [] },
          {
            name: 'totalPrice',
            type: 'computed',
            line: 22,
            dependencies: ['items']
          }
        ],
        inputs: [{ name: 'isOpen', isSignal: true, isRequired: false, line: 14 }],
        outputs: [],
        injectedServices: [{ tokenName: 'CartService', kind: 'inject-function', line: 12 }],
        lineCount: 55,
        hasTemplate: true
      },
      {
        id: 'src/app/cart/cart-badge.component.ts:CartBadgeComponent',
        className: 'CartBadgeComponent',
        selector: 'app-cart-badge',
        filePath: 'd:/demo/modern-angular-store/src/app/cart/cart-badge.component.ts',
        relativePath: 'src/app/cart/cart-badge.component.ts',
        standalone: true,
        changeDetection: 'OnPush',
        templateSource: 'inline',
        declaredImports: [],
        renderedChildrenSelectors: [],
        signals: [
          {
            name: 'count',
            type: 'computed',
            line: 16,
            dependencies: ['cartService.items']
          }
        ],
        inputs: [],
        outputs: [],
        injectedServices: [{ tokenName: 'CartService', kind: 'inject-function', line: 10 }],
        lineCount: 30,
        hasTemplate: true
      },
      {
        id: 'src/app/cart/checkout-dialog.component.ts:CheckoutDialogComponent',
        className: 'CheckoutDialogComponent',
        selector: 'app-checkout-dialog',
        filePath: 'd:/demo/modern-angular-store/src/app/cart/checkout-dialog.component.ts',
        relativePath: 'src/app/cart/checkout-dialog.component.ts',
        standalone: true,
        changeDetection: 'OnPush',
        templateSource: 'inline',
        declaredImports: ['CartDrawerComponent'], // Intentional cycle for detection!
        renderedChildrenSelectors: ['app-cart-drawer'],
        signals: [{ name: 'isProcessing', type: 'signal', line: 12, dependencies: [] }],
        inputs: [],
        outputs: [{ name: 'completed', isSignal: true, line: 15 }],
        injectedServices: [{ tokenName: 'CartService', kind: 'inject-function', line: 10 }],
        lineCount: 45,
        hasTemplate: true
      },
      {
        id: 'src/app/shared/orphan-modal.component.ts:OrphanModalComponent',
        className: 'OrphanModalComponent',
        selector: 'app-orphan-modal',
        filePath: 'd:/demo/modern-angular-store/src/app/shared/orphan-modal.component.ts',
        relativePath: 'src/app/shared/orphan-modal.component.ts',
        standalone: true,
        changeDetection: 'Default',
        templateSource: 'inline',
        declaredImports: [],
        renderedChildrenSelectors: [],
        signals: [],
        inputs: [{ name: 'visible', isSignal: false, isRequired: false, line: 8 }],
        outputs: [],
        injectedServices: [],
        lineCount: 25,
        hasTemplate: true
      }
    ],
    services: [
      {
        id: 'src/app/services/cart.service.ts:CartService',
        className: 'CartService',
        filePath: 'd:/demo/modern-angular-store/src/app/services/cart.service.ts',
        relativePath: 'src/app/services/cart.service.ts',
        providedIn: 'root',
        injectedTokens: ['AnalyticsService'],
        lineCount: 60
      },
      {
        id: 'src/app/services/auth.service.ts:AuthService',
        className: 'AuthService',
        filePath: 'd:/demo/modern-angular-store/src/app/services/auth.service.ts',
        relativePath: 'src/app/services/auth.service.ts',
        providedIn: 'root',
        injectedTokens: [],
        lineCount: 40
      },
      {
        id: 'src/app/services/analytics.service.ts:AnalyticsService',
        className: 'AnalyticsService',
        filePath: 'd:/demo/modern-angular-store/src/app/services/analytics.service.ts',
        relativePath: 'src/app/services/analytics.service.ts',
        providedIn: 'root',
        injectedTokens: [],
        lineCount: 35
      }
    ],
    nodes: [
      {
        id: 'src/app/app.component.ts:AppComponent',
        label: 'AppComponent',
        type: 'component',
        metadata: {
          selector: 'app-root',
          relativePath: 'src/app/app.component.ts',
          standalone: true,
          changeDetection: 'OnPush',
          signals: [
            { name: 'isCartOpen', type: 'model', line: 15, dependencies: [] },
            { name: 'currentCategory', type: 'signal', line: 18, dependencies: [] }
          ],
          injectedServices: [{ tokenName: 'AnalyticsService', kind: 'inject-function', line: 14 }]
        }
      },
      {
        id: 'src/app/navbar/navbar.component.ts:NavbarComponent',
        label: 'NavbarComponent',
        type: 'component',
        metadata: {
          selector: 'app-navbar',
          relativePath: 'src/app/navbar/navbar.component.ts',
          standalone: true,
          changeDetection: 'OnPush',
          signals: [
            { name: 'searchQuery', type: 'signal', line: 12, dependencies: [] },
            { name: 'isMenuOpen', type: 'signal', line: 14, dependencies: [] }
          ],
          outputs: [{ name: 'openCart', isSignal: true, line: 16 }],
          injectedServices: [
            { tokenName: 'AuthService', kind: 'inject-function', line: 10 },
            { tokenName: 'CartService', kind: 'constructor', line: 11 }
          ]
        }
      },
      {
        id: 'src/app/products/product-list.component.ts:ProductListComponent',
        label: 'ProductListComponent',
        type: 'component',
        metadata: {
          selector: 'app-product-list',
          relativePath: 'src/app/products/product-list.component.ts',
          standalone: true,
          signals: [
            { name: 'products', type: 'signal', line: 20, dependencies: [] },
            { name: 'filter', type: 'signal', line: 22, dependencies: [] },
            { name: 'filteredProducts', type: 'computed', line: 25, dependencies: ['products', 'filter'] }
          ],
          injectedServices: [{ tokenName: 'CartService', kind: 'inject-function', line: 16 }]
        }
      },
      {
        id: 'src/app/products/product-card.component.ts:ProductCardComponent',
        label: 'ProductCardComponent',
        type: 'component',
        metadata: {
          selector: 'app-product-card',
          relativePath: 'src/app/products/product-card.component.ts',
          standalone: true,
          signals: [
            { name: 'isFavorite', type: 'signal', line: 16, dependencies: [] },
            { name: 'product', type: 'input', line: 12, dependencies: [] },
            { name: 'formattedPrice', type: 'computed', line: 18, dependencies: ['product'] }
          ],
          inputs: [{ name: 'product', isSignal: true, isRequired: true, line: 12 }],
          outputs: [{ name: 'addToCart', isSignal: true, line: 14 }]
        }
      },
      {
        id: 'src/app/cart/cart-drawer.component.ts:CartDrawerComponent',
        label: 'CartDrawerComponent',
        type: 'component',
        metadata: {
          selector: 'app-cart-drawer',
          relativePath: 'src/app/cart/cart-drawer.component.ts',
          standalone: true,
          isCircular: true,
          signals: [
            { name: 'isOpen', type: 'model', line: 14, dependencies: [] },
            { name: 'totalPrice', type: 'computed', line: 22, dependencies: ['items'] }
          ],
          inputs: [{ name: 'isOpen', isSignal: true, isRequired: false, line: 14 }],
          injectedServices: [{ tokenName: 'CartService', kind: 'inject-function', line: 12 }]
        }
      },
      {
        id: 'src/app/cart/cart-badge.component.ts:CartBadgeComponent',
        label: 'CartBadgeComponent',
        type: 'component',
        metadata: {
          selector: 'app-cart-badge',
          relativePath: 'src/app/cart/cart-badge.component.ts',
          standalone: true,
          signals: [{ name: 'count', type: 'computed', line: 16, dependencies: ['cartService.items'] }],
          injectedServices: [{ tokenName: 'CartService', kind: 'inject-function', line: 10 }]
        }
      },
      {
        id: 'src/app/cart/checkout-dialog.component.ts:CheckoutDialogComponent',
        label: 'CheckoutDialogComponent',
        type: 'component',
        metadata: {
          selector: 'app-checkout-dialog',
          relativePath: 'src/app/cart/checkout-dialog.component.ts',
          standalone: true,
          isCircular: true,
          signals: [{ name: 'isProcessing', type: 'signal', line: 12, dependencies: [] }],
          outputs: [{ name: 'completed', isSignal: true, line: 15 }],
          injectedServices: [{ tokenName: 'CartService', kind: 'inject-function', line: 10 }]
        }
      },
      {
        id: 'src/app/shared/orphan-modal.component.ts:OrphanModalComponent',
        label: 'OrphanModalComponent',
        type: 'component',
        metadata: {
          selector: 'app-orphan-modal',
          relativePath: 'src/app/shared/orphan-modal.component.ts',
          standalone: true,
          isOrphan: true,
          inputs: [{ name: 'visible', isSignal: false, isRequired: false, line: 8 }]
        }
      },
      {
        id: 'src/app/services/cart.service.ts:CartService',
        label: 'CartService',
        type: 'service',
        metadata: { relativePath: 'src/app/services/cart.service.ts', providedIn: 'root' }
      },
      {
        id: 'src/app/services/auth.service.ts:AuthService',
        label: 'AuthService',
        type: 'service',
        metadata: { relativePath: 'src/app/services/auth.service.ts', providedIn: 'root' }
      },
      {
        id: 'src/app/services/analytics.service.ts:AnalyticsService',
        label: 'AnalyticsService',
        type: 'service',
        metadata: { relativePath: 'src/app/services/analytics.service.ts', providedIn: 'root' }
      }
    ],
    edges: [
      { id: 'e1', source: 'src/app/app.component.ts:AppComponent', target: 'src/app/navbar/navbar.component.ts:NavbarComponent', type: 'renders', label: '<app-navbar>' },
      { id: 'e2', source: 'src/app/app.component.ts:AppComponent', target: 'src/app/products/product-list.component.ts:ProductListComponent', type: 'renders', label: '<app-product-list>' },
      { id: 'e3', source: 'src/app/app.component.ts:AppComponent', target: 'src/app/cart/cart-drawer.component.ts:CartDrawerComponent', type: 'renders', label: '<app-cart-drawer>' },
      { id: 'e4', source: 'src/app/navbar/navbar.component.ts:NavbarComponent', target: 'src/app/cart/cart-badge.component.ts:CartBadgeComponent', type: 'renders', label: '<app-cart-badge>' },
      { id: 'e5', source: 'src/app/products/product-list.component.ts:ProductListComponent', target: 'src/app/products/product-card.component.ts:ProductCardComponent', type: 'renders', label: '<app-product-card>' },
      { id: 'e6', source: 'src/app/cart/cart-drawer.component.ts:CartDrawerComponent', target: 'src/app/cart/checkout-dialog.component.ts:CheckoutDialogComponent', type: 'renders', label: '<app-checkout-dialog>', isCircular: true },
      { id: 'e7', source: 'src/app/cart/checkout-dialog.component.ts:CheckoutDialogComponent', target: 'src/app/cart/cart-drawer.component.ts:CartDrawerComponent', type: 'renders', label: '<app-cart-drawer>', isCircular: true },
      { id: 'e8', source: 'src/app/navbar/navbar.component.ts:NavbarComponent', target: 'src/app/services/cart.service.ts:CartService', type: 'injects', label: 'constructor' },
      { id: 'e9', source: 'src/app/navbar/navbar.component.ts:NavbarComponent', target: 'src/app/services/auth.service.ts:AuthService', type: 'injects', label: 'inject()' },
      { id: 'e10', source: 'src/app/products/product-list.component.ts:ProductListComponent', target: 'src/app/services/cart.service.ts:CartService', type: 'injects', label: 'inject()' },
      { id: 'e11', source: 'src/app/cart/cart-drawer.component.ts:CartDrawerComponent', target: 'src/app/services/cart.service.ts:CartService', type: 'injects', label: 'inject()' },
      { id: 'e12', source: 'src/app/services/cart.service.ts:CartService', target: 'src/app/services/analytics.service.ts:AnalyticsService', type: 'injects', label: 'inject()' }
    ],
    diagnostics: [
      {
        id: 'diag-cycle-0',
        severity: 'error',
        code: 'CIRCULAR_DEPENDENCY',
        title: 'Circular Dependency Detected',
        message: 'Circular reference detected: CartDrawerComponent ➔ CheckoutDialogComponent ➔ CartDrawerComponent',
        relatedNodes: [
          'src/app/cart/cart-drawer.component.ts:CartDrawerComponent',
          'src/app/cart/checkout-dialog.component.ts:CheckoutDialogComponent',
          'src/app/cart/cart-drawer.component.ts:CartDrawerComponent'
        ]
      },
      {
        id: 'diag-orphan-1',
        severity: 'warning',
        code: 'UNUSED_COMPONENT',
        title: 'Unused / Orphan Component',
        message: "Component 'OrphanModalComponent' (app-orphan-modal) is never rendered in any template and never imported.",
        filePath: 'd:/demo/modern-angular-store/src/app/shared/orphan-modal.component.ts',
        relatedNodes: ['src/app/shared/orphan-modal.component.ts:OrphanModalComponent']
      }
    ],
    metrics: {
      totalComponents: 8,
      standaloneComponents: 8,
      legacyComponents: 0,
      totalServices: 3,
      totalSignals: 9,
      totalComputed: 4,
      totalClassicInputs: 1,
      totalSignalInputs: 2,
      signalAdoptionRatePercent: 94,
      circularDependencyCyclesCount: 1,
      unusedComponentsCount: 1
    }
  };
}
