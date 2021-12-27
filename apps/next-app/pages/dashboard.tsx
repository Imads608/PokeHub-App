import { getDrawerToggle } from '../store/selectors/drawer';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';

const Dashboard = () => {
  const drawerToggle: boolean = useSelector<RootState, boolean>(
    getDrawerToggle
  );

  return (
    <div style={{ height: '93vh' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap' }}>
        <div>Authenticated</div>
        <div>Authenticated</div>
        <div>Authenticated</div>
        <div>Authenticated</div>
        <div>Authenticated</div>
        <div>Authenticated</div>
        <div>Authenticated</div>
        <div>Authenticated</div>
        <div>Authenticated</div>
        <div>Authenticated</div>
        <div>Authenticated</div>
        <div>Authenticated</div>
        <div>Authenticated</div>
        <div>Authenticated</div>
      </div>
    </div>
  );
};

export default Dashboard;
