
import styles from './navigation-links.module.scss';
import { ClassNameMap } from '@mui/styles';

const NavigationLinkItem = ({ children, classes }: { children: JSX.Element[], classes: ClassNameMap<'item' | 'icon'> }) => {
  return <div className={classes.item}>{children}</div>;
};

export default NavigationLinkItem;
