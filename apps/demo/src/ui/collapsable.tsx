import classNames from 'classnames';
import styles from './collapsable.module.css';
import { useState, type HTMLAttributes } from 'react';
import Card from './card';

const TAG = 'collapsable';
type Props = HTMLAttributes<HTMLDivElement> & {
  label: string;
  //
};

export default function Collapsable({ children, className, label, ...props }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <Card data-component={TAG} className={classNames(styles.root, className)} {...props}>
      <button onClick={() => setOpen((s) => !s)}>{label}</button>
      <hr />
      {open && <div>{children}</div>}
    </Card>
  );
}
