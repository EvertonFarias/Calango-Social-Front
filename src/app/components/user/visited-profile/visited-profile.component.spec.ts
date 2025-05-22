import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VisitedProfileComponent } from './visited-profile.component';

describe('VisitedProfileComponent', () => {
  let component: VisitedProfileComponent;
  let fixture: ComponentFixture<VisitedProfileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VisitedProfileComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VisitedProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
