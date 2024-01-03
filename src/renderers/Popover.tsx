import React from 'react';
import {
  Animated,
  Easing,
  I18nManager,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';

import { CLOSE_ANIM_DURATION, OPEN_ANIM_DURATION, USE_NATIVE_DRIVER } from '../constants';
import {
  LayoutsType,
  PlacementType,
  PositionType,
  PreferredPlacementType,
  RendererProps,
} from '../types';

type OptionsLayoutType = {
  oDim: number;
  wDim: number;
  tPos: number;
  tDim: number;
};

const popoverPadding = 7;
const anchorSize = 15;
const anchorHyp = Math.sqrt(anchorSize * anchorSize + anchorSize * anchorSize);
const anchorOffset = (anchorHyp + anchorSize) / 2 - popoverPadding;

// left/top placement
function axisNegativeSideProperties({ oDim, tPos }: { oDim: number; tPos: number }) {
  return { position: tPos - oDim };
}

// right/bottom placement
function axisPositiveSideProperties({ tPos, tDim }: { tPos: number; tDim: number }) {
  // substract also anchor placeholder from the beginning
  return { position: tPos + tDim - anchorSize };
}

// computes offsets (off screen overlap) of popover when trying to align it to the center
function centeringProperties({ oDim, wDim, tPos, tDim }: OptionsLayoutType) {
  const center = Math.round(tPos + tDim / 2);
  const leftOffset = oDim / 2 - center;
  const rightOffset = center + oDim / 2 - wDim;
  return { center, leftOffset, rightOffset };
}

/**
 * Computes position and offset of popover when trying to align it to the triger center.
 * It consideres window boundaries.
 * Returns object with keys:
 *   - position: <Number> Absolute position - top/left,
 *   - offset: <Number> window overlapping size if window boundaries were not considered
 */
function axisCenteredPositionProperties(options: OptionsLayoutType) {
  const { oDim, wDim } = options;
  const { center, leftOffset, rightOffset } = centeringProperties(options);
  if (leftOffset > 0 || rightOffset > 0) {
    // right/bottom position is better
    if (leftOffset < rightOffset) {
      return { offset: rightOffset, position: wDim - oDim };
    }
    // left/top position is better
    if (rightOffset < leftOffset) {
      return { offset: -leftOffset, position: 0 };
    }
  }
  // centered position
  return { offset: 0, position: center - oDim / 2 };
}

/* Evaluate centering placement */
function getCenteringPrice(options: OptionsLayoutType) {
  const { leftOffset, rightOffset } = centeringProperties(options);
  // TODO: currently shifted popovers have higher price,
  // popover shift could be taken into account with the same price
  return Math.max(0, leftOffset) + Math.max(0, rightOffset);
}

/* Evaluate top placement */
function getTopPrice(hOptions: OptionsLayoutType, vOptions: OptionsLayoutType) {
  const centerOffset = getCenteringPrice(vOptions);
  const sideOffset = Math.max(0, hOptions.oDim - hOptions.tPos);
  return centerOffset + sideOffset;
}

/* Evaluate bottom placement */
function getBottomPrice(hOptions: OptionsLayoutType, vOptions: OptionsLayoutType) {
  const centerOffset = getCenteringPrice(vOptions);
  const sideOffset = Math.max(0, hOptions.tPos + hOptions.tDim + hOptions.oDim - hOptions.wDim);
  return centerOffset + sideOffset;
}

/* Evaluate left placement */
function getLeftPrice(hOptions: OptionsLayoutType, vOptions: OptionsLayoutType) {
  const centerOffset = getCenteringPrice(hOptions);
  const sideOffset = Math.max(0, vOptions.oDim - vOptions.tPos);
  return centerOffset + sideOffset;
}

/* Evaluate right placement */
function getRightPrice(hOptions: OptionsLayoutType, vOptions: OptionsLayoutType) {
  const centerOffset = getCenteringPrice(hOptions);
  const sideOffset = Math.max(0, vOptions.tPos + vOptions.tDim + vOptions.oDim - vOptions.wDim);
  return centerOffset + sideOffset;
}

function getStartPosKey(isRTL: boolean) {
  return isRTL ? 'right' : 'left';
}

function topProperties(hOptions: OptionsLayoutType, vOptions: OptionsLayoutType, isRTL: boolean) {
  const centered = axisCenteredPositionProperties(vOptions);
  const side = axisNegativeSideProperties(hOptions);
  return {
    position: {
      top: side.position,
      [getStartPosKey(isRTL)]: centered.position,
    },
    offset: centered.offset,
    placement: 'top',
  } satisfies ComputedPropertiesType;
}

function bottomProperties(
  hOptions: OptionsLayoutType,
  vOptions: OptionsLayoutType,
  isRTL: boolean,
) {
  const centered = axisCenteredPositionProperties(vOptions);
  const side = axisPositiveSideProperties(hOptions);
  return {
    position: {
      top: side.position,
      [getStartPosKey(isRTL)]: centered.position,
    },
    offset: centered.offset,
    placement: 'bottom',
  } satisfies ComputedPropertiesType;
}

function rightProperties(hOptions: OptionsLayoutType, vOptions: OptionsLayoutType, isRTL: boolean) {
  const centered = axisCenteredPositionProperties(hOptions);
  const side = axisPositiveSideProperties(vOptions);
  return {
    position: {
      top: centered.position,
      [getStartPosKey(isRTL)]: side.position,
    },
    offset: centered.offset,
    placement: 'right',
  } satisfies ComputedPropertiesType;
}

function leftProperties(hOptions: OptionsLayoutType, vOptions: OptionsLayoutType, isRTL: boolean) {
  const centered = axisCenteredPositionProperties(hOptions);
  const side = axisNegativeSideProperties(vOptions);
  return {
    position: {
      top: centered.position,
      [getStartPosKey(isRTL)]: side.position,
    },
    offset: centered.offset,
    placement: 'left',
  } satisfies ComputedPropertiesType;
}

// maps placement to function which computes correct properties
const propertiesByPlacement = {
  top: topProperties,
  bottom: bottomProperties,
  left: leftProperties,
  right: rightProperties,
};

type ComputedPropertiesType = {
  position: PositionType;
  placement: PreferredPlacementType;
  offset: number;
};

/**
 * Computes properties needed for drawing popover.
 * Returns object with keys:
 *   - position: <Object> { top: Number, left: Number } - popover absolute position
 *   - placement: <Enum> top|left|top|bottom - position to the trigger
 *   - offset: <Number> value by which must be anchor shifted
 */
export function computeProperties(
  { windowLayout, triggerLayout, optionsLayout }: LayoutsType,
  placement: PlacementType,
  preferredPlacement: PreferredPlacementType,
  isRTL: boolean,
): ComputedPropertiesType {
  const { x: wX, y: wY, width: wWidth, height: wHeight } = windowLayout;
  const { x: tX, y: tY, height: tHeight, width: tWidth } = triggerLayout;
  const { height: oHeight, width: oWidth } = optionsLayout;
  const hOptions = {
    oDim: oHeight + popoverPadding * 2,
    wDim: wHeight,
    tPos: tY - wY,
    tDim: tHeight,
  };
  const vOptions = {
    oDim: oWidth + popoverPadding * 2,
    wDim: wWidth,
    tPos: tX - wX,
    tDim: tWidth,
  };
  if (placement !== 'auto' && propertiesByPlacement[placement]) {
    return propertiesByPlacement[placement](hOptions, vOptions, isRTL);
  }

  const prices = {
    top: getTopPrice(hOptions, vOptions),
    bottom: getBottomPrice(hOptions, vOptions),
    right: getRightPrice(hOptions, vOptions),
    left: getLeftPrice(hOptions, vOptions),
  };
  const bestPrice = Object.values(prices).sort((a, b) => a - b)[0];
  const bestPlacement =
    prices[preferredPlacement] === bestPrice
      ? preferredPlacement
      : Object.keys(prices).find(pl => prices[pl as keyof typeof prices] === bestPrice);

  return propertiesByPlacement[bestPlacement as keyof typeof propertiesByPlacement](
    hOptions,
    vOptions,
    isRTL,
  );
}

type Props = RendererProps & {
  openAnimationDuration?: number;
  closeAnimationDuration?: number;
  anchorStyle?: StyleProp<ViewStyle>;
  preferredPlacement?: PreferredPlacementType;
  placement?: PlacementType;
};

export default class Popover extends React.Component<Props, { scaleAnim: Animated.Value }> {
  constructor(props: Props) {
    super(props);
    this.state = {
      scaleAnim: new Animated.Value(0.1),
    };
  }

  componentDidMount() {
    Animated.timing(this.state.scaleAnim, {
      duration:
        this.props.openAnimationDuration !== undefined
          ? this.props.openAnimationDuration
          : OPEN_ANIM_DURATION,
      toValue: 1,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: USE_NATIVE_DRIVER,
    }).start();
  }

  close() {
    return new Promise(resolve => {
      Animated.timing(this.state.scaleAnim, {
        duration:
          this.props.closeAnimationDuration !== undefined
            ? this.props.closeAnimationDuration
            : CLOSE_ANIM_DURATION,
        toValue: 0,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: USE_NATIVE_DRIVER,
      }).start(resolve);
    });
  }

  render() {
    const {
      style,
      children,
      layouts,
      anchorStyle,
      preferredPlacement = 'top',
      openAnimationDuration,
      closeAnimationDuration,
      placement: userPlacement = 'auto',
      ...other
    } = this.props;
    const isRTL = I18nManager.isRTL;
    const animation = {
      transform: [{ scale: this.state.scaleAnim }],
      opacity: this.state.scaleAnim,
    };
    const { position, placement, offset } = computeProperties(
      layouts,
      userPlacement,
      preferredPlacement,
      isRTL,
    );
    return (
      <Animated.View
        style={[styles.animated, animation, position, getContainerStyle({ placement, isRTL })]}
      >
        <View
          style={[styles.anchor, dynamicAnchorStyle({ placement, offset, isRTL }), anchorStyle]}
        />
        <View {...other} style={[styles.options, style]}>
          {children}
        </View>
      </Animated.View>
    );
  }
}

const getContainerStyle = ({
  placement,
  isRTL,
}: {
  placement: PreferredPlacementType;
  isRTL: boolean;
}) =>
  ({
    left: {
      flexDirection: isRTL ? 'row' : 'row-reverse',
    } satisfies ViewStyle,
    right: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
    } satisfies ViewStyle,
    top: {
      flexDirection: 'column-reverse',
    } satisfies ViewStyle,
    bottom: {
      flexDirection: 'column',
    } satisfies ViewStyle,
  })[placement];

const dynamicAnchorStyle = ({
  offset,
  placement,
  isRTL,
}: {
  offset: number;
  placement: PreferredPlacementType;
  isRTL: boolean;
}) => {
  const start = getStartPosKey(isRTL);
  switch (placement) {
    case 'right':
      return {
        top: offset,
        transform: [{ translateX: anchorOffset }, { rotate: '45deg' }],
      };
    case 'left':
      return {
        top: offset,
        transform: [{ translateX: -anchorOffset }, { rotate: '45deg' }],
      };
    case 'top':
      return {
        [start]: offset,
        transform: [{ translateY: -anchorOffset }, { rotate: '45deg' }],
      };
    case 'bottom':
      return {
        [start]: offset,
        transform: [{ translateY: anchorOffset }, { rotate: '45deg' }],
      };
  }
};

export const styles = StyleSheet.create({
  animated: {
    padding: popoverPadding,
    backgroundColor: 'transparent',
    position: 'absolute',
    alignItems: 'center',
    pointerEvents: 'box-none',
  },
  options: {
    borderRadius: 2,
    minWidth: anchorHyp,
    minHeight: anchorHyp,
    backgroundColor: 'white',

    // Shadow only works on iOS.
    shadowColor: 'black',
    shadowOpacity: 0.3,
    shadowOffset: { width: 3, height: 3 },
    shadowRadius: 4,

    // This will elevate the view on Android, causing shadow to be drawn.
    elevation: 5,
  },
  anchor: {
    width: anchorSize,
    height: anchorSize,
    backgroundColor: 'white',
    elevation: 5,
  },
});
