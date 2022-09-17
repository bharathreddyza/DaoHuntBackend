const cron = require('node-cron');
const DaoModel = require('../models/daoModel');
const daoList = require('./daoList.json');
const AppError = require('./appError');
const axios = require('axios');
const util = require('util');
const {
  getProsalsReq,
  getVotesReq,
  getDaoDelegatesReq,
} = require('./graphRequests');

const getOverview = async (daoTickers, daoAddresses, pageSize = 100) => {
  try {
    let daos = [];

    // Fetch latest prices
    const {
      data: { data },
    } = await axios(
      `https://api.covalenthq.com/v1/pricing/tickers/?tickers=${daoTickers.toString()}&key=${'ckey_6562db8ca22f481bb2d1ef24af0'}`
    );
    // console.log(data);
    // const { data } = await res.json();

    // Remove duplicate tickers
    daos = data.items.filter(({ contract_address }) =>
      daoAddresses.includes(contract_address)
    );

    // getTokenHolder promise
    const tokenHolderPromises = daos.map(async (dao) => {
      return await axios(
        `https://api.covalenthq.com/v1/1/tokens/${
          dao.contract_address
        }/token_holders/?quote-currency=USD&format=JSON&page-size=${pageSize}&key=${'ckey_6562db8ca22f481bb2d1ef24af0'}`
      );
      // return await res.json();
    });

    // resolve tokenHolder promise
    let tokenHoldersObj = await Promise.all(tokenHolderPromises);
    tokenHoldersObj = tokenHoldersObj.map(
      (tokenHolderItem) => tokenHolderItem.data
    );

    // add tokenHolder props to each dao in daos array
    daos = daos.map((dao) => {
      const reqTokenHolder = tokenHoldersObj.find(
        (token) =>
          token.error === false &&
          token.data.items[0].contract_address === dao.contract_address
      );
      if (!reqTokenHolder) {
        return { ...dao, tokenHoldersFound: false };
      } else {
        const firstTokenHolder = reqTokenHolder.data.items[0];
        const totalMembers = reqTokenHolder.data.pagination.total_count;
        const totalSupply =
          BigInt(firstTokenHolder.total_supply) /
          BigInt(10 ** firstTokenHolder.contract_decimals);

        const marketCap = parseFloat(totalSupply) * dao.quote_rate;

        const topTokenHolders = reqTokenHolder.data.items.slice(0, 50);
        topTokenHolders.forEach((holder) => {
          holder.value = parseInt(
            BigInt(holder.balance) / BigInt(10 ** holder.contract_decimals)
          );
        });
        const updatedAt = reqTokenHolder.data.updated_at;
        return {
          ...dao,
          treasury: marketCap,
          totalMembers,
          topTokenHolders,
          updatedAt,
        };
      }
    });
    // console.log(daos);
    return daos;
  } catch (error) {
    throw new AppError(500, error.message);
  }
};

// addDaosTodatabase
cron.schedule('*/15 * * * *', async () => {
  try {
    console.log('Running cron : addDaosTodatabase');
    const daoTickers = [];
    const daoAddresses = [];
    daoList.forEach(({ contractTicker, contractAddress }) => {
      daoTickers.push(contractTicker);
      daoAddresses.push(contractAddress);
    });

    const daos = await getOverview(daoTickers, daoAddresses);

    const daosPromises = daos.map(async (dao) => {
      const obj = {
        id: dao.contract_address,
        ...dao,
        lastUpdatedAt: new Date().toISOString(),
      };
      return await DaoModel.updateDao(obj);
    });

    await Promise.all(daosPromises);
    console.log('Cron : Daos Added to database successfully');
  } catch (error) {
    console.log('Cron : addDaosTodatbase error : ', error);
  }
});

// calcTreasuryOvertime
cron.schedule('33 2 1 * *', async () => {
  console.log('Running cron : calcTreasuryOvertime');
  for (let i = 0; i < daoList.length; i++) {
    try {
      const contract = daoList[i].contractAddress;
      const date = new Date();
      const curYear = date.getFullYear();
      const month = date.getMonth();
      const dates = [];
      let newDate;
      for (let i = month; i <= 11; i++) {
        newDate = new Date(curYear - 1, i, 1, 0, 0, 0, 0);
        dates.push(newDate);
      }

      for (let i = 0; i <= month; i++) {
        newDate = new Date(curYear, i, 1, 0, 0, 0, 0);
        dates.push(newDate);
      }

      // console.log(dates);
      const blockHeightsPromises = dates.map(async (startDate) => {
        const stopDate = new Date(startDate.getTime() + 60 * 1000);
        // console.log(
        //   `https://api.covalenthq.com/v1/1/block_v2/${startDate.toISOString()}/${stopDate.toISOString()}/?quote-currency=USD&format=JSON&page-size=25000&page-number=&key=ckey_6562db8ca22f481bb2d1ef24af0`
        // );
        const res = await axios.get(
          `https://api.covalenthq.com/v1/1/block_v2/${startDate.toISOString()}/${stopDate.toISOString()}/?quote-currency=USD&format=JSON&page-size=25000&page-number=&key=ckey_6562db8ca22f481bb2d1ef24af0`
        );
        return res.data;
      });

      const blockHeightsRes = await Promise.all(blockHeightsPromises);
      const blockHeights = blockHeightsRes.map(
        (blockHeightObj) => blockHeightObj.data.items[0].height
      );
      // console.log(blockHeights);

      const historicalSupplyProm = blockHeights.map(async (height) => {
        const supplyPromise = await axios.get(
          `https://api.covalenthq.com/v1/1/tokens/${contract}/token_holders/?quote-currency=USD&format=JSON&page-size=1&block-height=${height}&key=ckey_6562db8ca22f481bb2d1ef24af0`
        );
        return supplyPromise.data;
      });

      const historicalSupply = await Promise.all(historicalSupplyProm);
      // console.log(dates);
      // console.log(historicalSupply);
      let contractDecimals;
      for (let i = 0; i < historicalSupply.length; i++) {
        if (historicalSupply[i].data.items[0]?.contract_decimals) {
          contractDecimals =
            historicalSupply[i].data.items[0].contract_decimals;
        }
        if (contractDecimals) {
          break;
        }
      }

      const finalSupply = historicalSupply.map((item) => {
        return item.data.items[0]?.total_supply ?? 0;
      });
      // console.log(finalSupply);
      // console.log('Historical supply', historicalSupply);

      const { contractTicker } = daoList.find(
        (el) => el.contractAddress === contract
      );

      const historicalPricesProm = await axios.get(
        `https://api.covalenthq.com/v1/pricing/historical/USD/${contractTicker}/?quote-currency=USD&format=JSON&from=${
          dates[0].toISOString().split('T')[0]
        }&to=${
          dates[dates.length - 1].toISOString().split('T')[0]
        }&prices-at-asc=true&key=ckey_6562db8ca22f481bb2d1ef24af0`
      );
      let historicalPrices = historicalPricesProm.data;
      historicalPrices = historicalPrices.data.prices;
      const finalPrices = [];
      for (let i = 0; i < dates.length; i++) {
        const priceOnDate = historicalPrices.find(
          (obj) => obj.date === new Date(dates[i]).toISOString().split('T')[0]
        );
        if (priceOnDate) {
          finalPrices.push(priceOnDate.price);
        } else {
          historicalSupply[i] = 0;
          finalPrices.push(0);
        }
      }
      // console.log('Historical prices', historicalPrices);
      // console.log(finalPrices);

      const treasuryOverTime = {};
      const treasuryDatesOrder = [];
      dates.forEach((date, ind) => {
        treasuryDatesOrder.push(date.toLocaleDateString('en-GB'));
        treasuryOverTime[`${date.toLocaleDateString('en-GB')}`] =
          finalPrices[ind] *
          parseFloat(BigInt(finalSupply[ind]) / BigInt(10 ** contractDecimals));
      });

      const treasuryObj = {
        treasuryOrder: treasuryDatesOrder,
        treasuryOverTime: treasuryOverTime,
      };
      const newDao = await DaoModel.setDaoTreasury(contract, treasuryObj);
      console.log(i, ' done');
    } catch (error) {
      console.log('Cron : Treasury over time error', error);
      continue;
    }
  }
  console.log('Cron : Treasury overtime completed successfully');
});

//getAllDaoProposalsAndVotes
const daoProposalAndVotesFunc = async (i) => {
  try {
    const { contractAddress: contract, snapshotId, contractName } = daoList[i];

    const proposals = await getProsalsReq({ contract, snapshotId });

    const proposalVotesPromise = proposals.map(async (proposal) => {
      // To calculate choices
      const choiceCounts = {};
      proposal.choices.forEach((el) => {
        choiceCounts[`${el}`] = 0;
      });

      proposal.dao_id = contract;

      let votes = await getVotesReq(proposal.id);
      // calculate votes counts
      votes.forEach((vote) => {
        if (choiceCounts.hasOwnProperty(proposal.choices[vote.choice - 1])) {
          choiceCounts[proposal.choices[vote.choice - 1]] += 1;
        }
      });

      proposal.voteCounts = choiceCounts;
      await DaoModel.updateProposal(proposal);
      // we need to run this after await updateProposal because we dont want to store allVotes array directly on each proposal object in database
      if (votes.length > 20) {
        votes = votes.slice(0, 20);
      }
      proposal.allVotes = votes;

      return await DaoModel.updateProposalVotes({ id: proposal.id, votes });
    });

    await Promise.all(proposalVotesPromise);
    console.log(`Contract ${contractName} has ${proposals.length} proposals`);
    console.log(`${i} completed`);
  } catch (error) {
    throw new Error(error);
  }
};

cron.schedule('*/15 * * * *', async () => {
  console.log('Running cron : getAllDaoProposalsAndVotes');
  for (let i = 0; i < daoList.length; i++) {
    try {
      // if (i % 3 == 0 && i !== 0) {
      if (i > 0) {
        const sleep = util.promisify(setTimeout);
        await sleep(1000 * 10);
      }
      // }
      await daoProposalAndVotesFunc(i);
    } catch (error) {
      console.log('Cron : Proposal and Votes over time error', error);
      continue;
    }
  }
  console.log('Cron : Get all Dao proposals completed successfully');
});

// getAllDaoDelegates
cron.schedule('*/15 * * * *', async () => {
  console.log('Running cron : getAllDaoDelegates');
  for (let i = 0; i < daoList.length; i++) {
    try {
      const dao = daoList[i];
      const delegates = await getDaoDelegatesReq(dao.snapshotId);
      await DaoModel.setDaoDelegates({ id: dao.contractAddress, delegates });
    } catch (error) {
      console.log('Cron : Proposal and Votes over time error', error);
      continue;
    }
  }
  console.log('Cron : Get all Dao delegates completed succesfully');
});
