import { Pipe, PipeTransform, inject } from '@angular/core';
import { CategoryService } from '../services/category.service';

@Pipe({
  name: 'categoryColor',
  standalone: true,
  pure: true
})
export class CategoryColorPipe implements PipeTransform {
  private static readonly COLORS: Record<string, string> = {
    'infrastructure': 'orange',
    'environment': 'green',
    'publicservices': 'blue',
    'safety': 'red',
    'other': 'default'
  };

  transform(categoryId: string | null | undefined): string {
    if (!categoryId) return 'default';
    return CategoryColorPipe.COLORS[categoryId] || 'default';
  }
}

/**
 * Canonical PascalCase category value. Some endpoints return camelCase
 * ('publicServices') where the category list uses 'PublicServices'.
 */
function canonicalCategory(category: string): string {
  return category.charAt(0).toUpperCase() + category.slice(1);
}

/** Romanian label for a category value ('Infrastructure' → 'Infrastructură'). */
@Pipe({
  name: 'categoryLabel',
  standalone: true,
  pure: true
})
export class CategoryLabelPipe implements PipeTransform {
  private readonly _categories = inject(CategoryService);

  transform(category: string | null | undefined): string {
    return category ? this._categories.getCategoryLabel(canonicalCategory(category)) : '';
  }
}

/** Ant Design icon name for a category, matching the issue-creation picker. */
@Pipe({
  name: 'categoryIcon',
  standalone: true,
  pure: true
})
export class CategoryIconPipe implements PipeTransform {
  private static readonly ICONS: Record<string, string> = {
    'Infrastructure': 'tool',
    'Environment': 'environment',
    'Transportation': 'car',
    'PublicServices': 'bank',
    'Safety': 'safety',
    'Other': 'question-circle'
  };

  transform(category: string | null | undefined): string {
    return (category && CategoryIconPipe.ICONS[canonicalCategory(category)]) || 'question-circle';
  }
}
