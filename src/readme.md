### 依赖包

- moment

### 使用示例

组件定义

```typescript
interface SliderDatePickerProps {
  dateValue: string;
  /**
   * 渲染日期节点
   * @param dateObj 日期节点数据
   * @param isCurrent 是否当前日期
   * @param preCallbackOnClick 节点click事件时必须调用
   */
  renderDayNode: (
    dateObj: RenderDaysType,
    isCurrent: boolean,
    preCallbackOnClick: (date: moment.Moment) => void,
  ) => React.ReactNode | React.ReactElement;

  getPolicyCountByDates: (dates: string[]) => Promise<number[]>;
  leftSideContent?: React.ReactNode | React.ReactElement;
  rightSideContent?: React.ReactNode | React.ReactElement;
}
```

```javascript
function getRandomNumber(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export default function Slider() {
  return (
    <div style={{ width: 1250 }}>
      <SliderDatePicker
        leftSideContent={<span className={styles.headTitle}>政策日历</span>}
        rightSideContent={<div className={styles.operBox}>容器内容自定义</div>}
        dateValue="2024-07-02"
        renderDayNode={(dateObj, isCurrent, preCallbackOnClick) => {
          const dayStr = Number.parseInt(dateObj.date.split('-')[2]);
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
              <span className={styles.count}>
                {dateObj.option.policyCount}项
              </span>
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
    </div>
  );
}
```

```scss
.card {
  cursor: pointer;
  display: flex;
  padding: 20px 16px 16px 16px;
  flex-direction: column;
  justify-content: flex-end;
  align-items: center;
  gap: 16px;
  border-radius: 8px;
  border: 1px solid #0076ff1a;
  background: linear-gradient(113deg, #1fa5ff29 18.63%, #0076ff29 100%);

  &.current {
    background: linear-gradient(113deg, #1fa5ff 18.63%, #0076ff 100%);
    color: #fff;

    .count {
      color: #0076ff;
    }
    .day {
      color: #fff;
    }
  }

  .day {
    color: #070c1b;
    text-align: center;
    font-family: 'PingFang SC';
    font-size: 20px;
    font-style: normal;
    font-weight: 400;
    line-height: 20px;
    text-transform: uppercase;
  }
  .count {
    width: 48px;
    height: 24px;
    flex-shrink: 0;
    border-radius: 100px;
    background: #fff;
    color: #999999;
  }
}

.card:hover {
  color: #fff;
}

.headTitle {
  color: #070c1b;
  font-family: 'FZZhengHeiS-B-GB';
  font-size: 24px;
  font-style: normal;
  font-weight: 400;
  line-height: 24px;
}

.operBox {
  width: 295px;
  height: 40px;
  flex-shrink: 0;
  border-radius: 20px;
  background: #fff;
}
```
