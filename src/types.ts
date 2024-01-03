import * as React from 'react';
import { ElementType, ReactNode } from 'react';
import { LayoutRectangle, StyleProp, TextStyle, View, ViewProps, ViewStyle } from 'react-native';
import Backdrop from './Backdrop';
import { Menu } from './Menu';
export { Menu, Menu as MenuRef };

/**
 * MenuProvider
 * @see https://github.com/instea/react-native-popup-menu/blob/master/doc/api.md#menuprovider
 */

export interface MenuProviderProps {
  style?: StyleProp<ViewStyle>;
  customStyles?: {
    menuProviderWrapper?: StyleProp<ViewStyle>;
    backdrop?: StyleProp<ViewStyle>;
  };
  backHandler?: boolean | Function;
  skipInstanceCheck?: boolean;
  children: React.ReactNode;
  MenuWrapperComponent?: ElementType;
}

/**
 * MenuTrigger
 * @see https://github.com/instea/react-native-popup-menu/blob/master/doc/api.md#menutrigger
 */
export interface MenuTriggerProps {
  disabled?: boolean;
  menuName: string;
  onRef?(el: View): void;
  text?: string;
  customStyles?: {
    triggerOuterWrapper?: StyleProp<ViewStyle>;
    triggerWrapper?: StyleProp<ViewStyle>;
    triggerText?: StyleProp<TextStyle>;
    TriggerTouchableComponent?: ElementType;
    triggerTouchable?: {};
  };
  testID?: string;
  triggerOnLongPress?: boolean;

  onPress?(): void;
  onAlternativeAction?(): void;
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

/**
 * MenuOptions
 * @see https://github.com/instea/react-native-popup-menu/blob/master/doc/api.md#menuoptions
 */
export interface MenuOptionsProps {
  optionsContainerStyle?: StyleProp<ViewStyle>;
  renderOptionsContainer?: Function;
  customStyles?: MenuOptionsCustomStyle;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  children?: React.ReactNode;
}

export interface MenuOptionsCustomStyle extends MenuOptionCustomStyle {
  optionsWrapper?: StyleProp<ViewStyle>;
  optionsContainer?: StyleProp<ViewStyle>;
}

export interface MenuOptionCustomStyle {
  optionWrapper?: StyleProp<ViewStyle>;
  optionText?: StyleProp<TextStyle>;
  optionTouchable?: {};
  OptionTouchableComponent?: ElementType;
}

/**
 * Types for MenuRegistry (which isn't exported)
 */
export interface TriggerLayoutType {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

export interface OptionsLayoutType {
  width?: number;
  height?: number;
}

export interface MenuEntry {
  name: string;
  instance: Menu;
  triggerLayout?: TriggerLayoutType;
  optionsLayout?: OptionsLayoutType;
  optionsCustomStyles?: MenuOptionsCustomStyle;
}

export interface MenuRegistry {
  subscribe: (instance: Menu) => void;
  unsubscribe: (instance: Menu) => void;
  updateLayoutInfo: (
    name: string,
    layouts?: {
      triggerLayout?: TriggerLayoutType;
      optionsLayout?: OptionsLayoutType;
    },
  ) => void;
  setOptionsCustomStyles: (name: string, optionsCustomStyles: MenuOptionsCustomStyle) => void;
  getMenu: (name: string) => MenuEntry | undefined;
  getAll: () => MenuEntry[];
}

/**
 * withMenuContext
 * @see https://github.com/instea/react-native-popup-menu/blob/master/doc/api.md#menuprovider
 */
export interface MenuActions {
  openMenu: (name: string) => Promise<void>;
  closeMenu: () => Promise<void>;
  _getOpenedMenu: () => MenuEntry | undefined;
  toggleMenu: (name: string) => Promise<void>;
  isMenuOpen: () => boolean;
  _notify: (force?: boolean) => unknown;
}

export interface MenuContext {
  // This part shouldn't be exported to the user so it's commented out
  menuRegistry: MenuRegistry;
  menuActions: MenuActions;
  _isMenuClosing: boolean;
  _isInitialized: () => boolean;
  isMenuOpen: () => boolean;
  _makeOptions: () => ReactNode;
  _onBackdropPress: () => unknown;
  onBackdropRef: (ref: Backdrop) => unknown;
}

export interface MenuContextProps {
  ctx: MenuContext;
}

export type LayoutsType = {
  windowLayout: LayoutRectangle;
  triggerLayout: LayoutRectangle;
  optionsLayout: LayoutRectangle;
  safeAreaLayout: LayoutRectangle;
};

export type RendererProps = ViewProps & {
  layouts: LayoutsType;
};

export type PositionType = {
  left?: number;
  right?: number;
  top?: number;
};

export type PreferredPlacementType = 'top' | 'left' | 'bottom' | 'right';

export type PlacementType = PreferredPlacementType | 'auto';
