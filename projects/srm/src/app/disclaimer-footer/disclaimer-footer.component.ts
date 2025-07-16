import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-disclaimer-footer',
  templateUrl: './disclaimer-footer.component.html',
  styleUrls: ['./disclaimer-footer.component.less']
})
export class DisclaimerFooterComponent implements OnInit {
  @Input() card = false;
  @Input() homepage = false;

  constructor() { }

  ngOnInit(): void {
  }

}
