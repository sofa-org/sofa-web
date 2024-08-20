import classNames from 'classnames';

import './index.scss';

export const BottomCloud = (props: BaseProps) => {
  return (
    <div
      className={classNames('bottom-cloud', props.className)}
      style={props.style}
    >
      <div />
    </div>
  );
};
