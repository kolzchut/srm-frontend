import { Injectable } from '@angular/core';
import { ReplaySubject } from 'rxjs';
import { PlatformService } from './platform.service';

// import * as mapboxgl from 'mapbox-gl';
declare var mapboxgl: any;
@Injectable({
  providedIn: 'root'
})
export class MapboxService {

  ACCESS_TOKEN = 'pk.eyJ1Ijoic3JtLWtvbHpjaHV0IiwiYSI6ImNrcnhza3c5ZjBhd3Eydm1za3BvNjNxbzUifQ.dTyD9BD5jAsxZ2nUzSo-yw';
  public init = new ReplaySubject<void>(1);

  constructor(private platform: PlatformService) {
    this.platform.browser(() => {
      this.loadScript().then(() => {
        (mapboxgl.accessToken as any) = this.ACCESS_TOKEN;
        mapboxgl.setRTLTextPlugin(
          'https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-rtl-text/v0.2.3/mapbox-gl-rtl-text.js',
          (error: any) => {
            console.log('FAILED TO LOAD PLUGIN', error);
          },
          true // Lazy load the plugin
        );  
        this.init.next();
      });
    });
  } 

  loadScript() {
    return new Promise((resolve, reject) => {
      const scriptTag = document.createElement('script');
      scriptTag.src = 'https://api.mapbox.com/mapbox-gl-js/v2.6.0/mapbox-gl.js';
      scriptTag.onload = resolve;
      scriptTag.async = true;
      (scriptTag as any).onreadystatechange = resolve;
      document.body.appendChild(scriptTag);
    });
  }
}
