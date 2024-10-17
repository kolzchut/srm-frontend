import { AfterViewInit, Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { PlaceResult } from '../area-search-selector-result-place/area-search-selector-result-place.component';
import { AreaSearchState } from '../area-search-selector/area-search-state';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Observable, Subject, delay, map, tap, timer } from 'rxjs';
import { LayoutService } from '../layout.service';




@UntilDestroy()
@Component({
  selector: 'app-area-search-selector-results',
  templateUrl: './area-search-selector-results.component.html',
  styleUrls: ['./area-search-selector-results.component.less']
})
export class AreaSearchSelectorResultsComponent implements OnInit {

  @Input() state: AreaSearchState;

  @ViewChild('mobileInput') mobileInputEl: ElementRef<HTMLInputElement>;

  presets: PlaceResult[] = [
    {name: 'גוש דן', display: 'גוש דן', bounds: [34.6, 31.8, 35.1, 32.181]},
    {name: 'איזור ירושלים', display: 'איזור ירושלים', bounds: [34.9, 31.7, 35.3, 31.9]},
    {name: 'איזור הצפון', display: 'איזור הצפון', bounds: [34.5, 32.5, 35.8, 33.3]},
    {name: 'איזור באר-שבע', display: 'איזור באר-שבע', bounds: [34.5, 30.8, 35.5, 31.5]},
  ];

  // width: Observable<string>;

  constructor(public layout: LayoutService) {
  }

  ngOnInit(): void {
    // this.width = '100%';
    //  this.state.resultsWidth.pipe(
    //   untilDestroyed(this),
    //   map((w) => this.layout.mobile() ? '100%' : `${w}px`)
    // );
    this.state.showResults.pipe(
      untilDestroyed(this),
      delay(0),
    ).subscribe(() => {
      this.mobileInputEl?.nativeElement.focus();
    });
  }

  clear(event: TouchEvent) {
    if (this.mobileInputEl.nativeElement.value.length > 0) {
      timer(0).pipe(
        tap(() => {
          this.state.results.next(null);
          this.mobileInputEl.nativeElement.value = '';
          this.mobileInputEl.nativeElement.focus();
          this.state.focusInput();
        }),
        delay(100),
        tap(() => {
          this.mobileInputEl.nativeElement.focus();
        }),
      ).subscribe();
    } else {
      timer(0).subscribe(() => {
        this.state.area_ = null;
      });
    }
    event.stopPropagation();
    event.preventDefault();
  }
}
