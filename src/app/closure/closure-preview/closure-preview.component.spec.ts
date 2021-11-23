import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ClosurePreviewComponent } from './closure-preview.component';

describe('ClosurePreviewComponent', () => {
  let component: ClosurePreviewComponent;
  let fixture: ComponentFixture<ClosurePreviewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ClosurePreviewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ClosurePreviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
