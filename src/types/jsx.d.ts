// Global JSX namespace shim. The codebase uses `JSX.Element` literally even
// though `jsx: react-jsx` doesn't pull a global JSX namespace into scope.
// Mirror React's JSX namespace so existing code compiles unchanged.

import 'react';

declare global {
  namespace JSX {
    type Element = React.ReactElement;
    interface IntrinsicElements extends React.JSX.IntrinsicElements {}
    interface ElementClass extends React.JSX.ElementClass {}
    interface ElementAttributesProperty extends React.JSX.ElementAttributesProperty {}
    interface ElementChildrenAttribute extends React.JSX.ElementChildrenAttribute {}
    interface LibraryManagedAttributes<C, P>
      extends React.JSX.LibraryManagedAttributes<C, P> {}
    interface IntrinsicAttributes extends React.JSX.IntrinsicAttributes {}
    interface IntrinsicClassAttributes<T> extends React.JSX.IntrinsicClassAttributes<T> {}
  }
}

export {};
