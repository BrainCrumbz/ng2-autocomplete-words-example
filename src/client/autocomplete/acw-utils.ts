export interface Disposable {
    dispose();
}

export interface TextRun {
  fullText: string;
  text: string;
  startIndex: number;
  endIndex: number;
}

export function isTyping(keyCode: number): boolean {
  return (
    keyCode > 47 && keyCode < 58   || // number keys
    keyCode === 32                 || // spacebar
    keyCode === 8                  || // backspace
    keyCode === 46                 || // delete
    keyCode > 64 && keyCode < 91   || // letter keys
    keyCode > 95 && keyCode < 112  || // numpad keys
    keyCode > 185 && keyCode < 193 || // ;=,-./` in order
    keyCode > 218 && keyCode < 223    // [\]' in order
  );
}

export function isManagedKey(event: KeyboardEvent): boolean {
  // * prevent caret from moving in field when pressing arrow up/down/right
  // * prevent field from losing focus when pressing tab
  // * arrow left _is_ managed, but its default behaviour is retained
  return (
    (event.keyCode === 9
      && !event.shiftKey
      && !event.ctrlKey
      && !event.altKey)            || // tab
    event.keyCode === 13           || // enter
    event.keyCode === 27           || // esc
    event.keyCode === 38           || // arrow up
    event.keyCode === 39           || // arrow right
    event.keyCode === 40              // arrow down
  );
}

export function isAcceptSelectionKey(event: KeyboardEvent): boolean {
  return (
    (event.keyCode === 9
      && !event.shiftKey
      && !event.ctrlKey
      && !event.altKey)            || // tab
    event.keyCode === 13           || // enter
    event.keyCode === 39              // arrow right
  );
}

export function isArrowUpKey(event: KeyboardEvent): boolean {
  return (event.keyCode === 38);
}

export function isArrowDownKey(event: KeyboardEvent): boolean {
  return (event.keyCode === 40);
}

export function isClosingKey(event: KeyboardEvent): boolean {
  return (
    event.keyCode === 27           || // esc
    event.keyCode === 37              // arrow left
  );
}

export function findCurrentWord(fullText: string, currentIndex: number): TextRun[] {

  let findWordsRegex = /\S+/g;
  let wordResults: TextRun[] = [];

  let regexResult = findWordsRegex.exec(fullText);

  while (regexResult !== null) {
    const word = regexResult[0];
    const startIndex = regexResult.index;
    const endIndex = startIndex + word.length;

    wordResults.push({
      fullText, text: word, startIndex, endIndex,
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

export function limitPositive(index: number, high: number): number {
  let limited;

  if (high === 0) {
    return 0;
  }

  if (index <= 0) {
    limited = 0;
  } else if (index >= high) {
    limited = high - 1;
  } else {
    limited = index;
  }

  return limited;
}
