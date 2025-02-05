import React from 'react';
import { Text, View } from 'react-native';
import { render } from '../helpers';

jest.dontMock('../../src/renderers/MenuOutside');
const { default: MenuOutside, computePosition } = require('../../src/renderers/MenuOutside');

describe('MenuOutside', () => {
  const defaultLayouts = {
    windowLayout: { width: 400, height: 600 },
    triggerLayout: { width: 50, height: 50, x: 10, y: 10 },
    optionsLayout: { width: 200, height: 100 },
  };

  describe('renderer', () => {
    it('should render component', () => {
      const { output } = render(
        <MenuOutside layouts={defaultLayouts}>
          <Text>Some text</Text>
          <Text>Other text</Text>
        </MenuOutside>,
      );
      expect(output.type).toEqual(View);
      expect(output.props.children).toEqual([<Text>Some text</Text>, <Text>Other text</Text>]);
    });
  });

  describe('computePosition', () => {
    it('should compute position outside of the screen', () => {
      const windowLayout = { width: 400, height: 600 };
      const layouts = { windowLayout };
      expect(computePosition(layouts)).toEqual(
        expect.objectContaining({
          top: 600,
          left: 400,
        }),
      );
    });
  });
});
