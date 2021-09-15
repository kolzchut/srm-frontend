import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-card-button',
  templateUrl: './card-button.component.html',
  styleUrls: ['./card-button.component.less']
})
export class CardButtonComponent implements OnInit {

  @Input() kind: string | null = null;
  @Input() display: string | null = null;
  @Input() action: string | null = null;
  @Input() arrow = false;
  
  constructor() { }

  ngOnInit(): void {
  }

  onclick() {
    if (this.action) {
      window.open(this.action, '_blank');
    }
  }

}
