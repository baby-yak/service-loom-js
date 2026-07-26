import { createServiceContext, useReactiveState } from '@baby-yak/service-loom-react';
import classNames from 'classnames';
import { CounterService, type ICounter } from '../services/counterService';
import styles from './subTree.module.css';

const TAG = 'subTreeService';
type Props = {};

//
const { ServiceProvider, useService } = createServiceContext<ICounter>({ verbose: true });
function create() {
  console.log('creating service');
  return new CounterService();
}

export default function SubTreeService({}: Props) {
  return (
    <div data-component={TAG} className={classNames(styles.root)}>
      <ServiceProvider createService={create}>
        <Inner1 />
        <Inner2 />
      </ServiceProvider>
    </div>
  );
}

//-------------------------------------------------------
type Inner1Props = {};
function Inner1({}: Inner1Props) {
  const counter = useService();
  return (
    <div className={classNames(styles.Inner)}>
      <button onClick={() => counter.actions.increment()}>+</button>
    </div>
  );
}

//-------------------------------------------------------
type Inner2Props = {};
function Inner2({}: Inner2Props) {
  const counter = useService();
  const state = useReactiveState(counter.state);
  return <div className={classNames(styles.Inner)}>inner count = {state.count}</div>;
}
