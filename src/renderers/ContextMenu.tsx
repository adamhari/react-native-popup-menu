import React from 'react';
import { Animated, Easing, I18nManager, PixelRatio, StyleSheet } from 'react-native';
import { CLOSE_ANIM_DURATION, OPEN_ANIM_DURATION, USE_NATIVE_DRIVER } from '../constants';
import { LayoutsType, PositionType, RendererProps } from '../types';

const axisPosition = (oDim: number, wDim: number, tPos: number, tDim: number) => {
  // if options are bigger than window dimension, then render at 0
  if (oDim > wDim) {
    return 0;
  }
  // render at trigger position if possible
  if (tPos + oDim <= wDim) {
    return tPos;
  }
  // aligned to the trigger from the bottom (right)
  if (tPos + tDim - oDim >= 0) {
    return tPos + tDim - oDim;
  }
  // compute center position
  let pos = Math.round(tPos + tDim / 2 - oDim / 2);
  // check top boundary
  if (pos < 0) {
    return 0;
  }
  // check bottom boundary
  if (pos + oDim > wDim) {
    return wDim - oDim;
  }
  // if everything ok, render in center position
  return pos;
};

function fit(pos: number | undefined, len: number, minPos: number, maxPos: number) {
  if (pos === undefined) {
    return undefined;
  }
  if (pos + len > maxPos) {
    pos = maxPos - len;
  }
  if (pos < minPos) {
    pos = minPos;
  }
  return pos;
}
// fits options (position) into safeArea
export const fitPositionIntoSafeArea = (position: PositionType, layouts: LayoutsType) => {
  const { windowLayout, safeAreaLayout, optionsLayout } = layouts;
  if (!safeAreaLayout) {
    return position;
  }
  const { x: saX, y: saY, height: saHeight, width: saWidth } = safeAreaLayout;
  const { height: oHeight, width: oWidth } = optionsLayout;
  const { width: wWidth } = windowLayout;
  let { top, left, right } = position;
  top = fit(top, oHeight, saY, saY + saHeight);
  left = fit(left, oWidth, saX, saX + saWidth);
  right = fit(right, oWidth, wWidth - saX - saWidth, saX);
  return { top, left, right };
};

export const computePosition = (layouts: LayoutsType, isRTL: boolean) => {
  const { windowLayout, triggerLayout, optionsLayout } = layouts;
  const { x: wX, y: wY, width: wWidth, height: wHeight } = windowLayout;
  const { x: tX, y: tY, height: tHeight, width: tWidth } = triggerLayout;
  const { height: oHeight, width: oWidth } = optionsLayout;
  const top = axisPosition(oHeight, wHeight, tY - wY, tHeight);
  const left = axisPosition(oWidth, wWidth, tX - wX, tWidth);
  const start = isRTL ? 'right' : 'left';
  const position = { top, left: 0, right: 0, [start]: left };
  return fitPositionIntoSafeArea(position, layouts);
};

export default class ContextMenu extends React.Component<
  RendererProps,
  { scaleAnim: Animated.Value }
> {
  static computePosition: typeof computePosition;
  static fitPositionIntoSafeArea: typeof fitPositionIntoSafeArea;

  constructor(props: RendererProps) {
    super(props);
    this.state = {
      scaleAnim: new Animated.Value(0.1),
    };
  }

  componentDidMount() {
    Animated.timing(this.state.scaleAnim, {
      duration: OPEN_ANIM_DURATION,
      toValue: 1,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: USE_NATIVE_DRIVER,
    }).start();
  }

  close() {
    return new Promise(resolve => {
      Animated.timing(this.state.scaleAnim, {
        duration: CLOSE_ANIM_DURATION,
        toValue: 0,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: USE_NATIVE_DRIVER,
      }).start(resolve);
    });
  }

  render() {
    const { style, children, layouts, ...other } = this.props;
    const animation = {
      transform: [{ scale: this.state.scaleAnim }],
      opacity: this.state.scaleAnim,
    };
    const position = computePosition(layouts, I18nManager.isRTL);
    return (
      <Animated.View {...other} style={[styles.options, style, animation, position]}>
        {children}
      </Animated.View>
    );
  }
}

// public exports
ContextMenu.computePosition = computePosition;
ContextMenu.fitPositionIntoSafeArea = fitPositionIntoSafeArea;

export const styles = StyleSheet.create({
  options: {
    position: 'absolute',
    borderRadius: 2,
    backgroundColor: 'white',
    width: PixelRatio.roundToNearestPixel(200),

    // Shadow only works on iOS.
    shadowColor: 'black',
    shadowOpacity: 0.3,
    shadowOffset: { width: 3, height: 3 },
    shadowRadius: 4,

    // This will elevate the view on Android, causing shadow to be drawn.
    elevation: 5,
  },
});
