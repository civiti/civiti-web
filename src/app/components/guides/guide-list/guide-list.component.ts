import { Component, signal, computed } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { GUIDE_ARTICLES, GuideArticle } from '../../../generated/guide-data';

interface CategoryFilter {
  value: string;
  label: string;
}

@Component({
  selector: 'app-guide-list',
  standalone: true,
  imports: [RouterLink, DatePipe],
  templateUrl: './guide-list.component.html',
  styleUrl: './guide-list.component.scss',
})
export class GuideListComponent {
  readonly articles = GUIDE_ARTICLES;
  readonly categories: CategoryFilter[] = [
    { value: 'all', label: 'Toate' },
    { value: 'ghid-practic', label: 'Ghiduri practice' },
    { value: 'drepturi', label: 'Drepturi' },
  ];

  selectedCategory = signal('all');

  readonly categoryLabels: Readonly<Partial<Record<string, string>>> = {
    'ghid-practic': 'Ghid practic',
    'drepturi': 'Drepturi',
  };

  filteredArticles = computed(() => {
    const cat = this.selectedCategory();
    if (cat === 'all') return this.articles;
    return this.articles.filter(a => a.category === cat);
  });

  featuredArticle = computed<GuideArticle | undefined>(() => {
    return this.filteredArticles().find(a => a.featured) || this.filteredArticles()[0];
  });

  regularArticles = computed(() => {
    const featured = this.featuredArticle();
    return this.filteredArticles().filter(a => a !== featured);
  });

  selectCategory(value: string): void {
    this.selectedCategory.set(value);
  }
}
