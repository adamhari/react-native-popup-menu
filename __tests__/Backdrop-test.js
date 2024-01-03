import React from 'react';
import { TouchableWithoutFeedback, View } from 'react-native';
import { render } from './helpers';

jest.dontMock('../src/Backdrop');
const Backdrop = require('../src/Backdrop').default;

describe('Backdrop', () => {
  it('should render component', () => {
    const { output } = render(<Backdrop onPress={jest.fn()} />);
    expect(output.type).toEqual(TouchableWithoutFeedback);
    const view = output.props.children;
    expect(view.type).toEqual(View);
  });

  it('should trigger on press event', () => {
    const onPressSpy = jest.fn();
    const { output } = render(<Backdrop onPress={onPressSpy} />);
    expect(output.type).toEqual(TouchableWithoutFeedback);
    expect(typeof output.props.onPress).toEqual('function');
    output.props.onPress();
    expect(onPressSpy).toHaveBeenCalled();
  });
});
