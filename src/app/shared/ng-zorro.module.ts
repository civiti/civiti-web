import { NgModule } from '@angular/core';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzCollapseModule } from 'ng-zorro-antd/collapse';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzPageHeaderModule } from 'ng-zorro-antd/page-header';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzResultModule } from 'ng-zorro-antd/result';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzStepsModule } from 'ng-zorro-antd/steps';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzListModule } from 'ng-zorro-antd/list';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { NzMessageModule } from 'ng-zorro-antd/message';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzCommentModule } from 'ng-zorro-antd/comment';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';


// Import required icons
import { IconDefinition } from '@ant-design/icons-angular';
import {
  ArrowLeftOutline,
  CopyOutline,
  MailOutline,
  PhoneOutline,
  UserOutline,
  WarningOutline,
  LoadingOutline,
  CheckCircleOutline,
  CloseCircleOutline,
  InfoCircleOutline,
  ExclamationCircleOutline,
  PlusOutline,
  SearchOutline,
  FilterOutline,
  EnvironmentOutline,
  CalendarOutline,
  ClockCircleOutline,
  ShareAltOutline,
  FacebookOutline,
  TwitterOutline,
  LinkOutline,
  ZoomInOutline,
  PictureOutline,
  SendOutline,
  BankOutline,
  SafetyCertificateOutline,
  ApartmentOutline,
  TeamOutline,
  GlobalOutline,
  CompassOutline,
  ForwardOutline,
  HomeOutline,
  ReloadOutline,
  FileExclamationOutline,
  LeftOutline,
  RightOutline,
  EyeOutline,
  ArrowRightOutline,
  GoogleOutline,
  EyeInvisibleOutline,
  PlusCircleOutline,
  FileTextOutline,
  UserAddOutline,
  LoginOutline,
  LogoutOutline,
  DownOutline,
  SettingOutline,
  NotificationOutline,
  HeartOutline,
  LikeOutline,
  LikeFill,
  LockOutline,
  ToolOutline,
  MessageOutline,
  RobotOutline,
  UploadOutline,
  CameraOutline,
  DeleteOutline,
  EditOutline,
  CheckOutline,
  PercentageOutline,
  FieldTimeOutline,
  FlagOutline,
  InboxOutline
} from '@ant-design/icons-angular/icons';

const icons: IconDefinition[] = [
  ArrowLeftOutline,
  CopyOutline,
  MailOutline,
  PhoneOutline,
  UserOutline,
  WarningOutline,
  LoadingOutline,
  CheckCircleOutline,
  CloseCircleOutline,
  InfoCircleOutline,
  ExclamationCircleOutline,
  PlusOutline,
  SearchOutline,
  FilterOutline,
  CalendarOutline,
  ClockCircleOutline,
  ShareAltOutline,
  FacebookOutline,
  TwitterOutline,
  LinkOutline,
  ZoomInOutline,
  PictureOutline,
  SendOutline,
  BankOutline,
  SafetyCertificateOutline,
  ApartmentOutline,
  TeamOutline,
  GlobalOutline,
  CompassOutline,
  EnvironmentOutline,
  ForwardOutline,
  HomeOutline,
  ReloadOutline,
  FileExclamationOutline,
  LeftOutline,
  RightOutline,
  EyeOutline,
  ArrowRightOutline,
  GoogleOutline,
  EyeInvisibleOutline,
  PlusCircleOutline,
  FileTextOutline,
  UserAddOutline,
  LoginOutline,
  LogoutOutline,
  DownOutline,
  SettingOutline,
  NotificationOutline,
  HeartOutline,
  LikeOutline,
  LikeFill,
  LockOutline,
  ToolOutline,
  MessageOutline,
  RobotOutline,
  UploadOutline,
  CameraOutline,
  DeleteOutline,
  EditOutline,
  CheckOutline,
  PercentageOutline,
  FieldTimeOutline,
  FlagOutline,
  InboxOutline
];

const NgZorroModules = [
  NzButtonModule,
  NzCardModule,
  NzFormModule,
  NzInputModule,
  NzSelectModule,
  NzModalModule,
  NzTagModule,
  NzGridModule,
  NzIconModule,
  NzToolTipModule,
  NzTabsModule,
  NzCollapseModule,
  NzBadgeModule,
  NzDividerModule,
  NzSpaceModule,
  NzTypographyModule,
  NzLayoutModule,
  NzMenuModule,
  NzPageHeaderModule,
  NzSpinModule,
  NzEmptyModule,
  NzResultModule,
  NzAlertModule,
  NzCheckboxModule,
  NzStepsModule,
  NzProgressModule,
  NzStatisticModule,
  NzAvatarModule,
  NzListModule,
  NzDropDownModule,
  NzUploadModule,
  NzMessageModule,
  NzTableModule,
  NzRadioModule,
  NzCommentModule,
  NzPopconfirmModule
];

@NgModule({
  imports: [
    ...NgZorroModules,
    NzIconModule.forRoot(icons)
  ],
  exports: NgZorroModules
})
export class NgZorroModule { }