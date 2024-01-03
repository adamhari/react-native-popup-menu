import React, { Component } from 'react';
import { Text, View } from 'react-native';
import { withCtx } from './MenuProvider';
import { makeTouchable } from './helpers';
import { debug } from './logger';
import { MenuContextProps, MenuTriggerProps } from './types';

type Props = MenuTriggerProps & MenuContextProps;

export class MenuTrigger extends Component<Props> {
  _onPress() {
    debug('trigger onPress');
    this.props.onPress && this.props.onPress();
    this.props.ctx.menuActions.openMenu(this.props.menuName);
  }

  render() {
    const {
      disabled,
      onRef,
      text,
      children,
      style,
      customStyles = {},
      menuName,
      triggerOnLongPress,
      onAlternativeAction,
      testID,
      ...other
    } = this.props;
    const onPress = () => !disabled && this._onPress();
    const { Touchable, defaultTouchableProps } = makeTouchable(
      customStyles.TriggerTouchableComponent,
    );
    return (
      <View ref={onRef} collapsable={false} style={customStyles.triggerOuterWrapper}>
        <Touchable
          testID={testID}
          onPress={triggerOnLongPress ? onAlternativeAction : onPress}
          onLongPress={triggerOnLongPress ? onPress : onAlternativeAction}
          {...defaultTouchableProps}
          {...customStyles.triggerTouchable}
        >
          <View {...other} style={[customStyles.triggerWrapper, style]}>
            {text ? <Text style={customStyles.triggerText}>{text}</Text> : children}
          </View>
        </Touchable>
      </View>
    );
  }
}

export default withCtx(MenuTrigger);
