import React, { Component, createContext, FunctionComponent, ReactNode } from 'react';
import {
  BackHandler,
  LayoutChangeEvent,
  LayoutRectangle,
  SafeAreaView,
  StyleSheet,
  View,
} from 'react-native';
import Backdrop from './Backdrop';
import { measure } from './helpers';
import { debug } from './logger';
import { MenuProps } from './Menu';
import MenuPlaceholder from './MenuPlaceholder';
import makeMenuRegistry from './menuRegistry';
import MenuOutside from './renderers/MenuOutside';
import {
  Menu,
  MenuActions,
  MenuContext,
  MenuContextProps,
  MenuEntry,
  MenuProviderProps,
  MenuRegistry,
} from './types';
import { withContext } from './with-context';

const defaultOptionsContainerRenderer = (options: ReactNode) => options;
const layoutsEqual = (a?: LayoutRectangle, b?: LayoutRectangle) =>
  a === b || (a && b && a.width === b.width && a.height === b.height);

if (!React.forwardRef) {
  throw new Error('This version of popup-menu requires RN 0.55+. Check our compatibility table.');
}
export const PopupMenuContext = createContext({});
export const withCtx = withContext<MenuContextProps>(PopupMenuContext, 'ctx');

// count of MenuProvider instances
let instanceCount = 0;

type Props = MenuProviderProps;

export default class MenuProvider extends Component<Props> {
  _isMenuClosing: boolean;
  _isBackHandlerRegistered: boolean;
  _ownLayout?: LayoutRectangle;
  _safeAreaLayout?: LayoutRectangle;
  _placeholderRef?: MenuPlaceholder;
  menuRegistry: MenuRegistry;
  menuActions: MenuActions;
  menuCtx: Partial<MenuContext>;
  backdropRef?: Backdrop;
  openedMenu?: MenuEntry;
  optionsRef?: Menu;

  constructor(props: Props) {
    super(props);
    this.menuRegistry = makeMenuRegistry();
    this.menuActions = {
      openMenu: (name: string) => this.openMenu(name),
      closeMenu: () => this.closeMenu(),
      toggleMenu: (name: string) => this.toggleMenu(name),
      isMenuOpen: () => this.isMenuOpen(),
      _getOpenedMenu: () => this._getOpenedMenu(),
      _notify: (force?: boolean) => this._notify(force),
    };
    this._isMenuClosing = false;
    this._isBackHandlerRegistered = false;

    this.menuCtx = {
      menuRegistry: this.menuRegistry,
      menuActions: this.menuActions,
    };
  }

  _handleBackButton = () => {
    const { backHandler } = this.props;
    debug('_handleBackButton called', backHandler);

    // Default handler if true is passed
    if (backHandler === true) {
      if (this.isMenuOpen()) {
        this.closeMenu();
        return true;
      }
    }

    // Custom handler called with MenuProvider instance id function is passed
    if (typeof backHandler === 'function') {
      return backHandler(this);
    }

    return false;
  };

  componentDidMount() {
    const { customStyles, skipInstanceCheck } = this.props;
    if (!skipInstanceCheck) {
      instanceCount++;
    }
    if (instanceCount > 1) {
      console.warn(
        'In most cases you should not have more MenuProviders in your app (see API documentation). In other cases use skipInstanceCheck prop.',
      );
    }
  }

  componentWillUnmount() {
    debug('unmounting menu provider');
    if (this._isBackHandlerRegistered) {
      BackHandler.removeEventListener('hardwareBackPress', this._handleBackButton);
    }
    const { skipInstanceCheck } = this.props;
    if (!skipInstanceCheck) {
      instanceCount--;
    }
  }

  isMenuOpen() {
    return !!this._getOpenedMenu();
  }

  openMenu(name: string) {
    const menu = this.menuRegistry.getMenu(name);
    if (!menu) {
      console.warn(`menu with name ${name} does not exist`);
      return Promise.resolve();
    }
    debug('open menu', name);
    if (!this._isBackHandlerRegistered) {
      // delay menu registration until the menu is really opened (and thus this back handler will be called "sooner")
      // too soon registration can cause another back handlers (e.g. react navigation) to be called instead of our back handler
      BackHandler.addEventListener('hardwareBackPress', this._handleBackButton);
      this._isBackHandlerRegistered = true;
    }
    menu.instance._setOpened(true);
    return this._notify();
  }

  closeMenu() {
    // has no effect on controlled menus
    debug('close menu');
    this.menuRegistry
      .getAll()
      .filter(menu => menu.instance._getOpened())
      .forEach(menu => menu.instance._setOpened(false));
    return this._notify();
  }

  _invalidateTriggerLayouts() {
    // invalidate layouts for closed menus,
    // both controlled and uncontrolled menus
    this.menuRegistry
      .getAll()
      .filter(menu => !menu.instance.isOpen())
      .forEach(menu => {
        this.menuRegistry.updateLayoutInfo(menu.name, { triggerLayout: undefined });
      });
  }

  _beforeClose(menu: MenuEntry) {
    debug('before close', menu.name);
    const hideMenu = this.optionsRef?.close?.() || Promise.resolve();
    const hideBackdrop = this.backdropRef && this.backdropRef.close();
    this._invalidateTriggerLayouts();
    this._isMenuClosing = true;
    return Promise.all([hideMenu, hideBackdrop])
      .then(() => {
        this._isMenuClosing = false;
      })
      .catch(err => {
        this._isMenuClosing = false;
        throw err;
      });
  }

  toggleMenu(name: string) {
    const menu = this.menuRegistry.getMenu(name);
    if (!menu) {
      console.warn(`menu with name ${name} does not exist`);
      return Promise.resolve();
    }
    debug('toggle menu', name);
    if (menu.instance._getOpened()) {
      return this.closeMenu();
    } else {
      return this.openMenu(name);
    }
  }

  _notify(forceUpdate?: boolean) {
    const NULL = {};
    const prev = this.openedMenu;
    const next = this.menuRegistry.getAll().find(menu => menu.instance.isOpen());
    // set newly opened menu before any callbacks are called
    this.openedMenu = next;
    if (!forceUpdate && !this._isRenderNeeded(prev, next)) {
      return Promise.resolve();
    }

    debug('notify: next menu:', next?.name, ' prev menu:', prev?.name);
    let afterSetState: () => unknown;
    let beforeSetState = () => Promise.resolve();
    if (prev?.name !== next?.name) {
      if (prev && !prev?.instance.isOpen()) {
        beforeSetState = () => this._beforeClose(prev).then(() => prev.instance.props.onClose?.());
      }
      if (next) {
        next.instance.props.onOpen?.();
        afterSetState = () => this._initOpen(next);
      }
    }

    return beforeSetState().then(() => {
      if (!this._placeholderRef) {
        debug('setState ignored - maybe the context was unmounted');
        return;
      }
      this._placeholderRef.setState(
        { openedMenuName: this.openedMenu && this.openedMenu.name },
        afterSetState,
      );
      debug('notify ended');
    });
  }

  /**
  Compares states of opened menu to determine if rerender is needed.
  */
  _isRenderNeeded(prev?: MenuEntry, next?: MenuEntry) {
    if (prev === next) {
      debug('_isRenderNeeded: skipping - no change');
      return false;
    }
    if (prev?.name !== next?.name) {
      return true;
    }
    const { triggerLayout, optionsLayout } = next ?? {};
    if (!triggerLayout || !optionsLayout) {
      debug('_isRenderNeeded: skipping - no trigger or options layout');
      return false;
    }
    return true;
  }

  render() {
    const { style, customStyles, MenuWrapperComponent } = this.props;
    const MenuWrapper = MenuWrapperComponent ?? React.Fragment;

    debug('render menu', this.isMenuOpen(), this._ownLayout);
    return (
      <PopupMenuContext.Provider value={this.menuCtx}>
        <View style={styles.flex1} onLayout={this._onLayout}>
          <View style={[styles.flex1, customStyles?.menuProviderWrapper, style]}>
            {this.props.children}
          </View>
          <MenuWrapper>
            <SafeAreaView style={styles.safeArea}>
              <View style={styles.flex1} collapsable={false} onLayout={this._onSafeAreaLayout} />
              <MenuPlaceholder
                ctx={this}
                backdropStyles={customStyles?.backdrop}
                ref={this._onPlaceholderRef}
              />
            </SafeAreaView>
          </MenuWrapper>
        </View>
      </PopupMenuContext.Provider>
    );
  }

  onBackdropRef = (r: Backdrop) => {
    this.backdropRef = r;
  };

  onOptionsRef = (r: Menu) => {
    this.optionsRef = r;
  };

  _onPlaceholderRef = (r: MenuPlaceholder) => (this._placeholderRef = r);

  _getOpenedMenu() {
    const name = this._placeholderRef && this._placeholderRef.state.openedMenuName;
    const menu = name ? this.menuRegistry.getMenu(name) : undefined;
    debug('_getOpenedMenu', name, !!menu);
    return menu;
  }

  _onBackdropPress = () => {
    debug('on backdrop press');
    const menu = this._getOpenedMenu();
    if (menu) {
      menu.instance.props.onBackdropPress?.();
    }
    this.closeMenu();
  };

  _isInitialized() {
    return !!this._ownLayout;
  }

  _initOpen(menu: MenuEntry) {
    debug('opening', menu.name);
    const trigger = menu.instance._getTrigger();
    trigger &&
      measure(trigger).then(res => {
        const triggerLayout = res;
        debug('got trigger measurements', triggerLayout);
        this.menuRegistry.updateLayoutInfo(menu.name, { triggerLayout });
        this.backdropRef && this.backdropRef.open();
        this._notify();
      });
  }

  _onOptionsLayout(e: LayoutChangeEvent, name: string, isOutside: boolean) {
    const optionsLayout = { ...e.nativeEvent.layout, isOutside };
    debug('got options layout', optionsLayout);
    this.menuRegistry.updateLayoutInfo(name, { optionsLayout });
    this._notify();
  }

  _makeOptions() {
    const { instance, triggerLayout, optionsLayout } = this._getOpenedMenu() ?? {};
    const options = instance?._getOptions();
    if (!instance || !options) {
      return;
    }
    const { renderer, rendererProps } = instance.props;
    const windowLayout = this._ownLayout;
    const safeAreaLayout = this._safeAreaLayout;
    const { optionsContainerStyle, renderOptionsContainer, customStyles } = options.props;
    const optionsRenderer = renderOptionsContainer || defaultOptionsContainerRenderer;
    const isOutside = !triggerLayout || !optionsLayout;
    const onLayout = (e: LayoutChangeEvent) =>
      this._onOptionsLayout(e, instance.getName(), isOutside);
    const style = [optionsContainerStyle, customStyles?.optionsContainer];
    const layouts = { windowLayout, triggerLayout, optionsLayout, safeAreaLayout };
    const props: MenuProps['rendererProps'] = { ...rendererProps, style, onLayout, layouts };
    const optionsType = isOutside ? MenuOutside : renderer;
    if (optionsType === renderer) {
      props.ref = this.onOptionsRef;
    }
    if (optionsType) {
      return React.createElement(optionsType as FunctionComponent, props, optionsRenderer(options));
    }
  }

  _onLayout = ({ nativeEvent: { layout } }: LayoutChangeEvent) => {
    if (layoutsEqual(this._ownLayout, layout)) {
      return;
    }
    this._ownLayout = layout;
    debug('context layout has changed', this._ownLayout);
    const menu = this._getOpenedMenu();
    if (!menu) {
      return;
    }
    const trigger = menu.instance._getTrigger();
    trigger &&
      measure(trigger).then(res => {
        const triggerLayout = res;
        debug('got trigger measurements after context layout change', triggerLayout);
        this.menuRegistry.updateLayoutInfo(menu.instance.getName(), { triggerLayout });
        // force update as own layout has changed
        this._notify(true);
      });
  };

  _onSafeAreaLayout = ({ nativeEvent: { layout } }: LayoutChangeEvent) => {
    if (layoutsEqual(this._safeAreaLayout, layout)) {
      return;
    }
    this._safeAreaLayout = layout;
    debug('safeArea layout has changed', this._safeAreaLayout);
    if (!this.isMenuOpen()) {
      return;
    }
    this._notify(true);
  };
}

const styles = StyleSheet.create({
  flex1: {
    flex: 1,
    pointerEvents: 'box-none',
  },
  safeArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'box-none',
  },
});
