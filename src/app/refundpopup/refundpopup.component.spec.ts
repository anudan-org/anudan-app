import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RefundpopupComponent } from './refundpopup.component';

describe('RefundpopupComponent', () => {
  let component: RefundpopupComponent;
  let fixture: ComponentFixture<RefundpopupComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RefundpopupComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RefundpopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
