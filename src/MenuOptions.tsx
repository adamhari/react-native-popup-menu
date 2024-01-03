import React from 'react';
import { View } from 'react-native';
import { withCtx } from './MenuProvider';
import { MenuContextProps, MenuOptionsProps } from './types';

type Props = MenuOptionsProps & MenuContextProps;

export class MenuOptions extends React.Component<Props> {
  updateCustomStyles(props: Props) {
    const { customStyles = {} } = props;
    const menu = this.props.ctx.menuActions._getOpenedMenu();
    // FIXME react 16.3 workaround for ControlledExample!
    if (!menu) return;
    const menuName = menu.instance.getName();
    this.props.ctx.menuRegistry.setOptionsCustomStyles(menuName, customStyles);
  }

  componentDidMount() {
    this.updateCustomStyles(this.props);
  }

  componentDidUpdate() {
    this.updateCustomStyles(this.props);
  }

  render() {
    const { customStyles, style, children } = this.props;
    return <View style={[customStyles?.optionsWrapper, style]}>{children}</View>;
  }
}

export default withCtx(MenuOptions);
