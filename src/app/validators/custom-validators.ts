import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export class CustomValidators {
  
  // Email validator with Romanian domain support
  static emailValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }
      
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      const valid = emailRegex.test(control.value);
      
      return valid ? null : { invalidEmail: true };
    };
  }
  
  // Romanian phone number validator
  static phoneValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null; // Optional field
      }
      
      // Remove spaces and dashes
      const cleaned = control.value.replace(/[\s-]/g, '');
      
      // Romanian phone patterns: 
      // - Mobile: 07XXXXXXXX or +407XXXXXXXX or 00407XXXXXXXX
      // - Landline: 02XXXXXXXX or 03XXXXXXXX etc.
      const phoneRegex = /^(\+40|0040|0)[2-7][0-9]{8}$/;
      const valid = phoneRegex.test(cleaned);
      
      return valid ? null : { invalidPhone: true };
    };
  }
  
  // No special characters validator (for names)
  static noSpecialCharsValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }
      
      // Allow letters (including Romanian diacritics), spaces, hyphens, and apostrophes
      const nameRegex = /^[a-zA-ZăâîșțĂÂÎȘȚ\s'-]+$/;
      const valid = nameRegex.test(control.value);
      
      return valid ? null : { invalidCharacters: true };
    };
  }
  
  // Minimum words validator (for text areas)
  static minWordsValidator(minWords: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }
      
      const words = control.value.trim().split(/\s+/).filter((word: string) => word.length > 0);
      const valid = words.length >= minWords;
      
      return valid ? null : { minWords: { required: minWords, actual: words.length } };
    };
  }
  
  // XSS prevention validator
  static noScriptTagsValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }
      
      const scriptRegex = /<script[\s\S]*?>[\s\S]*?<\/script>/gi;
      const hasScripts = scriptRegex.test(control.value);
      
      return hasScripts ? { dangerousContent: true } : null;
    };
  }
  
  // Maximum length validator with trimming
  static maxLengthTrimmedValidator(maxLength: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }
      
      const trimmedLength = control.value.trim().length;
      const valid = trimmedLength <= maxLength;
      
      return valid ? null : { maxLengthTrimmed: { max: maxLength, actual: trimmedLength } };
    };
  }
}