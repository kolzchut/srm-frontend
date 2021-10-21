import { AfterViewInit, Component, ElementRef, EventEmitter, OnInit, Output, ViewChild } from '@angular/core';
import { MapboxService } from '../mapbox.service';

import * as mapboxgl from 'mapbox-gl';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { StateService } from '../state.service';
import { ALL_CATEGORIES, CATEGORY_COLORS } from '../common/consts';
import { DomSanitizer } from '@angular/platform-browser';
import { Card } from '../common/datatypes';
import { Point } from 'geojson';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.less']
})
export class MapComponent implements OnInit, AfterViewInit {

  STYLE = 'mapbox://styles/srm-kolzchut/cksprr4sy0hbg18o5ct2ty2oc/draft';

  @Output('points') points = new EventEmitter<Card[]>();
  @Output('map') newMap = new EventEmitter<mapboxgl.Map>();
  @ViewChild('map') mapEl: ElementRef;

  map: mapboxgl.Map;
  moveEvents = new Subject<[number, number, number]>();
  
  ZOOM_THRESHOLD = 10;
  OFFSETS = [
    [[0.0, 0.0]],
    [[0.0, -0.5], [0.0, 0.5]],
    [[0.0, -0.577], [0.5, 0.289], [-0.5, 0.289]], 
    [[0.0, -0.707], [0.707, -0.0], [0.0, 0.707], [-0.707, 0.0]], 
    // [[0.0, -0.851], [0.809, -0.263], [0.5, 0.688], [-0.5, 0.688], [-0.809, -0.263]],
    // [[0.0, -1.0], [0.866, -0.5], [0.866, 0.5], [0.0, 1.0], [-0.866, 0.5], [-0.866, -0.5]],
    // [[0.0, 0.0], [0.0, -1.0], [0.866, -0.5], [0.866, 0.5], [0.0, 1.0], [-0.866, 0.5], [-0.866, -0.5]]
];
  ALL_CATEGORIES = ALL_CATEGORIES; 

  constructor(private mapboxService: MapboxService, private state: StateService, private sanitizer: DomSanitizer) {
    this.moveEvents.subscribe(centerZoom => {
      state.updateCenterZoom(centerZoom, true);
    });
  }

  ngOnInit(): void {
  }

  tooltipImg(color: string) {
    const svg = `<svg width="82" height="24" viewBox="0 0 82 24" fill="blue" xmlns="http://www.w3.org/2000/svg">
      <path d="M0 4C0 1.79086 1.79086 0 4 0H78C80.2091 0 82 1.79086 82 4V20C82 22.2091 80.2091 24 78 24H4C1.79086 24 0 22.2091 0 20V4Z" fill="${color}"/>
    </svg>`;
    return 'data:image/svg+xml;base64,' + btoa(svg);
  }

  ngAfterViewInit() {
    if (this.mapEl && this.mapEl.nativeElement && this.mapboxService.init) {
      try {
        const mapParams: any = {
          container: this.mapEl.nativeElement,
          style: this.STYLE,
          minZoom: 3,
        };
        this.map = new mapboxgl.Map(mapParams);
        this.state.geoChanges.pipe(
          debounceTime(500),
        ).subscribe(state => {
          if (this.map) {
            const geo = state.geo;
            if (geo) {
              if (geo.length === 3) {
                console.log('CENTERING', geo);
                this.map.flyTo({
                  center: geo.slice(0, 2) as mapboxgl.LngLatLike,
                  zoom: geo[2],
                  padding: {top: 0, left: 0, right: 0, bottom: 500}
                });
              } else if (geo.length === 2) {
                console.log('FITTING BOUNDS', geo);
                this.map.fitBounds(geo as mapboxgl.LngLatBoundsLike, {}, {fromState: true});  
              }
            }
          }
        });    
        this.map.on('styleimagemissing', (e) => {
          const id: string = e.id;
          const img: HTMLImageElement | null = this.createLabelBg(id);
          if (img) {
            img.onload = () => this.map.addImage(id, img);
          }
        });
        this.map.on('load', () => {
          // for (const layerName of ['points-on', 'points-stroke-on']) {
          //   const layer = this.map.getStyle().layers?.filter((l) => l.id === layerName)[0] as mapboxgl.CircleLayer;
          //   for (const countList of this.OFFSETS) {
          //     const count = countList.length;
          //     for (const offsetIdx_ in countList) {
          //       const offsetIdx = parseInt(offsetIdx_);
          //       const offset = countList[offsetIdx];
          //       const radius = 6;
          //       const modifiedOffset = [offset[0] * radius, offset[1] * radius];
          //       const offsetLayerName = `${layerName}-${count}-${offsetIdx+1}`;
          //       const newLayer: any = {
          //         id: offsetLayerName, 
          //         type: layer.type,
          //         source: layer.source,
          //         'source-layer': layer['source-layer'],
          //         layout: layer.layout || {},
          //         paint: Object.assign(layer.paint, {'circle-translate': modifiedOffset}),
          //         filter: ['==', ['get', 'offset'], `${count}-${offsetIdx+1}`]
          //       };
          //       console.log('SS', newLayer.source, newLayer['source-layer']);
          //       this.map.addLayer(newLayer, layerName);
          //     }
          //   }
          //   this.map.setLayoutProperty(layerName, 'visibility', 'none');
          // }
          const clusterProperties: any = {};
          CATEGORY_COLORS.forEach(cc => {
            clusterProperties[cc.category] = ['+', ['case', ['==', ['get', 'response_category'], cc.category], 1, 0]];
          });
          clusterProperties.care = ['+', 1];
          this.map.addSource('clustee', {
            'type': 'geojson',
            'data': environment.clusterDataURL,
            'cluster': true,
            'clusterRadius': 50,
            'clusterProperties': clusterProperties,
            'maxzoom': this.ZOOM_THRESHOLD,
          });
          this.map.addLayer({
            'id': 'clustee_dummy',
            'type': 'circle',
            'source': 'clustee',
            'filter': ['==', 'cluster', true],
            'paint': {
              'circle-color': '#000000',
              'circle-opacity': 0,
              'circle-radius': 12
            },
            // maxzoom: 10
          });
          const markers: any= {};
          let markersOnScreen: any = {};
          this.map.on('render', () => {
            if (!this.map.isSourceLoaded('clustee')) return;
            const newMarkers: any = {};
            const features = this.map.querySourceFeatures('clustee');
            // for every cluster on the screen, create an HTML marker for it (if we didn't yet),
            // and add it to the map if it's not there already
            for (const feature of features) {
              const coords = (feature.geometry as Point).coordinates as mapboxgl.LngLatLike;
              const props: any = feature.properties;
              if (!props.cluster) continue;
              const id = props.cluster_id;
              
              let marker = markers[id];
              if (!marker) {
                const el = this.createDonutChart(props);
                marker = markers[id] = new mapboxgl.Marker({
                  element: el
                }).setLngLat(coords);
              }
              newMarkers[id] = marker;
              if (!markersOnScreen[id]) marker.addTo(this.map);
            }
            // for every marker we've added previously, remove those that are no longer visible
            for (const id in markersOnScreen) {
              if (!newMarkers[id]) markersOnScreen[id].remove();
            }
            markersOnScreen = newMarkers;            
          });

          this.map.getStyle().layers?.filter((l) => l.id.indexOf('points-stroke-on') === 0).forEach((layer) => {
            const layerName = layer.id;
            this.map.on('click', layerName, (e: mapboxgl.MapLayerMouseEvent) => {
              if (e.features && e.features.length > 0) {
                const props: any = e.features[0].properties;
                // console.log('SELECTED', props);
                const records = JSON.parse(props.records) as Card[];
                this.points.next(records);
              }
            });
          });
          this.newMap.next(this.map);
          this.map.on('moveend', (event: DragEvent) => {
            const fromState = (event as any).fromState;
            console.log('MOVED', this.map?.getBounds(), fromState);
            if (!fromState) {
              this.moveEvents.next([this.map.getCenter().lng, this.map.getCenter().lat, this.map.getZoom()]);
            }
          });  
        });
        // this.state.bounds = this.map.getBounds();
      } catch (e) {
        console.log('FAILED TO LOAD', e)
      }
    }
  }

  createLabelBg(id: string): HTMLImageElement | null {
    for (const cc of ALL_CATEGORIES) {
      if (id === 'tooltip-rc-' + cc.category) {
        const img = new Image(82, 24);
        img.src = this.tooltipImg(cc.color);
        return img;
      }
    }
    return null;
  }

  createDonutChart(props: any): HTMLElement {
    const offsets = [];
    const counts = CATEGORY_COLORS.map(cc => props[cc.category]);
    const clusterColors = CATEGORY_COLORS.map(cc => cc.color);

    let total = 0;
    for (const count of counts) {
      offsets.push(total);
      total += count;
    }
    const fontSize = 16;
    const r = 24;
    const r0 = Math.round(r * 0.6);
    const w = r * 2;
     
    let html = `<div>
    <svg width="${w}" height="${w}" viewbox="0 0 ${w} ${w}" text-anchor="middle" style="font: ${fontSize}px sans-serif; display: block">`;
     
    for (let i = 0; i < counts.length; i++) {
      if (counts[i]) {
        html += this.donutSegment(
          offsets[i] / total,
          (offsets[i] + counts[i]) / total,
          r,
          r0,
          clusterColors[i]
        );  
      }
    }
    html += `<circle cx="${r}" cy="${r}" r="${r0}" fill="white" />
      <text dominant-baseline="central" x="${r}" y="${r}">
      ${total.toLocaleString()}
      </text>
      </svg>
      </div>`;
     
    const el = document.createElement('div');
    el.innerHTML = html;
    return el.firstChild as HTMLElement;
  }

  donutSegment(start: number, end: number, r: number, r0: number, color: string) {
    if (end - start === 1) end -= 0.00001;
    const a0 = 2 * Math.PI * (start - 0.25);
    const a1 = 2 * Math.PI * (end - 0.25);
    const x0 = Math.cos(a0),
    y0 = Math.sin(a0);
    const x1 = Math.cos(a1),
    y1 = Math.sin(a1);
    const largeArc = end - start > 0.5 ? 1 : 0;
     
    // draw an SVG path
    return `<path d="M ${r + r0 * x0} ${r + r0 * y0} L ${r + r * x0} ${
      r + r * y0
      } A ${r} ${r} 0 ${largeArc} 1 ${r + r * x1} ${r + r * y1} L ${
      r + r0 * x1
      } ${r + r0 * y1} A ${r0} ${r0} 0 ${largeArc} 0 ${r + r0 * x0} ${
      r + r0 * y0
      }" fill="${color}" />`;
  }
}
