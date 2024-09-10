import './index.css';

import { Button } from 'antd';
import classNames from 'classnames';
import moment from 'moment/moment';
import React from 'react';
import ReactDOM from 'react-dom/client';

import SliderDatePicker from '../src/index';
import styles from './index.module.scss';

function getRandomNumber(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const root = ReactDOM.createRoot(document.getElementById('root'));

const handleDayClick = async (currentMDate: moment.Moment) => {
  // 业务逻辑
  console.log(currentMDate.format('YYYY-MM-DD'));
};

root.render(
  <div style={{ width: 1300 }}>
    <SliderDatePicker
      handleDayClick={handleDayClick}
      leftSideContent={<span className={styles.headTitle}>政策日历</span>}
      rightSideContent={setRefreshCond => {
        return (
          <div className={styles.operBox}>
            <Button
              onClick={() => {
                setRefreshCond({ cond: 1 });
              }}
            >
              11
            </Button>
            <Button
              onClick={() => {
                setRefreshCond({ cond: 2 });
              }}
            >
              22
            </Button>
          </div>
        );
      }}
      dateValue="2024-07-02"
      renderDayNode={(dateObj, isCurrent, preCallbackOnClick) => {
        const dayStr = Number.parseInt(dateObj.date.split('-')[2], 10);
        return (
          <div
            className={classNames({
              [styles.card]: true,
              [styles.current]: isCurrent,
            })}
            onClick={() => {
              const currentMDate = moment(dateObj.date);
              preCallbackOnClick(currentMDate);
              handleDayClick(currentMDate);
            }}
          >
            <span className={styles.day}>{dayStr}日</span>
            <span className={styles.count}>{dateObj.option.policyCount}项</span>
          </div>
        );
      }}
      getPolicyCountByDates={async (days, refreshCond) => {
        console.log('refreshCond', refreshCond);
        return new Promise(function (resolve) {
          setTimeout(() => {
            resolve(
              Array.from({ length: days.length }, (_, index) => {
                const random = getRandomNumber(1, 100);
                // @ts-ignore
                return refreshCond?.cond || 0;
              }),
            );
          }, 1000);
        });
      }}
    />
  </div>,
);
