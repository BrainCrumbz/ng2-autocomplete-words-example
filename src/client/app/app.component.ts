import { Component } from '@angular/core';
import { Observable, Observer, Subject, Subscription } from 'rxjs';

import { AcMatchesComponent } from '../autocomplete/ac-matches.component';
import { AcInputDriver } from '../autocomplete/ac-input-driver';
import { TextRun, findCurrentWord, isTyping } from '../autocomplete/ac-utils';
import { countryNames } from './countries';

@Component({
  selector: 'my-app',
  template: `
    <input id="dummyInput" [(ngModel)]="dummyText" autofocus=""
           type="text" class="form-control" placeholder="Autocomplete on country names"
           aria-haspopup="true" aria-controls="dummyInputMatches"
           (keyup)="onKeyUp($event)">
    <ac-matches id="dummyInputMatches" [matches]="matches"
                (select)="onMatchSelect($event)"></ac-matches>
  `,
  styles: [require('./app.component.css')],
  directives: [
    AcMatchesComponent,
  ],
  providers: [
  ],
})
export class AppComponent {

  dummyText: string = '';

  constructor() {
    this.matches = [];
    this.keyUpSubject = new Subject<KeyboardEvent>();
    this.matchSelectedSubject = new Subject<string>();

    const escPressed$ = this.keyUpSubject
      .filter(event => event.keyCode === 27)
      .do(event => event.preventDefault());

    const arrowUpPressed$ = this.keyUpSubject
      .filter(event => event.keyCode === 38)
      .do(event => event.preventDefault());

    const arrowDownPressed$ = this.keyUpSubject
      .filter(event => event.keyCode === 40)
      .do(event => event.preventDefault());

    const enterPressed$ = this.keyUpSubject
      .filter(event => event.keyCode === 13)
      .do(event => event.preventDefault());

    const tabPressed$ = this.keyUpSubject
      .filter(event => event.keyCode === 9 && !event.shiftKey
        && !event.ctrlKey && !event.key)
      .do(event => event.preventDefault());

    const inputDriver = new AcInputDriver(
      this.keyUpSubject,
      this.getMatches.bind(this),
      {
        debounceMs: this.debounceMs,
        minWordLength: this.minWordLength,
      });

    inputDriver.matches$
      .subscribe(completions => {
        this.matches = completions;
      });

    const inputText$ = this.matchSelectedSubject
      .withLatestFrom(inputDriver.words$, (selected, typedWord) => {
        const { text, startIndex, endIndex } = typedWord;

        const newText = this.dummyText.slice(0, startIndex)
          + selected + this.dummyText.slice(endIndex);

        return newText;
      });

    inputText$.subscribe(text => {
      this.dummyText = text;

      this.matches = [];
    });
  }

  getMatches(text: string): Observable<string[]> {
    const lowerCaseText = text.toLocaleLowerCase();

    const matchingCompletions = this.completions
      .filter(completion => completion.toLocaleLowerCase().startsWith(lowerCaseText));

    return Observable.of(matchingCompletions);
  }

  onKeyUp(event: KeyboardEvent): void {
    this.keyUpSubject.next(event);
  }

  onMatchSelect(match: string): void {
    this.matchSelectedSubject.next(match);
  }

  keyUpSubject: Subject<KeyboardEvent>;

  matches: string[];

  completions: string[] = countryNames;

  matchSelectedSubject: Subject<string>;

  minWordLength: number = 2;

  debounceMs: number = 200;
}
