import { devEnv } from './development-env';

export const environment = Object.assign({}, devEnv, {
    isHideGtagLog: false,
    // clusterDataURL: '/clusters.json',
    // taxonomySituationsURL: '/situations.json',
    // taxonomyResponsesURL: '/responses.json'
    externalUrl: 'https://srm-staging.whiletrue.industries',
});
  