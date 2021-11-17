import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { SearchService } from '../../search.service';
import { Preset } from '../datatypes';

@Component({
  selector: 'app-preset-strip',
  templateUrl: './preset-strip.component.html',
  styleUrls: ['./preset-strip.component.less']
})
export class PresetStripComponent implements OnInit {

  @Output() clicked = new EventEmitter<void>();

  presets: Preset[] = [];

  constructor(private search: SearchService) {
    this.search.presets.subscribe(presets => {
      this.presets = presets;
    });
  }

  ngOnInit(): void {
  }

}
