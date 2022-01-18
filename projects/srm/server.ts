/***************************************************************************************************
 * Load `$localize` onto the global scope - used if i18n tags appear in Angular templates.
 */
import '@angular/localize/init';
import 'zone.js/dist/zone-node';

import { ngExpressEngine } from '@nguniversal/express-engine';
import * as express from 'express';
import { join } from 'path';

import { AppServerModule } from './src/main.server';
import { APP_BASE_HREF } from '@angular/common';
import { existsSync } from 'fs';

import { environment  } from './src/environments/environment';
import fetch from 'node-fetch';
import * as NodeCache from 'node-cache';
import * as compression from 'compression';

// The Express app is exported so that it can be used by serverless Functions.
export function app(): express.Express {
  const server = express();
  const distFolder = join(process.cwd(), 'dist/srm/browser');
  const indexHtml = existsSync(join(distFolder, 'index.original.html')) ? 'index.original.html' : 'index';
  const cache = new NodeCache({ stdTTL: 3600 });

  server.use(compression());

  // Our Universal express-engine (found @ https://github.com/angular/universal/tree/master/modules/express-engine)
  server.engine('html', ngExpressEngine({
    bootstrap: AppServerModule,
  }));

  server.set('view engine', 'html');
  server.set('views', distFolder);

  // Serve static files from /browser
  server.get('*.*', express.static(distFolder, {
    maxAge: '1y'
  }));

  server.get('/sitemap.xml', (req, res) => {
    fetch(environment.sitemapUrl)
      .then(sm => sm.body?.pipe(
        res.contentType('application/xml')
      )
    )
  });

  for (const [path, url] of [
    ['/clusters.json', environment.clusterDataSourceURL],
    ['/situations.json', environment.taxonomySituationsSourceURL],
    ['/responses.json', environment.taxonomyResponsesSourceURL],
  ]) {
    server.get(path, (req, res) => {
      if (cache.has(path)) {
        res.status(200).json(cache.get(path));
      } else {
        fetch(url)
          .then(sm => sm.json())
          .then((json) => {
            cache.set(path, json);
            res.status(200).json(json);
          });
      }
    });
  }

  // All regular routes use the Universal engine
  server.get('*', (req, res) => {
    res.render(indexHtml, {
      req, providers: [
        { provide: APP_BASE_HREF, useValue: req.baseUrl }
      ]
    });
  });

  return server;
}

function run(): void {
  const port = process.env.PORT || 4000;

  // Start up the Node server
  const server = app();
  server.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

// Webpack will replace 'require' with '__webpack_require__'
// '__non_webpack_require__' is a proxy to Node 'require'
// The below code is to ensure that the server is run only when not requiring the bundle.
declare const __non_webpack_require__: NodeRequire;
const mainModule = __non_webpack_require__.main;
const moduleFilename = mainModule && mainModule.filename || '';
if (moduleFilename === __filename || moduleFilename.includes('iisnode')) {
  run();
}

export * from './src/main.server';
