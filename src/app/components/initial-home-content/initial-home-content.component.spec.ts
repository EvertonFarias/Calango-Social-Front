import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InitialHomeContentComponent } from './initial-home-content.component';

describe('InitialHomeContentComponent', () => {
  let component: InitialHomeContentComponent;
  let fixture: ComponentFixture<InitialHomeContentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InitialHomeContentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InitialHomeContentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
