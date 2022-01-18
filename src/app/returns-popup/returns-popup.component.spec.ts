import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ReturnsPopupComponent } from './returns-popup.component';

describe('ReturnsPopupComponent', () => {
  let component: ReturnsPopupComponent;
  let fixture: ComponentFixture<ReturnsPopupComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ReturnsPopupComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ReturnsPopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
