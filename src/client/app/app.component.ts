import { Component } from '@angular/core';

import { AUTOCOMPLETE_WORDS_DIRECTIVES } from '../autocomplete';
import { countryNames } from './countries';

@Component({
  selector: 'my-app',
  template: `
    <input id="dummyInput" [(ngModel)]="dummyText"
           type="text" class="form-control" autofocus=""
           placeholder="Autocomplete on country names"
           [acwAutocompleteWords]="completions">
  `,
  styles: [require('./app.component.css')],
  directives: [
    AUTOCOMPLETE_WORDS_DIRECTIVES,
  ],
})
export class AppComponent {

  constructor() {
    this.dummyText = '';
  }

  dummyText: string;

  completions: string[] = countryNames;
}
