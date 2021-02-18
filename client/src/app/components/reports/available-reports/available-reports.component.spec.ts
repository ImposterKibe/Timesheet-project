import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AvailableReportsComponent } from './available-reports.component';

describe('AvailableReportsComponent', () => {
  let component: AvailableReportsComponent;
  let fixture: ComponentFixture<AvailableReportsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AvailableReportsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AvailableReportsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
