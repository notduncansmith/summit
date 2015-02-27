module.exports = function (app) {
  return function notFound (res, views, respond) {
    if (res.body) {
      return res;
    }

    if (views.not_found) {
      return respond(views.not_found, {}, {status:404});
    }

    var message = '<h1>Sorry, we couldn\'t find this page.</h1>';

    return {
      status: 404,
      body: [message],
      headers: {
        'content-type': 'text/html',
        'content-length': Buffer.byteLength(message)
      }
    };
  };
};

