import moment from 'moment';

/**
 * 获取月份数据
 * @param currentDate
 */
const getMonthData = (currentDate: any): [number, number] => {
  const nowYear = currentDate.year();
  // dayjs内部从0开始，0-11
  const nowMonth = currentDate.month();
  return [nowYear, nowMonth];
};

/**
 * 获取渲染的日期树
 * @param monthData
 */
const getMonthRenderDays = (monthData: [number, number]) => {
  const monthDays = moment(monthData).daysInMonth();
  return Array.from({ length: monthDays }, (_, index) => {
    return moment([...monthData, index + 1]).format('YYYY-MM-DD');
  });
};

type RenderDaysType = {
  date: string;
  option: {
    policyCount?: number;
    [index: string]: any;
  };
};
/**
 * 获取渲染的日期树， [年，月]
 * @param monthData
 */
const getMonthRenderDaysObj = (
  monthData: [number, number],
): RenderDaysType[] => {
  const monthDays = moment(monthData).daysInMonth();
  return Array.from({ length: monthDays }, (_, index) => {
    return {
      date: moment([...monthData, index + 1]).format('YYYY-MM-DD'),
      option: {},
    };
  });
};

/**
 * 返回两个日期的月份差
 * @param fromDate
 * @param toDate
 */
const getMonthPaddingTwoDate = (
  fromDate: moment.Moment,
  toDate: moment.Moment,
) => {
  const fromYear = fromDate.year();
  const fromMonth = fromDate.month();
  const toYear = toDate.year();
  const toMonth = toDate.month();
  let result = 0;
  if (toDate.isAfter(fromDate, 'month')) {
    const restYears = toYear - fromYear;
    const restMonths = toMonth - fromMonth;

    if (restMonths >= 0) {
      result = restYears * 12 + restMonths;
    } else {
      result = (restYears - 1) * 12 + (12 + restMonths);
    }
  } else if (toDate.isBefore(fromDate, 'month')) {
    const restYears = fromYear - toYear;
    const restMonths = fromMonth - toMonth;

    if (restMonths >= 0) {
      result = -(restYears * 12 + restMonths);
    } else {
      result = -((restYears - 1) * 12 + (12 + restMonths));
    }
  }

  return result;
};

export {
  getMonthData,
  getMonthRenderDays,
  getMonthRenderDaysObj,
  getMonthPaddingTwoDate,
};

export type { RenderDaysType };
