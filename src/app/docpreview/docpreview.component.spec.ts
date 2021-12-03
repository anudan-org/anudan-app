import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DocpreviewComponent } from './docpreview.component';

describe('DocpreviewComponent', () => {
  let component: DocpreviewComponent;
  let fixture: ComponentFixture<DocpreviewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DocpreviewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DocpreviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
