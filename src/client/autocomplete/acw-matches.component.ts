import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { Observable, Subscription } from 'rxjs';

import './rx-ext/Subscription/addTo';

@Component({
  selector: 'acw-matches',
  host: {
    '[attr.id]': 'id',
  },
  template: `
    <div class="dropdown"
         *ngIf="matches.length > 0">
      <ul class="dropdown-menu" style="" role="listbox">
        <li class="dropdown-item"
            *ngFor="let match of matches; let index = index"
            [class.active]="isActiveItem(index)"
            (mouseenter)="onMouseEnterItem(index)">
          <a tabindex="-1" (click)="onSelectItem($event, index)" role="option">
            {{match}}
          </a>
        </li>
      </ul>
    </div>
  `,
  styles: [`
    .dropdown-menu {
      display: block;
    }
  `],
})
export class AcwMatchesComponent implements OnInit, OnDestroy {

  @Input() id: string;

  @Input() matches: string[];

  @Input() activeIndex: number;

  @Input() close$: Observable<void>;

  @Output() select = new EventEmitter<number>();

  @Output() over = new EventEmitter<number>();

  constructor() {
    this.matches = [];
  }

  ngOnInit(): void {
    this.close$
      .subscribe(_ => {
        this.matches = [];
      })
      .add(this.subscription);
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  isActiveItem(index: number): boolean {
    return (index === this.activeIndex);
  }

  onMouseEnterItem(index: number): void {
    this.over.next(index);

    event.preventDefault();
    event.stopPropagation();
  }

  onSelectItem(event: Event, index: number): void {
    this.select.next(index);

    event.preventDefault();
    event.stopPropagation();
  }

  private subscription: Subscription = new Subscription();
}
