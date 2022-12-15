import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChange, SimpleChanges, ViewChild } from '@angular/core';
import { MapboxService } from '../mapbox.service';

import { from, ReplaySubject, Subject, timer } from 'rxjs';
import { throttleTime, filter, distinctUntilChanged, switchMap, debounceTime, first, delay } from 'rxjs/operators';
import { StateService, CenterZoomType, GeoType, BoundsType } from '../state.service';
import { ALL_CATEGORIES, CATEGORY_COLORS } from '../colors';
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
  @Input() markerProps: any;
  // @Output('points') points = new EventEmitter<SRMPoint | null>();
  // @Output('hover') pointsHover = new EventEmitter<string | null>();
  @Output('map') newMap = new EventEmitter<MapComponent>();
  @Output('mapBounds') mapBounds = new EventEmitter<number[][]>();
  @ViewChild('map') mapEl: ElementRef;

  map: mapboxgl.Map;
  addedImages: {[key: string]: boolean} = {};

  moveQueue: MoveQueueItem[] = [];
  geoChanges = new Subject<GeoType>();
  searchParamsQueue = new ReplaySubject<SearchParams>(1);
  bounds: mapboxgl.LngLatBounds;
  lastProps: any = {};

  ZOOM_THRESHOLD = 10;
  ALL_CATEGORIES = ALL_CATEGORIES; 
  savedChanges: SimpleChanges = {};
  currentPointIds: string[];
  
  constructor(private mapboxService: MapboxService, 
              private api: ApiService,
              private platform: PlatformService,
              private layout: LayoutService,
              private router: Router
             ) {
      
  }

  getTitle(card: Card) {
    let title = (card.organization_short_name || card.organization_name);
    const max_len = 40;
    if (title && title.length > max_len) {
      title = title.slice(0, max_len) + '…';
    }
    return title;
  }

  changed(changes: SimpleChanges, key: string) {
    return (changes?.[key]?.currentValue !== changes?.[key]?.previousValue || changes?.[key]?.firstChange || false);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (!this.map) {
      Object.assign(this.savedChanges, changes);
      return;
    }
    if (this.changed(changes, 'markerProps') && changes?.markerProps?.currentValue) {
      this.updateMarkerProps(this.markerProps);
    } else if (this.changed(changes, 'pointId') && changes?.pointId?.currentValue) {
      this.api.getPoint(this.pointId, this.searchParams || undefined).subscribe((cards) => {
        if (cards.length > 0) {
          const titles: string[] = [];
          cards.forEach(card => {
            const title = this.getTitle(card);
            if (titles.indexOf(title) === -1) {
              titles.push(title);
            }
          });
          let title = titles[0];
          if (titles.length > 1) {
            title += ' + ' + (titles.length - 1);
          }
          this.processPointIds([this.pointId], true, {
            response_category: cards[0].response_category,
            title: title,
            coordinates: cards[0].branch_geometry
          });  
        }
      });
    } else if (this.changed(changes, 'cardId') || (this.changed(changes, 'pointId') && !this.pointId && this.cardId)) {
      this.api.getCard(this.cardId).subscribe(card => {
        const title = this.getTitle(card);
        this.processPointIds([card.point_id], true, {
          response_category: card.response_category,
          title: title,
          coordinates: card.branch_geometry
        });
      });
    }
    if (!this.pointId && !this.cardId) {
      (this.map.getSource('active-point') as mapboxgl.GeoJSONSource)?.setData({
        type: 'FeatureCollection',
        features: [{
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [0, 0]
          },
          properties: {}
        }]
      });
    }
    if (this.changed(changes, 'searchParams') && changes?.searchParams?.currentValue) {
      this.searchParamsQueue.next(changes?.searchParams?.currentValue);
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
    // let first_ = true;
    if (this.platform.browser() && this.mapEl && this.mapEl.nativeElement) {
      try {
        const mapParams: mapboxgl.MapboxOptions = {
          container: this.mapEl.nativeElement,
          style: this.STYLE,
          minZoom: 3,
          attributionControl: false,
          center: [34.9, 32],
          zoom: 8.5,
        };
        this.map = new mapboxgl.Map(mapParams);
        this.map.addControl(new mapboxgl.AttributionControl(), 'top-right');
        if (this.layout.desktop) {
          this.map.addControl(new mapboxgl.NavigationControl({showCompass: false}), 'top-left');
        }
        this.map.dragRotate.disable();
        this.map.touchZoomRotate.disableRotation();
        this.map.touchPitch.disable();
        this.map.on('styleimagemissing', (e) => {
          const id: string = e.id;
          if (this.addedImages[id]) {
            return;
          }
          this.addedImages[id] = true;
          this.map.addImage(id, {width: 0, height: 0, data: new Uint8Array()});
          const img: HTMLImageElement | null = this.createLabelBg(id);
          if (img) {
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
            };
          }
        });
        this.map.on('load', () => {
          console.log('MAP LOADED', environment.production);
          if (!environment.production) {
            for (const layer of ['labels-off', 'points-on', 'points-off', 'points-stroke-on']) {
              this.setStagingLayerSource(this.map, layer);
            }
          }
          this.updateActiveLabelLayer(this.map);
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
                // console.log('MAP CLICKED', this.searchParams?.ac_query, this.cardId, this.pointId, props.point_id);
                // props.records = JSON.parse(props.records) as Card[];
                if (this.cardId) {
                  if (this.searchParams?.ac_query) {
                    if (this.pointId && this.pointId !== props.point_id) {
                      this.router.navigate(['/s', this.searchParams?.ac_query, 'p', props.point_id], {queryParamsHandling: 'preserve'});
                    } else {
                      this.router.navigate(['/s', this.searchParams?.ac_query, 'c', this.cardId, 'p', props.point_id], {queryParamsHandling: 'preserve'});
                    }
                  } else {
                    if (this.pointId && this.pointId !== props.point_id) {
                      this.router.navigate(['/p', props.point_id], {queryParamsHandling: 'preserve'});
                    } else {
                      this.router.navigate(['/c', this.cardId, 'p', props.point_id], {queryParamsHandling: 'preserve'});
                    }
                  }  
                } else {
                  if (this.searchParams?.ac_query) {
                    this.router.navigate(['/s', this.searchParams?.ac_query, 'p', props.point_id], {queryParamsHandling: 'preserve'});
                  } else {
                    this.router.navigate(['/p', props.point_id], {queryParamsHandling: 'preserve'});
                  }  
                }
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
            debounceTime(500),
            distinctUntilChanged((a, b) => a.searchHash.localeCompare(b.searchHash) === 0),
            switchMap((params) => {
              if (params) {
                return this.api.getPoints(params);
              } else {
                return from([[]]);
              }
            }),
          ).subscribe(ids => {
            // console.log('POINTS', ids);
            this.processPointIds(ids, false);
          });
          this.map.on('moveend', (event: mapboxgl.MapboxEvent<MouseEvent>) => {
            // console.log('MOVEEND', event);
            this.bounds = this.map.getBounds();
            this.mapBounds.next([
              [
                this.bounds.getWest(),
                this.bounds.getNorth()
              ],
              [
                this.bounds.getEast(),
                this.bounds.getSouth()
              ]
            ]);
            if (!(event as any).ignore) {
              this.setCenter(this.map.getCenter(), this.map.getZoom());
            }
            this.processAction();
          });
          this.bounds = this.map.getBounds();
          this.newMap.next(this);
          this.ngOnChanges(this.savedChanges);
        });
      } catch (e) {
        console.log('FAILED TO LOAD', e)
      }
    }
  }

  processAction() {
    if (this.moveQueue.length > 0) {
      const {action, description} = this.moveQueue.shift() as MoveQueueItem;
      if (!!action) {
        console.log('ACTION-QQ', description);
        action(this.map);  
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

  updateActiveLabelLayer(map: mapboxgl.Map) {

    map.addSource('active-point', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: [{
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [0, 0]
          },
          properties: {
            title: ''
          }
        }]
      }
    });


    for (const layer of ['labels-active', 'points-active', 'points-stroke-active']) {
      const oldLayers = map.getStyle().layers || [];
      const layerIndex = oldLayers.findIndex(l => l.id === layer);
      const layerDef: any = oldLayers[layerIndex];
      const before = oldLayers[layerIndex + 1] && oldLayers[layerIndex + 1].id;

      map.removeLayer(layer);
      map.addLayer({
        id: layer,
        type: layerDef.type,
        source: 'active-point',
        layout: layerDef.layout || {},
        paint: layerDef.paint || {}
      }, before);
      map.setFilter(layer, null);
    }
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
      console.log('ACTION-IMM', description);
      action(this.map);
    } else {
      // console.log('ACTION-QUE', description);
      this.moveQueue.push({action, description});
    }
  }

  processPointIds(ids: string[], singlePointMode: boolean, props: any | null = null) {
    const pointIds = ids || [];
    const activePointId = singlePointMode ? pointIds[0] : null;
    const inactiveLabels = singlePointMode ? [] : pointIds;
    if (singlePointMode) {
      if (this.currentPointIds?.length) {
        for (const layer of ['points-on', 'points-stroke-on']) {
          this.map.setFilter(layer, ['in', ['get', 'point_id'], ['literal', [...this.currentPointIds.filter(id => id !== activePointId)]]]);
        }
        for (const layer of ['labels-off']) {
          this.map.setFilter(layer, ['in', ['get', 'point_id'], ['literal', [...this.currentPointIds.filter(id => id !== activePointId)]]]);
        }  
      }
    } else {
      for (const layer of ['points-on', 'points-stroke-on']) {
        this.map.setFilter(layer, ['in', ['get', 'point_id'], ['literal', [...pointIds]]]);
      }
      for (const layer of ['labels-off']) {
        this.map.setFilter(layer, ['in', ['get', 'point_id'], ['literal', [...inactiveLabels]]]);
      }
      this.currentPointIds = pointIds;
    }
    if (activePointId && props) {
      this.lastProps = props;
      this.updateMarkerProps({});
    } 
  }

  setCenter(center: mapboxgl.LngLat, zoom: number) {
    const fragment = 'g' + center.lng.toFixed(5) + '/' + center.lat.toFixed(5) + '/' + zoom.toFixed(2);
    this.router.navigate([], {
      fragment,
      queryParamsHandling: 'preserve',
      replaceUrl: true,
    });
  }

  updateMarkerProps(props: any) {
    const overlaid = Object.assign({}, this.lastProps, props);
    (this.map.getSource('active-point') as mapboxgl.GeoJSONSource)?.setData({
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: overlaid && overlaid.coordinates || [0, 0]
        },
        properties: overlaid
      }]
    });
  }
}
