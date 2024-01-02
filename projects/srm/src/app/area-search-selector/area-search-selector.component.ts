import { AfterViewInit, Component, ElementRef, Input, OnInit, ViewChild, effect } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { AreaSearchState } from './area-search-state';
import { animationFrameScheduler, delay, distinct, distinctUntilChanged, filter, interval, map, switchMap, take, tap, timer } from 'rxjs';
import { PlatformService } from '../platform.service';
import { LayoutService } from '../layout.service';

@UntilDestroy()
@Component({
  selector: 'app-area-search-selector',
  templateUrl: './area-search-selector.component.html',
  styleUrls: ['./area-search-selector.component.less']
})
export class AreaSearchSelectorComponent implements OnInit, AfterViewInit {

  @Input() state: AreaSearchState;

  @ViewChild('mapRegion') mapRegionEl: ElementRef;
  @ViewChild('nationWide') nationWideEl: ElementRef;
  @ViewChild('area', {static: false}) areaEl: ElementRef;


  selectorWidth = 140;
  selectorRight = 0;

  inputPlaceholder = 'חיפוש';
  
  constructor(private el: ElementRef, private ps: PlatformService) {
    effect(() => {
      if (!this.state.searchState.onlyNational()) {
        timer(0).subscribe(() => {
          this.state.areaInputEl = this.areaEl?.nativeElement;
        });
      }
      const totalCount = this.state.searchState.mapCount() + this.state.searchState.nationalCount();
      const loading = this.state.searchState.mapLoading() || this.state.searchState.nationalLoading();
      this.resizeSelector();
    });
  }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    this.state.selectorResize.pipe(
      untilDestroyed(this),
      map(() => (!!this.state.area_ || !!this.state.searching_) ? this.areaEl :
        (this.state.nationWide_ ? this.nationWideEl : this.mapRegionEl)),
      map((ref) => ref.nativeElement as HTMLDivElement),
      filter((el) => !!el),
      switchMap((el) => {
        return interval(60, animationFrameScheduler).pipe(
          take(5),
          map(() => el.getBoundingClientRect()),
          distinctUntilChanged((a, b) => a.width === b.width && a.right === b.right),
          tap((rect) => this.updateSelector(rect)),
        );
      }),
    ).subscribe();
  }

  showButtonText(): boolean {
    return !this.state.searching_ && this.state.area_ === null;
  }

  isActive(expected: boolean): boolean {
    return this.state.nationWide_ === expected && this.showButtonText();
  }
  
  selectMapRegion(): void {
    this.state.selectMapRegion();
  }

  selectNationWide(): void {
    this.state.selectNationWide();
  }

  resizeSelector(): void {
    this.state.selectorResize.next();
  }

  updateSelector(boundingRect: DOMRect): void {
    if (!!boundingRect && this.ps.browser()) {
      const width = boundingRect.width;
      const hostBoundingRect = this.el.nativeElement.getBoundingClientRect();
      timer(0).subscribe(() => {
        this.selectorRight = hostBoundingRect.right - boundingRect.right;
        this.selectorWidth = width;
      });
    }
  }

  inputTouched(event: TouchEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.state.startSearching();
  }

}
