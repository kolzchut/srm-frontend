import { Location } from '@angular/common';
import { AfterViewInit, Component, Input, OnInit, ViewChild } from '@angular/core';
import { SearchConfig } from '../search-config';
import { PlatformService } from '../../platform.service';
import { timer } from 'rxjs';

@Component({
  selector: 'app-search-bar',
  templateUrl: './search-bar.component.html',
  styleUrls: ['./search-bar.component.less']
})
export class SearchBarComponent implements OnInit, AfterViewInit {

  @Input() config: SearchConfig;

  @ViewChild('input') inputEl: any;

  constructor(public location: Location, private platform: PlatformService) { }

  ngOnInit(): void {
  }

  ngAfterViewInit() {
    this.platform.browser(() => {
      timer(0).subscribe(() => {
        this.config.setInputEl(this.inputEl.nativeElement as HTMLInputElement);
      });  
    });
  }

}
