import { Component, Input, Output, EventEmitter } from '@angular/core';

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
    /* TODO remove */
    .active {
      background-color: aquamarine;
    }
  `],
})
export class AcwMatchesComponent {

  @Input() id: string;

  @Input() matches: string[];

  @Input() activeIndex: number;

  @Output() select = new EventEmitter<number>();

  @Output() over = new EventEmitter<number>();

  constructor() {
    this.matches = [];
  }

  isActiveItem(index: number): boolean {
    return (index === this.activeIndex);
  }

  onMouseEnterItem(index: number): void {
    this.over.next(index);

    this.stopEvent(event);
  }

  onSelectItem(event: Event, index: number): void {
    this.select.next(index);

    this.stopEvent(event);
  }

  private stopEvent(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
  }
}
