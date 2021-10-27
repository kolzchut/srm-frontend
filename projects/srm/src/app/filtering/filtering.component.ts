import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { SituationsService } from '../situations.service';

@Component({
  selector: 'app-filtering',
  templateUrl: './filtering.component.html',
  styleUrls: ['./filtering.component.less'],
  host: {
    '[class.active]': '!!this.activeSection || situations.activeEditors().length > 0'
  }
})
export class FilteringComponent implements OnInit {

  @Output() activated = new EventEmitter<boolean>();

  activeSection: string | null = null;

  constructor(public situations: SituationsService) { }

  ngOnInit(): void {
  }

  set active(value: string | null) {
    this.activeSection = value;
    this.activated.next(!!value);
  }

}
