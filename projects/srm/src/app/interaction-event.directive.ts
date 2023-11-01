import { AfterViewInit, Directive, ElementRef, Input } from '@angular/core';
import { SearchParams } from './consts';
import { AnalyticsService } from './analytics.service';
import { ActivatedRoute } from '@angular/router';

@Directive({
  selector: '[interactionEvent]'
})
export class InteractionEventDirective implements AfterViewInit{

  @Input() interactionEvent: string;
  @Input() interactionEventWhere: string;
  @Input() interactionEventContent: string;
  @Input() searchParams: SearchParams;

  constructor(private el: ElementRef, private analytics: AnalyticsService) {}

  ngAfterViewInit() {
    const el: HTMLElement = this.el.nativeElement;
    el.addEventListener('keydown', (event: KeyboardEvent) => {
      if (event.keyCode === 13 || event.keyCode === 32) {
        this.interaction();
      }
    });
    el.addEventListener('click', () => {
      this.interaction();
    });
  }

  interaction() {
    this.analytics.interactionEvent(this.interactionEvent, this.interactionEventWhere, this.interactionEventContent, this.searchParams);
  }
}
