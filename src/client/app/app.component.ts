import { Component } from '@angular/core';
import { Observable, Observer, Subject, Subscription } from 'rxjs';

import { AcMatchesComponent } from '../autocomplete/ac-matches.component';
import { countryNames } from './countries';

@Component({
  selector: 'my-app',
  template: `
    <input id="dummyInput" [(ngModel)]="dummyInput" autofocus=""
           type="text" class="form-control" placeholder="Dummy text input"
           (keyup)="onKeyUp($event)">
    <ac-matches></ac-matches>
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

        const wordResult: TextRun[] = findCurrentWord(fullText, selectionStart);

        return wordResult;
      })
      .filter(wordResult => wordResult.length > 0)
      .map(wordResult => wordResult[0]);

    const longEnoughWord$ = typedWord$
      .filter(wordResult => wordResult.text.length >= this.minWordLength);

    longEnoughWord$.subscribe(typedWord => {
      const { text, startIndex, endIndex } = typedWord;
      console.log('(%d, %d) %s', startIndex, endIndex, text);
    });
  }

  onKeyUp(event: KeyboardEvent): void {
    this.keyUpSubject.next(event);
  }

  keyUpSubject: Subject<KeyboardEvent>;

  matches: string[];

  completions: string[] = countryNames;

  minWordLength: number = 2;
}

interface TextRun {
  text: string;
  startIndex: number;
  endIndex: number;
}

function isTyping(keyCode: number): boolean {
  return (
    keyCode > 47 && keyCode < 58   || // number keys
    keyCode === 32                 || // spacebar
    //keyCode === 13                 || // return key
    keyCode > 64 && keyCode < 91   || // letter keys
    keyCode > 95 && keyCode < 112  || // numpad keys
    keyCode > 185 && keyCode < 193 || // ;=,-./` in order
    keyCode > 218 && keyCode < 223   // [\]' in order
  );
}

function findCurrentWord(fullText: string, currentIndex: number): TextRun[] {

  let findWordsRegex = /\S+/g;
  let wordResults: TextRun[] = [];

  let regexResult = findWordsRegex.exec(fullText);

  while (regexResult !== null) {
    const word = regexResult[0];
    const startIndex = regexResult.index;
    const endIndex = startIndex + word.length;

    wordResults.push({
      text: word, startIndex, endIndex,
    });

    regexResult = findWordsRegex.exec(fullText);
  }

  wordResults.reverse();

  const wordResult = wordResults.find(wr =>
    wr.startIndex <= currentIndex && currentIndex <= wr.endIndex);

  return wordResult
    ? [ wordResult ]
    : [];
}
