import { Pipe, PipeTransform } from '@angular/core';
import { ActivityType } from '../types/civica-api.types';

@Pipe({
  name: 'activityIcon',
  standalone: true,
  pure: true
})
export class ActivityIconPipe implements PipeTransform {
  private readonly icons: Record<ActivityType, string> = {
    'newSupporters': 'team',
    'statusChange': 'sync',
    'issueApproved': 'check-circle',
    'issueResolved': 'trophy',
    'issueCreated': 'plus-circle'
  };

  transform(type: ActivityType): string {
    return this.icons[type] || 'bell';
  }
}

@Pipe({
  name: 'activityColor',
  standalone: true,
  pure: true
})
export class ActivityColorPipe implements PipeTransform {
  private readonly colors: Record<ActivityType, string> = {
    'newSupporters': '#FCA311',
    'statusChange': '#1890ff',
    'issueApproved': '#52c41a',
    'issueResolved': '#52c41a',
    'issueCreated': '#14213D'
  };

  transform(type: ActivityType): string {
    return this.colors[type] || '#14213D';
  }
}
