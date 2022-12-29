import { Component, Input, OnInit } from '@angular/core';
import { Card } from '../consts';

@Component({
  selector: 'app-quick-actions',
  templateUrl: './quick-actions.component.html',
  styleUrls: ['./quick-actions.component.less']
})
export class QuickActionsComponent implements OnInit {

  @Input() card: Card;
  
  constructor() { }

  ngOnInit(): void {
  }

}
