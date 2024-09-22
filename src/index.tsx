/**
 * 每个日期需要查询的信息，按月份查找
 * @Notice 已知问题，计算政策数量，异步请求切换月份过快，导致响应跟不上切换显示出现异常
 */
import { Spin } from 'antd';
import classNames from 'classnames';
import update from 'immutability-helper';
import { each, find, findIndex, map } from 'lodash-es';
import moment from 'moment';
import React, {
  forwardRef,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

import styles from './index.module.scss';
import {
  getMonthData,
  getMonthPaddingTwoDate,
  getMonthRenderDaysObj,
  getRoundDays,
  RenderDaysType,
} from './utils';

export interface RefProps {
  currentDate: moment.Moment;
  recordMonths: string[];
  setExtraCond: Function;
}

interface SliderDatePickerProps {
  showCount?: number;
  dateValue?: string;
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
  // 暴露出来主要是给回到今日调用
  handleDayClick: (currentDate: moment.Moment) => Promise<void>;
  getPolicyCountByDates: (
    dates: string[],
    extraCond: { activeTab: number },
  ) => Promise<number[]>;
  leftSideContent?: React.ReactNode | React.ReactElement;
  rightSideContent?: React.ReactNode | React.ReactElement;
}

// 一行展示12个
const SHOW_COUNT = 12;
// 每次左右移动1天
const STEP = 1;

function SliderDatePicker(
  props: SliderDatePickerProps,
  ref: React.MutableRefObject<RefProps>,
) {
  const {
    dateValue,
    leftSideContent,
    rightSideContent,
    renderDayNode,
    getPolicyCountByDates,
    handleDayClick,
  } = props;

  const showCount = props.showCount || SHOW_COUNT;

  const cardRefs = useRef({});
  const cardBoxRef = useRef(null);
  // 指定的当前日期
  const _currentDate = dateValue ? moment(dateValue) : moment();

  const monthsPadding = _currentDate.diff(moment(), 'months');

  const [currentDate, setCurrentDate] = useState(_currentDate);

  const [extraCond, setExtraCond] = useState<{ activeTab: number }>();

  const currentMonthData = getMonthData(currentDate);
  // month picker的数据
  const [monthPickerData, setMonthPickerData] =
    useState<[number, number]>(currentMonthData);

  const endDate = _currentDate.clone().add(showCount - 1, 'd');
  const endMonthData = getMonthData(endDate);
  let _renderDates;
  let _recordMonths;
  if (endMonthData[1] > currentMonthData[1]) {
    _renderDates = getMonthRenderDaysObj(currentMonthData, endMonthData);
    _recordMonths = [
      `${currentMonthData[0]}-${currentMonthData[1] + 1}`,
      `${endMonthData[0]}-${endMonthData[1] + 1}`,
    ];
  } else {
    _renderDates = getMonthRenderDaysObj(currentMonthData);
    _recordMonths = [`${currentMonthData[0]}-${currentMonthData[1] + 1}`];
  }

  // 所有用来渲染的日期
  const [renderDates, setRenderDates] =
    useState<RenderDaysType[]>(_renderDates);
  // 记录被渲染的月份
  const [recordMonths, setRecordMonths] = useState(_recordMonths);

  const [loading, setLoading] = useState(false);

  // 初始头尾日期，计算好之后都需要移动
  const [firstDate, setFirstDate] = useState(moment(_renderDates[0].date));
  const [lastDate, setLastDate] = useState(
    moment(_renderDates[0].date)
      .clone()
      .add(showCount - 1, 'd'),
  );
  // card宽度
  const [cardWidth, setCardWidth] = useState(null);

  /**
   * 计算diff并移动卡片
   * @param formDate
   * @param toDate
   * @param width
   * @param offset 偏移量，新生的dom，可能原先容器存在scrollLeft
   * @param extraParam
   */
  const moveDateCard = async (
    formDate: moment.Moment,
    toDate: moment.Moment,
    width: number,
    offset: number,
    extraParam: {
      firstData: moment.Moment;
      showCount: number;
      newRenderDates: RenderDaysType[];
    },
  ) => {
    offset = offset || 0;
    // 对象内部会干扰原数据对象，重新设置对象
    const mFromStr = formDate.format('YYYY-MM-DD');
    const mFrom = moment(mFromStr);
    const mToStr = toDate.format('YYYY-MM-DD');
    const mTo = moment(mToStr);
    const diff = mFrom.diff(mTo, 'days');
    console.log('---moveDateCard:::', mFromStr, mToStr, diff, offset);
    cardBoxRef.current.scrollLeft += width * (diff - offset);

    const countDays = getRoundDays(extraParam.firstData, extraParam.showCount);
    await handleGetPolicyCount(countDays, extraParam.newRenderDates);

    return diff;
  };

  /**
   * 传入两个月数据，获取没渲染数据月份数据。
   *
   */
  const getMonthRenderDatesList = (
    curDate: moment.Moment,
    nowDate: moment.Moment,
  ) => {
    const monthDataList = [];
    let _newRenderDates = [];
    const _newRecordMonths = [];
    const paddingCurrentToNow = getMonthPaddingTwoDate(nowDate, curDate);

    console.log('???paddingCurrentToNow', paddingCurrentToNow);

    // 从后往前移
    if (paddingCurrentToNow > 0) {
      for (let i = 1; i <= paddingCurrentToNow; i++) {
        const monthData = getMonthData(curDate.clone().subtract(i, 'M'));
        monthDataList.push(monthData);
      }

      let renderDatesArr = [];
      for (let i = 0; i < monthDataList.length; i++) {
        const nextMonthStr = `${monthDataList[i][0]}-${
          monthDataList[i][1] + 1
        }`;

        if (recordMonths.includes(nextMonthStr)) {
          continue;
        }

        _newRecordMonths.push(nextMonthStr);

        const _renderDates = getMonthRenderDaysObj(monthDataList[i]);
        renderDatesArr = [..._renderDates, ...renderDatesArr];
      }
      _newRenderDates = update(renderDates, {
        $splice: [[0, 0, ...renderDatesArr]],
      });
    } else {
      // 从前往后移，为了安全，多获取后一个月的数据，+1
      for (let i = 1; i <= -paddingCurrentToNow + 1; i++) {
        const monthData = getMonthData(curDate.clone().add(i, 'M'));
        monthDataList.push(monthData);
      }

      let renderDatesArr = [];
      for (let i = 0; i < monthDataList.length; i++) {
        const nextMonthStr = `${monthDataList[i][0]}-${
          monthDataList[i][1] + 1
        }`;

        if (recordMonths.includes(nextMonthStr)) {
          continue;
        }

        _newRecordMonths.push(nextMonthStr);

        const _renderDates = getMonthRenderDaysObj(monthDataList[i]);
        renderDatesArr = [...renderDatesArr, ..._renderDates];
      }
      _newRenderDates = update(renderDates, {
        $splice: [[renderDates.length, 0, ...renderDatesArr]],
      });
    }

    return {
      newRenderDates: _newRenderDates,
      newRecordMonths: [...recordMonths, ..._newRecordMonths],
    };
  };

  /**
   * 回到今日逻辑
   * 如果当前日期到这个月的结束日期小于SHOW_COUNT，那么今日不会在最开始位置，因为一次只获取了一个月的
   */
  const handleClickToday = async () => {
    const nowDate = moment();
    // 今天的dom不存在需要创建
    const nowDateStr = nowDate.format('YYYY-MM-DD');
    const nowDom = cardRefs.current[nowDateStr];

    if (!nowDom) {
      const currentMonthStateDate = currentDate.clone().startOf('month');
      const offset = currentDate.clone().diff(currentMonthStateDate, 'days');

      const { newRenderDates, newRecordMonths } = getMonthRenderDatesList(
        currentDate,
        nowDate,
      );

      console.log(
        '>>>>>>>newRenderDates, newRecordMonths',
        newRenderDates,
        newRecordMonths,
      );

      setRecordMonths(newRecordMonths);
      setRenderDates(newRenderDates);

      //   往后
      if (firstDate.isBefore(nowDate)) {
        setTimeout(async () => {
          const diff = await moveDateCard(nowDate, firstDate, cardWidth, 0, {
            firstData: nowDate,
            showCount,
            newRenderDates,
          });
          setFirstDate(nowDate);
          setLastDate(lastDate.clone().add(diff, 'd'));
          console.log(
            '@###handleClickToday 新的开始结束',
            nowDate.format('YYYY-MM-DD'),
            lastDate.clone().add(diff, 'd').format('YYYY-MM-DD'),
          );
        });
      } else {
        // 往前
        setTimeout(async () => {
          const startDate = moment(newRenderDates[0].date);
          await moveDateCard(nowDate, startDate, cardWidth, offset, {
            firstData: nowDate,
            showCount,
            newRenderDates,
          });
          setFirstDate(nowDate);
          setLastDate(nowDate.clone().add(showCount - 1, 'd'));
          console.log(
            '@###handleClickToday 新的开始结束',
            nowDate.format('YYYY-MM-DD'),
            nowDate
              .clone()
              .add(showCount - 1, 'd')
              .format('YYYY-MM-DD'),
          );
        });
      }
    } else {
      const diff = await moveDateCard(nowDate, firstDate, cardWidth, 0, {
        firstData: nowDate,
        showCount,
        newRenderDates: renderDates,
      });
      setFirstDate(nowDate);
      setLastDate(lastDate.clone().add(diff, 'd'));
      console.log(
        '@###handleClickToday 新的开始结束',
        nowDate.format('YYYY-MM-DD'),
        lastDate.clone().add(diff, 'd').format('YYYY-MM-DD'),
      );
    }

    // 设置月份数据
    const _monthData = getMonthData(nowDate);
    setMonthPickerData(_monthData);
    // 仅是为了渲染颜色
    setCurrentDate(nowDate);

    await handleDayClick(nowDate);
  };

  /**
   * 根据月份数据，生成需要渲染的天数
   * @param monthData
   *  @param step 前赠还是后
   */
  const genNewMonthRenderDates = (
    monthData: [number, number],
    step: number,
  ) => {
    const nextRenderDates = getMonthRenderDaysObj(monthData);
    let $newRenderDates = null;
    // 后加
    if (step > 0) {
      $newRenderDates = update(renderDates, {
        $splice: [[renderDates.length, 0, ...nextRenderDates]],
      });
    } else {
      $newRenderDates = update(renderDates, {
        $splice: [[0, 0, ...nextRenderDates]],
      });
    }
    return $newRenderDates;
  };

  /**
   * 计算月份数据
   * @param mData
   * @param step
   */
  const handleChangeMonth = async (mData: [number, number], step: number) => {
    // @ts-ignore
    const nextDate = moment(mData).add(step, 'M');
    const nextMonthData = getMonthData(nextDate);
    setMonthPickerData(nextMonthData);
    // 拼成记录月份
    const nextMonthStr = `${nextMonthData[0]}-${nextMonthData[1] + 1}`;
    console.log(
      '???recordMonths.indexOf(nextMonthStr)',
      recordMonths.indexOf(nextMonthStr),
    );
    let $newRenderDates = renderDates;
    // 加这个判断是为了不创建
    if (recordMonths.indexOf(nextMonthStr) < 0) {
      const newRecordMonths = update(recordMonths, {
        $push: [nextMonthStr],
      });
      setRecordMonths(newRecordMonths);
      const _newRenderDates = genNewMonthRenderDates(nextMonthData, step);
      setRenderDates(_newRenderDates);
      $newRenderDates = _newRenderDates;
    }
    //   延迟一步，更新滚动条
    setTimeout(async () => {
      //  之前dom已存在,不会发生scrollWidth变化,直接进行定位
      const newFirstDate = moment([nextMonthData[0], nextMonthData[1], 1]);
      const diff = await moveDateCard(newFirstDate, firstDate, cardWidth, 0, {
        firstData: newFirstDate,
        showCount,
        newRenderDates: $newRenderDates,
      });
      setFirstDate(newFirstDate);
      const newLastDate = lastDate.clone().add(diff, 'd');
      setLastDate(newLastDate);
      console.log(
        '@###handleChangeMonth 新的开始结束',
        diff,
        newFirstDate.format('YYYY-MM-DD'),
        newLastDate.format('YYYY-MM-DD'),
      );
    });
  };

  /**
   * slider的上一步和下一步
   */
  const handleSliderChange = async (dDate: moment.Moment, step: number) => {
    const newFirstDate = firstDate.clone().add(step, 'd');
    const newLastDate = lastDate.clone().add(step, 'd');

    const nextDate = dDate.clone().add(step, 'd');
    const nextDateStr = nextDate.format('YYYY-MM-DD');
    const nextDateDom = cardRefs.current[nextDateStr];

    const nextMonthData = getMonthData(nextDate);
    setMonthPickerData(nextMonthData);

    if (!nextDateDom) {
      const nextMonthStr = `${nextMonthData[0]}-${nextMonthData[1] + 1}`;
      const newRecordMonths = update(recordMonths, {
        $push: [nextMonthStr],
      });
      setRecordMonths(newRecordMonths);
      const _newRenderDates = genNewMonthRenderDates(nextMonthData, step);
      setRenderDates(_newRenderDates);

      if (step > 0) {
        // 往右移动
        setTimeout(() => {
          moveDateCard(nextDate, dDate, cardWidth, 0, {
            firstData: newLastDate,
            showCount: 1,
            newRenderDates: _newRenderDates,
          });
          setFirstDate(newFirstDate);
          setLastDate(newLastDate);
          console.log(
            '@@@handleSliderChange no dom新的开始结束',
            newFirstDate.format('YYYY-MM-DD'),
            newLastDate.format('YYYY-MM-DD'),
          );
        }, 0);
      } else {
        // 往左移动
        setTimeout(() => {
          const startDate = nextDate.clone().startOf('month');
          moveDateCard(nextDate, startDate, cardWidth, 0, {
            firstData: newFirstDate,
            showCount: 1,
            newRenderDates: _newRenderDates,
          });
          setFirstDate(newFirstDate);
          setLastDate(newLastDate);
          console.log(
            '@@@handleSliderChange no dom新的开始结束',
            newFirstDate.format('YYYY-MM-DD'),
            newLastDate.format('YYYY-MM-DD'),
          );
        }, 0);
      }
    } else {
      // step为负数是向左，正数向右
      cardBoxRef.current.scrollLeft += cardWidth * step;
      setFirstDate(newFirstDate);
      setLastDate(newLastDate);
      console.log(
        '@@@handleSliderChange 新的开始结束',
        newFirstDate.format('YYYY-MM-DD'),
        newLastDate.format('YYYY-MM-DD'),
      );
      // 左
      if (step < 0) {
        const matched = find(renderDates, item => {
          return item.date === newFirstDate.format('YYYY-MM-DD');
        });
        if (!matched?.option.policyCount) {
          const countDays = getRoundDays(newFirstDate, 1);
          await handleGetPolicyCount(countDays, renderDates);
        }
      } else {
        // 右
        const matched = find(renderDates, item => {
          return item.date === newLastDate.format('YYYY-MM-DD');
        });
        if (!matched?.option.policyCount) {
          const countDays = getRoundDays(newLastDate, 1);
          await handleGetPolicyCount(countDays, renderDates);
        }
      }

      // // 此处不知前后，为方便，故计算showCount个
      // const countDays = getRoundDays(newLastDate, showCount);
      // await handleGetPolicyCount(countDays, renderDates);
    }
  };

  /**
   * 渲染当前slider并初始化
   * @param renderDateStrs 可渲染数据
   * @param currentDate 用来渲染蓝色
   */
  const renderSlider = (renderDateStrs: RenderDaysType[], currentDate: any) => {
    return map(renderDateStrs, dateObj => {
      const dateStr = dateObj.date;
      const mEndOfMonth = moment(dateStr).endOf('month');
      const endOfMonthStr = mEndOfMonth.format('YYYY-MM-DD');

      const isCurrent = dateStr === currentDate?.format('YYYY-MM-DD');

      return (
        <span
          title={dateObj.date}
          className={classNames({
            [styles.cardBox]: true,
            [styles.endOfMonth]: dateStr === endOfMonthStr,
          })}
          style={{
            width: `${100 / showCount}%`,
            flexBasis: `${100 / showCount}%`,
          }}
          key={dateStr}
          ref={el => {
            cardRefs.current[dateStr] = el;
          }}
        >
          {renderDayNode(dateObj, isCurrent, (selectedDate: moment.Moment) => {
            setCurrentDate(selectedDate);
          })}
        </span>
      );
    });
  };

  // 宽度只计算一次
  useLayoutEffect(() => {
    const currentDateStr = currentDate?.format('YYYY-MM-DD');
    const currentMatchedCardDom = cardRefs.current[currentDateStr];
    const width = currentMatchedCardDom.getBoundingClientRect().width;
    setCardWidth(width);

    moveDateCard(currentDate, firstDate, width, 0, {
      firstData: currentDate,
      showCount,
      newRenderDates: renderDates,
    }).then(diff => {
      setFirstDate(currentDate);
      setLastDate(lastDate.clone().add(diff, 'd'));
    });
  }, []);

  /**
   * @param days
   * @param renderDates
   * @param $extraCond
   */
  const handleGetPolicyCount = async (
    days: string[],
    renderDates: RenderDaysType[],
    $extraCond?: { activeTab: number },
  ) => {
    $extraCond = $extraCond || extraCond;
    setLoading(true);
    try {
      const result = await getPolicyCountByDates(days, $extraCond);
      const resp = {
        params: days,
        result,
      };

      let optionsStr = {};
      each(resp.params, (day, idx) => {
        const $index = findIndex(renderDates, item => {
          return item.date === day;
        });
        if ($index > -1) {
          const $count = resp.result[idx];
          const $option = {
            [$index]: {
              option: {
                policyCount: {
                  $set: $count,
                },
              },
            },
          };
          optionsStr = { ...$option, ...optionsStr };
        }
      });
      const newRenderDates = update(renderDates, {
        ...optionsStr,
      });
      setRenderDates(newRenderDates);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useImperativeHandle(ref, () => {
    return {
      currentDate,
      recordMonths,
      setExtraCond,
    };
  });

  if (Math.abs(monthsPadding) > 12) {
    return <span>默认日期不能超出当前时间12个月</span>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.leftSide}>
          <div className={styles.leftContent}>{leftSideContent}</div>
          <div className={styles.dateOperate}>
            <div
              className={styles.today}
              onClick={() => {
                handleClickToday();
              }}
            >
              今日
            </div>
            <div className={styles.picker}>
              <span
                className={classNames({
                  [styles.btn]: true,
                  [styles.left]: true,
                })}
                onClick={() => {
                  handleChangeMonth(monthPickerData, -1);
                }}
              />
              {/* @NOTICE 最后一天消失才显示下个月 */}
              <span>
                <span className={styles.year}>{monthPickerData?.[0]}</span>年
                <span className={styles.month}>{monthPickerData?.[1] + 1}</span>
                月
              </span>
              <span
                className={classNames({
                  [styles.btn]: true,
                  [styles.right]: true,
                })}
                onClick={() => {
                  handleChangeMonth(monthPickerData, 1);
                }}
              />
            </div>
          </div>
        </div>
        <div className={styles.rightSide}>{rightSideContent}</div>
      </div>
      <Spin spinning={loading}>
        <div className={styles.slider}>
          <span
            className={classNames({
              [styles.btn]: true,
              [styles.left]: true,
            })}
            onClick={() => {
              if (!loading) {
                handleSliderChange(firstDate, -STEP);
              }
            }}
          />
          <div
            className={classNames({ [styles.cardContainer]: true })}
            ref={cardBoxRef}
          >
            {renderSlider(renderDates, currentDate)}
          </div>
          <span
            className={classNames({
              [styles.btn]: true,
              [styles.right]: true,
            })}
            onClick={() => {
              if (!loading) {
                handleSliderChange(lastDate, STEP);
              }
            }}
          />
        </div>
      </Spin>
    </div>
  );
}

export default forwardRef(SliderDatePicker);
