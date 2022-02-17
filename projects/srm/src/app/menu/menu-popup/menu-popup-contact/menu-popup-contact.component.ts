import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-menu-popup-contact',
  templateUrl: './menu-popup-contact.component.html',
  styleUrls: ['./menu-popup-contact.component.less']
})
export class MenuPopupContactComponent implements OnInit {

  @Input() active = false;
  @Output() close = new EventEmitter<void>();
  
  constructor() { }

  ngOnInit(): void {
  }

}
