import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule } from '@angular/forms';
import { ProductReviewsService } from '../../../core/services/product-reviews.service';
import { ProductReview } from '../../../shared/models/product-review.model';
import { finalize } from 'rxjs/operators';
import { AccountService } from '../../../core/services/account.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
    selector: 'product-reviews',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatIconModule,
        MatButtonModule,
        MatDividerModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatProgressSpinnerModule,
        TranslateModule
    ],
    templateUrl: 'product-reviews.html',
    styleUrls: ['product-reviews.scss']
})
export class ProductReviewsComponent implements OnChanges {
    @Input() productId?: number;
    @Input() reviews: ProductReview[] = [];
    @Input() loggedIn: boolean = false;
    @Output() reviewsChanged = new EventEmitter<ProductReview[]>();
    
    constructor(private translate: TranslateService) {}

    loading = false;
    error: string | null = null;

    newCommentText: string = '';
    newCommentRating: number = 5;
    hoverRating: number = 0;

    setRating(r: number): void {
        this.newCommentRating = r;
    }

    setHoverRating(r: number): void {
        this.hoverRating = r;
    }

    clearHoverRating(): void {
        this.hoverRating = 0;
    }

    getFormStarIcon(star: number): string {
        return (this.hoverRating || this.newCommentRating) >= star ? 'star' : 'star_border';
    }

    getRelativeTime(date: Date | string | undefined): string {
        if (!date) return '';
        const now = new Date();
        const then = new Date(date);
        const diffMs = now.getTime() - then.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        if (diffDays === 0) return 'today';
        if (diffDays === 1) return '1 day ago';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 14) return '1 week ago';
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
        if (diffDays < 60) return '1 month ago';
        if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
        if (diffDays < 730) return '1 year ago';
        return `${Math.floor(diffDays / 365)} years ago`;
    }

    public accountService = inject(AccountService);
    private reviewsService = inject(ProductReviewsService);

    get reviewsWithComments(): ProductReview[] {
        return (this.reviews || []).filter(r => r.description && r.description.trim().length > 0);
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['reviews']?.currentValue) {
            this.reviews = [...this.reviews!];
        } else if (this.productId && !this.reviews) {
            this.loadReviews();
        }
    }

    private loadReviews() {
        if (!this.productId) return;
        
        this.loading = true;
        this.error = null;
        
        this.reviewsService.getReviewsForProduct(this.productId).pipe(
            finalize(() => this.loading = false)
        ).subscribe({
            next: (reviews) => {
                this.reviews = [...reviews];
                this.reviewsChanged.emit(this.reviews);
            },
            error: (err) => {
                this.error = this.translate.instant('ERROR_MESSAGES.ERROR_LOADING_REVIEWS');
                console.error('Error loading reviews:', err);
            }
        });
    }

    addComment() {
        if (!this.loggedIn || !this.productId) return;

        const currentUser = this.accountService.currentUser();
        if (!currentUser) {
            this.error = this.translate.instant('ERROR_MESSAGES.MUST_BE_LOGGED_IN_FOR_REVIEW');
            return;
        }

        const newReview = {
            Description: this.newCommentText?.trim() || '',
            Rating: this.newCommentRating
        };

        this.loading = true;
        this.reviewsService.createReview(this.productId, newReview).subscribe({
            next: (response) => {
                if (this.productId) {
                    this.loadReviews();
                } else {
                    this.reviews = this.reviews || [];
                    this.reviews = [response, ...this.reviews];
                }
                this.newCommentText = '';
                this.newCommentRating = 5;
            },
            error: (err) => {
                this.error = this.translate.instant('ERROR_MESSAGES.ERROR_ADDING_REVIEW');
                console.error('Error adding review:', err);
                this.loading = false;
            }
        });
    }

    trackByReviewId(_index: number, review: ProductReview): number {
        return review.id;
    }
}
