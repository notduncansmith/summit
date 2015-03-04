module.exports = function (res, next) {
  res.headers['X-Powered-By'] = 'Summit';
  return next();
};
