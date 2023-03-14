import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ClosureCovernoteComponent } from './closure-covernote.component';

describe('ClosureCovernoteComponent', () => {
  let component: ClosureCovernoteComponent;
  let fixture: ComponentFixture<ClosureCovernoteComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ClosureCovernoteComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ClosureCovernoteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
