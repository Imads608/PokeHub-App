import styles from './frontend-shared-components.module.css';

/* eslint-disable-next-line */
export interface FrontendSharedComponentsProps {}

export function FrontendSharedComponents(props: FrontendSharedComponentsProps) {
  return (
    <div className={styles['container']}>
      <h1>Welcome to FrontendSharedComponents!</h1>
    </div>
  );
}

export default FrontendSharedComponents;
