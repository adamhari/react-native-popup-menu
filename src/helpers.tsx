import { ElementType } from 'react';
import { LayoutRectangle, Platform, TouchableHighlight, View } from 'react-native';

/**
 * Promisifies measure's callback function and returns layout object.
 */
export const measure = (ref: View): Promise<LayoutRectangle> =>
  new Promise(resolve => {
    ref.measure((x, y, width, height, pageX, pageY) => {
      resolve({
        x: pageX,
        y: pageY,
        width,
        height,
      });
    });
  });

/**
 * Create unique menu name across all menu instances.
 */
export const makeName = (function () {
  let nextID = 1;
  return () => `menu-${nextID++}`;
})();

/**
 * Create touchable component based on passed parameter and platform.
 * It also returns default props for specific touchable types.
 */
export function makeTouchable(TouchableComponent?: ElementType) {
  const Touchable =
    TouchableComponent ||
    Platform.select({
      android: TouchableHighlight,
      ios: TouchableHighlight,
      default: TouchableHighlight,
    });
  let defaultTouchableProps = {};
  if (Touchable === TouchableHighlight) {
    defaultTouchableProps = { underlayColor: 'rgba(0, 0, 0, 0.1)' };
  }
  return { Touchable, defaultTouchableProps };
}

/**
Converts iterator to array
*/
export function iterator2array<T>(it: Iterator<T>): T[] {
  // workaround around https://github.com/instea/react-native-popup-menu/issues/41#issuecomment-340290127
  const arr = [];
  for (let next = it.next(); !next.done; next = it.next()) {
    arr.push(next.value);
  }
  return arr;
}
