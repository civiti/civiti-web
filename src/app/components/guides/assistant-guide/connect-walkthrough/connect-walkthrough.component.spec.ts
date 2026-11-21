import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideNzIconsTesting } from 'ng-zorro-antd/icon/testing';
import { ConnectWalkthroughComponent } from './connect-walkthrough.component';
import { WALK_STEPS } from './connect-walkthrough.data';

describe('ConnectWalkthroughComponent', () => {
  let fixture: ComponentFixture<ConnectWalkthroughComponent>;
  let host: HTMLElement;

  const press = (key: string) =>
    fixture.componentInstance.onKeydown(new KeyboardEvent('keydown', { key }));

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ConnectWalkthroughComponent],
      providers: [provideRouter([]), provideNzIconsTesting()],
    });
    fixture = TestBed.createComponent(ConnectWalkthroughComponent);
    fixture.detectChanges();
    host = fixture.nativeElement;
  });

  it('prerenders every step, so an agent reading the page sees all of them', () => {
    expect(host.querySelectorAll('[role="tabpanel"]').length).toBe(WALK_STEPS.length);
  });

  // A lookalike login page on civiti.ro must never accept a password.
  it('recreates the Civiti pages without any form or input', () => {
    expect(host.querySelectorAll('form, input, textarea, select').length).toBe(0);
  });

  it('shows the Unverified badge and explains it as normal', () => {
    expect(host.textContent).toContain('Unverified');
    expect(host.textContent).toContain('Unverified e normal');
  });

  // The consent page's placeholder notice promises a revocation page that doesn't exist.
  it('does not repeat the revocation promise from the privacy notice', () => {
    expect(host.textContent).not.toContain('revoke them in your Civiti account settings');
  });

  it('gives every pin a note and every note a pin', () => {
    host.querySelectorAll<HTMLElement>('[role="tabpanel"]').forEach((panel, i) => {
      const pins = panel.querySelectorAll('.stage .pin').length;
      expect(pins).withContext(WALK_STEPS[i].id).toBe(WALK_STEPS[i].notes.length);
    });
  });

  it('moves with the arrow keys and starts each step at its first note', () => {
    fixture.componentInstance.pick(3);
    press('ArrowRight');
    expect(fixture.componentInstance.active()).toBe(1);
    expect(fixture.componentInstance.note()).toBe(1);
    press('ArrowLeft');
    press('ArrowLeft');
    expect(fixture.componentInstance.active()).toBe(WALK_STEPS.length - 1);
    press('Home');
    expect(fixture.componentInstance.active()).toBe(0);
  });
});
