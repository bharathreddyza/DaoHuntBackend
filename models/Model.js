const Ipfs = require('ipfs');
const OrbitDB = require('orbit-db');
const AppError = require('../utils/appError');
const { v4: uuidv4 } = require('uuid');
const catchAsync = require('../utils/catchAsync');

let daos, reviews, jobs;
exports.setupIPFS = async () => {
  const ipfs = await Ipfs
  .create({
    preload: { enabled: false },
    repo: './ipfs',
    EXPERIMENTAL: { pubsub: true },
    config: {
      Bootstrap: [],
      Addresses: { Swarm: [] },
    },
  })

  const orbitdb = await OrbitDB.createInstance(ipfs);

  const defaultOptions = {
    accessController: {
      write: [orbitdb.identity.id],
    },
  };

  const docStoreOptions = {
    ...defaultOptions,
    indexBy: 'id',
  };

  daos = await orbitdb.docs('dao.daos', docStoreOptions);
  await daos.load();
  // console.log(daos);

  reviews = await orbitdb.docs('dao.reviews', docStoreOptions);
  await reviews.load();

  jobs = await orbitdb.docs('dao.jobs', docStoreOptions);
  await jobs.load();
}

exports.newDao = async (dao) => {
  const existingDao = await daos.query((doc) => doc._id === dao._id);
  if (existingDao.length) {
    return new AppError('Dao with same id already exists');
  }

  const returnVal = await daos.put(dao);
  await reviews.put({ dao_id: dao._id });
  await jobs.put({ dao_id: dao._id });
  console.log('saved', returnVal);
  return returnVal;
}

exports.updateDao = async (dao) => {
  let existingDao = await daos.query((doc) => doc._id === dao._id);

  if (!existingDao) {
    return new AppError('No Dao exists with that ID');
  }

  existingDao = { existingDao, ...dao };
  return await jobs.put(existingDao);
}

exports.addReview = async (review) => {
  const existingDao = await daos.query(
    (doc) => doc._id === review.dao_id
  );

  if (!existingDao) {
    return new AppError('No Dao exists with that id');
  }

  const reviewId = uuidv4();
  return reviews.put({
    _id: reviewId,
    ...review,
    upvotes: 0,
    replies: [],
    time: new Date().toISOString,
  });
}

exports.upvoteReview = async(reviewID) => {
  // const existingReview = await reviews.query(
  //   (doc) => doc._id === reviewID
  // );
  const existingReview = reviews.get(reviewID);
  if (!existingReview) {
    return new AppError('No review exists with that id');
  }

  existingReview.upvotes += 1;
  return await reviews.put(existingReview);
}

exports.removeUpvote = async(reviewID) => {
  const existingReview = reviews.get(reviewID)[0];
  if (!existingReview) {
    return new AppError('No review exists with that id');
  }
  existingReview.upvotes -= 1;
  return await reviews.put(existingReview);
}

exports.reply = async(replyObj) => {
  const existingReview = reviews.get(replyObj.review_id)[0];
  if (!existingReview) {
    return new AppError('No review exists with that id');
  }

  existingReview.replies = [...existingReview.replies, { ...replyObj }];
  return await reviews.put(existingReview);
}

exports.getDaoReviews = async(daoID) => {
  const reviews = await reviews.query((doc) => doc.dao_id === daoID);
  return reviews;
}

exports.newJob = async(jobObj) => {
  const existingDao = daos.get(jobObj.dao_id)[0];
  if (!existingDao) {
    return new AppError('No Dao exists with that id');
  }

  return await jobs.put(jobObj);
}

exports.getDaoJobs = async(daoID) => {
  const jobs = await jobs.query((doc) => doc.dao_id === daoID);
  return jobs;
}

exports.getDaoDetails = async(daoID) => {
  const dao = daos.get(daoID)[0];
  return dao;
}

exports.getFullDao = async(daoID)=> {
  const dao = daos.get(daoID)[0];
  dao.reviews = await reviews.query((doc) => doc.dao_id === daoID);
  dao.jobs = await jobs.query((doc) => doc.dao_id === daoID);
  return dao;
}

exports.GET_ALL_DATA = async() =>{
  const Alldaos = daos.get('');
  const Allreviews = reviews.get('');
  const Alljobs = jobs.get('');
  return { daos : Alldaos, reviews: Allreviews, jobs: Alljobs };
}
// Ipfs
//   .create({
//     preload: { enabled: false },
//     repo: './ipfs',
//     EXPERIMENTAL: { pubsub: true },
//     config: {
//       Bootstrap: [],
//       Addresses: { Swarm: [] },
//     },
//   })
//   .then(async (ipfs) => {
//     // const id = await node.id();
//     const orbitdb = await OrbitDB.createInstance(ipfs);
//     // const defaultOptions = {
//     //   accessController: {
//     //     write: [orbitdb.identity.id],
//     //   },
//     // };
//     this.daos = await this.orbitdb.docs('dao.daos', docStoreOptions);
//     await this.daos.load();

//     this.reviews = await this.orbitdb.docs('dao.reviews', docStoreOptions);
//     await this.reviews.load();

//     this.jobs = await this.orbitdb.docs('dao.jobs', docStoreOptions);
//     await this.jobs.load();

//   });

// class Dao {
//   constructor(Ipfs, OrbitDB) {
//     this.OrbitDB = OrbitDB;
//     this.Ipfs = Ipfs;
//   }

//   async create() {
//     this.node = await this.Ipfs.create({
//       preload: { enabled: false },
//       repo: './ipfs',
//       EXPERIMENTAL: { pubsub: true },
//       config: {
//         Bootstrap: [],
//         Addresses: { Swarm: [] },
//       },
//     });

//     this._init();
//   }

//   async _init() {
//     const peerInfo = await this.node.id();
//     this.orbitdb = await this.OrbitDB.createInstance(this.node);
//     this.defaultOptions = {
//       accessController: {
//         write: [this.orbitdb.identity.id],
//       },
//     };

//     const docStoreOptions = {
//       ...this.defaultOptions,
//       indexBy: 'hash',
//     };
//     // this.daos = await this.orbitdb.docs('daos', docStoreOptions);
//     this.daos = await this.orbitdb.docs('dao.daos', docStoreOptions);
//     await this.daos.load();

//     this.reviews = await this.orbitdb.docs('dao.reviews', docStoreOptions);
//     await this.reviews.load();

//     this.jobs = await this.orbitdb.docs('dao.jobs', docStoreOptions);
//     await this.jobs.load();

//     // this.onready();
//   }

//   async newDao(dao) {
//     const existingDao = await this.daos.query((doc) => doc._id === dao._id);

//     if (existingDao) {
//       return new AppError('Dao with same id already exists');
//     }

//     const returnVal = await this.daos.put(dao);
//     await this.reviews.put({ dao_id: dao._id });
//     await this.jobs.put({ dao_id: dao._id });
//     return returnVal;
//   }

//   async updateDao(dao) {
//     let existingDao = await this.daos.query((doc) => doc._id === dao._id);

//     if (!existingDao) {
//       return new AppError('No Dao exists with that ID');
//     }

//     existingDao = { existingDao, ...dao };
//     return await this.jobs.put(existingDao);
//   }

//   async addReview(review) {
//     const existingDao = await this.daos.query(
//       (doc) => doc._id === review.dao_id
//     );

//     if (!existingDao) {
//       return new AppError('No Dao exists with that id');
//     }

//     const reviewId = uuidv4();
//     return this.reviews.put({
//       _id: reviewId,
//       ...review,
//       upvotes: 0,
//       replies: [],
//       time: new Date().toISOString,
//     });
//   }

//   async upvoteReview(reviewID) {
//     // const existingReview = await this.reviews.query(
//     //   (doc) => doc._id === reviewID
//     // );
//     const existingReview = this.reviews.get(reviewID);
//     if (!existingReview) {
//       return new AppError('No review exists with that id');
//     }

//     existingReview.upvotes += 1;
//     return await this.reviews.put(existingReview);
//   }

//   async removeUpvote(reviewID) {
//     const existingReview = this.reviews.get(reviewID)[0];
//     if (!existingReview) {
//       return new AppError('No review exists with that id');
//     }
//     existingReview.upvotes -= 1;
//     return await this.reviews.put(existingReview);
//   }

//   async reply(replyObj) {
//     const existingReview = this.reviews.get(replyObj.review_id)[0];
//     if (!existingReview) {
//       return new AppError('No review exists with that id');
//     }

//     existingReview.replies = [...existingReview.replies, { ...replyObj }];
//     return await this.reviews.put(existingReview);
//   }

//   async getDaoReviews(daoID) {
//     const reviews = await this.reviews.query((doc) => doc.dao_id === daoID);
//     return reviews;
//   }

//   async newJob(jobObj) {
//     const existingDao = this.daos.get(jobObj.dao_id)[0];
//     if (!existingDao) {
//       return new AppError('No Dao exists with that id');
//     }

//     return await this.jobs.put(jobObj);
//   }

//   async getDaoJobs(daoID) {
//     const jobs = await this.jobs.query((doc) => doc.dao_id === daoID);
//     return jobs;
//   }

//   async getDaoDetails(daoID) {
//     const dao = this.daos.get(daoID)[0];
//     return dao;
//   }

//   async getFullDao(daoID) {
//     const dao = this.daos.get(daoID)[0];
//     dao.reviews = await this.reviews.query((doc) => doc.dao_id === daoID);
//     dao.jobs = await this.jobs.query((doc) => doc.dao_id === daoID);
//     return dao;
//   }

//   async GET_ALL_DATA() {
//     const daos = this.daos.get('');
//     const reviews = this.reviews.get('');
//     const jobs = this.jobs.get('');
//     return { daos, reviews, jobs };
//   }
// }

// try {
//   const Ipfs = require('ipfs');
//   const OrbitDB = require('orbit-db');
//   module.exports = exports = new Dao(Ipfs, OrbitDB);
// } catch (e) {
//   console.log(e);
//   // window.NPP = new Dao(window.Ipfs, window.OrbitDB);
// }