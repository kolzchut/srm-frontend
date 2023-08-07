import { AfterViewInit, Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { animationFrameScheduler, interval, take } from 'rxjs';
import { AnimationFrameScheduler } from 'rxjs/internal/scheduler/AnimationFrameScheduler';


@Component({
  selector: 'app-area-search-selector',
  templateUrl: './area-search-selector.component.html',
  styleUrls: ['./area-search-selector.component.less']
})
export class AreaSearchSelectorComponent implements OnInit, AfterViewInit {

  @Input() area: string | null = null;
  @Input() nationWide = false;

  @ViewChild('mapRegion') mapRegionEl: ElementRef;
  @ViewChild('nationWide') nationWideEl: ElementRef;
  @ViewChild('area') areaEl: ElementRef;

  searching = false;

  selectorWidth = 0;
  selectorRight = 0;

  constructor(private el: ElementRef) { }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    if (this.nationWide) {
      this.selectNationWide();
    } else {
      this.selectMapRegion();
    }
  }

  showButtonText(): boolean {
    return !this.searching && this.area === null;
  }

  isActive(expected: boolean): boolean {
    return this.nationWide === expected && this.showButtonText();
  }
  
  selectMapRegion(): void {
    this.area = null;
    this.nationWide = false;
    this.updateSelector(this.mapRegionEl);
  }

  selectNationWide(): void {
    this.area = null;
    this.nationWide = true;
    this.updateSelector(this.nationWideEl);
  }

  startSearching(): void {
    this.searching = true;
    this.updateSelector(this.areaEl);
  }

  stopSearching(): void {
    this.searching = false;
    this.ngAfterViewInit();
  }

  updateSelector(ref: ElementRef): void {
    interval(100, animationFrameScheduler).pipe(
      take(3)
    ).subscribe(() => {
      const el = ref.nativeElement as HTMLDivElement;
      if (el !== null) {
        const width = el.offsetWidth;
        const boundingRect = el.getBoundingClientRect();
        const hostBoundingRect = this.el.nativeElement.getBoundingClientRect();
        this.selectorRight = hostBoundingRect.right - boundingRect.right;
        this.selectorWidth = width;
      }
    });
  }
}
