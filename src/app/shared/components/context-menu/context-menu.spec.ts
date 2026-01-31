import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ContextMenu, ContextMenuItem } from './context-menu';
import { faBan, faBatteryEmpty, faEdit, faShare, faTrash } from '@fortawesome/free-solid-svg-icons';

describe('ContextMenuComponent', () => {
  let component: ContextMenu<any>;
  let fixture: ComponentFixture<ContextMenu<any>>;
  let compiled: HTMLElement;

  const mockMenuItems: ContextMenuItem<any>[] = [
    { label: 'Edit', icon: faEdit, action: jest.fn() },
    { label: 'Delete', icon: faTrash, action: jest.fn() },
    { label: 'Share', icon: faShare, action: jest.fn() }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContextMenu]
    }).compileComponents();

    fixture = TestBed.createComponent(ContextMenu);
    component = fixture.componentInstance;
    compiled = fixture.nativeElement;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initialize', () => {
    it('should be closed initially', () => {
      expect(component["isOpen"]()).toBe(false);
    });

    it('should not show menu initially', () => {
      fixture.componentRef.setInput('items', mockMenuItems);
      fixture.detectChanges();

      const menu = compiled.querySelector('[role="menu"]');
      expect(menu).toBeNull();
    });

    it('should show icon initially', () => {
      fixture.componentRef.setInput('items', mockMenuItems);
      fixture.detectChanges();

      const icon = compiled.querySelector('.fa-ellipsis-v');
      expect(icon).toBeTruthy();
    });
  });

  describe('Open / Close Menu', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('items', mockMenuItems);
      fixture.detectChanges();
    });

    it('should open menu on button click', () => {
      const button = compiled.querySelector('button') as HTMLButtonElement;
      button.click();
      fixture.detectChanges();

      expect(component["isOpen"]()).toBe(true);
      const menu = compiled.querySelector('[role="menu"]');
      expect(menu).toBeTruthy();
    });

    it('should emit menuOpened event on open', () => {
      jest.spyOn(component.menuOpened, 'emit');

      const button = compiled.querySelector('button') as HTMLButtonElement;
      button.click();

      expect(component.menuOpened.emit).toHaveBeenCalled();
    });

    it('should close menu on second button click', () => {
      const button = compiled.querySelector('button') as HTMLButtonElement;

      button.click();
      fixture.detectChanges();
      expect(component["isOpen"]()).toBe(true);

      button.click();
      fixture.detectChanges();
      expect(component["isOpen"]()).toBe(false);
    });

    it('should emit menuClosed event on close', () => {
      jest.spyOn(component.menuClosed, 'emit');

      const button = compiled.querySelector('button') as HTMLButtonElement;
      button.click();
      button.click();

      expect(component.menuClosed.emit).toHaveBeenCalled();
    });

    it('should close menu on click outside', () => {
      const button = compiled.querySelector('button') as HTMLButtonElement;
      button.click();
      fixture.detectChanges();

      expect(component["isOpen"]()).toBe(true);

      const outsideElement = document.createElement('div');
      document.body.appendChild(outsideElement);
      
      const clickEvent = new MouseEvent('click', { bubbles: true });
      outsideElement.dispatchEvent(clickEvent);
      fixture.detectChanges();

      expect(component["isOpen"]()).toBe(false);
      document.body.removeChild(outsideElement);
    });
  });

  describe('menu items render', () => {
    it('should render all menu items', () => {
      fixture.componentRef.setInput('items', mockMenuItems);
      fixture.detectChanges();

      const button = compiled.querySelector('button') as HTMLButtonElement;
      button.click();
      fixture.detectChanges();

      const menuItems = compiled.querySelectorAll('[role="menuitem"]');
      expect(menuItems.length).toBe(mockMenuItems.length);
    });

    it('should display correct labels', () => {
      fixture.componentRef.setInput('items', mockMenuItems);
      fixture.detectChanges();

      const button = compiled.querySelector('button') as HTMLButtonElement;
      button.click();
      fixture.detectChanges();

      const menuItems = compiled.querySelectorAll('[role="menuitem"]');
      menuItems.forEach((item, index) => {
        expect(item.textContent?.trim()).toContain(mockMenuItems[index].label);
      });
    });

    it('should display correct icons', () => {
      fixture.componentRef.setInput('items', mockMenuItems);
      fixture.detectChanges();

      const button = compiled.querySelector('button') as HTMLButtonElement;
      button.click();
      fixture.detectChanges();

      const icons = compiled.querySelectorAll('fa-icon');
      expect(icons.length).toBe(4);
    });

    it('should display empty state for empty items', () => {
      fixture.componentRef.setInput('items', []);
      fixture.detectChanges();

      const button = compiled.querySelector('button') as HTMLButtonElement;
      button.click();
      fixture.detectChanges();

      const emptyState = compiled.querySelector('.text-center');
      expect(emptyState?.textContent).toContain('No options available');
    });
  });

  describe('Item interactions', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('items', mockMenuItems);
      fixture.detectChanges();
    });

    it('should emit itemClicked', () => {
      jest.spyOn(component.itemClicked, 'emit');

      const button = compiled.querySelector('button') as HTMLButtonElement;
      button.click();
      fixture.detectChanges();

      const firstMenuItem = compiled.querySelector('[role="menuitem"]') as HTMLButtonElement;
      firstMenuItem.click();

      expect(component.itemClicked.emit).toHaveBeenCalledWith(mockMenuItems[0]);
    });

    it('should execute action function', () => {
      const button = compiled.querySelector('button') as HTMLButtonElement;
      button.click();
      fixture.detectChanges();

      const firstMenuItem = compiled.querySelector('[role="menuitem"]') as HTMLButtonElement;
      firstMenuItem.click();

      expect(mockMenuItems[0].action).toHaveBeenCalled();
    });

    it('should close menu after item click', () => {
      const button = compiled.querySelector('button') as HTMLButtonElement;
      button.click();
      fixture.detectChanges();

      const firstMenuItem = compiled.querySelector('[role="menuitem"]') as HTMLButtonElement;
      firstMenuItem.click();
      fixture.detectChanges();

      expect(component["isOpen"]()).toBe(false);
    });

    it('should not execute disabled item', () => {
      const disabledItem: ContextMenuItem<any> = {
        label: 'Disabled Item',
        icon: faBan,
        action: jest.fn(),
        disabled: true
      };

      fixture.componentRef.setInput('items', [disabledItem]);
      fixture.detectChanges();

      const button = compiled.querySelector('button') as HTMLButtonElement;
      button.click();
      fixture.detectChanges();

      const menuItem = compiled.querySelector('[role="menuitem"]') as HTMLButtonElement;
      menuItem.click();

      expect(disabledItem.action).not.toHaveBeenCalled();
      expect(component["isOpen"]()).toBe(true);
    });
  });

  describe('Divider', () => {
    it('should render divider', () => {
      const itemsWithDivider: ContextMenuItem<any>[] = [
        {
          label: 'Item 1', icon: faEdit,
          action: function (param?: any): void {
            throw new Error('Function not implemented.');
          }
        },
        {
          label: '', icon: faBatteryEmpty, divider: true,
          action: function (param?: any): void {
            throw new Error('Function not implemented.');
          }
        },
        {
          label: 'Item 2', icon: faTrash,
          action: function (param?: any): void {
            throw new Error('Function not implemented.');
          }
        }
      ];

      fixture.componentRef.setInput('items', itemsWithDivider);
      fixture.detectChanges();

      const button = compiled.querySelector('button') as HTMLButtonElement;
      button.click();
      fixture.detectChanges();

      const divider = compiled.querySelector('[role="separator"]');
      expect(divider).toBeTruthy();
    });
  });

  describe('Position', () => {
    it('should have bottom-right as default position', () => {
      fixture.componentRef.setInput('items', mockMenuItems);
      fixture.detectChanges();

      const button = compiled.querySelector('button') as HTMLButtonElement;
      button.click();
      fixture.detectChanges();

      const menu = compiled.querySelector('[role="menu"]');
      expect(menu?.classList.contains('right-0')).toBe(true);
    });

    it('should have bottom-left position', () => {
      fixture.componentRef.setInput('items', mockMenuItems);
      fixture.componentRef.setInput('position', 'bottom-left');
      fixture.detectChanges();

      const button = compiled.querySelector('button') as HTMLButtonElement;
      button.click();
      fixture.detectChanges();

      const menu = compiled.querySelector('[role="menu"]');
      expect(menu?.classList.contains('left-0')).toBe(true);
    });
  });

  describe('Disabled State', () => {
    it('should disable button', () => {
      fixture.componentRef.setInput('items', mockMenuItems);
      fixture.componentRef.setInput('disabled', true);
      fixture.detectChanges();

      const button = compiled.querySelector('button') as HTMLButtonElement;
      expect(button.disabled).toBe(true);
    });

    it('should not open menu on disabled state', () => {
      fixture.componentRef.setInput('items', mockMenuItems);
      fixture.componentRef.setInput('disabled', true);
      fixture.detectChanges();

      const button = compiled.querySelector('button') as HTMLButtonElement;
      button.click();
      fixture.detectChanges();

      expect(component["isOpen"]()).toBe(false);
    });
  });

  describe('Accessibility', () => {
    it('should set aria-label', () => {
      fixture.componentRef.setInput('items', mockMenuItems);
      fixture.componentRef.setInput('ariaLabel', 'Actions');
      fixture.detectChanges();

      const button = compiled.querySelector('button') as HTMLButtonElement;
      expect(button.getAttribute('aria-label')).toBe('Actions');
    });

    it('should set aria-expanded', () => {
      fixture.componentRef.setInput('items', mockMenuItems);
      fixture.detectChanges();

      const button = compiled.querySelector('button') as HTMLButtonElement;
      expect(button.getAttribute('aria-expanded')).toBe('false');

      button.click();
      fixture.detectChanges();
      expect(button.getAttribute('aria-expanded')).toBe('true');
    });
  });
});