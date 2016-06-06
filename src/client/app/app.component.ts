import { Component } from '@angular/core';

import { AUTOCOMPLETE_WORDS_DIRECTIVES } from '../autocomplete';
import { countryNames } from './countries';

@Component({
  selector: 'my-app',
  template: `
    <div class="container">
      <div class="row">
        <div class="col-md-offset-3 col-md-6">
          <form role="form">
            <fieldset>

              <div class="form-group">
                <label for="dummyInput">
                  An input field with autocomplete-words, detecting country names:
                </label>
                <input id="dummyInput" [(ngModel)]="dummyText"
                      type="text" class="form-control" autofocus=""
                      placeholder="Autocomplete on country names"
                      [acwAutocompleteWords]="completions">
              </div>

              <div class="form-group">
                <label for="anotherInput">
                  Another input, no autocomplete, just to play with focus:
                </label>
                <input id="anotherInput" [(ngModel)]="anotherText"
                      type="text" class="form-control" placeholder="No autocomplete here">
              </div>

            </fieldset>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [require('./app.component.css')],
  directives: [
    AUTOCOMPLETE_WORDS_DIRECTIVES,
  ],
})
export class AppComponent {

  constructor() {
    this.dummyText = '';
    this.anotherText = '';
  }

  dummyText: string;
  anotherText: string;

  completions: string[] = countryNames;
}
