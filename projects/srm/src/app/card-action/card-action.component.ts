import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-card-action',
  templateUrl: './card-action.component.html',
  styleUrls: ['./card-action.component.less']
})
export class CardActionComponent implements OnInit {

  @Input() kind: string;
  @Input() display: string;
  @Input() action: string;
  @Input() label: string;
  @Input() primary = false;
  @Input() org = false;
  
  constructor() { }

  ngOnInit(): void {
  }

  onclick() {
    if (this.action) {
      window.open(this.action, '_blank');
    }
  }
}
