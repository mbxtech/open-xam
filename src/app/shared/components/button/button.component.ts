import {Component, computed, input} from '@angular/core';

type ButtonVariant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';

@Component({
  selector: 'ox-button',
  imports: [],
  templateUrl: './button.component.html',
  styleUrl: './button.component.scss',
})
export class ButtonComponent {
  public variant = input<ButtonVariant>('default');
  public size = input<ButtonSize>('default');
  public type = input<'button' | 'submit' | 'reset'>('button');
  public disabled = input<boolean>(false);
  public ariaInvalid = input<boolean | undefined>(undefined);
  public class = input<string>('');

  protected buttonClasses = computed(() => {
    const baseClasses = 'cursor-pointer inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*=\'size-\'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive';

    const variantClasses = this.getVariantClasses(this.variant());
    const sizeClasses = this.getSizeClasses(this.size());
    const customClasses = this.class();

    return `${baseClasses} ${variantClasses} ${sizeClasses} ${customClasses}`.trim();
  });

  private getVariantClasses(variant: ButtonVariant): string {
    const variants: Record<ButtonVariant, string> = {
      default: 'bg-brand-primary text-white hover:opacity-90',
      destructive: 'bg-red-500 text-white hover:opacity-90',
      outline: 'border border-neutral-border bg-transparent text-default-font hover:bg-neutral-50 dark:hover:bg-neutral-800',
      secondary: 'bg-neutral-100 text-neutral-900 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-700',
      ghost: 'hover:bg-neutral-50 dark:hover:bg-neutral-800 text-default-font',
      link: 'text-brand-primary underline-offset-4 hover:underline'
    };
    return variants[variant] || variants.default;
  }

  private getSizeClasses(size: ButtonSize): string {
    const sizes: Record<ButtonSize, string> = {
      default: 'h-9 px-4 py-2 has-[>svg]:px-3',
      sm: 'h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5',
      lg: 'h-10 rounded-md px-6 has-[>svg]:px-4',
      icon: 'size-9 rounded-md'
    };
    return sizes[size] || sizes.default;
  }
}
