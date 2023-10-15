import { AfterViewInit, Component, ElementRef, Input, OnInit } from '@angular/core';
import { Card } from '../consts';

@Component({
  selector: 'app-quick-actions',
  templateUrl: './quick-actions.component.html',
  styleUrls: ['./quick-actions.component.less']
})
export class QuickActionsComponent implements AfterViewInit {

  @Input() card: Card;
  
  constructor(private el: ElementRef) { }

  ngAfterViewInit(): void {
    const first = this.el.nativeElement.querySelector('.visible app-card-action a') as HTMLElement;
    first.classList.add('primary');

  }

}
