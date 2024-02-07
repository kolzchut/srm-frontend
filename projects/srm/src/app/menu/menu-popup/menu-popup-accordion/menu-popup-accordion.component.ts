import { Component, ElementRef, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewChild, signal } from '@angular/core';
import { timer } from 'rxjs';

@Component({
  selector: 'app-menu-popup-accordion',
  templateUrl: './menu-popup-accordion.component.html',
  styleUrl: './menu-popup-accordion.component.less'
})
export class MenuPopupAccordionComponent implements OnChanges {

  @Input() title: string;
  @Input() open = false;

  @Output() selected = new EventEmitter<void>();

  @ViewChild('inner') content: ElementRef;
  
  height = signal(48);

  select() {
    this.selected.emit();
  }

  ngOnChanges(): void {
      timer(0).subscribe(() => {
        this.height.set(18 + (this.open ? this.content.nativeElement.scrollHeight : 32));
      });
  }
}
