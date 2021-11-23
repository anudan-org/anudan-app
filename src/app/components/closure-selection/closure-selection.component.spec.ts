import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ClosureSelectionComponent } from './closure-selection.component';

describe('ClosureSelectionComponent', () => {
  let component: ClosureSelectionComponent;
  let fixture: ComponentFixture<ClosureSelectionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ClosureSelectionComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ClosureSelectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
