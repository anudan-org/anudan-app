import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BottomsheetNotesComponent } from './bottomsheetNotes.component';

describe('BottomsheetNotesComponent', () => {
  let component: BottomsheetNotesComponent;
  let fixture: ComponentFixture<BottomsheetNotesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BottomsheetNotesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BottomsheetNotesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
