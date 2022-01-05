// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: true,
  servicesURL: 'https://srm-production-api.whiletrue.industries/api/idx/search/cards',
  pointsURL: 'https://srm-production-api.whiletrue.industries/api/idx/search/points',
  countCategoriesURL: 'https://srm-production-api.whiletrue.industries/api/idx/search/count',
  clusterDataURL: 'https://srm.datacity.org.il/dataset/0f51648d-b5dd-4981-88d1-c47023f14585/resource/0457d754-7acb-405f-ac36-37128e84c2ef/download/geo_data.geojson',
  placesURL: 'https://srm-production-api.whiletrue.industries/api/idx/search/places',
  responsesURL: 'https://srm-production-api.whiletrue.industries/api/idx/search/responses',
  presetsURL: 'https://srm-production-api.whiletrue.industries/api/idx/search/presets',
  itemURL: 'https://srm-production-api.whiletrue.industries/api/idx/get/',
  taxonomySituationsURL: 'https://srm.datacity.org.il/dataset/6f1a45c6-c855-43c8-8a3f-acaad318581c/resource/f705ef6e-182c-40a9-8305-a6fd17a3af24/download/situations.json',
  taxonomyResponsesURL: 'https://srm.datacity.org.il/dataset/812345ae-521e-4171-9a91-d66d0fcf03df/resource/8f77667c-fb75-48ff-a696-093321ee3bda/download/responses.json',
  suggestChangesForm: 'https://airtable.com/shriuBukhE2B2Loy8',
  mapStyle: 'mapbox://styles/srm-kolzchut/cksprr4sy0hbg18o5ct2ty2oc',
  gaTag: 'G-7ZHM371DDF',
  sitemapUrl: 'https://srm-staging.datacity.org.il/dataset/572c3ee3-8d50-4da8-99ea-88db35f1bdd4/resource/6b0a249e-3dd1-4051-a2af-eae27dd4e219/download/sitemap.xml',  // TODO: change to production
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
