import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ManagerReportsComponent } from './manager-reports.component';

describe('ManagerReportsComponent', () => {
  let component: ManagerReportsComponent;
  let fixture: ComponentFixture<ManagerReportsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ManagerReportsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ManagerReportsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
