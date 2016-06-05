import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'ac-matches',
  template: `
    <div class="dropdown" [attr.id]="id"
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
export class AcMatchesComponent {

  constructor() {
    this.matches = [];
  }

  @Input() id: string;

  @Input() set matches(value: string[]) {
    this.internalMatches = value;

    if (this.internalMatches.length > 0) {
      this.activeIndex = 0;
    }
  }

  @Output('select') selectItem = new EventEmitter<string>();

  get matches(): string[] {
    throw new Error('\'matches\' property is write-only, cannot be read');
  }

  isActiveItem(index: number): boolean {
    return (index === this.activeIndex);
  }

  onMouseEnterItem(index: number): void {
    this.activeIndex = index;
  }

  onSelectItem(event: Event, index: number): void {
    const match = this.internalMatches[index];

    this.selectItem.next(match);

    event.preventDefault();
  }

  onMouseLeaveContainer(): void {
  }

  internalMatches: string[];
  activeIndex: number;
}
