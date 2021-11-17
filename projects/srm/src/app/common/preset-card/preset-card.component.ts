import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { StateService } from '../../state.service';
import { Preset } from '../datatypes';

@Component({
  selector: 'app-preset-card',
  templateUrl: './preset-card.component.html',
  styleUrls: ['./preset-card.component.less']
})
export class PresetCardComponent implements OnInit {

  @Input() preset: Preset;
  @Output() clicked = new EventEmitter<void>();

  constructor(private state: StateService) { }

  ngOnInit(): void {
  }
  
  onClicked(event: Event) {
    event.stopPropagation();
    event.preventDefault();
    this.state.applyFromUrl(this.preset.link);
    this.clicked.emit();
  }
}
