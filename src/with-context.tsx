import React, { ComponentProps, ForwardedRef } from 'react';
import { PopupMenuContext } from './MenuProvider';

type Props = { forwardedRef?: unknown };
export function withContext<T extends ComponentProps<any>>(
  Context: typeof PopupMenuContext,
  propName = 'context',
) {
  return function wrap(Component: React.ComponentType<T & any>) {
    class EnhanceContext extends React.Component<T & Props> {
      render() {
        const { forwardedRef, ...rest } = this.props;

        return (
          <Context.Consumer>
            {(value: unknown) => {
              const custom = {
                [propName]: value,
                ref: forwardedRef,
              };
              return <Component {...custom} {...rest} />;
            }}
          </Context.Consumer>
        );
      }
    }

    const name = Component.displayName || Component.name || 'Component';
    const consumerName = Context.displayName || Context.Consumer.name || 'Context.Consumer';

    function enhanceForwardRef(props: ComponentProps<any>, ref: ForwardedRef<EnhanceContext>) {
      return <EnhanceContext {...props} forwardedRef={ref} />;
    }

    enhanceForwardRef.displayName = `enhanceContext-${consumerName}(${name})`;

    const FC = React.forwardRef(enhanceForwardRef);
    FC.defaultProps = Component.defaultProps;
    FC.propTypes = Component.propTypes;
    return FC;
  };
}
