import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNzIconsTesting } from 'ng-zorro-antd/icon/testing';
import { GUIDE_CLIENTS } from '../assistant-guide.data';
import { ClientSetupComponent } from './client-setup.component';

describe('ClientSetupComponent', () => {
  let fixture: ComponentFixture<ClientSetupComponent>;

  const press = (key: string) =>
    fixture.componentInstance.onKeydown(new KeyboardEvent('keydown', { key }));
  const visiblePanels = () =>
    [...fixture.nativeElement.querySelectorAll('[role="tabpanel"]')].filter(
      (panel) => !(panel as HTMLElement).hidden,
    ) as HTMLElement[];

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [ClientSetupComponent], providers: [provideNzIconsTesting()] });
    fixture = TestBed.createComponent(ClientSetupComponent);
    fixture.componentRef.setInput('clients', GUIDE_CLIENTS);
    fixture.detectChanges();
  });

  it('renders every panel, so an agent reading the page sees all clients', () => {
    expect(fixture.nativeElement.querySelectorAll('[role="tabpanel"]').length).toBe(GUIDE_CLIENTS.length);
    expect(visiblePanels().length).toBe(1);
  });

  it('moves with the arrow keys and wraps at both ends', () => {
    press('ArrowLeft');
    expect(fixture.componentInstance.active()).toBe(GUIDE_CLIENTS.length - 1);
    press('ArrowRight');
    expect(fixture.componentInstance.active()).toBe(0);
    press('End');
    expect(fixture.componentInstance.active()).toBe(GUIDE_CLIENTS.length - 1);
    press('Home');
    expect(fixture.componentInstance.active()).toBe(0);
  });

  it('shows the selected client', () => {
    fixture.componentInstance.select(2);
    fixture.detectChanges();
    expect(visiblePanels()[0].id).toBe(`client-panel-${GUIDE_CLIENTS[2].id}`);
  });
});
