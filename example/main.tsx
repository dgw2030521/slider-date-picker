import './index.css';

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

root.render(
  <div style={{ width: 1200 }}>
    <SliderDatePicker
      leftSideContent={<span className={styles.headTitle}>政策日历</span>}
      rightSideContent={<div className={styles.operBox}>容器内容自定义</div>}
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
              // 业务逻辑
              console.log(currentMDate.format('YYYY-MM-DD'));
            }}
          >
            <span className={styles.day}>{dayStr}日</span>
            <span className={styles.count}>{dateObj.option.policyCount}项</span>
          </div>
        );
      }}
      getPolicyCountByDates={async days => {
        return new Promise(function (resolve) {
          setTimeout(() => {
            resolve(
              Array.from({ length: days.length }, (_, index) => {
                return getRandomNumber(1, 100);
              }),
            );
          }, 1000);
        });
      }}
    />
  </div>,
);
