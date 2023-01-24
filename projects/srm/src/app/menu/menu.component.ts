import { Component, EventEmitter, Injectable, Input, OnInit, Output } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ReplaySubject, timer } from 'rxjs';
import { delay, filter, tap } from 'rxjs/operators';


@Injectable({
  providedIn: 'root'
})
export class MenuService {

  public activated = new ReplaySubject<boolean>(1);

  private active_ = false;

  constructor(private router: Router) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.active = false;
    });
  }

  set active(value: boolean) {
    this.active_ = value;
    this.activated.next(value);
  }

  get active(): boolean {
    return this.active_;
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
  visible = false;

  logoUrls: string[] = [
    'assets/img/logo-kolzchut.svg',
    'assets/img/logo-moj.svg',
    'assets/img/logo-digital.svg',
  ];

  constructor(private menu: MenuService) {
    this.menu.activated.pipe(
      untilDestroyed(this),
      tap((value) => {
        if (value) {
          this.visible = true;
        }
      }),
      delay(100),
      tap((value) => {
        this.active = value;
      }),
      delay(250),
      tap((value) => {
        if (!value) {
          this.visible = false;
        }
      }),
    ).subscribe((value) => {
      console.log('MENU ACTIVE=', value);
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
