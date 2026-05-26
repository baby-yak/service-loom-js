import { useEvent, useReactiveState } from '@baby-yak/service-loom-react';
import classNames from 'classnames';
import { useRef } from 'react';
import { services } from '../services/app';
import Card from '../ui/card';
import { Logger, type LoggerRef } from '../ui/logger';
import styles from './counter.module.css';

const TAG = 'counter';
type Props = {};

export default function Counter({}: Props) {
  const refLogger = useRef<LoggerRef>(null);

  const count = useReactiveState(services.counter.state, (s) => s.count);
  const running = useReactiveState(services.counter.state, (s) => s.running);
  const step = useReactiveState(services.counter.state, (s) => s.step);

  //actions
  const increment = services.counter.invoke.increment;
  const decrement = services.counter.invoke.decrement;
  const setStep = services.counter.invoke.setStep;
  const reset = services.counter.invoke.reset;
  const start = services.counter.invoke.start;
  const stop = services.counter.invoke.stop;

  useEvent(services.counter.events, 'incremented', (count) => {
    refLogger.current?.log(`incremented: ${count}`);
  });
  useEvent(services.counter.events, 'decremented', (count) => {
    refLogger.current?.log(`decremented: ${count}`);
  });
  useEvent(services.counter.events, 'reset', () => {
    refLogger.current?.log(`reset`);
  });

  return (
    <Card data-component={TAG} className={classNames(styles.root)}>
      <div>count : {count} </div>
      <div>running : {running ? 'running' : 'idle'} </div>
      <div>step : {step} </div>
      <div className={classNames(styles.buttons)}>
        <button onClick={() => increment()}>increment</button>
        <button onClick={() => decrement()}>decrement</button>
        <button onClick={() => setStep(10)}>setStep</button>
        <button onClick={() => reset()}>reset</button>
        <button onClick={() => start()}>start</button>
        <button onClick={() => stop()}>stop</button>
      </div>
      <Logger ref={refLogger} />
    </Card>
  );
}
