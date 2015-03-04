var Timer = require('node-timer');

module.exports = function (name) {
  var t = Timer(name);

  t.onend(log);
  t.oninterval(log);

  return t;
};

function log (name, time, counter) {
  var time = (time[0] + (time[1] / 1e9)).toFixed(3);
  console.log('Timer ' + name + '(' + counter + '):' + time + 's');
}