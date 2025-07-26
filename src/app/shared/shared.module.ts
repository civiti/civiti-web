import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from './material.module';
import { SafeHtmlPipe } from '../pipes/safe-html.pipe';

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MaterialModule,
    SafeHtmlPipe
  ],
  exports: [
    CommonModule,
    ReactiveFormsModule,
    MaterialModule,
    SafeHtmlPipe
  ]
})
export class SharedModule { }