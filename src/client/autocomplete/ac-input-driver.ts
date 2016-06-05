import { Observable } from 'rxjs';

import { TextRun, findCurrentWord, isTyping } from '../autocomplete/ac-utils';

export interface InputDriverOptions {
  debounceMs: number;
  minWordLength: number;
}

export class AcInputDriver {
  constructor(
    keyUp$: Observable<KeyboardEvent>,
    getMatches: (text: string) => Observable<string[]>,
    opts: InputDriverOptions) {

    const currentTyping$ = keyUp$
      .debounceTime(opts.debounceMs)
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
      .filter(wordResult => wordResult.text.length >= opts.minWordLength);

    const emptyMatches = [];

    const notSuitableWord$ = typedWord$
      .filter(wordResults => wordResults.length === 0
        || wordResults[0].text.length < opts.minWordLength)
      .map(_ => emptyMatches);

    const matchingCompletions$ = longEnoughWord$
      .switchMap(wordResult => getMatches(wordResult.text)
        .catch(_ => Observable.of([]))
      );

    this.words$ = longEnoughWord$;

    this.matches$ = matchingCompletions$
      .merge(notSuitableWord$);
  }

  words$: Observable<TextRun>;

  matches$: Observable<string[]>;
}
