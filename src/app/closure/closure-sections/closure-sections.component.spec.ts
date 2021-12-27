import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ClosureSectionsComponent } from './closure-sections.component';

describe('ClosureSectionsComponent', () => {
  let component: ClosureSectionsComponent;
  let fixture: ComponentFixture<ClosureSectionsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ClosureSectionsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ClosureSectionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
