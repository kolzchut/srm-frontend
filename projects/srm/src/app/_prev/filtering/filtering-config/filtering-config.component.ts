import { Component, OnInit } from '@angular/core';
import { SituationsService } from '../../situations.service';

@Component({
  selector: 'app-filtering-config',
  templateUrl: './filtering-config.component.html',
  styleUrls: ['./filtering-config.component.less']
})
export class FilteringConfigComponent implements OnInit {

  constructor(public situations: SituationsService) { }

  ngOnInit(): void {
  }

}
