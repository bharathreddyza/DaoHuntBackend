const keys = require('../config/keys');
const AppError = require('../utils/appError');

exports.isAdmin = (req, res, next) => {
  const { body } = req;
  // const user = req.cookies.user;
  // if(!user){
  //   return next(new AppError(400, "Please connect your wallet to add review."));
  // }
  let user = req.cookies.user;
  if (!user) {
    user = req.header('user');
    if (!user || user === 'null') {
      return next(new AppError(400, 'Please connect your wallet.'));
    }
  }
  // console.log(keys.adminUsers);

  const admin = keys.adminUsers.find((item) => item === user);
  if (!admin) {
    return next(new AppError(400, 'Only admins have access to this route.'));
  }

  if (!body.hasOwnProperty('password')) {
    return next(new AppError(400, 'Please enter password'));
  }

  if (body.password !== keys.adminPassword) {
    return next(new AppError(400, `Incorrect credentials. please try again.`));
  }

  req.admin = user;

  next();
};

exports.isAuth = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  return next(400, 'You are not logged in. Please log in first.');
};
