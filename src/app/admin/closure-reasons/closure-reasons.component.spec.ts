import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ClosureReasonsComponent } from './closure-reasons.component';

describe('ClosureReasonsComponent', () => {
  let component: ClosureReasonsComponent;
  let fixture: ComponentFixture<ClosureReasonsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ClosureReasonsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ClosureReasonsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
