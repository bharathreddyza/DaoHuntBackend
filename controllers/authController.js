const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.login = (req, res) => {
  console.log('Login Successful.');
  const { user } = req.body;
  res.cookie('user', req.body, { httpOnly: true });
  res.status(200).json({
    success: true,
    data: user,
  });
};

exports.logout = (req, res) => {
  req.logout();
  res.status(200).json({
    success: true,
  });
};
