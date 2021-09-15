import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-card-what',
  templateUrl: './card-what.component.html',
  styleUrls: ['./card-what.component.less']
})
export class CardWhatComponent implements OnInit {

  @Input() item: any;
  @Input() big = false;

  constructor() { }

  ngOnInit(): void {
  }

  get categoryColor() {
    return '#07B2EA';
  }

}
