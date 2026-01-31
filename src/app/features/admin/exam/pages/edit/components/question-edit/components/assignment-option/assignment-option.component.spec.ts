import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { AssignmentOptionComponent } from './assignment-option.component';
import { FormBuilder, ReactiveFormsModule, FormGroup, FormArray } from '@angular/forms';
import { AssignmentOptionService } from '../../../../../../../../../shared/service/assignment-option';
import { ToastService } from '../../../../../../../../../shared/service/toast.service';
import { of, BehaviorSubject } from 'rxjs';

describe('AssignmentOptionComponent', () => {
  let component: AssignmentOptionComponent;
  let fixture: ComponentFixture<AssignmentOptionComponent>;
  let assignmentServiceMock: any;
  let toastServiceMock: any;
  let fb: FormBuilder;
  let parentForm: FormGroup;

  beforeEach(async () => {
    assignmentServiceMock = {
      errors$: new BehaviorSubject([]),
      update: jest.fn().mockReturnValue(of({ id: 1 })),
      create: jest.fn().mockReturnValue(of({ id: 1 })),
      deleteById: jest.fn().mockReturnValue(of(true))
    };
    toastServiceMock = {
      addErrorToast: jest.fn(),
      add: jest.fn(),
      addSuccessToast: jest.fn()
    };

    await TestBed.configureTestingModule({
      imports: [AssignmentOptionComponent, ReactiveFormsModule],
      providers: [
        FormBuilder,
        { provide: AssignmentOptionService, useValue: assignmentServiceMock },
        { provide: ToastService, useValue: toastServiceMock }
      ]
    })
    .compileComponents();

    fb = TestBed.inject(FormBuilder);
    parentForm = fb.group({
      id: [1],
      options: fb.array([])
    });

    fixture = TestBed.createComponent(AssignmentOptionComponent);
    component = fixture.componentInstance;
    
    fixture.componentRef.setInput('formGroup', parentForm);
    fixture.componentRef.setInput('formArrayName', 'options');
    
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should add options when assignmentOptions input changes', () => {
    const options = [{ id: 1, text: 'Opt 1', questionId: 1 }];
    fixture.componentRef.setInput('assignmentOptions', options);
    fixture.detectChanges();
    
    expect(component['formArray'].length).toBe(1);
    expect(component['formArray'].at(0).get('text')?.value).toBe('Opt 1');
  });

  it('should add a new option when addAssignmentOption is called', () => {
    component.addAssignmentOption();
    expect(component['formArray'].length).toBe(1);
  });

  it('should emit answerChange when form values change', (done) => {
    component.addAssignmentOption({ id: 1, text: 'Valid text long enough', questionId: 1 });
    const optionForm = component['formArray'].at(0) as FormGroup;
    const answersArray = optionForm.get('assignmentAnswers') as FormArray;
    
    component.answerChange.subscribe(answers => {
      expect(answers.length).toBe(1);
      expect(answers[0].answerText).toBe('A1');
      done();
    });

    answersArray.push(fb.group({ answerText: 'A1', assignedOptionId: 1 }));
  });

  it('should call assignmentService.update when saveAssignmentOption is called', fakeAsync(() => {
    component.addAssignmentOption({ id: 1, text: 'Valid text long enough', questionId: 1 });
    component['currentIndex'].set(0);
    
    // @ts-ignore
    component._saveAssignmentOption();
    tick();
    
    expect(assignmentServiceMock.update).toHaveBeenCalled();
  }));

  it('should call assignmentService.deleteById when deleteAssignmentOption is called', fakeAsync(() => {
    component.addAssignmentOption({ id: 10, text: 'Valid option text', questionId: 1 });
    component['currentIndex'].set(0);
    
    // @ts-ignore
    component._deleteAssignmentOption();
    tick();
    
    expect(assignmentServiceMock.deleteById).toHaveBeenCalledWith(10);
    expect(component['formArray'].length).toBe(0);
  }));
});
