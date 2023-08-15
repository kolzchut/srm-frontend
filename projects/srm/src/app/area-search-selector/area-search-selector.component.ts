import { AfterViewInit, Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { AreaSearchState } from './area-search-state';
import { delay, map, tap, timer } from 'rxjs';

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
  @ViewChild('area') areaEl: ElementRef;


  selectorWidth = 140;
  selectorRight = 0;

  inputPlaceholder = 'חיפוש';
  
  constructor(private el: ElementRef) {
  }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    this.state.areaInputEl = this.areaEl.nativeElement;
    this.state.selectorVisible.pipe(
      untilDestroyed(this),
      map(() => !!this.state.area_ ? this.areaEl :
        (this.state.nationWide_ ? this.nationWideEl : this.mapRegionEl)),
      tap((ref) => this.updateSelector(ref)),
      delay(250),
      tap((ref) => this.updateSelector(ref)),
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

  updateSelector(ref: ElementRef): void {
    const el = ref.nativeElement as HTMLDivElement;
    if (el !== null) {
      const width = el.offsetWidth;
      const boundingRect = el.getBoundingClientRect();
      const hostBoundingRect = this.el.nativeElement.getBoundingClientRect();
      timer(0).subscribe(() => {
        this.selectorRight = hostBoundingRect.right - boundingRect.right;
        this.selectorWidth = width;
      });
    }
  }

}
