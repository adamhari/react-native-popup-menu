import React, { Component } from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { withCtx } from './MenuProvider';
import { makeTouchable } from './helpers';
import { debug } from './logger';
import { MenuContextProps, MenuOptionCustomStyle } from './types';

export type MenuOptionsProps = {
  value?: any;
  text?: string;
  disabled?: boolean;
  disableTouchable?: boolean;
  customStyles?: MenuOptionCustomStyle;

  style?: StyleProp<ViewStyle>;
  testID?: string;

  onSelect?: (value: unknown) => unknown;
  children?: React.ReactNode;
};

export class MenuOption extends Component<MenuOptionsProps & MenuContextProps> {
  _onSelect() {
    const { value } = this.props;
    const onSelect = this.props.onSelect || this._getMenusOnSelect();
    const shouldClose = onSelect?.(value) !== false;
    debug('select option', value, shouldClose);
    if (shouldClose) {
      this.props.ctx.menuActions.closeMenu();
    }
  }

  _getMenusOnSelect() {
    const menu = this.props.ctx.menuActions._getOpenedMenu();
    return menu?.instance.props.onSelect;
  }

  _getCustomStyles() {
    // FIXME react 16.3 workaround for ControlledExample!
    const menu = this.props.ctx.menuActions._getOpenedMenu();
    const { optionsCustomStyles } = menu ?? { optionsCustomStyles: {} };
    return {
      ...optionsCustomStyles,
      ...this.props.customStyles,
    };
  }

  render() {
    const { text, disabled, disableTouchable, children, style, testID } = this.props;
    const customStyles = this._getCustomStyles();
    if (text && React.Children.count(children) > 0) {
      console.warn(
        "MenuOption: Please don't use text property together with explicit children. Children are ignored.",
      );
    }
    if (disabled) {
      const disabledStyles = [defaultStyles.optionTextDisabled, customStyles.optionText];
      return (
        <View style={[defaultStyles.option, customStyles.optionWrapper, style]}>
          {text ? <Text style={disabledStyles}>{text}</Text> : children}
        </View>
      );
    }
    const rendered = (
      <View style={[defaultStyles.option, customStyles.optionWrapper, style]}>
        {text ? <Text style={customStyles.optionText}>{text}</Text> : children}
      </View>
    );
    if (disableTouchable) {
      return rendered;
    } else {
      const { Touchable, defaultTouchableProps } = makeTouchable(
        customStyles.OptionTouchableComponent,
      );
      return (
        <Touchable
          testID={testID}
          onPress={() => this._onSelect()}
          {...defaultTouchableProps}
          {...customStyles.optionTouchable}
        >
          {rendered}
        </Touchable>
      );
    }
  }
}

const defaultStyles = StyleSheet.create({
  option: {
    padding: 5,
    backgroundColor: 'transparent',
  },
  optionTextDisabled: {
    color: '#ccc',
  },
});

export default withCtx(MenuOption);
