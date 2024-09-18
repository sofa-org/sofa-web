if (!window.mockData) window.mockData = {};

window.mockData.login = () => ({
  code: 0,
  value: {
    uid: 1,
    token: 'string',
    wallet: '12121',
  },
});
