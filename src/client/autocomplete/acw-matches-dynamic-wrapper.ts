import { ComponentRef } from '@angular/core';

import { Observable } from 'rxjs';

import { AcwMatchesComponent } from './acw-matches.component';

interface AcwMatchesHolder {
  setId (id: string): void;

  setMatches(matches: string[]): void;

  setIndex(index: number): void;

  getSelectObservable(): Observable<number>;

  getOverObservable(): Observable<number>;
}

export class AcwMatchesDynamicWrapper {
  constructor() {
    // by default, start with an empty holder
    this.holder = new AcwMatchesEmptyHolder();
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
    return this.holder.getSelectObservable();
  }

  get over(): Observable<number> {
    return this.holder.getOverObservable();
  }

  load(componentRef: ComponentRef<AcwMatchesComponent>): void {
    const instance: AcwMatchesComponent = componentRef.instance;

    this.holder = new AcwMatchesFullHolder(instance);
  }

  unload(): void {
    if (this.componentRef) {
      this.componentRef.destroy();
      this.componentRef = null;
    }

    this.holder = new AcwMatchesEmptyHolder();
  }

  componentRef: ComponentRef<AcwMatchesComponent>;
  holder: AcwMatchesHolder;
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

  getSelectObservable(): Observable<number> {
    return this.instance.select;
  }

  getOverObservable(): Observable<number> {
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

  getSelectObservable(): Observable<number> {
    return Observable.empty<number>();
  }

  getOverObservable(): Observable<number> {
    return Observable.empty<number>();
  }
}
