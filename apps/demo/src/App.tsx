import classNames from 'classnames';
import styles from './App.module.css';
import Counter from './components/counter';
import SubTree from './components/subTree';
import SubTreeService from './components/subTreeService';
import Users from './components/users';
import Card from './ui/card';
import Collapsable from './ui/collapsable';
import ModuleView from './components/moduleView';
import { module } from './services/app';

function App() {
  return (
    <div className={classNames(styles.root)}>
      <Card className={classNames(styles.card)}>
        <h4>module</h4>
        <ModuleView module={module} />
      </Card>

      <Counter />
      <Users />

      <Collapsable label="SubTree (module)">
        <Card>
          <SubTree></SubTree>
        </Card>
        <Card>
          <SubTree></SubTree>
        </Card>
      </Collapsable>
      <Collapsable label="SubTree (service)">
        <Card>
          <SubTreeService></SubTreeService>
        </Card>
        <Card>
          <SubTreeService></SubTreeService>
        </Card>
      </Collapsable>
    </div>
  );
}

export default App;
