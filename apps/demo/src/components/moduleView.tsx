import classNames from 'classnames';
import styles from './moduleView.module.css';
import { app } from '../services/app';
import { useReactiveState } from '@baby-yak/service-loom-react';

const TAG = 'moduleView';

type Props = {};

export default function ModuleView({}: Props) {
  const isStarted = useReactiveState(app.services.app, (a) => a.started);
  return (
    <div data-component={TAG} className={classNames(styles.root)}>
      <div className={classNames(styles.indicator)} data-is-started={isStarted}></div>

      <div className={classNames(styles.title)}>module</div>
    </div>
  );
}
