const { request, GraphQLClient, gql } = require('graphql-request');
const snapshotClient = new GraphQLClient(
  'https://api.thegraph.com/subgraphs/name/snapshot-labs/snapshot'
);
// const client = new GraphQLClient(
//   'https://gateway.thegraph.com/api/961b1b64179b09fe632fe19bfad84bb5/subgraphs/id/3Q4vnuSqemXnSNHoiLD7wdBbGCXszUYnUbTz191kDMNn'
// );

// --------------------------------------------------
// ----------Snapshot subgraph requests --------------
// ---------------------------------------------------

exports.getDaoDelegatesReq = async (snapshotID) => {
  const variables = {
    first: 1000,
    space: `${snapshotID}`,
  };
  const query = gql`
    query Delegations($first: Int!, $space: String!) {
      delegations(first: $first, skip: 0, where: { space: $space }) {
        id
        delegator
        space
        delegate
        timestamp
      }
    }
  `;

  const { delegations } = await snapshotClient.request(query, variables);

  return delegations;
};

const client = new GraphQLClient('https://hub.snapshot.org/graphql');

exports.getProsalsReq = async (contractObj) => {
  const variables = {
    first: 500,
    skip: 0,
    state: 'all',
    space: `${contractObj.snapshotId}`,
  };

  const query = gql`
    query Proposals(
      $first: Int!
      $skip: Int!
      $state: String!
      $space: String!
      $space_in: [String]
    ) {
      proposals(
        first: $first
        skip: $skip
        where: { space: $space, state: $state, space_in: $space_in }
      ) {
        id
        title
        body
        start
        end
        state
        author
        created
        choices
        votes
      }
    }
  `;

  const { proposals } = await client.request(query, variables);

  return proposals;
};

exports.getVotesReq = async (proposal) => {
  const variables = {
    first: 5000,
    id: `${proposal}`,
    orderBy: 'vp',
    orderDirection: 'desc',
  };

  const query = gql`
    query Votes(
      $id: String!
      $first: Int
      $skip: Int
      $orderBy: String
      $orderDirection: OrderDirection
      $voter: String
    ) {
      votes(
        first: $first
        skip: $skip
        where: { proposal: $id, vp_gt: 0, voter: $voter }
        orderBy: $orderBy
        orderDirection: $orderDirection
      ) {
        id
        voter
        created
        choice
        vp
      }
    }
  `;

  const { votes } = await client.request(query, variables);

  return votes;
};
