import { Observable } from 'rxjs';

import { TextRun, findCurrentWord, isTyping } from '../autocomplete/acw-utils';

export interface InputDriverOptions {
  debounceMs: number;
  minWordLength: number;
}

export class AcwInputDriver {
  constructor(
    keyUp$: Observable<KeyboardEvent>,
    selectedMatch$: Observable<string>,
    getMatches: (text: string) => Observable<string[]>,
    opts: InputDriverOptions) {

    const typedWord$ = keyUp$
      .debounceTime(opts.debounceMs)
      .filter(event => isTyping(event.keyCode))
      .map(event => {
        const { value: fullText, selectionStart } = (event.srcElement as HTMLInputElement);

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

    this.matches$ = matchingCompletions$
      .merge(notSuitableWord$);

    this.text$ = selectedMatch$
      .withLatestFrom(longEnoughWord$, (selected, typedWord) => {
        const { fullText, text, startIndex, endIndex } = typedWord;

        const newText = fullText.slice(0, startIndex)
          + selected + fullText.slice(endIndex);

        return newText;
      });
  }

  matches$: Observable<string[]>;

  text$: Observable<string>;
}
