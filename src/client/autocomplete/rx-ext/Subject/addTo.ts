import { Subject } from 'rxjs/Subject';
import { addTo, AddToSignature } from '../impl/addTo';

// 'Subject' implements 'Subscription' as well, so augment that as well

// Create an augmentation for 'rxjs/Subject' module
declare module 'rxjs/Subject' {

  // Augment the 'Subject' class definition with interface merging
  interface Subject {
    addTo: AddToSignature;
  }

}

// Actually patch 'Subject' type with added implementation
Subject.prototype.addTo = addTo;
