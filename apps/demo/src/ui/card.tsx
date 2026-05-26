import classNames from 'classnames';
import styles from './card.module.css';
import type { HTMLAttributes } from 'react';

const TAG = 'card';
type Props = HTMLAttributes<HTMLDivElement> & {
  //
};

export default function Card({ children, className, ...props }: Props) {
  return (
    <div data-component={TAG} className={classNames(styles.root, className)} {...props}>
      {children}
    </div>
  );
}
