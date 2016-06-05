import { Component } from '@angular/core';
import { Observable, Observer, Subject, Subscription } from 'rxjs';

import { AcMatchesComponent } from '../autocomplete/ac-matches.component';

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

    currentTyping$.subscribe(currentState => {
      const { text: fullText, startIndex: selectionStart } = currentState;

      const result: TextRun[] = findCurrentWord(fullText, selectionStart);

      if (result.length) {
        const { text: word, startIndex, endIndex } = result[0];

        console.log('(%d) %s: (%d, %d) %s', selectionStart, fullText, startIndex, endIndex, word);
      } else {
        console.log('(%d) %s: no current word', selectionStart, fullText);
      }
    });
  }

  onKeyUp(event: KeyboardEvent): void {
    this.keyUpSubject.next(event);
  }

  keyUpSubject: Subject<KeyboardEvent>;

  matches: string[];
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
