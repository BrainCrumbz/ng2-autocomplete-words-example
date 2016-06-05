import { Component, Input } from '@angular/core';

@Component({
  selector: 'ac-matches',
  template: `
    <div class="match-container" *ngIf="matches.length > 0"
         (mouseleave)="onMouseLeave()">
      <ul class="dropdown-menu" style="display: block;">
        <li *ngFor="let match of matches; let index = index"
            [class.active]="isActive(index)"
            (mouseenter)="setActive(index)">
          <a href="#" tabindex="-1" (click)="select(index)">{{match}}</a>
        </li>
      </ul>
    </div>
  `,
  styles: [/*require('./ac-matches.component.css')*/],
  directives: [
  ],
  providers: [
  ],
})
export class AcMatchesComponent {

  constructor() {
    this.matches = [];
  }

  @Input() set matches(value: string[]) {
    this.internalMatches = value;

    if (this.internalMatches.length > 0) {
      this.activeIndex = 0;
    }
  }

  get matches(): string[] {
    return this.internalMatches;
  }

  isActive(index: number): boolean {
    return (index === this.activeIndex);
  }

  setActive(index: number): void {
    this.activeIndex = index;
  }

  select(index: number): void {
    console.log('Select #%d', index);
  }

  onMouseLeave(): void {
  }

  internalMatches: string[];
  activeIndex: number;
}
