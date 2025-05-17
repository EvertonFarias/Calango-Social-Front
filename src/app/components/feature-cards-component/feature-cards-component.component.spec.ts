import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FeatureCardsComponentComponent } from './feature-cards-component.component';

describe('FeatureCardsComponentComponent', () => {
  let component: FeatureCardsComponentComponent;
  let fixture: ComponentFixture<FeatureCardsComponentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FeatureCardsComponentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FeatureCardsComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
