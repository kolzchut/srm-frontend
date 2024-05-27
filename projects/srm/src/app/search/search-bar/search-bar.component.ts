import { Location } from '@angular/common';
import { AfterViewInit, Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { SearchConfig } from '../search-config';
import { PlatformService } from '../../platform.service';
import { timer } from 'rxjs';

@Component({
  selector: 'app-search-bar',
  templateUrl: './search-bar.component.html',
  styleUrls: ['./search-bar.component.less'],
  host: {
    '[class.desktop-style]': 'desktopStyle',
  }
})
export class SearchBarComponent implements OnInit, AfterViewInit {

  @Input() config: SearchConfig;
  @Input() homepage = false;
  @Input() desktopStyle = true;

  @Output() focus = new EventEmitter<boolean>();

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

  get placeholder() {
    return this.homepage ?
          'כל שירות, כל קהל וכל מיקום...' :
          'ניתן לחפש לפי שם, סוג מענה, מיקום...';
  }

}
