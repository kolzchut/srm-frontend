import { AfterViewInit, Component, ElementRef, EventEmitter, OnInit, Output, ViewChild } from '@angular/core';
import { MapboxService } from '../mapbox.service';

import { ReplaySubject, Subject, timer } from 'rxjs';
import { throttleTime, filter } from 'rxjs/operators';
import { StateService, CenterZoomType } from '../state.service';
import { ALL_CATEGORIES, CATEGORY_COLORS } from '../colors';
import { Card, Point as SRMPoint } from '../_prev/common/datatypes';
import { Point } from 'geojson';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { SearchService } from '../search.service';
import { PlatformService } from '../platform.service';
import { LayoutService } from '../layout.service';
import { ApiService } from '../api.service';

// import * as mapboxgl from 'mapbox-gl';
declare var mapboxgl: any;
type MoveQueueItem = {
  action: (map: mapboxgl.Map) => void,
  description: string
};
@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.less']
})
export class MapComponent implements OnInit, AfterViewInit {

  STYLE = environment.mapStyle;

  @Output('points') points = new EventEmitter<SRMPoint | null>();
  @Output('hover') pointsHover = new EventEmitter<string | null>();
  @Output('map') newMap = new EventEmitter<MapComponent>();
  @ViewChild('map') mapEl: ElementRef;

  map: mapboxgl.Map;
  moveEvents = new Subject<CenterZoomType>();
  markers: any = {};
  markersOnScreen: any = {};
  clusterData = new ReplaySubject<any>(1);
  addedImages: {[key: string]: boolean} = {};
  pointFilter: any = {};

  moveQueue: MoveQueueItem[] = [];
  expectedMoves = new Set();

  ZOOM_THRESHOLD = 10;
  ALL_CATEGORIES = ALL_CATEGORIES; 

  constructor(private mapboxService: MapboxService, private state: StateService, 
              private http: HttpClient, private search: SearchService, private api: ApiService,
              private platform: PlatformService, private layout: LayoutService) {
    this.moveEvents.subscribe(centerZoom => {
      state.updateCenterZoom(centerZoom);
    });
    this.platform.browser(() => {
      this.http.get(environment.clusterDataURL).subscribe(data => {
        this.clusterData.next(data);
        this.clusterData.complete();
      });  
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

  ngAfterViewInit(): void {
      this.mapboxService.init.subscribe(() => {
        this.initialize();
      });
  }

  initialize() {
    let first = true;
    if (this.platform.browser() && this.mapEl && this.mapEl.nativeElement && this.mapboxService.init) {
      try {
        const mapParams: any = {
          container: this.mapEl.nativeElement,
          style: this.STYLE,
          minZoom: 3,
          attributionControl: false,
        
        };
        this.map = new mapboxgl.Map(mapParams);
        this.map.addControl(new mapboxgl.AttributionControl(), 'top-right');
        if (this.layout.desktop) {
          this.map.addControl(new mapboxgl.NavigationControl({showCompass: false}), 'top-left');
        }
        this.map.dragRotate.disable();
        this.map.touchZoomRotate.disableRotation();
        this.map.touchPitch.disable();
        // Handle filter changes and apply on map
        // Listen for changes in geo view
        this.state.geoChanges.pipe(
          throttleTime(500, undefined, {leading: true, trailing: true}),
        ).subscribe(state => {
          if (this.map) {
            const geo = state.geo;
            if (!!geo) {
              if (geo.length === 3) {
                console.log('CENTERING', geo);
                this.queueAction((map) => map.flyTo({
                    center: geo.slice(0, 2) as mapboxgl.LngLatLike,
                    zoom: geo[2],
                    animate: !first
                  }, {internal: !first, kind: 'centering'}
                ), 'internal-centering-' + geo);
              } else if (geo.length === 2) {
                console.log('FITTING BOUNDS', geo);
                this.queueAction(
                  (map) => map.fitBounds(geo as mapboxgl.LngLatBoundsLike, {},),
                  'fit-bounds-' + geo
                );
              }
            }
            first = false;
          }
        });    
        this.map.on('styleimagemissing', (e) => {
          const id: string = e.id;
          if (this.addedImages[id]) {
            return;
          }
          console.log('CREATING BG IMAGE for', id);
          this.addedImages[id] = true;
          this.map.addImage(id, {width: 0, height: 0, data: new Uint8Array()});
          const img: HTMLImageElement | null = this.createLabelBg(id);
          if (img) {
            console.log('CREATED BG IMAGE for', img);
            img.onload = () => {
              this.map.setLayoutProperty('labels-active', 'visibility', 'none');
              this.map.removeImage(id);
              const options: any = {
                content: [2, 0, 162, 48],
                stretchX: [[8, 156]],
                stretchY: [[8, 40]],
              };
              this.map.addImage(id, img, options);
              timer(0).subscribe(() => {
                this.map.setLayoutProperty('labels-active', 'visibility', 'visible');
              });
              console.log('ADDED BG IMAGE for', id);
            };
          }
        });
        this.map.on('load', () => {
          console.log('MAP LOADED', environment.production);
          if (!environment.production) {
            for (const layer of ['labels-active', 'labels-off', 'points-on', 'points-off', 'points-stroke-on']) {
              this.setStagingLayerSource(this.map, layer);
            }
          }
          const colorStyle = [
            "match",
            [
              "get",
              "response_category"
            ],
          ];
          CATEGORY_COLORS.forEach(cc => {
            colorStyle.push([cc.category]);
            colorStyle.push(cc.color);
          });
          colorStyle.push('#444444');
          this.map.setPaintProperty('points-on', 'circle-color', colorStyle);
          this.map.setPaintProperty('points-stroke-on', 'circle-stroke-color', colorStyle);

          this.clusterData.subscribe(data => {
            const clusterProperties: any = {};
            CATEGORY_COLORS.forEach(cc => {
              clusterProperties[cc.category] = ['+', ['case', ['in', cc.category, ['get', 'response_categories']], 1, 0]];
            });
            this.map.addSource('cluster_source', {
              'type': 'geojson',
              'data': environment.clusterDataURL,
              'cluster': true,
              'clusterRadius': 80,
              'clusterProperties': clusterProperties,
              'clusterMinPoints': 0,
              'maxzoom': this.ZOOM_THRESHOLD,
            });
            this.map.addLayer({
              'id': 'clusters',
              'type': 'circle',
              'source': 'cluster_source',
              // 'filter': ['==', 'cluster', true],
              'paint': {
                'circle-color': '#000000',
                'circle-opacity': 0,
                'circle-radius': 12
              },
              maxzoom: 10
            });            
            this.map.on('render', () => {
              if (!this.map.isSourceLoaded('cluster_source')) return;
              const newMarkers: any = {};
              const features = this.map.querySourceFeatures('cluster_source');
              // for every cluster on the screen, create an HTML marker for it (if we didn't yet),
              // and add it to the map if it's not there already
              for (const feature_ of features) {
                const feature = JSON.parse(JSON.stringify(feature_));
                const coords = (feature.geometry as Point).coordinates as mapboxgl.LngLatLike;
                const props: any = feature.properties;
                // if (!props.cluster) {
                //   continue;
                // }
                const id = props.cluster_id;
                
                let marker = this.markers[id];
                if (!marker) {
                  const el = this.createDonutChart(props);
                  marker = this.markers[id] = new mapboxgl.Marker({
                    element: el
                  }).setLngLat(coords);
                }
                newMarkers[id] = marker;
                if (!this.markersOnScreen[id]) marker.addTo(this.map);
              }
              // for every marker we've added previously, remove those that are no longer visible
              for (const id in this.markersOnScreen) {
                if (!newMarkers[id]) this.markersOnScreen[id].remove();
              }
              this.markersOnScreen = newMarkers;            
            });
            this.map.on('click', 'clusters', (e: mapboxgl.MapLayerMouseEvent) => {
              if (e.features && e.features.length > 0) {
                const geometry: Point = e.features[0].geometry as Point;
                const center = new mapboxgl.LngLat(geometry.coordinates[0], geometry.coordinates[1]);
                this.queueAction((map) => map.flyTo({
                    center: center,
                    zoom: 10.5
                  }
                ), 'cluster-click-' + center);
              }
            });
            this.point_ids.subscribe(ids => {
              if (ids?.length > 1) {
                this.pointFilter.searchPoints = ['in', ['get', 'point_id'], ['literal', [...ids]]];
                for (const layer of ['points-on', 'points-stroke-on']) {
                  this.map.setFilter(layer, this.pointFilter.searchPoints);
                }  
              } else if (ids?.length === 1) {
              } else {}
                this.pointFilter.searchPoints = null;
                for (const layer of ['points-on', 'points-stroke-on']) {
                  this.map.setFilter(layer, null);
                }
              }
              this.setLabelsOffFilter();
            });
            this.search.card_ids.subscribe(ids => {
              this.clusterData.subscribe(data => {
                let features: any[] = data.features;
                let newData: GeoJSON.FeatureCollection = data;
                if (ids) {
                  newData = {
                    type: 'FeatureCollection',
                    features: features.filter(f => ids.has(f.properties.card_id))
                  };
                  console.log('SET NEW DATA for SOURCE', newData.features.length, features[0].properties);
                }
                (this.map.getSource('cluster_source') as mapboxgl.GeoJSONSource).setData(newData);
              });

            });
            this.newMap.next(this);
          });

          this.map.getStyle().layers?.filter((l) => ['points-stroke-on', 'labels-off'].indexOf(l.id) >= 0).forEach((layer) => {
            const layerName = layer.id;
            this.map.on('click', layerName, (e: mapboxgl.MapLayerMouseEvent) => {
              if (e.features && e.features.length > 0) {
                const props: any = e.features[0].properties;
                props.records = JSON.parse(props.records) as Card[];
                this.points.next(props as SRMPoint);
              }
              e.preventDefault();
            });
            this.map.on('mouseenter', layerName, (e: mapboxgl.MapLayerMouseEvent) => {
              if (e.features && e.features.length > 0) {
                const props: any = e.features[0].properties;
                this.pointsHover.next(props.point_id || null);
              }
              this.map.getCanvas().style.cursor = 'pointer';
            });
            this.map.on('mouseout', layerName, (e: mapboxgl.MapLayerMouseEvent) => {
              this.pointsHover.next(null);
              this.map.getCanvas().style.cursor = '';
            });
          });
          this.map.on('click', (e: mapboxgl.MapLayerMouseEvent) => {
            if (!e.defaultPrevented) {
              this.points.next(null);
            }
          });
          this.map.on('moveend', (event: DragEvent) => {
            const internal = (event as any).internal;
            if (!internal) {
              this.state.latestBounds = this.map?.getBounds();
              let geo: CenterZoomType = [this.map.getCenter().lng, this.map.getCenter().lat, this.map.getZoom()];
              geo = geo.map((x) => this.api.coord(x)) as CenterZoomType;
              this.expectedMoves.add('internal-centering-' + geo);
              // console.log('ACTION-INT', 'internal-centering-' + geo);
              this.moveEvents.next(geo);
            }
            if (this.moveQueue.length > 0) {
              const {action, description} = this.moveQueue.shift() as MoveQueueItem;
              if (!!action) {
                // console.log('ACTION-QQ', description);
                action(this.map);  
              }
            }
          });    
          this.state.latestBounds = this.map.getBounds();
          this.search.init();
          this.moveEvents.next([this.map.getCenter().lng, this.map.getCenter().lat, this.map.getZoom()]);
        });
      } catch (e) {
        console.log('FAILED TO LOAD', e)
      }
    }
  }

  setStagingLayerSource(map: mapboxgl.Map, layerId: string) {
    const oldLayers = map.getStyle().layers || [];
    const layerIndex = oldLayers.findIndex(l => l.id === layerId);
    const layerDef: any = oldLayers[layerIndex];
    const before = oldLayers[layerIndex + 1] && oldLayers[layerIndex + 1].id;
    layerDef['source-layer'] = 'geo_data_staging';
    map.removeLayer(layerId);
    map.addLayer(layerDef, before);
  }

  createLabelBg(id: string): HTMLImageElement | null {
    for (const cc of ALL_CATEGORIES) {
      if (id === 'tooltip-rc-' + cc.category) {
        const img = new Image(164, 48);
        img.src = this.tooltipImg(cc.color);
        return img;
      }
    }
    return null;
  }

  createDonutChart(props: any): HTMLElement {
    const offsets = [];
    const counts = [];
    const clusterColors = CATEGORY_COLORS.map(cc => cc.color);

    if (!props.point_count) {
      const cat = JSON.parse(props.response_categories)[0];
      counts.push(...CATEGORY_COLORS.map(cc => cc.category === cat ? 1 : 0));
    } else {
      counts.push(...CATEGORY_COLORS.map(cc => props[cc.category]));
    }
    let total = 0;
    for (const count of counts) {
      offsets.push(total);
      total += count;
    }
    const fontSize = 16;
    const r = 39;
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
      ${props.point_count?.toLocaleString() || 1}
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

  queueAction(action: (map: mapboxgl.Map) => void, description: string) {
    if (this.expectedMoves.has(description)) {
      // console.log('ACTION-SKIP', description);
      this.expectedMoves.delete(description);
      return;
    }
    if (this.moveQueue.length === 0 && !this.map.isMoving()) {
      // console.log('ACTION-IMM', description);
      action(this.map);
    } else {
      this.moveQueue.push({action, description});
    }
  }

  setLabelsOffFilter() {
    const terms = [];
    if (this.pointFilter.externalLabelsOff) {
      terms.push(this.pointFilter.externalLabelsOff);
    }
    if (this.pointFilter.searchPoints) {
      terms.push(this.pointFilter.searchPoints);
    }
    const filter = ['all', ...terms];
    this.map.setFilter('labels-off', filter);
  }

  set labelsOffFilter(value: any[]) {
    this.pointFilter.externalLabelsOff = value;
    this.setLabelsOffFilter();
  }
}
