const { v4: uuidv4 } = require('uuid');
const axios = require('axios').default;

const DaoModel = require('../models/daoModel');
const keys = require('../config/keys');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

const API_ENDPOINTS = {
  balances:
    '1/address/0xf206A8Bf5CD5789a425066952FF8fF5d2563a0a0/balances_v2/?quote-currency=USD&format=JSON&nft=false&no-nft-fetch=false',
};

function checkFields(body, fields) {
  let field;
  for (let i = 0; i < fields.length; i++) {
    field = fields[i];
    if (!body.hasOwnProperty(`${field}`)) {
      return [false, field];
    }
  }
  return [true];
}

exports.newReview = catchAsync(async (req, res, next) => {
  const contract = req.params.contract;
  const { body } = req;

  let user = req.cookies.user;
  if (!user) {
    user = req.header('user');
    if (!user || user === 'null') {
      return next(
        new AppError(400, 'Please connect your wallet to add review.')
      );
    }
  }

  if (!body.hasOwnProperty('value') || !body.value.length) {
    return next(
      new AppError(400, 'Review cannot be empty. Please add review.')
    );
  }

  let tokenBalances = await axios.get(
    `${keys.covalentBase}/1/address/${user}/balances_v2/?quote-currency=USD&format=JSON&nft=false&no-nft-fetch=false&key=${keys.covalentKey}`
  );

  if (tokenBalances.data.error) {
    return next(
      new AppError(
        tokenBalances.data.error_code,
        tokenBalances.data.error_message
      )
    );
  }

  tokenBalances = tokenBalances.data.data;

  const hasToken = tokenBalances.items.find((token) => {
    return token.contract_address === contract && parseFloat(token.balance) > 0;
  });

  // if(!hasToken){
  //   return next(new AppError(400, 'You cannot review since you are not part of this dao.'));
  // }
  const reviewObj = {
    dao_id: contract,
    user,
    value: body.value,
    isMember: hasToken ? true : false,
  };

  const review = await DaoModel.addReview(reviewObj);

  if (!review) {
    return next(new AppError(500, 'Something went wrong. Please try again.'));
  }

  return res.status(200).json({
    success: true,
    data: review,
  });
});

exports.newReply = catchAsync(async (req, res, next) => {
  const { body } = req;

  let user = req.cookies.user;
  if (!user) {
    user = req.header('user');
    if (!user || user === 'null') {
      return next(new AppError(400, 'Please connect your wallet to upvote.'));
    }
  }

  const hasFields = checkFields(body, ['review_id', 'value']);
  if (!hasFields[0]) {
    return next(new AppError(400, `${hasFields[1]} is a required field.`));
  }

  const replyObj = { review_id: body.review_id, user, value: body.value };
  const reply = await DaoModel.reply(replyObj);

  if (!reply) {
    return next(new AppError(500, 'Something went wrong. Please try again.'));
  }

  return res.status(200).json({
    success: true,
    data: reply,
  });
});
exports.getReviews = () => {};
exports.deleteReview = () => {};

exports.upvoteReview = catchAsync(async (req, res, next) => {
  const { body } = req;
  // console.log(body);
  let user = req.cookies.user;
  if (!user) {
    user = req.header('user');
    if (!user || user === 'null') {
      return next(new AppError(400, 'Please connect your wallet to upvote.'));
    }
  }

  const hasFields = checkFields(body, ['review_id']);
  if (!hasFields[0]) {
    return next(new AppError(400, `${hasFields[1]} is a required field.`));
  }

  const newVotes = await DaoModel.upvoteReview({
    review_id: body.review_id,
    user,
  });

  return res.status(200).json({
    success: true,
    data: { newVotes },
  });
});
exports.removeUpvote = () => {};
