import { Component } from '@angular/core';
import { Observable, Observer, Subject, Subscription } from 'rxjs';

import { AcMatchesComponent } from '../autocomplete/ac-matches.component';
import { TextRun, findCurrentWord, isTyping } from '../autocomplete/ac-utils';
import { countryNames } from './countries';

@Component({
  selector: 'my-app',
  template: `
    <input id="dummyInput" [(ngModel)]="dummyInput" autofocus=""
           type="text" class="form-control" placeholder="Dummy text input"
           (keyup)="onKeyUp($event)">
    <ac-matches [matches]="matches"></ac-matches>
  `,
  styles: [require('./app.component.css')],
  directives: [
    AcMatchesComponent,
  ],
  providers: [
  ],
})
export class AppComponent {

  constructor() {
    this.matches = [];
    this.keyUpSubject = new Subject<KeyboardEvent>();

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

    const currentTyping$ = this.keyUpSubject
      .debounceTime(200)
      .filter(event => isTyping(event.keyCode))
      .map(event => {
        const { value, selectionStart } = (event.srcElement as HTMLInputElement);

        return <TextRun>{
          text: value,
          startIndex: selectionStart,
          endIndex: -1,
        };
      });

    const typedWord$ = currentTyping$
      .map(currentTyping => {
        const { text: fullText, startIndex: selectionStart } = currentTyping;

        const wordResults: TextRun[] = findCurrentWord(fullText, selectionStart);

        return wordResults;
      })
      .share();

    const longEnoughWord$ = typedWord$
      .filter(wordResults => wordResults.length > 0)
      .map(wordResults => wordResults[0])
      .filter(wordResult => wordResult.text.length >= this.minWordLength);

    const emptyMatches = [];

    const notSuitableWord$ = typedWord$
      .filter(wordResults => wordResults.length === 0
        || wordResults[0].text.length < this.minWordLength)
      .map(_ => emptyMatches);

    /* This will be needed

    longEnoughWord$.subscribe(typedWord => {
      const { text, startIndex, endIndex } = typedWord;
      console.log('(%d, %d) %s', startIndex, endIndex, text);
    });
    */

    const matchingCompletions$ = longEnoughWord$
      .switchMap(wordResult => this.getMatches(wordResult.text));

    matchingCompletions$
      .merge(notSuitableWord$)
      .subscribe(completions => {
        this.matches = completions;
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

  keyUpSubject: Subject<KeyboardEvent>;

  matches: string[];

  completions: string[] = countryNames;

  minWordLength: number = 2;
}
