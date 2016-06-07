import { ComponentRef } from '@angular/core';
import { Observable, Observer, Subject } from 'rxjs';

import { AcwMatchesComponent } from './acw-matches.component';
import { Disposable } from './acw-utils';
import './rx-ext/Subscription/addTo';

interface AcwMatchesHolder {
  setId (id: string): void;

  setMatches(matches: string[]): void;

  setIndex(index: number): void;

  getSelectEmitter(): Observable<number>;

  getOverEmitter(): Observable<number>;
}

export class AcwMatchesDynamicWrapper implements Disposable {
  constructor() {
    // by default, start with an empty holder
    this.holder = new AcwMatchesEmptyHolder();
  }

  dispose(): void {
    if (this.componentRef) {
      this.componentRef.destroy();
      this.componentRef = null;

      this.holder = null;
    }
  }

  set id(id: string) {
    this.holder.setId(id);
  }

  set matches(matches: string[]) {
    this.holder.setMatches(matches);
  }

  set index(index: number) {
    this.holder.setIndex(index);
  }

  get select(): Observable<number> {
    return this.holder.getSelectEmitter();
  }

  get over(): Observable<number> {
    return this.holder.getOverEmitter();
  }

  load(componentRef: ComponentRef<AcwMatchesComponent>): void {
    const instance: AcwMatchesComponent = componentRef.instance;

    this.holder = new AcwMatchesFullHolder(instance);
  }

  unload(): void {
    this.dispose();

    this.holder = new AcwMatchesEmptyHolder();
  }

  private componentRef: ComponentRef<AcwMatchesComponent>;

  private holder: AcwMatchesHolder;
}

class AcwMatchesFullHolder implements AcwMatchesHolder {
  constructor(private instance: AcwMatchesComponent) {
  }

  setId (id: string): void {
    this.instance.id = id;
  }

  setMatches(matches: string[]): void {
    this.instance.matches = matches;
  }

  setIndex(index: number): void {
    this.instance.activeIndex = index;
  }

  getSelectEmitter(): Observable<number> {
    return this.instance.select;
  }

  getOverEmitter(): Observable<number> {
    return this.instance.over;
  }
}

class AcwMatchesEmptyHolder implements AcwMatchesHolder {
  setId (id: string): void {
    // do nothing
  }

  setMatches(matches: string[]): void {
    // do nothing
  }

  setIndex(index: number): void {
    // do nothing
  }

  getSelectEmitter(): Observable<number> {
    return Observable.never<number>();
  }

  getOverEmitter(): Observable<number> {
    return Observable.never<number>();
  }
}
