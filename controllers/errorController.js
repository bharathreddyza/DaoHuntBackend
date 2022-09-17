module.exports = (err, req, res, next) => {
  err.statusCode = err.hasOwnProperty('statusCode') ? err.statusCode : 500;
  err.message = err.message || 'Something went wrong!';

  const errJson = {
    success: false,
    status: err.status,
    message: err.message,
  };

  if (process.env.NODE_ENV != 'production') {
    errJson.stack = err.stack;
  }

  return res.status(err.statusCode).json(errJson);
};
