import React, { Component, isValidElement, ReactElement, ReactNode } from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { makeName } from './helpers';
import { CFG, debug } from './logger';
import MenuOptions from './MenuOptions';
import { withCtx } from './MenuProvider';
import MenuTrigger from './MenuTrigger';
import { MenuContextProps, MenuOptionsProps, MenuTriggerProps } from './types';

const isRegularComponent = (c: ReactNode): c is ReactElement =>
  isValidElement(c) && c.type !== MenuOptions && c.type !== MenuTrigger;
const isTrigger = (c: ReactNode): c is ReactElement<MenuTriggerProps> =>
  isValidElement(c) && c.type === MenuTrigger;
const isMenuOptions = (c: ReactNode): c is ReactElement<MenuOptionsProps> =>
  isValidElement(c) && c.type === MenuOptions;

export interface MenuProps {
  name?: string;
  opened?: boolean;
  renderer?: Function;
  rendererProps?: Record<string, unknown>;
  style?: StyleProp<ViewStyle>;

  onSelect?: (value: unknown) => unknown;

  onOpen?(): void;

  onClose?(): void;

  onBackdropPress?(): void;
  children?: React.ReactNode;
}

type Props = MenuProps & MenuContextProps;
export class Menu extends Component<Props> {
  _forceClose: boolean;
  _name: string;
  _opened: boolean;
  _trigger: View | null;
  constructor(props: Props) {
    super(props);

    this._forceClose = false;
    this._name = this.props.name || makeName();
    this._opened = false;
    this._trigger = null;

    const { ctx } = props;
    if (!(ctx && ctx.menuActions)) {
      throw new Error('Menu component must be ancestor of MenuProvider');
    }
  }

  componentDidMount() {
    if (!this._validateChildren()) {
      return;
    }
    debug('subscribing menu', this._name);
    this.props.ctx.menuRegistry.subscribe(this);
    this.props.ctx.menuActions._notify();
  }

  componentDidUpdate(prevProps: Props) {
    if (this.props.name !== prevProps.name) {
      console.warn('Menu name cannot be changed');
    }
    // force update if menu is opened as its content might have changed
    const force = this.isOpen();
    debug('component did update', this._name, force);
    this.props.ctx.menuActions._notify(force);
  }

  componentWillUnmount() {
    debug('unsubscribing menu', this._name);
    if (this.isOpen()) {
      this._forceClose = true;
      this.props.ctx.menuActions._notify();
    }
    this.props.ctx.menuRegistry.unsubscribe(this);
  }

  open() {
    return this.props.ctx.menuActions.openMenu(this._name);
  }

  close() {
    return this.props.ctx.menuActions.closeMenu();
  }

  isOpen() {
    if (this._forceClose) {
      return false;
    }
    return this.props.hasOwnProperty('opened') ? this.props.opened : this._opened;
  }

  getName() {
    return this._name;
  }

  render() {
    const { style } = this.props;
    const children = this._reduceChildren();
    return <View style={style}>{children}</View>;
  }

  _reduceChildren() {
    return React.Children.toArray(this.props.children).reduce(
      (r: ReactNode[], child: ReactNode) => {
        if (isTrigger(child)) {
          r.push(
            React.cloneElement(child, {
              key: null,
              menuName: this._name,
              onRef: (t: View) => (this._trigger = t),
            }),
          );
        }
        if (isRegularComponent(child)) {
          r.push(child);
        }

        return r;
      },
      [] as ReactElement[],
    );
  }

  _getTrigger() {
    return this._trigger;
  }

  _getOptions() {
    return React.Children.toArray(this.props.children).find(isMenuOptions);
  }

  _getOpened() {
    return this._opened;
  }

  _setOpened(opened: boolean) {
    this._opened = opened;
  }

  _validateChildren() {
    const children = React.Children.toArray(this.props.children);
    const options = children.find(isMenuOptions);
    if (!options) {
      console.warn('Menu has to contain MenuOptions component');
    }
    const trigger = children.find(isTrigger);
    if (!trigger) {
      console.warn('Menu has to contain MenuTrigger component');
    }
    return options && trigger;
  }
}

const MenuExternal = withCtx(Menu);
Object.defineProperty(MenuExternal, 'debug', {
  get: function () {
    return CFG.debug;
  },
  set: function (val) {
    CFG.debug = val;
  },
});
export default MenuExternal;
