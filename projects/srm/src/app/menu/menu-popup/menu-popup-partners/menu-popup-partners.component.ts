import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-menu-popup-partners',
  templateUrl: './menu-popup-partners.component.html',
  styleUrls: ['./menu-popup-partners.component.less']
})
export class MenuPopupPartnersComponent implements OnInit {

  @Input() active = false;
  @Output() close = new EventEmitter<void>();
  
  constructor() { }

  ngOnInit(): void {
  }
}
