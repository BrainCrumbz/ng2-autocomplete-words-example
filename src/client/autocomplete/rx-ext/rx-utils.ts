import { Observable, Observer, Subject } from 'rxjs';

export function splitSubject<T>(
  subj: Subject<T> = new Subject<T>()): [Observer<T>, Observable<T>] {

  const emitter = subj as Observer<T>;
  const stream$ = subj.asObservable();

  return [emitter, stream$];
}
