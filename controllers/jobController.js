const catchAsync = require('../utils/catchAsync');
const keys = require('../config/keys');
const AppError = require('../utils/appError');
const DaoModel = require('../models/daoModel');

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

exports.getDaoJobs = catchAsync(async (req, res, next) => {
  const contract = req.params.contract;
  // console.log(contract);

  const jobs = await DaoModel.getDaoJobs(contract);
  if (!jobs) {
    return next(new AppError(500, 'Something went wrong. Please try again.'));
  }

  return res.status(200).json({
    success: true,
    data: jobs,
  });
});

exports.newJob = catchAsync(async (req, res, next) => {
  const { body } = req;

  let user = req.admin;

  const validFields = checkFields(body, [
    'dao_id',
    'description',
    'job_role',
    'tags',
    'amount',
  ]);
  if (!validFields[0]) {
    return next(new AppError(400, `${validFields[1]} is a required field`));
  }

  const jobObj = {
    dao_id: body.dao_id,
    description: body.description,
    tags: body.tags,
    amount: body.amount,
    job_role: body.job_role,
    createdBy: user,
  };

  const job = await DaoModel.newJob(jobObj);

  if (!job) {
    return next(new AppError(500, 'Something went wrong. Please try again.'));
  }

  return res.status(200).json({
    success: true,
    data: job,
  });
});

exports.applyJob = catchAsync(async (req, res, next) => {
  const { body } = req;
  // console.log(body);
  let user = req.cookies.user;
  if (!user) {
    user = req.header('user');
    if (!user || user === 'null') {
      return next(new AppError(400, 'Please connect your wallet to upvote.'));
    }
  }

  const hasFields = checkFields(body, ['job_id']);
  if (!hasFields[0]) {
    return next(new AppError(400, `${hasFields[1]} is a required field.`));
  }

  await DaoModel.applyJob(body.job_id, user);

  return res.status(200).json({
    success: true,
    data: {
      jobID: body.job_id,
      appliedUser: user,
      applied: true,
    },
  });
});

exports.getAllJobs = catchAsync(async (req, res, next) => {
  const jobs = await DaoModel.getAllJobs();
  return res.status(200).json({
    success: true,
    data: jobs,
  });
});
