// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  servicesURL: 'https://srm-staging-api.whiletrue.industries/api/idx/search/cards',
  pointsURL: 'https://srm-staging-api.whiletrue.industries/api/idx/search/points',
  countCategoriesURL: 'https://srm-staging-api.whiletrue.industries/api/idx/search/count',
  clusterDataURL: 'https://srm-staging.datacity.org.il/dataset/2902488f-da99-4836-9a90-1582958cfba4/resource/4c5ea1c5-af92-4930-914e-4c835ab25fb7/download/geo_data.geojson',
  placesURL: 'https://srm-staging-api.whiletrue.industries/api/idx/search/places',
  responsesURL: 'https://srm-staging-api.whiletrue.industries/api/idx/search/responses',
  presetsURL: 'https://srm-staging-api.whiletrue.industries/api/idx/search/presets',
  itemURL: 'https://srm-staging-api.whiletrue.industries/api/idx/get/',
  taxonomySituationsURL: 'https://srm-staging.datacity.org.il/dataset/657a1b09-2474-4309-aac8-381d41e115d8/resource/e80f6ce0-fdf8-42ef-a134-13014b228cdd/download/situations.json',
  taxonomyResponsesURL: 'https://srm-staging.datacity.org.il/dataset/71a7e998-4984-472a-9e96-66890bbef5f5/resource/7a8d9349-c8af-485e-981a-be9411fe8ba5/download/responses.json',
  suggestChangesForm: 'https://airtable.com/shrV3pmEN3ctycWVN',
  mapStyle: 'mapbox://styles/srm-kolzchut/cksprr4sy0hbg18o5ct2ty2oc/draft',
  gaTag: 'G-7ZHM371DDF',
  sitemapUrl: 'https://srm-staging.datacity.org.il/dataset/572c3ee3-8d50-4da8-99ea-88db35f1bdd4/resource/6b0a249e-3dd1-4051-a2af-eae27dd4e219/download/sitemap.xml',
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
