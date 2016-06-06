import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { Observable, Subscription } from 'rxjs';

import {
  isAcceptSelectionKey, isArrowUpKey, isArrowDownKey, isEscKey
} from './acw-utils';
import './rx-ext/Subscription/addTo';

@Component({
  selector: 'acw-matches',
  host: {
    '[attr.id]': 'id',
  },
  template: `
    <div class="dropdown"
         *ngIf="internalMatches.length > 0">
      <ul class="dropdown-menu" style="" role="listbox">
        <li class="dropdown-item"
            *ngFor="let match of internalMatches; let index = index"
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

  @Input() set matches(value: string[]) {
    this.internalMatches = value;

    if (this.internalMatches.length > 0) {
      this.activeIndex = 0;
    }
  }

  get matches(): string[] {
    throw new Error('\'matches\' property is write-only, cannot be read');
  }

  @Input() keyUp$: Observable<KeyboardEvent>;

  @Output('select') selectItem = new EventEmitter<string>();

  constructor() {
    this.matches = [];
  }

  ngOnInit(): void {
    this.keyUp$
      .filter(isArrowUpKey)
      .subscribe(event => {
        this.moveActiveUp();

        event.preventDefault();
      })
      .addTo(this.subscription);

    this.keyUp$
      .filter(isArrowDownKey)
      .subscribe(event => {
        this.moveActiveDown();

        event.preventDefault();
      })
      .addTo(this.subscription);

    this.keyUp$
      .filter(isEscKey)
      .subscribe(event => {
        this.close();

        event.preventDefault();
      })
      .addTo(this.subscription);

    const selectedByKey$ = this.keyUp$
      .filter(isAcceptSelectionKey);

    selectedByKey$
      .subscribe(event => {
        this.notifySelected(this.activeIndex);

        event.preventDefault();
      })
      .addTo(this.subscription);
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  isActiveItem(index: number): boolean {
    return (index === this.activeIndex);
  }

  onMouseEnterItem(index: number): void {
    this.activeIndex = index;
  }

  onSelectItem(event: Event, index: number): void {
    this.notifySelected(index);

    event.preventDefault();
  }

  internalMatches: string[];

  activeIndex: number;

  private close(): void {
    this.matches = [];
  }

  private moveActiveUp(): void {
    if (this.activeIndex > 0) {
      this.activeIndex--;
    }
  }

  private moveActiveDown(): void {
    if (this.activeIndex < this.internalMatches.length - 1) {
      this.activeIndex++;
    }
  }

  private notifySelected(index: number): void {
    const match = this.internalMatches[index];

    this.selectItem.next(match);
  }

  private subscription: Subscription = new Subscription();
}
