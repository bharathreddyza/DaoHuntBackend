const DaoModel = require('../models/daoModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

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

exports.getAllBlogs = catchAsync(async (req, res, next) => {
  const blogs = await DaoModel.getAllBlogs();
  return res.status(200).json({
    success: true,
    data: blogs,
  });
});

exports.newBlog = catchAsync(async (req, res, next) => {
  const { body } = req;

  let user = req.admin;
  // id, name, banner, tags, description, text, publishedAt, length, user, upvotes;
  const reqFields = ['name', 'banner', 'tags', 'description', 'text', 'length'];
  const validFields = checkFields(body, reqFields);

  if (!validFields[0]) {
    return next(new AppError(400, `${validFields[1]} is a required field.`));
  }

  const blogObj = {};
  reqFields.forEach((field) => {
    blogObj[field] = body[field];
  });
  blogObj.user = user;
  // console.log(blogObj);

  const blog = await DaoModel.newBlog(blogObj);

  return res.status(200).json({
    success: true,
    data: blog,
  });
});
exports.getBlogDetail = catchAsync(async (req, res, next) => {
  const { blog } = req.params;
  const reqBlog = await DaoModel.getBlog(blog);

  return res.status(200).json({
    success: true,
    data: reqBlog,
  });
});

exports.upvoteBlog = catchAsync(async (req, res, next) => {
  const { body } = req;
  // console.log(body);
  let user = req.cookies.user;
  if (!user) {
    user = req.header('user');
    if (!user || user === 'null') {
      return next(new AppError(400, 'Please connect your wallet to upvote.'));
    }
  }

  const hasFields = checkFields(body, ['blog_id']);
  if (!hasFields[0]) {
    return next(new AppError(400, `${hasFields[1]} is a required field.`));
  }

  const newVotes = await DaoModel.upvoteBlog({
    blog_id: body.blog_id,
    user,
  });

  return res.status(200).json({
    success: true,
    data: { newVotes },
  });
});
