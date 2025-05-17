import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserEvaluationsComponent } from './user-evaluations.component';

describe('UserEvaluationsComponent', () => {
  let component: UserEvaluationsComponent;
  let fixture: ComponentFixture<UserEvaluationsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserEvaluationsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserEvaluationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
