import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ToolCatalogComponent } from './tool-catalog.component';
import { TOOL_GROUPS } from './tool-catalog.data';

const all = TOOL_GROUPS.flatMap((group) => group.tools);

describe('tool catalog data', () => {
  // civiti-server's tool-inventory.md §1 and §2 list 21 tools: 7 public, 14 signed in.
  it('lists every tool once, 7 public and 14 that need an account', () => {
    expect(all.length).toBe(21);
    expect(new Set(all.map((tool) => tool.name)).size).toBe(21);
    expect(TOOL_GROUPS.find((group) => group.id === 'public')!.tools.length).toBe(7);
  });

  it('marks exactly the tools the civiti-petitions skill calls', () => {
    expect(all.filter((tool) => tool.skill).map((tool) => tool.name).sort()).toEqual([
      'get_issue',
      'list_authorities',
      'mark_email_sent',
    ]);
  });

  it('never presents generate_petition_body as the petition writer', () => {
    const tool = all.find((t) => t.name === 'generate_petition_body')!;
    expect(tool.skill).toBeFalse();
    expect(tool.text).toContain('Nu scrie petiții');
  });
});

describe('ToolCatalogComponent', () => {
  let fixture: ComponentFixture<ToolCatalogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [ToolCatalogComponent] });
    fixture = TestBed.createComponent(ToolCatalogComponent);
    fixture.detectChanges();
  });

  it('keeps every tool in the DOM when filtering, and hides the rest', () => {
    fixture.componentInstance.setFilter('skill');
    fixture.detectChanges();
    const items = fixture.nativeElement.querySelectorAll('.tool');
    expect(items.length).toBe(21);
    expect(fixture.nativeElement.querySelectorAll('.tool:not([hidden])').length).toBe(3);
    expect(fixture.nativeElement.querySelector('[aria-live]').textContent).toContain('3 din 21');
  });
});
