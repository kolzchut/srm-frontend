import { devEnv } from './development-env';

export const environment = Object.assign({}, devEnv, {
    clusterDataURL: '/clusters.json',
    taxonomySituationsURL: '/situations.json',
    taxonomyResponsesURL: '/responses.json'
});
  