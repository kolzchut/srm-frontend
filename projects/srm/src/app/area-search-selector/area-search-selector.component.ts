import { AfterViewInit, Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { BehaviorSubject, Subject, debounceTime, filter, switchMap, timer } from 'rxjs';
import { ApiService } from '../api.service';

export class AreaSearchState {
  resultsWidth = new BehaviorSubject<number>(200);
  results = new BehaviorSubject<any[] | null>(null);
  showResults = new BehaviorSubject<boolean>(false);
  searching = new BehaviorSubject<boolean>(false);
  inputPlaceholder = new BehaviorSubject<string>('חיפוש');
  selectorVisible = new BehaviorSubject<boolean>(true);
  area = new BehaviorSubject<string | null>(null);
  nationWide = new BehaviorSubject<boolean>(false);
  queries = new Subject<string>();

  inputFocus: boolean;
  resultsFocus = 0;

  areaInputEl: HTMLInputElement;

  constructor(private api: ApiService) {
    this.queries.pipe(
      filter((value) => !!value && value.length > 1),
      debounceTime(200),
      switchMap((value) => this.api.getPlaces(value))
    ).subscribe((results) => {
      const places = results.map((result) => {
        let display = result._highlights?.query;
        if (display) {
          display = `<span class='highlight'>${display}</span>`;
        } else {
          display = result.query;
        }
        return {
          name: result.query,
          display: display,
          bounds: result.bounds,
        };
      });
      this.results.next(places);
    });
  }

  init() {
    if (this.nationWide_) {
      this.selectNationWide();
    } else {
      this.selectMapRegion();
    }
  }

  selectMapRegion() {
    this.area_ = null;
    this.nationWide_ = false;
    this.selectorVisible_ = true;
  }

  selectNationWide(): void {
    this.area_ = null;
    this.nationWide_ = true;
    this.selectorVisible_ = true;
  }

  focusInput() {
    this.inputFocus = true;
    this.startSearching();
  }

  focusResults() {
    this.resultsFocus += 1;
  }
  
  blurInput() {
    this.inputFocus = false;
    timer(10).subscribe(() => {
      if (!this.resultsFocus) {
        this.stopSearching();
      }
    });
  }

  blurResults() {
    this.resultsFocus -= 1;
    timer(10).subscribe(() => {
      if (!this.inputFocus && !this.resultsFocus) {
        this.stopSearching();
      }
    });
  }

  startSearching(): void {
    if (this.searching_) {
      return;
    }
    this.searching_ = true;
    this.inputPlaceholder_ = 'חפש שירותים בישוב או איזור מוגדר';
    this.selectorVisible_ = false;
    timer(500).subscribe(() => {
      this.resultsWidth.next(this.areaInputEl.offsetWidth);
      this.showResults.next(true);
    });
  }

  stopSearching(): void {
    if (!this.searching_) {
      return;
    }
    this.searching_ = false;
    this.inputPlaceholder_ = 'חיפוש';
    this.showResults_ = false;
    timer(300).subscribe(() => {    
      this.init();  
    });
  }

  set area_(value: string | null) {
    if (value && value.length > 0) {
      this.queries.next(value);
    } else {
      this.results.next(null);
    }
    this.area.next(value);
  }

  get area_(): string | null {
    return this.area.value;
  }

  set nationWide_(value: boolean) {
    this.nationWide.next(value);
  }

  get nationWide_(): boolean {
    return this.nationWide.value;
  }

  set selectorVisible_(value: boolean) {
    this.selectorVisible.next(value);
  }

  get selectorVisible_(): boolean {
    return this.selectorVisible.value;
  }

  set searching_(value: boolean) {
    this.searching.next(value);
  }

  get searching_(): boolean {
    return this.searching.value;
  }

  set inputPlaceholder_(value: string) {
    this.inputPlaceholder.next(value);
  }

  set showResults_(value: boolean) {
    this.showResults.next(value);
  }
}


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
    this.state.selectorVisible.pipe(untilDestroyed(this)).subscribe(visible => {
      this.updateSelector(this.state.nationWide_ ? this.nationWideEl : this.mapRegionEl);
    });
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
