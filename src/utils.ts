export const CANVAS_DIMS = {
  w: 1024,
  h: 576,
};

const colors = [
  /* [fill, stroke] */
  ["#876FC3", "#694AB5"],
  ["#D55D8D", "#CA3570"],
  ["#DE8854", "#D66A29"],
  ["#C7CC66", "#B9C03F"],
  ["#73BF8B", "#50AF6E"],
  ["#4980B6", "#6D99C5"],
  ["#72C074", "#4EB151"],
] as const;

/**
 * @returns {[number, number]} [Fill, Stroke]
 */
export const getRandomColors = () => {
  const index = Math.floor((Math.random() * 100) % colors.length);
  return colors[index];
};
/**
 * @returns {[number, number]} [Width, Height], [Left, Right]
 */
export const getRandomPos = () => [
  Math.floor((Math.random() * 100) % CANVAS_DIMS.w),
  Math.floor((Math.random() * 100) % CANVAS_DIMS.h),
];
