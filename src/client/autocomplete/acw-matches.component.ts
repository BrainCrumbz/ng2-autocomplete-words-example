import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { Observable, Subscription } from 'rxjs';

@Component({
  selector: 'acw-matches',
  host: {
    '[attr.id]': 'id',
  },
  template: `
    <div class="dropdown"
         *ngIf="internalMatches.length > 0"
         (mouseleave)="onMouseLeaveContainer()">
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
    let subs: Subscription;

    const escPressed$ = this.keyUp$
      .filter(event => event.keyCode === 27);

    const arrowUpPressed$ = this.keyUp$
      .filter(event => event.keyCode === 38);

    const arrowDownPressed$ = this.keyUp$
      .filter(event => event.keyCode === 40);

    const enterPressed$ = this.keyUp$
      .filter(event => event.keyCode === 13);

    const tabPressed$ = this.keyUp$
      .filter(event => event.keyCode === 9 && !event.shiftKey
        && !event.ctrlKey && !event.key);

    subs = escPressed$.subscribe(event => {
      this.close();
      event.preventDefault();
    });

    this.subscription.add(subs);

    subs = arrowUpPressed$.subscribe(event => {
      this.moveActiveUp();

      event.preventDefault();
    });

    this.subscription.add(subs);

    subs = arrowDownPressed$.subscribe(event => {
      this.moveActiveDown();

      event.preventDefault();
    });

    this.subscription.add(subs);

    subs = enterPressed$.subscribe(event => {
      this.notifySelected(this.activeIndex)

      event.preventDefault();
    });

    this.subscription.add(subs);

    subs = tabPressed$.subscribe(event => {
      this.notifySelected(this.activeIndex)
    });

    this.subscription.add(subs);
  }

  ngOnDestroy(): void {
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

  onMouseLeaveContainer(): void {
  }

  close(): void {
    this.matches = [];
  }

  internalMatches: string[];

  activeIndex: number;

  subscription: Subscription = new Subscription();

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
}
