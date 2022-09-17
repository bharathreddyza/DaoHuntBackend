const express = require('express');
// const mongoose = require('mongoose');
// const cookieSession = require('cookie-session');
const cors = require('cors');
// const path = require('path');
const cookieParser = require('cookie-parser');
// const keys = require('./config/keys');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const daoRoutes = require('./routes/daoRoutes');
const jobRoutes = require('./routes/jobRoutes');
const blogRoutes = require('./routes/blogRoutes');
const errorController = require('./controllers/errorController');
const reviewRoutes = require('./routes/reviewRoutes');
// const AppError = require('./utils/appError');
const { isAuth } = require('./middleware/middleware');
const DaoModel = require('./models/daoModel');
// const orbitDB = require('orbit-db');
require('./utils/cronJobs');

// console.log(orbitDB.isValidAddress('/orbitdb/12D3KooWFAoFyXK48rcszxHzwsvp3Wpy2FZZzy6nTCBGHKC8Ybm4/dao'));
// const DaoModel = require('./models/Model');
// const { v4: uuidv4 } = require('uuid');

// DaoModel.setupIPFS().then(() => {
//   console.log('IPFS connected 📑️📑️');
// }).catch((err) => {
//   console.log('IPFS not connected', err);
// });

DaoModel.create()
  .then(async () => {
    console.log('IPFS connected 📑️📑️');
    // console.log(await DaoModel.DELETE_REVIEW_BY_ID('b51b4b29-dd28-4b7f-bee0-54f125add1b7'));
    // console.log(await DaoModel.DELETE_ALL_DATA());
    // console.log(await DaoModel.orbitdb);
    // console.log(DaoModel.getAddress());
    // console.log(await DaoModel.DELETE_ALL_JOBS());
    // console.log(await DaoModel.DELETE_ALL_REVIEWS());
    // console.log(await DaoModel.DELETE_ALL_BLOGS());
    // console.log(await DaoModel.ADD_UPVOTE_USERS_DAOS());
    // console.log(await DaoModel.DELETE_ALL_PROPOSALS_AND_VOTES());
    // console.log(await DaoModel.addUpVotes());
    // console.log(await DaoModel.GET_ALL_JOBS());
    // console.log(await DaoModel.GET_ALL_DATA());
  })
  .catch((err) => {
    console.log('IPFS error : ', err);
  });

const app = express();

// app.use(
//   cookieSession({
//     keys: [keys.cookieKey],
//     maxAge: 10 * 24 * 60 * 60 * 1000,
//   })
// );

app.use(cors());
app.use(express.json({ limit: '500kb' }));
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());

app.use('/api/auth', authRoutes);

app.use('/user', userRoutes);

app.use('/api/dao', daoRoutes);

app.use('/api/review', reviewRoutes);

app.use('/api/jobs', jobRoutes);

app.use('/api/blog', blogRoutes);

app.use('/api/user', isAuth, (req, res, next) => {
  return res.status(200).json({
    success: true,
    data: req.user,
  });
});

app.use(errorController);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`App up and running at port ${PORT} 👟️👟️`);
});
//source ~/.bashrc    