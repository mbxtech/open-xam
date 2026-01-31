import {ComponentFixture, TestBed} from '@angular/core/testing';
import {Component} from '@angular/core';
import {By} from '@angular/platform-browser';
import {UploadedFilesSummary} from './uploaded-files-summary';

@Component({
  template: `
    <ox-uploaded-files-summary>
      <div class="projected-content">Projected Content</div>
      <span class="another-element">Another Element</span>
    </ox-uploaded-files-summary>
  `,
  imports: [UploadedFilesSummary]
})
class TestHostWithContentComponent {}

@Component({
  template: `<ox-uploaded-files-summary></ox-uploaded-files-summary>`,
  imports: [UploadedFilesSummary]
})
class TestHostEmptyComponent {}

@Component({
  template: `
    <ox-uploaded-files-summary>
      <div class="nested-content">
        <div class="level-1">
          <div class="level-2">
            <span class="deep-content">Deeply Nested Content</span>
          </div>
        </div>
      </div>
    </ox-uploaded-files-summary>
  `,
  imports: [UploadedFilesSummary]
})
class TestHostWithNestedContentComponent {}

@Component({
  template: `
    <ox-uploaded-files-summary>
      <button class="action-button" (click)="onClick()">Click Me</button>
    </ox-uploaded-files-summary>
  `,
  imports: [UploadedFilesSummary]
})
class TestHostWithInteractiveContentComponent {
  clicked = false;

  onClick() {
    this.clicked = true;
  }
}

@Component({
  template: `
    <ox-uploaded-files-summary>
      @for (item of items; track item) {
        <div class="dynamic-item">{{ item }}</div>
      }
    </ox-uploaded-files-summary>
  `,
  imports: [UploadedFilesSummary]
})
class DynamicContentComponent {
  items = ['Item 1', 'Item 2', 'Item 3'];
}

@Component({
  template: `
    <ox-uploaded-files-summary>
      @for (item of items; track item) {
        <div class="updating-item">{{ item }}</div>
      }
    </ox-uploaded-files-summary>
  `,
  imports: [UploadedFilesSummary]
})
class UpdatingContentComponent {
  items = ['Initial'];
}

@Component({
  template: `
    <ox-uploaded-files-summary>
      @if (showContent) {
        <div class="conditional-content">Visible Content</div>
      }
    </ox-uploaded-files-summary>
  `,
  imports: [UploadedFilesSummary]
})
class ConditionalContentComponent {
  showContent = false;
}

@Component({
  template: `
    <ox-uploaded-files-summary>

    </ox-uploaded-files-summary>
  `,
  imports: [UploadedFilesSummary]
})
class WhitespaceContentComponent {}

@Component({
  template: `
    <ox-uploaded-files-summary>
      <div class="special-chars">Special: &amp; &lt; &gt; "quotes" 'apostrophe'</div>
    </ox-uploaded-files-summary>
  `,
  imports: [UploadedFilesSummary]
})
class SpecialCharsContentComponent {}

@Component({
  template: `
    <ox-uploaded-files-summary>
      <div class="unicode-content">Unicode: 日本語 中文 한국어 العربية</div>
    </ox-uploaded-files-summary>
  `,
  imports: [UploadedFilesSummary]
})
class UnicodeContentComponent {}

@Component({
  template: `
    <ox-uploaded-files-summary>
      <div class="emoji-content">Emojis: 📁 📄 ✅ ❌ 🔄</div>
    </ox-uploaded-files-summary>
  `,
  imports: [UploadedFilesSummary]
})
class EmojiContentComponent {}

@Component({
  template: `
    <ox-uploaded-files-summary>
      @for (item of items; track item) {
        <div class="bulk-item">{{ item }}</div>
      }
    </ox-uploaded-files-summary>
  `,
  imports: [UploadedFilesSummary]
})
class BulkItemsComponent {
  items = Array.from({length: 100}, (_, i) => `Item ${i + 1}`);
}

@Component({
  template: `
    <ox-uploaded-files-summary>
      <div
        class="accessible-content"
        role="list"
        aria-label="File list"
      >
        <div role="listitem" aria-label="File 1">File 1</div>
      </div>
    </ox-uploaded-files-summary>
  `,
  imports: [UploadedFilesSummary]
})
class AccessibleContentComponent {}

describe('UploadedFilesSummary', () => {
  let component: UploadedFilesSummary;
  let fixture: ComponentFixture<UploadedFilesSummary>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        UploadedFilesSummary,
        TestHostWithContentComponent,
        TestHostEmptyComponent,
        TestHostWithNestedContentComponent,
        TestHostWithInteractiveContentComponent,
        DynamicContentComponent,
        UpdatingContentComponent,
        ConditionalContentComponent,
        WhitespaceContentComponent,
        SpecialCharsContentComponent,
        UnicodeContentComponent,
        EmojiContentComponent,
        BulkItemsComponent,
        AccessibleContentComponent
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(UploadedFilesSummary);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Component rendering', () => {
    it('should have the correct selector', () => {
      const hostFixture = TestBed.createComponent(TestHostWithContentComponent);
      hostFixture.detectChanges();

      const summaryElement = hostFixture.debugElement.query(By.css('ox-uploaded-files-summary'));
      expect(summaryElement).toBeTruthy();
    });

    it('should render without errors when empty', () => {
      const hostFixture = TestBed.createComponent(TestHostEmptyComponent);
      expect(() => hostFixture.detectChanges()).not.toThrow();

      const summaryElement = hostFixture.debugElement.query(By.directive(UploadedFilesSummary));
      expect(summaryElement).toBeTruthy();
    });
  });

  describe('Content projection', () => {
    it('should project single element content', () => {
      const hostFixture = TestBed.createComponent(TestHostWithContentComponent);
      hostFixture.detectChanges();

      const projectedContent = hostFixture.debugElement.query(By.css('.projected-content'));
      expect(projectedContent).toBeTruthy();
      expect(projectedContent.nativeElement.textContent).toBe('Projected Content');
    });

    it('should project multiple elements', () => {
      const hostFixture = TestBed.createComponent(TestHostWithContentComponent);
      hostFixture.detectChanges();

      const projectedDiv = hostFixture.debugElement.query(By.css('.projected-content'));
      const projectedSpan = hostFixture.debugElement.query(By.css('.another-element'));

      expect(projectedDiv).toBeTruthy();
      expect(projectedSpan).toBeTruthy();
      expect(projectedSpan.nativeElement.textContent).toBe('Another Element');
    });

    it('should project nested content correctly', () => {
      const hostFixture = TestBed.createComponent(TestHostWithNestedContentComponent);
      hostFixture.detectChanges();

      const deepContent = hostFixture.debugElement.query(By.css('.deep-content'));
      expect(deepContent).toBeTruthy();
      expect(deepContent.nativeElement.textContent).toBe('Deeply Nested Content');
    });

    it('should maintain content hierarchy', () => {
      const hostFixture = TestBed.createComponent(TestHostWithNestedContentComponent);
      hostFixture.detectChanges();

      const nestedContent = hostFixture.debugElement.query(By.css('.nested-content'));
      const level1 = nestedContent.query(By.css('.level-1'));
      const level2 = level1.query(By.css('.level-2'));
      const deepContent = level2.query(By.css('.deep-content'));

      expect(nestedContent).toBeTruthy();
      expect(level1).toBeTruthy();
      expect(level2).toBeTruthy();
      expect(deepContent).toBeTruthy();
    });
  });

  describe('Interactive content', () => {
    it('should allow interaction with projected content', () => {
      const hostFixture = TestBed.createComponent(TestHostWithInteractiveContentComponent);
      hostFixture.detectChanges();

      const button = hostFixture.debugElement.query(By.css('.action-button'));
      expect(button).toBeTruthy();

      button.triggerEventHandler('click', new MouseEvent('click'));
      hostFixture.detectChanges();

      expect(hostFixture.componentInstance.clicked).toBe(true);
    });

    it('should preserve event bindings on projected content', () => {
      const hostFixture = TestBed.createComponent(TestHostWithInteractiveContentComponent);
      hostFixture.detectChanges();

      const clickSpy = jest.spyOn(hostFixture.componentInstance, 'onClick');

      const button = hostFixture.debugElement.query(By.css('.action-button'));
      button.triggerEventHandler('click', new MouseEvent('click'));

      expect(clickSpy).toHaveBeenCalled();
    });
  });

  describe('Dynamic content', () => {
    it('should handle dynamically generated content', () => {
      const hostFixture = TestBed.createComponent(DynamicContentComponent);
      hostFixture.detectChanges();

      const dynamicItems = hostFixture.debugElement.queryAll(By.css('.dynamic-item'));
      expect(dynamicItems.length).toBe(3);
      expect(dynamicItems[0].nativeElement.textContent).toBe('Item 1');
      expect(dynamicItems[1].nativeElement.textContent).toBe('Item 2');
      expect(dynamicItems[2].nativeElement.textContent).toBe('Item 3');
    });

    it('should update when projected content changes', () => {
      const hostFixture = TestBed.createComponent(UpdatingContentComponent);
      hostFixture.detectChanges();

      let dynamicItems = hostFixture.debugElement.queryAll(By.css('.updating-item'));
      expect(dynamicItems.length).toBe(1);

      hostFixture.componentInstance.items = ['Item 1', 'Item 2'];
      hostFixture.detectChanges();

      dynamicItems = hostFixture.debugElement.queryAll(By.css('.updating-item'));
      expect(dynamicItems.length).toBe(2);
    });

    it('should handle conditional content', () => {
      const hostFixture = TestBed.createComponent(ConditionalContentComponent);
      hostFixture.detectChanges();

      let conditionalContent = hostFixture.debugElement.query(By.css('.conditional-content'));
      expect(conditionalContent).toBeNull();

      hostFixture.componentInstance.showContent = true;
      hostFixture.detectChanges();

      conditionalContent = hostFixture.debugElement.query(By.css('.conditional-content'));
      expect(conditionalContent).toBeTruthy();
      expect(conditionalContent.nativeElement.textContent).toBe('Visible Content');
    });
  });

  describe('Edge cases', () => {
    it('should handle whitespace-only content', () => {
      const hostFixture = TestBed.createComponent(WhitespaceContentComponent);
      expect(() => hostFixture.detectChanges()).not.toThrow();
    });

    it('should handle content with special characters', () => {
      const hostFixture = TestBed.createComponent(SpecialCharsContentComponent);
      hostFixture.detectChanges();

      const specialChars = hostFixture.debugElement.query(By.css('.special-chars'));
      expect(specialChars.nativeElement.textContent).toContain('&');
      expect(specialChars.nativeElement.textContent).toContain('<');
      expect(specialChars.nativeElement.textContent).toContain('>');
    });

    it('should handle unicode content', () => {
      const hostFixture = TestBed.createComponent(UnicodeContentComponent);
      hostFixture.detectChanges();

      const unicodeContent = hostFixture.debugElement.query(By.css('.unicode-content'));
      expect(unicodeContent.nativeElement.textContent).toContain('日本語');
      expect(unicodeContent.nativeElement.textContent).toContain('中文');
    });

    it('should handle emoji content', () => {
      const hostFixture = TestBed.createComponent(EmojiContentComponent);
      hostFixture.detectChanges();

      const emojiContent = hostFixture.debugElement.query(By.css('.emoji-content'));
      expect(emojiContent.nativeElement.textContent).toContain('📁');
      expect(emojiContent.nativeElement.textContent).toContain('✅');
    });

    it('should handle large number of projected items', () => {
      const hostFixture = TestBed.createComponent(BulkItemsComponent);
      hostFixture.detectChanges();

      const bulkItems = hostFixture.debugElement.queryAll(By.css('.bulk-item'));
      expect(bulkItems.length).toBe(100);
    });
  });

  describe('Accessibility', () => {
    it('should preserve aria attributes on projected content', () => {
      const hostFixture = TestBed.createComponent(AccessibleContentComponent);
      hostFixture.detectChanges();

      const accessibleContent = hostFixture.debugElement.query(By.css('.accessible-content'));
      expect(accessibleContent.nativeElement.getAttribute('role')).toBe('list');
      expect(accessibleContent.nativeElement.getAttribute('aria-label')).toBe('File list');

      const listItem = hostFixture.debugElement.query(By.css('[role="listitem"]'));
      expect(listItem.nativeElement.getAttribute('aria-label')).toBe('File 1');
    });
  });
});
