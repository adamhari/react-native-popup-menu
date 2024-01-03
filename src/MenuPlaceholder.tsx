import React, { Component } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Backdrop from './Backdrop';
import { debug } from './logger';
import { MenuContextProps } from './types';

type Props = MenuContextProps & {
  backdropStyles?: StyleProp<ViewStyle>;
};

export default class MenuPlaceholder extends Component<Props, { openedMenuName?: string }> {
  constructor(props: Props) {
    super(props);
    this.state = {};
  }

  shouldComponentUpdate() {
    // don't terminate closing animation
    return !this.props.ctx._isMenuClosing;
  }

  render() {
    const { ctx, backdropStyles } = this.props;
    const shouldRenderMenu = ctx.isMenuOpen() && ctx._isInitialized();
    debug('MenuPlaceholder should render', shouldRenderMenu);
    if (!shouldRenderMenu) {
      return null;
    }
    return (
      <View style={styles.placeholder}>
        <Backdrop onPress={ctx._onBackdropPress} style={backdropStyles} ref={ctx.onBackdropRef} />
        {ctx._makeOptions()}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  placeholder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
});
