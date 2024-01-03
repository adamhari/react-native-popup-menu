import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LayoutsType, RendererProps } from '../types';

export const computePosition = ({ windowLayout }: LayoutsType) => ({
  top: windowLayout.height,
  left: windowLayout.width,
});

const MenuOutside = (props: RendererProps) => {
  const { style, children, layouts, ...other } = props;
  const position = computePosition(layouts);
  return (
    <View {...other} style={[styles.options, style, position]} collapsable={false}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  options: {
    position: 'absolute',
  },
});

export default MenuOutside;
