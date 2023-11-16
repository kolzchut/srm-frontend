// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const devEnv: any = {
  production: false,
  cardsURL: 'https://srm-staging-api.whiletrue.industries/api/idx/search/cards',
  // pointsURL: 'https://srm-staging-api.whiletrue.industries/api/idx/search/points',
  // countCategoriesURL: 'https://srm-staging-api.whiletrue.industries/api/idx/search/count',
  // clusterDataURL: 'https://srm-staging.datacity.org.il/dataset/2902488f-da99-4836-9a90-1582958cfba4/resource/4c5ea1c5-af92-4930-914e-4c835ab25fb7/download/geo_data.geojson',
  placesURL: 'https://srm-staging-api.whiletrue.industries/api/idx/search/places',
  responsesURL: 'https://srm-staging-api.whiletrue.industries/api/idx/search/responses',
  situationsURL: 'https://srm-staging-api.whiletrue.industries/api/idx/search/situations',
  // orgsURL: 'https://srm-staging-api.whiletrue.industries/api/idx/search/orgs',
  autocompleteURL: 'https://srm-staging-api.whiletrue.industries/api/idx/search/autocomplete',
  presetsURL: 'https://srm-staging-api.whiletrue.industries/api/idx/search/presets',
  itemURL: 'https://srm-staging-api.whiletrue.industries/api/idx/get/',
  // taxonomySituationsURL: 'https://srm-staging.datacity.org.il/dataset/657a1b09-2474-4309-aac8-381d41e115d8/resource/7503fb96-380c-4e5c-a428-53c6105b083e/download/situations_actual.json',
  // taxonomyResponsesURL: 'https://srm-staging.datacity.org.il/dataset/71a7e998-4984-472a-9e96-66890bbef5f5/resource/7a8d9349-c8af-485e-981a-be9411fe8ba5/download/responses.json',
  suggestChangesForm: 'https://form.jotform.com/222203528302038',
  mapStyle: 'mapbox://styles/srm-kolzchut/ckzwhyzwr000t14mkynmw94zw/draft',
  gaTag: 'UA-16990732-9',
  sentry: false,

  externalUrl: 'http://localhost:4200',
  // gaTag: 'G-0FXK63SSNX',
  // gaTag: 'G-7ZHM371DDF',
  sitemapUrl: 'https://srm-staging.datacity.org.il/dataset/572c3ee3-8d50-4da8-99ea-88db35f1bdd4/resource/6b0a249e-3dd1-4051-a2af-eae27dd4e219/download/sitemap.xml',
};
Object.assign(devEnv, {
  clusterDataSourceURL: devEnv.clusterDataURL,
  taxonomySituationsSourceURL: devEnv.taxonomySituationsURL,
  taxonomyResponsesSourceURL: devEnv.taxonomyResponsesURL
});
