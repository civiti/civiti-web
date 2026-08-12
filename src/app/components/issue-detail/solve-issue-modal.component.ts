import { Component, DestroyRef, Inject, OnDestroy, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { Store } from '@ngrx/store';
import { Actions, ofType } from '@ngrx/effects';
import { Subject, from, merge, of } from 'rxjs';
import { catchError, filter, switchMap, take, takeUntil, toArray } from 'rxjs/operators';
import { NgZorroModule } from '../../shared/ng-zorro.module';
import { AppState } from '../../store/app.state';
import * as UserIssuesActions from '../../store/user-issues/user-issues.actions';
import { PhotoUploadService } from '../../services/photo-upload.service';
import { StorageService, UploadResult } from '../../services/storage.service';
import { IssueDetailResponse } from '../../types/civica-api.types';

/**
 * Mirrors IssueValidationLimits.MaxResolutionPhotoCount on the backend, which rejects a fourth.
 * Deliberately not MAX_PHOTO_COUNT (8): a proof set has one job — show the fix — and a wall of
 * images buries it.
 */
const MAX_RESOLUTION_PHOTOS = 3;

export interface SolveIssueModalData {
    issue: IssueDetailResponse;
    /** The viewer's Supabase auth id. The modal only ever opens for the owner. */
    userId: string | null;
}

interface ProofPhoto {
    id: string;
    /** A blob: preview until the upload lands, then the public storage URL that gets sent. */
    url: string;
    storagePath: string;
    isUploading: boolean;
}

/**
 * The "Marchează ca rezolvată" confirmation, with an optional 1–3 photo proof picker.
 *
 * Replaces a plain NzModalService.confirm() so resolving can carry "after" photos. Attaching
 * them is optional throughout: the confirm button is live from the moment the modal opens, and
 * pressing it with nothing added is exactly the old behaviour. There is deliberately no
 * separate "skip" button — one would imply the photos were expected.
 *
 * Photos upload to Supabase storage as they are picked, so what reaches the API is a list of
 * public URLs. That is the same shape issue creation and the owner edit already use.
 */
@Component({
    selector: 'app-solve-issue-modal',
    standalone: true,
    imports: [CommonModule, NgZorroModule],
    templateUrl: './solve-issue-modal.component.html',
    styleUrl: './solve-issue-modal.component.scss'
})
export class SolveIssueModalComponent implements OnDestroy {
    private _store = inject(Store<AppState>);
    private _actions$ = inject(Actions);
    private _message = inject(NzMessageService);
    private _modalRef = inject(NzModalRef);
    private _destroyRef = inject(DestroyRef);
    private _photoUploadService = inject(PhotoUploadService);
    private _storageService = inject(StorageService);

    readonly maxPhotos = MAX_RESOLUTION_PHOTOS;
    readonly issue: IssueDetailResponse;
    private readonly _userId: string | null;

    photos = signal<ProofPhoto[]>([]);
    isSubmitting = signal(false);
    submitFailed = signal(false);

    isUploading = computed(() => this.photos().some(p => p.isUploading));
    /** Confirming mid-upload would send blob: URLs, which the backend rejects outright. */
    isBusy = computed(() => this.isUploading() || this.isSubmitting());
    canAddMore = computed(() => this.photos().length < MAX_RESOLUTION_PHOTOS);
    hasPhotos = computed(() => this.photos().length > 0);

    /** Stops ngOnDestroy deleting blobs the issue now points at. */
    private _submittedSuccessfully = false;
    private _ongoingUploads = new Map<string, Subject<void>>();

    constructor(@Inject(NZ_MODAL_DATA) data: SolveIssueModalData) {
        this.issue = data.issue;
        this._userId = data.userId;
    }

    /** The hidden input is addressed by id because the tile that opens it is not a <label>. */
    triggerFileInput(): void {
        const input = document.getElementById('resolution-photo-input') as HTMLInputElement | null;
        input?.click();
    }

    onFileSelected(event: Event): void {
        const target = event.target as HTMLInputElement;
        const files = target.files;
        if (!files || files.length === 0) return;

        if (this.photos().length + files.length > MAX_RESOLUTION_PHOTOS) {
            this._message.warning(`Poți adăuga cel mult ${MAX_RESOLUTION_PHOTOS} fotografii.`);
            target.value = '';
            return;
        }
        if (!this._userId) {
            this._message.error('Trebuie să fii autentificat pentru a încărca fotografii.');
            target.value = '';
            return;
        }

        const filesToProcess = Array.from(files);
        target.value = '';

        // merge, not forkJoin: one photo failing must not cancel its siblings.
        const tasks = filesToProcess.map(file => this.processFile(file));
        merge(...tasks).pipe(takeUntilDestroyed(this._destroyRef), toArray()).subscribe();
    }

    private processFile(file: File) {
        const validation = this._photoUploadService.validate(file);
        if (!validation.ok) {
            this._message.error(validation.reason);
            return of(null);
        }

        const id = 'proof-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
        const previewUrl = URL.createObjectURL(file);

        const cancel$ = new Subject<void>();
        this._ongoingUploads.set(id, cancel$);

        this.photos.update(list => [...list, {
            id,
            url: previewUrl,
            storagePath: '',
            isUploading: true,
        }]);

        // compress() strips EXIF and throws rather than returning the original on failure. The
        // catch below drops the photo for exactly that reason: falling back to the raw file
        // would publish the GPS coordinates of wherever the owner took it.
        return from(this._photoUploadService.compress(file)).pipe(
            switchMap(compressed => this._storageService.uploadPhotoWithRetry(this._userId!, compressed)),
            switchMap((result: UploadResult) => {
                // Removed while the upload was in flight → delete what we just wrote.
                if (!this.photos().some(p => p.id === id)) {
                    this._storageService.deletePhotoWithRetry(result.path)
                        .subscribe({ error: () => { } });
                    URL.revokeObjectURL(previewUrl);
                    return of(null);
                }
                this.photos.update(list => list.map(p =>
                    p.id === id ? { ...p, url: result.url, storagePath: result.path, isUploading: false } : p
                ));
                // Delayed so the <img> has swapped to the public URL before the blob dies.
                setTimeout(() => URL.revokeObjectURL(previewUrl), 500);
                return of(result);
            }),
            takeUntil(cancel$),
            catchError(error => {
                console.error('[SolveIssueModal] Încărcarea fotografiei a eșuat:', error);
                this.photos.update(list => list.filter(p => p.id !== id));
                URL.revokeObjectURL(previewUrl);
                this._message.error('Încărcarea fotografiei a eșuat. Încearcă din nou.');
                return of(null);
            })
        );
    }

    removePhoto(id: string): void {
        const photo = this.photos().find(p => p.id === id);
        if (!photo) return;

        this.photos.update(list => list.filter(p => p.id !== id));

        // Nothing here is server-owned yet — every photo in this list was uploaded in this
        // session — so a removal always deletes the object rather than orphaning it.
        if (photo.storagePath) {
            this._storageService.deletePhotoWithRetry(photo.storagePath)
                .subscribe({ error: () => { } });
        } else if (photo.url.startsWith('blob:')) {
            URL.revokeObjectURL(photo.url);
        }
    }

    /**
     * Called from the host's footer button. Dispatches, then holds the modal open until the
     * effect reports back — closing on dispatch would let the host's refetch race the PUT that
     * is still in flight, and capture pre-resolve state that nothing would ever correct.
     */
    confirmSolve(): void {
        if (this.isBusy()) return;

        this.isSubmitting.set(true);
        this.submitFailed.set(false);

        // Shut the implicit exits while the PUT is in flight. The footer buttons are disabled,
        // but ESC, the mask and the X bypass them entirely and would tear the component down
        // mid-request — losing the refetch and leaving the cleanup unable to tell a resolve that
        // succeeded from one that failed. Re-opened on failure so the modal is escapable again.
        this._modalRef.updateConfig({ nzMaskClosable: false, nzKeyboard: false, nzClosable: false });

        const urls = this.photos().map(p => p.url).filter(url => !url.startsWith('blob:'));

        merge(
            this._actions$.pipe(ofType(UserIssuesActions.markIssueAsSolvedSuccess)),
            this._actions$.pipe(ofType(UserIssuesActions.markIssueAsSolvedFailure))
        ).pipe(
            filter(action => action.issueId === this.issue.id),
            take(1),
            takeUntilDestroyed(this._destroyRef)
        ).subscribe(action => {
            this.isSubmitting.set(false);

            if (action.type === UserIssuesActions.markIssueAsSolvedSuccess.type) {
                this._submittedSuccessfully = true;
                this._modalRef.close(true);
            } else {
                // Stay open with the uploads intact: making the owner re-pick three photos
                // because the PUT failed is the worst possible answer to a transient error.
                this.submitFailed.set(true);
                this._modalRef.updateConfig({ nzMaskClosable: true, nzKeyboard: true, nzClosable: true });
            }
        });

        this._store.dispatch(UserIssuesActions.markIssueAsSolved({
            issueId: this.issue.id,
            resolutionPhotoUrls: urls.length ? urls : undefined
        }));
    }

    ngOnDestroy(): void {
        this._ongoingUploads.forEach(cancel$ => { cancel$.next(); cancel$.complete(); });

        // Deleting is only safe once the resolve is known to have failed. A modal torn down
        // while the PUT is still in flight has no idea which way it went, and the two mistakes
        // are not equally bad: keeping the objects costs a few orphaned blobs, deleting them
        // breaks every image on a public page the resolve may have just succeeded in creating.
        this.cleanupSessionUploads(!this._submittedSuccessfully && !this.isSubmitting());
    }

    /**
     * Revoke blob previews and, when the resolve did not go through, delete the storage objects
     * this session uploaded. Every photo here is session-owned, so abandoning the modal must
     * not leave them behind.
     *
     * Fire-and-forget with no takeUntilDestroyed on purpose: this runs during destroy, and
     * takeUntilDestroyed would cancel the delete the instant it was issued.
     */
    private cleanupSessionUploads(deleteStorage: boolean): void {
        for (const photo of this.photos()) {
            if (photo.url.startsWith('blob:')) {
                URL.revokeObjectURL(photo.url);
            }
            if (deleteStorage && photo.storagePath) {
                this._storageService.deletePhotoWithRetry(photo.storagePath).subscribe({ error: () => { } });
            }
        }
    }
}
