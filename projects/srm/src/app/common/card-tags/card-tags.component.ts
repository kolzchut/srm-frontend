import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-card-tags',
  templateUrl: './card-tags.component.html',
  styleUrls: ['./card-tags.component.less']
})
export class CardTagsComponent implements OnInit {

  @Input() item: any;
  
  constructor() { }

  ngOnInit(): void {
  }

  get chips() {
    return [
      {
        display: 'סוג המענה',
        color: this.categoryColor,
      },
      ...this.item.responses.map((r: any) => {
          return {
            display: r.name
          };
      })      
    ];
  }

  get categoryColor() {
    return '#07B2EA';
  }

}
