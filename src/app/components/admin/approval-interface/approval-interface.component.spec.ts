import { TestBed } from '@angular/core/testing';
import { registerLocaleData } from '@angular/common';
import ro from '@angular/common/locales/ro';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { NzMessageService } from 'ng-zorro-antd/message';

import { ApprovalInterfaceComponent } from './approval-interface.component';
import { ApiService } from '../../../services/api.service';
import { ngZorroIcons } from '../../../providers/ng-zorro.providers';
import { AdminIssueListItem, AdminStatisticsResponse } from '../../../types/civica-api.types';

// app.config registers this at start-up; the template formats numbers for 'ro'.
registerLocaleData(ro);

function pendingIssue(id: string): AdminIssueListItem {
  return {
    id,
    title: `Sesizare ${id}`,
    category: 'Infrastructure',
    urgency: 'medium',
    status: 'Submitted',
    address: 'Str. Exemplu 1, București',
    createdAt: '2026-09-01T10:00:00Z',
    photoCount: 1,
    emailsSent: 0,
    userName: 'Ana'
  };
}

describe('ApprovalInterfaceComponent: request changes', () => {
  let api: jasmine.SpyObj<ApiService>;
  let message: jasmine.SpyObj<NzMessageService>;
  let stats: AdminStatisticsResponse;

  beforeEach(async () => {
    stats = { pendingReview: 2, reviewedToday: 0, approved: 0, rejected: 0, approvalRate: 0, averageReviewTimeHours: 0 } as AdminStatisticsResponse;
    api = jasmine.createSpyObj<ApiService>('ApiService', ['getPendingIssues', 'getAdminStatistics', 'requestChanges']);
    api.getPendingIssues.and.returnValue(of({ items: [pendingIssue('a'), pendingIssue('b')], totalItems: 2, page: 1, pageSize: 50, totalPages: 1 }));
    api.getAdminStatistics.and.returnValue(of(stats));
    message = jasmine.createSpyObj<NzMessageService>('NzMessageService', ['success', 'error', 'warning', 'info']);

    await TestBed.configureTestingModule({
      imports: [ApprovalInterfaceComponent],
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        ngZorroIcons,
        { provide: ApiService, useValue: api },
        { provide: NzMessageService, useValue: message }
      ]
    }).compileComponents();
  });

  function openReview(id: string) {
    const fixture = TestBed.createComponent(ApprovalInterfaceComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    component.openApprovalModal(component.pendingIssues.find(i => i.id === id)!);
    component.approvalForm.patchValue({ decision: 'request_changes' });
    return component;
  }

  it('requires the requested changes before the form can be sent', () => {
    const component = openReview('a');
    expect(component.approvalForm.valid).toBeFalse();

    component.approvalForm.patchValue({ notes: '   ' });
    expect(component.approvalForm.valid).toBeFalse();

    component.approvalForm.patchValue({ notes: 'Adaugă o fotografie de aproape.' });
    expect(component.approvalForm.valid).toBeTrue();
  });

  it('sends the changes, drops the report from the queue and stops the spinner', () => {
    api.requestChanges.and.returnValue(of({ success: true, message: 'ok', issueId: 'a' }));
    const component = openReview('a');
    component.approvalForm.patchValue({ notes: '  Adaugă o fotografie de aproape. ' });

    component.submitDecision();

    expect(api.requestChanges).toHaveBeenCalledWith('a', {
      requestedChanges: 'Adaugă o fotografie de aproape.',
      adminNotes: 'Adaugă o fotografie de aproape.'
    });
    expect(component.pendingIssues.map(i => i.id)).toEqual(['b']);
    expect(component.isProcessing).toBeFalse();
    expect(component.isApprovalModalVisible).toBeFalse();
    expect(stats.pendingReview).toBe(1);
    expect(stats.reviewedToday).toBe(1);
    expect(message.success).toHaveBeenCalled();
  });

  it('keeps the report and reports the error when the request fails', () => {
    api.requestChanges.and.returnValue(throwError(() => new Error('500')));
    const component = openReview('a');
    component.approvalForm.patchValue({ notes: 'Completează adresa.' });

    component.submitDecision();

    expect(component.pendingIssues.map(i => i.id)).toEqual(['a', 'b']);
    expect(component.isProcessing).toBeFalse();
    expect(message.error).toHaveBeenCalled();
  });
});
