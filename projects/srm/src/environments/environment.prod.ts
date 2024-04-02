// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: true,
  cardsURL: 'https://api.kolsherut.org.il/api/idx/search/cards',
  // pointsURL: 'https://api.kolsherut.org.il/api/idx/search/points',
  // countCategoriesURL: 'https://api.kolsherut.org.il/api/idx/search/count',
  // clusterDataSourceURL: 'https://srm.datacity.org.il/dataset/0f51648d-b5dd-4981-88d1-c47023f14585/resource/0457d754-7acb-405f-ac36-37128e84c2ef/download/geo_data.geojson',
  // clusterDataURL: '/clusters.json',
  placesURL: 'https://api.kolsherut.org.il/api/idx/search/places',
  responsesURL: 'https://api.kolsherut.org.il/api/idx/search/responses',
  situationsURL: 'https://api.kolsherut.org.il/api/idx/search/situations',
  // orgsURL: 'https://api.kolsherut.org.il/api/idx/search/orgs',
  autocompleteURL: 'https://api.kolsherut.org.il/api/idx/search/autocomplete',
  presetsURL: 'https://api.kolsherut.org.il/api/idx/search/presets',
  itemURL: 'https://api.kolsherut.org.il/api/idx/get/',
  // taxonomySituationsSourceURL: 'https://srm.datacity.org.il/dataset/6f1a45c6-c855-43c8-8a3f-acaad318581c/resource/ddafbcee-e35f-4db3-b07d-2acc4e9b65aa/download/situations_actual.json',
  // taxonomySituationsURL: '/situations.json',
  // taxonomyResponsesSourceURL: 'https://srm.datacity.org.il/dataset/812345ae-521e-4171-9a91-d66d0fcf03df/resource/8f77667c-fb75-48ff-a696-093321ee3bda/download/responses.json',
  // taxonomyResponsesURL: '/responses.json',
  suggestChangesForm: 'https://form.jotform.com/222203528302038',
  mapStyle: 'mapbox://styles/srm-kolzchut/ckzwhyzwr000t14mkynmw94zw',
  gaTag: 'GTM-N6QJLRL',
  sentry: true,

  externalUrl: 'https://www.kolsherut.org.il',
  // gaTag: 'G-0FXK63SSNX',
  // gaTag: 'G-7ZHM371DDF',
  sitemapUrl:  'https://srm.datacity.org.il/dataset/6fbf9571-b66e-4264-a4e6-605539517b22/resource/84a08676-b695-429f-a487-f9084b0b4888/download/sitemap.xml',
  sitemapUrl1: 'https://srm.datacity.org.il/dataset/6fbf9571-b66e-4264-a4e6-605539517b22/resource/2fdf48e0-310a-4aa9-8278-7a76bcc8c6c0/download/sitemap_1.xml',
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
