import classNames from 'classnames';
import styles from './logger.module.css';
import { forwardRef, useImperativeHandle, useState } from 'react';
import { v4 as uuid } from 'uuid';

const TAG = 'logger';
type Props = {};

export type LoggerRef = {
  log(log: string): void;
};

export const Logger = forwardRef<LoggerRef>(({}: Props, ref) => {
  const [logs, setLogs] = useState<{ log: string; id: string }[]>([]);
  useImperativeHandle(ref, () => ({
    log(log: string) {
      setLogs((s) => {
        const res = [{ id: uuid(), log }, ...s];
        res.length = Math.min(50, res.length);
        return res;
      });
    },
  }));
  return (
    <div data-component={TAG} className={classNames(styles.root)}>
      {logs.map((log) => (
        <pre className={classNames(styles.log)} key={log.id}>
          {log.log}
        </pre>
      ))}
    </div>
  );
});
