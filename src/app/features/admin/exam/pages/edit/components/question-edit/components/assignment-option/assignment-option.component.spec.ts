import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from "@angular/core/testing";
import {
  ReactiveFormsModule,
  FormArray,
  FormGroup,
  FormControl,
  Validators,
} from "@angular/forms";
import { By } from "@angular/platform-browser";
import { of } from "rxjs";
import { Component, Input, Output, EventEmitter } from "@angular/core";

import { AssignmentOptionComponent } from "./assignment-option.component";
import { AssignmentOptionService } from "../../../../../../../../../shared/service/assignment-option";
import { ToastService } from "../../../../../../../../../shared/service/toast.service";
import { QuestionType } from "../../../../../../../../../shared/model/question-type.enum";

// ---------------------------------------------------------------------------
// Stub components
// ---------------------------------------------------------------------------

@Component({
  selector: "ox-button",
  template: '<button (click)="clicked.emit($event)"><ng-content /></button>',
  standalone: true,
})
class OxButtonStub {
  @Output() clicked = new EventEmitter<Event>();
}

@Component({
  selector: "ox-card",
  template: "<div><ng-content /></div>",
  standalone: true,
})
class OxCardStub {
  @Input() cssClass = "";
}

@Component({
  selector: "ox-basic-input",
  template: "<input />",
  standalone: true,
})
class OxBasicInputStub {
  @Input() type = "text";
  @Input() formControl: any;
  @Input() placeholder = "";
  @Input() required = false;
  @Input() label = "";
}

@Component({
  selector: "ox-answer-form",
  template: "<div></div>",
  standalone: true,
})
class OxAnswerFormStub {
  @Input() answerArray: any;
  @Input() formGroup: any;
  @Input() formArrayName = "";
  @Input() assignedOptionId = 0;
  @Input() questionType: any;
}

@Component({
  selector: "ox-context-menu",
  template: "<div></div>",
  standalone: true,
})
class OxContextMenuStub {
  @Input() items: any[] = [];
  @Output() itemClicked = new EventEmitter<any>();
}

@Component({
  selector: "ox-dialog",
  template: ` <div *ngIf="isOpen">
    <ng-content />
    <button class="dialog-submit" (click)="submitted.emit(true)">Submit</button>
    <button class="dialog-cancel" (click)="cancelled.emit(true)">Cancel</button>
    <button class="dialog-close" (click)="closed.emit()">Close</button>
  </div>`,
  standalone: true,
})
class OxDialogStub {
  @Input() isOpen = false;
  @Input() title = "";
  @Input() submitLabel = "";
  @Input() cancelLabel = "";
  @Output() closed = new EventEmitter<void>();
  @Output() submitted = new EventEmitter<any>();
  @Output() cancelled = new EventEmitter<any>();
}

@Component({
  selector: "ox-dialog-header",
  template: "<ng-content />",
  standalone: true,
})
class OxDialogHeaderStub {}

@Component({
  selector: "ox-dialog-content",
  template: "<ng-content />",
  standalone: true,
})
class OxDialogContentStub {}

@Component({ selector: "fa-icon", template: "<span></span>", standalone: true })
class FaIconStub {
  @Input() icon: any;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeOptionGroup(overrides: Record<string, any> = {}): FormGroup {
  return new FormGroup({
    internalId: new FormControl(overrides["internalId"] ?? "uuid-1"),
    id: new FormControl(overrides["id"] ?? null),
    questionId: new FormControl(overrides["questionId"] ?? null),
    text: new FormControl(overrides["text"] ?? ""),
    assignmentAnswers: new FormArray([]),
  });
}

function makeOptionsArray(...groups: FormGroup[]): FormArray<FormGroup> {
  const arr = new FormArray<FormGroup>([]);
  groups.forEach((g) => arr.push(g));
  return arr;
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe("AssignmentOptionComponent", () => {
  let fixture: ComponentFixture<AssignmentOptionComponent>;
  let component: AssignmentOptionComponent;
  let assignmentOptionService: jest.Mocked<AssignmentOptionService>;
  let toastService: jest.Mocked<ToastService>;

  beforeEach(async () => {
    assignmentOptionService = {
      create: jest.fn().mockReturnValue(of(null)),
      update: jest.fn().mockReturnValue(of(null)),
      deleteById: jest.fn().mockReturnValue(of(null)),
    } as unknown as jest.Mocked<AssignmentOptionService>;

    toastService = {
      addSuccessToast: jest.fn(),
      addErrorToast: jest.fn(),
    } as unknown as jest.Mocked<ToastService>;

    await TestBed.configureTestingModule({
      imports: [
        ReactiveFormsModule,
        AssignmentOptionComponent,
        OxButtonStub,
        OxCardStub,
        OxBasicInputStub,
        OxAnswerFormStub,
        OxContextMenuStub,
        OxDialogStub,
        OxDialogHeaderStub,
        OxDialogContentStub,
        FaIconStub,
      ],
      providers: [
        { provide: AssignmentOptionService, useValue: assignmentOptionService },
        { provide: ToastService, useValue: toastService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AssignmentOptionComponent);
    component = fixture.componentInstance;

    component.optionsArray = makeOptionsArray();
    component.answerArray = new FormArray<FormGroup>([]);
    fixture.detectChanges();
  });

  afterEach(() => jest.clearAllMocks());

  // -------------------------------------------------------------------------
  // Rendering
  // -------------------------------------------------------------------------

  describe("Rendering", () => {
    it("should create the component", () => {
      expect(component).toBeTruthy();
    });

    it('should render the "Assignment" heading', () => {
      const h2: HTMLElement = fixture.nativeElement.querySelector("h2");
      expect(h2.textContent).toContain("Assignment");
    });

    it('should render the "Add Option" button', () => {
      const btn: HTMLElement = fixture.nativeElement.querySelector("ox-button");
      expect(btn.textContent).toContain("Add Option");
    });

    it("should render no cards when optionsArray is empty", () => {
      expect(fixture.nativeElement.querySelectorAll("ox-card").length).toBe(0);
    });

    it("should render one card per option in the array", () => {
      component.optionsArray = makeOptionsArray(
        makeOptionGroup({ internalId: "a" }),
        makeOptionGroup({ internalId: "b" }),
      );
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelectorAll("ox-card").length).toBe(2);
    });

    it("should label each option with its 1-based index", () => {
      component.optionsArray = makeOptionsArray(
        makeOptionGroup({ internalId: "a" }),
        makeOptionGroup({ internalId: "b" }),
      );
      fixture.detectChanges();
      const inputs = fixture.debugElement.queryAll(By.css("ox-basic-input"));
      expect(inputs[0].componentInstance.label).toBe("Option 1");
      expect(inputs[1].componentInstance.label).toBe("Option 2");
    });

    it("should render two ox-dialog elements", () => {
      expect(fixture.nativeElement.querySelectorAll("ox-dialog").length).toBe(
        2,
      );
    });

    it("should render a separator div inside each card", () => {
      component.optionsArray = makeOptionsArray(
        makeOptionGroup({ internalId: "s1" }),
      );
      fixture.detectChanges();
      expect(
        fixture.nativeElement.querySelector('[data-slot="separator-root"]'),
      ).toBeTruthy();
    });
  });

  // -------------------------------------------------------------------------
  // Add Option button
  // -------------------------------------------------------------------------

  describe("Add Option button", () => {
    it('clicking "Add Option" calls addAssignmentOption', () => {
      // @ts-ignore
      const spy = jest.spyOn(component, "addAssignmentOptions");
      fixture.nativeElement.querySelector("ox-button button").click();
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  // -------------------------------------------------------------------------
  // contextMenuItems
  // -------------------------------------------------------------------------

  describe("contextMenuItems", () => {
    it("exposes two items", () => {
      expect(component["contextMenuItems"].length).toBe(2);
    });

    it("Delete item action calls deleteAssignmentOption with param", () => {
      const spy = jest.spyOn(component as any, "deleteAssignmentOption");
      component["contextMenuItems"][0].action("uuid-1");
      expect(spy).toHaveBeenCalledWith("uuid-1");
    });

    it("Delete item action does NOT call deleteAssignmentOption for empty string", () => {
      const spy = jest.spyOn(component as any, "deleteAssignmentOption");
      component["contextMenuItems"][0].action("");
      expect(spy).not.toHaveBeenCalled();
    });

    it("Save item action calls openSaveDialog with param", () => {
      const spy = jest.spyOn(component, "openSaveDialog");
      component["contextMenuItems"][1].action("uuid-1");
      expect(spy).toHaveBeenCalledWith("uuid-1");
    });

    it("Save item action does NOT call openSaveDialog for empty string", () => {
      const spy = jest.spyOn(component, "openSaveDialog");
      component["contextMenuItems"][1].action("");
      expect(spy).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // handleContextMenuAction
  // -------------------------------------------------------------------------

  describe("handleContextMenuAction", () => {
    it("delegates to item.action with the supplied internalId", () => {
      const actionFn = jest.fn();
      component["handleContextMenuAction"](
        { label: "Test", icon: null, action: actionFn } as any,
        "some-id",
      );
      expect(actionFn).toHaveBeenCalledWith("some-id");
    });

    it("template wires ox-context-menu itemClicked to handleContextMenuAction", () => {
      component.optionsArray = makeOptionsArray(
        makeOptionGroup({ internalId: "x1" }),
      );
      fixture.detectChanges();
      // @ts-ignore
      const spy = jest.spyOn(component, "handleContextMenuAction");
      const ctxMenu = fixture.debugElement.query(By.css("ox-context-menu"));
      ctxMenu.componentInstance.itemClicked.emit({
        label: "Delete",
        action: jest.fn(),
      });
      expect(spy).toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // _getAssignmentGrpByInternalId (via public APIs)
  // -------------------------------------------------------------------------

  describe("_getAssignmentGrpByInternalId", () => {
    it("shows error toast and returns early when internalId is not found", () => {
      component.optionsArray = makeOptionsArray(
        makeOptionGroup({ internalId: "known" }),
      );
      fixture.detectChanges();
      component.openSaveDialog("unknown-id");
      expect(toastService.addErrorToast).toHaveBeenCalledTimes(2);
    });
  });

  // -------------------------------------------------------------------------
  // openSaveDialog
  // -------------------------------------------------------------------------

  describe("openSaveDialog", () => {
    it("shows error toast when questionId is missing", () => {
      component.optionsArray = makeOptionsArray(
        makeOptionGroup({ internalId: "q1", questionId: null }),
      );
      fixture.detectChanges();
      component.openSaveDialog("q1");
      expect(toastService.addErrorToast).toHaveBeenCalledTimes(1);
    });

    it("marks form touched and shows error toast when form is invalid", () => {
      const grp = makeOptionGroup({
        internalId: "q2",
        questionId: 99,
        text: "",
      });
      grp.get("text")!.setValidators([Validators.required]);
      grp.get("text")!.updateValueAndValidity();
      component.optionsArray = makeOptionsArray(grp);
      fixture.detectChanges();

      const markSpy = jest.spyOn(grp, "markAllAsTouched");
      component.openSaveDialog("q2");

      expect(markSpy).toHaveBeenCalled();
      expect(toastService.addErrorToast).toHaveBeenCalledTimes(1);
    });

    it("opens the confirm dialog when form is valid and questionId exists", () => {
      const grp = makeOptionGroup({
        internalId: "q3",
        questionId: 5,
        text: "valid",
      });
      component.optionsArray = makeOptionsArray(grp);
      fixture.detectChanges();
      component.openSaveDialog("q3");
      expect((component as any).actionDialogState.open).toBe(true);
    });

    it("calls create service (no id) when onSubmit is triggered", fakeAsync(() => {
      assignmentOptionService.create.mockReturnValue(of({ id: 42 } as any));
      const grp = makeOptionGroup({
        internalId: "q4",
        questionId: 5,
        text: "hello",
      });
      component.optionsArray = makeOptionsArray(grp);
      fixture.detectChanges();

      component.openSaveDialog("q4");
      (component as any).actionDialogState.onSubmit(true);
      tick();

      expect(assignmentOptionService.create).toHaveBeenCalled();
      expect(toastService.addSuccessToast).toHaveBeenCalled();
    }));

    it("calls update service (has id) when onSubmit is triggered", fakeAsync(() => {
      assignmentOptionService.update.mockReturnValue(of({ id: 7 } as any));
      const grp = makeOptionGroup({
        internalId: "q5",
        id: 7,
        questionId: 5,
        text: "world",
      });
      component.optionsArray = makeOptionsArray(grp);
      fixture.detectChanges();

      component.openSaveDialog("q5");
      (component as any).actionDialogState.onSubmit(true);
      tick();

      expect(assignmentOptionService.update).toHaveBeenCalled();
      expect(toastService.addSuccessToast).toHaveBeenCalled();
    }));

    it("calls resetDialog when onAbort is triggered", () => {
      const grp = makeOptionGroup({
        internalId: "q6",
        questionId: 5,
        text: "yo",
      });
      component.optionsArray = makeOptionsArray(grp);
      fixture.detectChanges();

      component.openSaveDialog("q6");
      const resetSpy = jest.spyOn(component as any, "resetDialog");
      (component as any).actionDialogState.onAbort(true);

      expect(resetSpy).toHaveBeenCalled();
    });

    it("actionDialogState.open becomes false when dialog emits closed", () => {
      const grp = makeOptionGroup({
        internalId: "q7",
        questionId: 5,
        text: "yo",
      });
      component.optionsArray = makeOptionsArray(grp);
      fixture.detectChanges();

      component.openSaveDialog("q7");
      fixture.detectChanges();
      const dialogCancelButton = fixture.debugElement.query(
        By.css('[data-testid="dialog-cancel-btn"]'),
      );
      expect(dialogCancelButton).toBeTruthy();
      dialogCancelButton.nativeElement.click();
      fixture.detectChanges();

      expect((component as any).actionDialogState.open).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // deleteAssignmentOption
  // -------------------------------------------------------------------------

  describe("deleteAssignmentOption", () => {
    it("shows error toast when internalId is not found", () => {
      (component as any).deleteAssignmentOption("nonexistent");
      expect(toastService.addErrorToast).toHaveBeenCalledTimes(1);
    });

    describe("no-id path (confirm dialog)", () => {
      it("opens confirm dialog (actionDialogState)", () => {
        const grp = makeOptionGroup({ internalId: "del-1", id: null });
        component.optionsArray = makeOptionsArray(grp);
        fixture.detectChanges();
        (component as any).deleteAssignmentOption("del-1");
        expect((component as any).actionDialogState.open).toBe(true);
      });

      it("onSubmit removes the option from optionsArray", () => {
        const grp = makeOptionGroup({ internalId: "del-2", id: null });
        component.optionsArray = makeOptionsArray(grp);
        fixture.detectChanges();
        (component as any).deleteAssignmentOption("del-2");
        (component as any).actionDialogState.onSubmit(true);
        expect(component.optionsArray.length).toBe(0);
      });

      it("onAbort keeps the option in optionsArray", () => {
        const grp = makeOptionGroup({ internalId: "del-3", id: null });
        component.optionsArray = makeOptionsArray(grp);
        fixture.detectChanges();
        (component as any).deleteAssignmentOption("del-3");
        (component as any).actionDialogState.onAbort(true);
        expect(component.optionsArray.length).toBe(1);
      });
    });

    describe("has-id path (directAction dialog)", () => {
      it("opens directAction dialog (directActionDialogState)", () => {
        const grp = makeOptionGroup({ internalId: "del-4", id: 10 });
        component.optionsArray = makeOptionsArray(grp);
        fixture.detectChanges();
        (component as any).deleteAssignmentOption("del-4");
        expect((component as any).directActionDialogState.open).toBe(true);
      });

      it("onSubmit removes option locally without calling the API", () => {
        const grp = makeOptionGroup({ internalId: "del-5", id: 10 });
        component.optionsArray = makeOptionsArray(grp);
        fixture.detectChanges();
        (component as any).deleteAssignmentOption("del-5");
        (component as any).directActionDialogState.onSubmit(true);
        expect(component.optionsArray.length).toBe(0);
        expect(assignmentOptionService.deleteById).not.toHaveBeenCalled();
      });

      it("onAction calls deleteById with the correct id", fakeAsync(() => {
        assignmentOptionService.deleteById.mockReturnValue(of(1));
        const grp = makeOptionGroup({ internalId: "del-6", id: 11 });
        component.optionsArray = makeOptionsArray(grp);
        fixture.detectChanges();
        (component as any).deleteAssignmentOption("del-6");
        (component as any).directActionDialogState.onAction({} as Event);
        tick();
        expect(assignmentOptionService.deleteById).toHaveBeenCalledWith(11);
      }));

      it("onAction shows success toast after deleteById resolves", fakeAsync(() => {
        assignmentOptionService.deleteById.mockReturnValue(of(1));
        const grp = makeOptionGroup({ internalId: "del-7", id: 12 });
        component.optionsArray = makeOptionsArray(grp);
        fixture.detectChanges();
        (component as any).deleteAssignmentOption("del-7");
        (component as any).directActionDialogState.onAction({} as Event);
        tick();
        expect(toastService.addSuccessToast).toHaveBeenCalled();
      }));

      it("onAction removes option from optionsArray after deleteById resolves", fakeAsync(() => {
        assignmentOptionService.deleteById.mockReturnValue(of(1));
        const grp = makeOptionGroup({ internalId: "del-8", id: 13 });
        component.optionsArray = makeOptionsArray(grp);
        fixture.detectChanges();
        (component as any).deleteAssignmentOption("del-8");
        (component as any).directActionDialogState.onAction({} as Event);
        tick();
        expect(component.optionsArray.length).toBe(0);
      }));

      it("onAbort keeps option in optionsArray", () => {
        const grp = makeOptionGroup({ internalId: "del-9", id: 14 });
        component.optionsArray = makeOptionsArray(grp);
        fixture.detectChanges();
        (component as any).deleteAssignmentOption("del-9");
        (component as any).directActionDialogState.onAbort(true);
        expect(component.optionsArray.length).toBe(1);
      });

      it("directActionDialogState.open becomes false when dialog emits closed", () => {
        const grp = makeOptionGroup({ internalId: "del-10", id: 15 });
        component.optionsArray = makeOptionsArray(grp);
        fixture.detectChanges();
        (component as any).deleteAssignmentOption("del-10");
        fixture.detectChanges();

        const dialogCancelButton = fixture.debugElement.query(
          By.css('[data-testid="dialog-cancel-btn"]'),
        );
        expect(dialogCancelButton).toBeTruthy();
        dialogCancelButton.nativeElement.click();
        fixture.detectChanges();

        expect((component as any).directActionDialogState.open).toBe(false);
      });
    });
  });

  // -------------------------------------------------------------------------
  // _removeAssignmentOption – answer cleanup
  // -------------------------------------------------------------------------

  describe("_removeAssignmentOption answer cleanup", () => {
    it("removes answers from answerArray whose assignedOptionId matches option id", () => {
      const grp = makeOptionGroup({ internalId: "r1", id: null });

      const matchingAnswer = new FormGroup({
        assignedOptionId: new FormControl(null),
        id: new FormControl(null),
      });
      const nonMatchingAnswer = new FormGroup({
        assignedOptionId: new FormControl(99),
        id: new FormControl(1),
      });
      component.optionsArray = makeOptionsArray(grp);
      component.answerArray = new FormArray([
        matchingAnswer,
        nonMatchingAnswer,
      ]) as FormArray<FormGroup>;
      fixture.detectChanges();

      (component as any).deleteAssignmentOption("r1");
      (component as any).actionDialogState.onSubmit(true);

      // Option removed
      expect(component.optionsArray.length).toBe(0);
    });

    it("keeps answers that do not match the deleted option", () => {
      const grp = makeOptionGroup({ internalId: "r2", id: null });
      const nonMatchingAnswer = new FormGroup({
        assignedOptionId: new FormControl(99),
        id: new FormControl(1),
      });
      component.optionsArray = makeOptionsArray(grp);
      component.answerArray = new FormArray([
        nonMatchingAnswer,
      ]) as FormArray<FormGroup>;
      fixture.detectChanges();

      (component as any).deleteAssignmentOption("r2");
      (component as any).actionDialogState.onSubmit(true);

      expect(component.answerArray.length).toBe(1);
    });
  });

  // -------------------------------------------------------------------------
  // QuestionType exposure
  // -------------------------------------------------------------------------

  describe("QuestionType", () => {
    it("exposes QuestionType enum to the template", () => {
      expect((component as any).QuestionType).toBe(QuestionType);
    });
  });

  // -------------------------------------------------------------------------
  // getControl helper
  // -------------------------------------------------------------------------

  describe("getControl", () => {
    it("returns the correct FormControl for a given field and index", () => {
      const grp = makeOptionGroup({ internalId: "gc1", text: "hello" });
      component.optionsArray = makeOptionsArray(grp);
      fixture.detectChanges();
      const ctrl = component["getCtrlInternal"](grp, "text");
      expect(ctrl.value).toBe("hello");
    });
  });

  // -------------------------------------------------------------------------
  // ox-answer-form input bindings
  // -------------------------------------------------------------------------

  describe("ox-answer-form bindings", () => {
    it("passes 1-based assignedOptionId to each ox-answer-form", () => {
      component.optionsArray = makeOptionsArray(
        makeOptionGroup({ internalId: "af1" }),
        makeOptionGroup({ internalId: "af2" }),
      );
      fixture.detectChanges();
      const instances = fixture.debugElement
        .queryAll(By.css("ox-answer-form"))
        .map((de) => de.componentInstance);
      expect(instances[0].assignedOptionId()).toBe(1);
      expect(instances[1].assignedOptionId()).toBe(2);
    });

    it("passes QuestionType.ASSIGNMENT to ox-answer-form", () => {
      component.optionsArray = makeOptionsArray(
        makeOptionGroup({ internalId: "af3" }),
      );
      fixture.detectChanges();
      const instance = fixture.debugElement.query(
        By.css("ox-answer-form"),
      ).componentInstance;
      expect(instance.questionType()).toBe(QuestionType.ASSIGNMENT);
    });
  });
});
