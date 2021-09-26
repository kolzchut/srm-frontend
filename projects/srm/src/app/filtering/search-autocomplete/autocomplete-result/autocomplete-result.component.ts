import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-autocomplete-result',
  templateUrl: './autocomplete-result.component.html',
  styleUrls: ['./autocomplete-result.component.less']
})
export class AutocompleteResultComponent implements OnInit {

  @Input() type: string;
  @Input() result: any;
  
  constructor() { }

  ngOnInit(): void {
  }

}
