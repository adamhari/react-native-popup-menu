import Menu from './Menu';
import MenuOption from './MenuOption';
import MenuOptions from './MenuOptions';
import MenuProvider from './MenuProvider';
import MenuTrigger from './MenuTrigger';

// @ts-ignore
import ContextMenu from './renderers/ContextMenu';
// @ts-ignore
import NotAnimatedContextMenu from './renderers/NotAnimatedContextMenu';
// @ts-ignore
import SlideInMenu from './renderers/SlideInMenu';
// @ts-ignore
import Popover from './renderers/Popover';

const renderers = { ContextMenu, SlideInMenu, NotAnimatedContextMenu, Popover };

export { Menu, MenuOption, MenuOptions, MenuProvider, MenuTrigger, Menu as default, renderers };
