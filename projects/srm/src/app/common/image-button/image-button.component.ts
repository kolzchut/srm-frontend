import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-image-button',
  templateUrl: './image-button.component.html',
  styleUrls: ['./image-button.component.less']
})
export class ImageButtonComponent implements OnInit {

  @Input() imageUrl: string = '';
  @Input() disabled = false;
  @Output() clicked = new EventEmitter<Event>();

  constructor() { }

  ngOnInit(): void {
  }

  get cssUrl(): string {
    return `url(${this.imageUrl})`;
  }
}
