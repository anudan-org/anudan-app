import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ClosureHeaderComponent } from './closure-header.component';

describe('ClosureHeaderComponent', () => {
  let component: ClosureHeaderComponent;
  let fixture: ComponentFixture<ClosureHeaderComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ClosureHeaderComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ClosureHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
