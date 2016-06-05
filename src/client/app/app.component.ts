import { Component } from '@angular/core';
import { Observable, Observer, Subject, Subscription } from 'rxjs';

@Component({
  selector: 'my-app',
  template: `
    <input id="dummyInput" [(ngModel)]="dummyInput" autofocus=""
           type="text" class="form-control" placeholder="Dummy text input"
           (keyup)="onKeyUp($event)">
    <div class="match-container" *ngIf="matches.length > 0">
      <ul class="dropdown-menu">
        <li *ngFor="let match of matches; let index = index"
            [class.active]="isActive(index)"
            (mouseenter)="setActive(index)">
          <a href="#" tabindex="-1" (click)="select(index)">{{match}}</a>
        </li>
      </ul>
    </div>
  `,
  styles: [require('./app.component.css')],
  directives: [
  ],
  providers: [
  ],
})
export class AppComponent {

  constructor() {
    this.matches = [];
    this.keyUpSubject = new Subject<any>();

    const currentState$ = this.keyUpSubject.map(elem => {
      const { value, selectionStart } = elem;

      return <TextRun>{
        text: value,
        startIndex: selectionStart,
        endIndex: -1,
      };
    });

    currentState$.subscribe(state => {
      const { text: fullText, startIndex: selectionStart } = state;

      const result: TextRun[] = findCurrentWord(fullText, selectionStart);

      if (result.length) {
        const { text: word, startIndex, endIndex } = result[0];

        console.log('(%d) %s: (%d, %d) %s', selectionStart, fullText, startIndex, endIndex, word);
      } else {
        console.log('(%d) %s: no current word', selectionStart, fullText);
      }
    });

    /*
    this.keyUpSubject.subscribe(elem => {
      const { value, selectionStart } = elem;

      const result: TextRun[] = findCurrentWord(value, selectionStart);

      if (result.length) {
        const { text, startIndex, endIndex } = result[0];

        console.log('(%d) %s: (%d, %d) %s', selectionStart, value, startIndex, endIndex, text);
      } else {
        console.log('(%d) %s: no current word', selectionStart, value);
      }
    });
    */
  }

  onKeyUp(event: any): void {
    //console.dir(event);
    this.keyUpSubject.next(event.srcElement);
  }

  keyUpSubject: Subject<any>;

  matches: string[];
}

interface TextRun {
  text: string;
  startIndex: number;
  endIndex: number;
}

function findCurrentWord(fullText: string, currentIndex: number): TextRun[] {

  let findWordsRegex = /(\S+)/g;

  let regexResult = findWordsRegex.exec(fullText);
  let wordResults: TextRun[] = [];

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
