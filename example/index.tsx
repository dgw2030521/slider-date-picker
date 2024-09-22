import { Button } from 'antd';
import classNames from 'classnames';
import moment from 'moment';
import React, { useRef } from 'react';

import SliderDatePicker, { RefProps } from '../src';
import styles from './index.module.scss';

function getRandomNumber(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export default function Example() {
  const datePickerRef = useRef<RefProps>(null);

  const handleDayClick = async (currentMDate: moment.Moment) => {
    // @todo 业务逻辑
    console.log(currentMDate.format('YYYY-MM-DD'));
  };

  return (
    <div style={{ width: 1300 }}>
      <SliderDatePicker
        ref={datePickerRef}
        handleDayClick={handleDayClick}
        leftSideContent={<span className={styles.headTitle}>政策日历</span>}
        rightSideContent={
          <div className={styles.operBox}>
            <Button
              onClick={() => {
                console.log(
                  '###datePickerRef',
                  datePickerRef.current.currentDate.format('YYYY-MM-DD'),
                );
                alert(datePickerRef.current.currentDate.format('YYYY-MM-DD'));
              }}
            >
              调用datePickerRef
            </Button>
          </div>
        }
        showCount={10}
        dateValue="2024-07-25"
        renderDayNode={(dateObj, isCurrent, preCallbackOnClick) => {
          const dayStr = Number.parseInt(dateObj.date.split('-')[2], 10);
          return (
            <div
              className={classNames({
                [styles.card]: true,
                [styles.current]: isCurrent,
              })}
              onClick={() => {
                console.log('-----dateObj', dateObj);
                const currentMDate = moment(dateObj.date);
                preCallbackOnClick(currentMDate);
                handleDayClick(currentMDate);
              }}
            >
              <span className={styles.day}>{dayStr}日</span>
              <span className={styles.count}>
                {dateObj.option.policyCount}项
              </span>
            </div>
          );
        }}
        getPolicyCountByDates={async (days, $extraCond) => {
          console.log('@@@@getPolicyCountByDates', days, $extraCond);
          return new Promise(function (resolve) {
            setTimeout(() => {
              resolve(
                Array.from({ length: days.length }, () => {
                  const random = getRandomNumber(1, 100);
                  return random;
                }),
              );
            }, 1000);
          });
        }}
      />
    </div>
  );
}
