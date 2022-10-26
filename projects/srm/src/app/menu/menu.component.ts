import { Component, EventEmitter, Injectable, Input, OnInit, Output } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ReplaySubject, timer } from 'rxjs';
import { filter } from 'rxjs/operators';


@Injectable({
  providedIn: 'root'
})
export class MenuService {

  public activated = new ReplaySubject<boolean>(1);

  constructor(private router: Router) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.active = false;
    });
  }

  set active(value: boolean) {
    this.activated.next(value);
  }
}


@UntilDestroy()
@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.less'],
})
export class MenuComponent implements OnInit {

  active = false;

  logoUrls: string[] = [
    'assets/img/logo-kolzchut.svg',
    'assets/img/logo-moj.svg',
    'assets/img/logo-digital.svg',
  ];

  constructor(private menu: MenuService) {
    this.menu.activated.pipe(
      untilDestroyed(this),
    ).subscribe((value) => {
      this.active = value;
    });
  }

  ngOnInit(): void {
  }

  ngOnChanges() {
  }

  closeMe(selection: string | null) {
    this.menu.active = false;
  }
}
