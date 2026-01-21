import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { tap, shareReplay, map, catchError, finalize } from 'rxjs/operators';
import { ApiService } from './api.service';
import { CategoryResponse } from '../types/civica-api.types';

/**
 * Extended category info for UI display
 */
export interface CategoryInfo {
  id: string;
  name: string;
  description: string;
  icon: string;
  examples: string[];
}

/**
 * Service for managing issue categories.
 * Caches categories from the backend and provides helper methods.
 */
@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private categories$ = new BehaviorSubject<CategoryResponse[]>([]);
  private loaded = false;
  private loading$: Observable<CategoryResponse[]> | null = null;

  /** Fallback labels used when categories haven't been loaded from backend yet */
  private static readonly FALLBACK_LABELS: Record<string, string> = {
    'Infrastructure': 'Infrastructură',
    'Environment': 'Mediu',
    'Transportation': 'Transport',
    'PublicServices': 'Servicii Publice',
    'Safety': 'Siguranță',
    'Other': 'Altele'
  };

  constructor(private apiService: ApiService) {}

  /**
   * Load categories from backend. Caches result for subsequent calls.
   */
  loadCategories(): Observable<CategoryResponse[]> {
    if (this.loaded) {
      return of(this.categories$.value);
    }

    if (this.loading$) {
      return this.loading$;
    }

    this.loading$ = this.apiService.getCategories().pipe(
      tap(categories => {
        this.categories$.next(categories);
        this.loaded = true;
      }),
      catchError(error => {
        console.error('[CategoryService] Failed to load categories:', error);
        // Return empty array on error, allowing retry on next call
        return of([]);
      }),
      finalize(() => {
        // Always reset loading$ so subsequent calls can retry
        this.loading$ = null;
      }),
      shareReplay(1)
    );

    return this.loading$;
  }

  /**
   * Get categories as observable (loads if not cached)
   */
  getCategories(): Observable<CategoryResponse[]> {
    return this.loadCategories();
  }

  /**
   * Get cached categories synchronously (empty if not loaded yet)
   */
  getCategoriesSync(): CategoryResponse[] {
    return this.categories$.value;
  }

  /**
   * Get category label by value (English ID -> Romanian label).
   * Uses cached value if available, falls back to static map if not loaded yet.
   */
  getCategoryLabel(value: string): string {
    const category = this.categories$.value.find(c => c.value === value);
    if (category) {
      return category.label;
    }
    // Fallback to static labels if categories not loaded yet
    return CategoryService.FALLBACK_LABELS[value] || value;
  }

  /**
   * Get categories with full UI info (icons, descriptions, examples)
   */
  getCategoriesWithInfo(): Observable<CategoryInfo[]> {
    return this.loadCategories().pipe(
      map(categories => categories.map(cat => ({
        id: cat.value,
        name: cat.label,
        description: this.getCategoryDescription(cat.value),
        icon: this.getCategoryIcon(cat.value),
        examples: this.getCategoryExamples(cat.value)
      })))
    );
  }

  /**
   * Get icon for category (Ant Design icon names)
   */
  private getCategoryIcon(categoryId: string): string {
    const icons: Record<string, string> = {
      'Infrastructure': 'tool',
      'Environment': 'environment',
      'Transportation': 'car',
      'PublicServices': 'bank',
      'Safety': 'safety',
      'Other': 'question-circle'
    };
    return icons[categoryId] || 'question-circle';
  }

  /**
   * Get description for category
   */
  private getCategoryDescription(categoryId: string): string {
    const descriptions: Record<string, string> = {
      'Infrastructure': 'Drumuri, trotuare, poduri, clădiri publice deteriorate',
      'Environment': 'Poluare, gunoi, spații verzi neîngrijite',
      'Transportation': 'Transport public, trafic, parcări',
      'PublicServices': 'Utilități, servicii administrative, instituții',
      'Safety': 'Iluminat public, zone periculoase, siguranță rutieră',
      'Other': 'Alte probleme civice care nu se încadrează în categoriile de mai sus'
    };
    return descriptions[categoryId] || 'Probleme civice generale';
  }

  /**
   * Get example issues for category
   */
  private getCategoryExamples(categoryId: string): string[] {
    const examples: Record<string, string[]> = {
      'Infrastructure': [
        'Gropi în asfalt',
        'Trotuare deteriorate',
        'Clădiri în paragină',
        'Canalizare defectă'
      ],
      'Environment': [
        'Gunoi abandonat',
        'Copaci căzuți',
        'Parcuri neîngrijite',
        'Poluare'
      ],
      'Transportation': [
        'Stații bus deteriorate',
        'Semafoare defecte',
        'Parcări ilegale',
        'Marcaje rutiere șterse'
      ],
      'PublicServices': [
        'Apă curentă oprită',
        'Probleme cu gazele',
        'Birouri închise',
        'Servicii întârziate'
      ],
      'Safety': [
        'Stâlpi de iluminat defecți',
        'Zone întunecate',
        'Treceri periculoase',
        'Indicatoare lipsă'
      ],
      'Other': [
        'Zgomot excesiv',
        'Animale abandonate',
        'Afișaj stradal deteriorat',
        'Alte probleme'
      ]
    };
    return examples[categoryId] || ['Alte probleme civice'];
  }
}
