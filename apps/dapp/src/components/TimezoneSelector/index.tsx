import dayjs from 'dayjs';

import { CSelect } from '../CSelect';

import { Timezone, TimezoneOptions, useTimezone } from './store';

import styles from './index.module.scss';

const TimezoneSelector = () => {
  const timezone = useTimezone((state) => state.timezone);

  return (
    <CSelect
      className={styles['timezone-selector']}
      value={timezone}
      optionList={TimezoneOptions}
      onChange={(v) => useTimezone.setTimezone(v as Timezone)}
    />
  );
};

export default TimezoneSelector;

export const Time = (props: { time: number | undefined; format?: string }) => {
  const timezone = useTimezone((state) => state.timezone);
  return (
    <>
      {dayjs(props.time)
        .utcOffset(timezone * 60)
        .format(props.format || 'YYYY-MM-DD HH:mm')}
    </>
  );
};
