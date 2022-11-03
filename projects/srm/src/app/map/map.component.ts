import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output, ViewChild } from '@angular/core';
import { MapboxService } from '../mapbox.service';

import { from, ReplaySubject, Subject, timer } from 'rxjs';
import { throttleTime, filter, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { StateService, CenterZoomType, GeoType, BoundsType } from '../state.service';
import { ALL_CATEGORIES, CATEGORY_COLORS } from '../_prev/common/consts';
import { Card, Point as SRMPoint, SearchParams } from '../consts';
import { environment } from '../../environments/environment';
import { PlatformService } from '../platform.service';
import { LayoutService } from '../layout.service';

import * as mapboxgl from 'mapbox-gl';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ApiService } from '../api.service';
import { Router } from '@angular/router';
// declare var mapboxgl: any;

type MoveQueueItem = {
  action: (map: mapboxgl.Map) => void,
  description: string
};
@UntilDestroy()
@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.less']
})
export class MapComponent implements OnChanges, AfterViewInit {

  STYLE = environment.mapStyle;

  @Input() searchParams: SearchParams | null;
  @Input() pointId: string;
  @Input() cardId: string;
  // @Output('points') points = new EventEmitter<SRMPoint | null>();
  // @Output('hover') pointsHover = new EventEmitter<string | null>();
  @Output('map') newMap = new EventEmitter<MapComponent>();
  @ViewChild('map') mapEl: ElementRef;

  map: mapboxgl.Map;
  addedImages: {[key: string]: boolean} = {};

  moveQueue: MoveQueueItem[] = [];
  geoChanges = new Subject<GeoType>();
  searchParamsQueue = new ReplaySubject<SearchParams>(1);
  bounds: mapboxgl.LngLatBounds;

  ZOOM_THRESHOLD = 10;
  ALL_CATEGORIES = ALL_CATEGORIES; 
  
  constructor(private mapboxService: MapboxService, 
              private api: ApiService,
              private platform: PlatformService,
              private layout: LayoutService,
              private router: Router
             ) {
      
  }

  ngOnChanges(): void {
    console.log('MAP CHANGES', this.cardId, this.pointId, this.searchParams);
    if (!this.map) {
      return;
    }
    if (this.pointId) {
      this.processPointIds([this.pointId]);
    } else if (this.cardId) {
      this.api.getCard(this.cardId).subscribe(card => {
        this.processPointIds([card.point_id]);
      });
    } else if (this.searchParams) {
      this.searchParamsQueue.next(this.searchParams);
    }
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
    console.log('INIT MAP');
    let first = true;
    if (this.platform.browser() && this.mapEl && this.mapEl.nativeElement) {
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
        this.geoChanges.pipe(
          untilDestroyed(this),
          throttleTime(500, undefined, {leading: true, trailing: true}),
        ).subscribe(geo => {
          if (this.map) {
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

          this.map.getStyle().layers?.filter((l) => ['points-stroke-on', 'labels-off'].indexOf(l.id) >= 0).forEach((layer) => {
            const layerName = layer.id;
            this.map.on('click', layerName, (e: mapboxgl.MapLayerMouseEvent) => {
              if (e.features && e.features.length > 0) {
                const props: any = e.features[0].properties;
                // console.log('CLICKED', props);
                props.records = JSON.parse(props.records) as Card[];
                this.router.navigate(['/p', props.point_id]);
                // this.points.next(props as SRMPoint);
              }
              e.preventDefault();
            });
            //TODO: Hover
            // this.map.on('mouseenter', layerName, (e: mapboxgl.MapLayerMouseEvent) => {
            //   if (e.features && e.features.length > 0) {
            //     const props: any = e.features[0].properties;
            //     this.pointsHover.next(props.point_id || null);
            //   }
            //   this.map.getCanvas().style.cursor = 'pointer';
            // });
            // this.map.on('mouseout', layerName, (e: mapboxgl.MapLayerMouseEvent) => {
            //   this.pointsHover.next(null);
            //   this.map.getCanvas().style.cursor = '';
            // });
          });
          this.searchParamsQueue.pipe(
            untilDestroyed(this),
            switchMap((params) => {
              if (params) {
                return this.api.getPoints(params, this.bounds);
              } else {
                return from([[]]);
              }
            }),
          ).subscribe(ids => {
            this.processPointIds(ids);
          });        
          // this.map.on('click', (e: mapboxgl.MapLayerMouseEvent) => {
          //   if (!e.defaultPrevented) {
          //     this.points.next(null);
          //   }
          // });
          this.map.on('moveend', (event: mapboxgl.MapboxEvent<MouseEvent>) => {
            this.bounds = this.map.getBounds();
            if (!(event as any).ignore) {
              this.setCenter(this.map.getCenter(), this.map.getZoom());
            }
            if (this.moveQueue.length > 0) {
              const {action, description} = this.moveQueue.shift() as MoveQueueItem;
              if (!!action) {
                // console.log('ACTION-QQ', description);
                action(this.map);  
              }
            }
          });
          this.bounds = this.map.getBounds();
          this.newMap.next(this);
          this.ngOnChanges();
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

  queueAction(action: (map: mapboxgl.Map) => void, description: string) {
    if (this.moveQueue.length === 0 && !this.map.isMoving()) {
      // console.log('ACTION-IMM', description);
      action(this.map);
    } else {
      // console.log('ACTION-QUE', description);
      this.moveQueue.push({action, description});
    }
  }

  processPointIds(ids: string[]) {
    // console.log('GOT POINTS', ids.length);
    const pointIds = ids || [];
    const activeLabels = pointIds.length === 1 ? [pointIds[0]] : [];
    const activePointId = pointIds.length === 1 ? pointIds[0] : null;
    const inactiveLabels = pointIds.length > 1 ? pointIds : [];
    for (const layer of ['points-on', 'points-stroke-on']) {
      this.map.setFilter(layer, ['in', ['get', 'point_id'], ['literal', [...pointIds]]]);
    }
    for (const layer of ['labels-active']) {
      this.map.setFilter(layer, ['in', ['get', 'point_id'], ['literal', [...activeLabels]]]);
    }
    for (const layer of ['labels-off']) {
      this.map.setFilter(layer, ['in', ['get', 'point_id'], ['literal', [...inactiveLabels]]]);
    }
    if (activePointId) {
      const lon = activePointId.slice(0, 2) + '.' + activePointId.slice(2, 7);
      const lat = activePointId.slice(7, 9) + '.' + activePointId.slice(9, 14);
      // console.log('CENTERING', activePointId, lon, lat);
      this.map.panTo([parseFloat(lon), parseFloat(lat)]);
    }
  }

  setCenter(center: mapboxgl.LngLat, zoom: number) {
    const fragment = 'g' + center.lng.toFixed(5) + '/' + center.lat.toFixed(5) + '/' + zoom.toFixed(2);
    this.router.navigate([], {
      fragment,
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }
}
