import { useActionAsync, useReactiveState, useStateEffect } from '@baby-yak/service-loom-react';
import classNames from 'classnames';
import { useState } from 'react';
import { services } from '../services/app';
import Card from '../ui/card';
import styles from './users.module.css';
import { errorToString } from '../utils';

const TAG = 'users';
type Props = {};

export default function Users({}: Props) {
  const users = useReactiveState(services.users.state, (s) => s.users);

   const add = useActionAsync(services.users, 'add');
  const fetch = useActionAsync(services.users.actions.fetch);

  useStateEffect(services.users, (s) => {
    console.log('state:', s);
  });
  useStateEffect(
    services.users,
    (s) => s.users,
    (s) => {
      console.log(
        'users:',
        s.map((x) => x.name),
      );
    },
  );

  return (
    <Card data-component={TAG} className={classNames(styles.root)}>
      <h4>users</h4>

      <div className={classNames(styles.buttons)}>
        <Card style={{ padding: 10 }}>
          <FormBox
            label="create user"
            isLoading={add.isLoading}
            isError={add.isError}
            error={add.error}
            onclick={(name) => add.execute(name)}
          />
          <div>last user added {add.data ?? '?'}</div>
          <div>{add.isError && JSON.stringify(add.error)}</div>
        </Card>
        <Card style={{ padding: 10 }}>
          <FormBox
            label="fetch user"
            isLoading={fetch.isLoading}
            isError={fetch.isError}
            error={fetch.error}
            onclick={(id) => fetch.execute(id)}
          />
          fetched: {fetch.data?.name ?? '?'}
        </Card>
      </div>

      <div className={classNames(styles.usersList)}>
        {users.map((user) => (
          <div key={user.id} className={classNames(styles.myElement)}>
            {user.id} --- {user.name}
          </div>
        ))}
      </div>
    </Card>
  );
}

type FormBoxProps = {
  label: string;
  text?: string;
  onChange?: (text: string) => void;
  onclick?: (text: string) => void;
  isLoading?: boolean;
  isError?: boolean;
  error?: unknown;
};

function FormBox({
  label,
  onChange,
  onclick: onClick,
  text,
  isError,
  isLoading,
  error,
}: FormBoxProps) {
  const [model, setModel] = useState(text ?? '');

  return (
    <div className={classNames(styles.FormBox)}>
      <div className={classNames(styles.main)}>
        <div
          data-is-error={isError ?? false}
          data-is-loading={isLoading ?? false}
          className={classNames(styles.indicator)}
        ></div>
        <input
          type="text"
          value={model}
          onChange={(e) => {
            setModel(e.target.value);
            onChange?.(e.target.value);
          }}
        />
        <button onClick={() => onClick?.(model)}>{label}</button>
      </div>
      {error != null && <div className={classNames(styles.error)}>{errorToString(error)}</div>}
    </div>
  );
}
