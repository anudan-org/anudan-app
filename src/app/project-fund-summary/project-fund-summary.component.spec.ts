import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectFundSummaryComponent } from './project-fund-summary.component';

describe('ProjectFundSummaryComponent', () => {
  let component: ProjectFundSummaryComponent;
  let fixture: ComponentFixture<ProjectFundSummaryComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ProjectFundSummaryComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProjectFundSummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
