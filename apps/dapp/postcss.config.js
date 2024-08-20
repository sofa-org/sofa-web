module.exports = {
  plugins: {
    autoprefixer: {},
    'postcss-pxtorem': {
      rootValue: 1, // 根元素字体大小。确保它匹配你 HTML 的根字体大小。
      unitPrecision: 5, // 转换后的小数位数。
      propList: ['*'], // 可以从 px 更改为 rem 的属性列表，['*'] 表示所有属性都要转换。
      selectorBlackList: [], // 忽略的选择器，保持为 px。
      replace: true, // 替换包含 px 的规则。
      mediaQuery: false, // 允许在媒体查询中转换 px。
      minPixelValue: 1.1, // 设置要替换的最小像素值。
    },
  },
};
