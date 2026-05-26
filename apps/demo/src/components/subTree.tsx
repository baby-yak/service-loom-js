import type { Service } from '@baby-yak/service-loom-js';
import { createModuleContext, useReactiveState } from '@baby-yak/service-loom-react';
import classNames from 'classnames';
import { CounterService, type ICounter } from '../services/courerService';
import ModuleView from './moduleView';
import styles from './subTree.module.css';

type M = {
  counter: Service<ICounter>;
};

const TAG = 'subTree';
type Props = {};

//
const { ModuleProvider, useModule } = createModuleContext<M>({ verbose: true });
function create() {
  console.log('creating module');
  return {
    counter: new CounterService(),
  };
}

export default function SubTree({}: Props) {
  return (
    <div data-component={TAG} className={classNames(styles.root)}>
      <ModuleProvider createModule={create}>
        <Inner1 />
        <Inner2 />
      </ModuleProvider>
    </div>
  );
}

//-------------------------------------------------------
type Inner1Props = {};
function Inner1({}: Inner1Props) {
  const module = useModule();
  const services = module.services;

  return (
    <div className={classNames(styles.Inner)}>
      <ModuleView module={module} />
      <button onClick={() => services.counter.invoke.increment()}>+</button>
    </div>
  );
}

//-------------------------------------------------------
type Inner2Props = {};
function Inner2({}: Inner2Props) {
  const module = useModule();
  const services = module.services;
  const state = useReactiveState(services.counter.state, (s) => s.count);
  return <div className={classNames(styles.Inner)}>inner count = {state}</div>;
}
