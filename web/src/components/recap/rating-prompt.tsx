'use client';

import * as React from 'react';
import { Star, Heart, ThumbsUp, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

// =============================================================================
// Types
// =============================================================================

export interface SessionRating {
  overall: number; // 1-5 stars
  helpful: boolean;
  feedback?: string;
}

interface RatingPromptProps {
  sessionId: string;
  onSubmit: (rating: SessionRating) => void;
  onSkip?: () => void;
  isSubmitting?: boolean;
  className?: string;
}

interface StarRatingProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

interface RatingPromptDialogProps {
  sessionId: string;
  onSubmit: (rating: SessionRating) => void;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

// =============================================================================
// Sub-Components
// =============================================================================

/**
 * Star rating input component.
 */
export function StarRating({
  value,
  onChange,
  disabled = false,
  size = 'md',
}: StarRatingProps) {
  const [hoverValue, setHoverValue] = React.useState<number | null>(null);

  const sizeClasses = {
    sm: 'h-5 w-5',
    md: 'h-8 w-8',
    lg: 'h-10 w-10',
  };

  const displayValue = hoverValue ?? value;

  return (
    <div
      className="flex items-center gap-1"
      role="radiogroup"
      aria-label="Session rating"
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHoverValue(star)}
          onMouseLeave={() => setHoverValue(null)}
          disabled={disabled}
          className={cn(
            'transition-transform focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2 rounded',
            !disabled && 'hover:scale-110 cursor-pointer',
            disabled && 'cursor-not-allowed opacity-50'
          )}
          role="radio"
          aria-checked={star === value}
          aria-label={`${star} star${star !== 1 ? 's' : ''}`}
        >
          <Star
            className={cn(
              sizeClasses[size],
              'transition-colors',
              star <= displayValue
                ? 'fill-status-warning text-status-warning'
                : 'fill-transparent text-muted-foreground'
            )}
          />
        </button>
      ))}
    </div>
  );
}

/**
 * Helpful yes/no toggle.
 */
function HelpfulToggle({
  value,
  onChange,
  disabled = false,
}: {
  value: boolean | null;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-muted-foreground">Was Diadi helpful?</span>
      <div className="flex gap-2">
        <Button
          type="button"
          variant={value === true ? 'secondary' : 'outline'}
          size="sm"
          onClick={() => onChange(true)}
          disabled={disabled}
          className="gap-1.5"
        >
          <ThumbsUp className="h-4 w-4" />
          Yes
        </Button>
        <Button
          type="button"
          variant={value === false ? 'secondary' : 'outline'}
          size="sm"
          onClick={() => onChange(false)}
          disabled={disabled}
          className="gap-1.5"
        >
          <ThumbsUp className="h-4 w-4 rotate-180" />
          No
        </Button>
      </div>
    </div>
  );
}

// =============================================================================
// Main Components
// =============================================================================

/**
 * RatingPrompt - Post-session rating card.
 *
 * Allows users to rate their session experience with stars,
 * indicate if Diadi was helpful, and provide optional feedback.
 *
 * Reference: requirements.md Section 6.9 Post-Session Recap Design
 */
export function RatingPrompt({
  sessionId,
  onSubmit,
  onSkip,
  isSubmitting = false,
  className,
}: RatingPromptProps) {
  const [rating, setRating] = React.useState(0);
  const [helpful, setHelpful] = React.useState<boolean | null>(null);
  const [feedback, setFeedback] = React.useState('');
  const [isSubmitted, setIsSubmitted] = React.useState(false);

  const canSubmit = rating > 0 && helpful !== null;

  const handleSubmit = () => {
    if (!canSubmit) return;

    onSubmit({
      overall: rating,
      helpful: helpful!,
      feedback: feedback.trim() || undefined,
    });
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <Card className={cn('text-center', className)}>
        <CardContent className="py-8">
          <Heart className="mx-auto h-12 w-12 text-secondary" />
          <h3 className="mt-4 font-serif text-xl font-semibold">Thank You!</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Your feedback helps us improve Diadi.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle className="font-serif text-xl">How was your session?</CardTitle>
        <CardDescription>
          Your feedback helps us improve the experience.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Star rating */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Overall experience</p>
          <StarRating
            value={rating}
            onChange={setRating}
            disabled={isSubmitting}
            size="lg"
          />
          {rating > 0 && (
            <p className="text-sm text-muted-foreground">
              {rating === 5
                ? 'Excellent!'
                : rating === 4
                  ? 'Great!'
                  : rating === 3
                    ? 'Good'
                    : rating === 2
                      ? 'Fair'
                      : 'Poor'}
            </p>
          )}
        </div>

        {/* Helpful toggle */}
        <HelpfulToggle
          value={helpful}
          onChange={setHelpful}
          disabled={isSubmitting}
        />

        {/* Optional feedback */}
        <div className="space-y-2">
          <label htmlFor={`feedback-${sessionId}`} className="text-sm font-medium">
            Anything else you&apos;d like to share? (optional)
          </label>
          <Textarea
            id={`feedback-${sessionId}`}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Share your thoughts about the session..."
            rows={3}
            disabled={isSubmitting}
            className="resize-none"
          />
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        {onSkip && (
          <Button
            variant="ghost"
            onClick={onSkip}
            disabled={isSubmitting}
          >
            Skip
          </Button>
        )}
        <Button
          onClick={handleSubmit}
          disabled={!canSubmit || isSubmitting}
          className={cn(!onSkip && 'ml-auto')}
        >
          {isSubmitting ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Submitting...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Submit Feedback
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}

/**
 * RatingPromptCompact - Minimal inline rating prompt.
 */
export function RatingPromptCompact({
  onSubmit,
  isSubmitting = false,
  className,
}: {
  onSubmit: (rating: number) => void;
  isSubmitting?: boolean;
  className?: string;
}) {
  const [rating, setRating] = React.useState(0);
  const [submitted, setSubmitted] = React.useState(false);

  const handleSubmit = (value: number) => {
    setRating(value);
    onSubmit(value);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className={cn('flex items-center gap-2 text-sm', className)}>
        <Heart className="h-4 w-4 text-secondary" />
        <span className="text-muted-foreground">Thanks for rating!</span>
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <span className="text-sm text-muted-foreground">Rate session:</span>
      <StarRating
        value={rating}
        onChange={handleSubmit}
        disabled={isSubmitting}
        size="sm"
      />
    </div>
  );
}

/**
 * RatingPromptDialog - Rating prompt in a dialog/modal.
 */
export function RatingPromptDialog({
  sessionId,
  onSubmit,
  trigger,
  open,
  onOpenChange,
}: RatingPromptDialogProps) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  const setIsOpen = isControlled
    ? (onOpenChange ?? (() => {}))
    : setInternalOpen;

  const handleSubmit = async (rating: SessionRating) => {
    setIsSubmitting(true);
    try {
      await onSubmit(rating);
      // Close dialog after short delay to show thank you message
      setTimeout(() => setIsOpen(false), 1500);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">
            How was your session?
          </DialogTitle>
          <DialogDescription>
            Your feedback helps us improve the experience.
          </DialogDescription>
        </DialogHeader>
        <RatingPromptInner
          sessionId={sessionId}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      </DialogContent>
    </Dialog>
  );
}

/**
 * Inner rating form for dialog use.
 */
function RatingPromptInner({
  sessionId,
  onSubmit,
  isSubmitting,
}: {
  sessionId: string;
  onSubmit: (rating: SessionRating) => void;
  isSubmitting: boolean;
}) {
  const [rating, setRating] = React.useState(0);
  const [helpful, setHelpful] = React.useState<boolean | null>(null);
  const [feedback, setFeedback] = React.useState('');
  const [isSubmitted, setIsSubmitted] = React.useState(false);

  const canSubmit = rating > 0 && helpful !== null;

  const handleSubmit = () => {
    if (!canSubmit) return;

    onSubmit({
      overall: rating,
      helpful: helpful!,
      feedback: feedback.trim() || undefined,
    });
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <div className="py-8 text-center">
        <Heart className="mx-auto h-12 w-12 text-secondary" />
        <h3 className="mt-4 font-serif text-xl font-semibold">Thank You!</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Your feedback helps us improve Diadi.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-4">
      {/* Star rating */}
      <div className="space-y-2">
        <p className="text-sm font-medium">Overall experience</p>
        <div className="flex justify-center">
          <StarRating
            value={rating}
            onChange={setRating}
            disabled={isSubmitting}
            size="lg"
          />
        </div>
      </div>

      {/* Helpful toggle */}
      <div className="flex justify-center">
        <HelpfulToggle
          value={helpful}
          onChange={setHelpful}
          disabled={isSubmitting}
        />
      </div>

      {/* Optional feedback */}
      <div className="space-y-2">
        <label htmlFor={`dialog-feedback-${sessionId}`} className="text-sm font-medium">
          Anything else? (optional)
        </label>
        <Textarea
          id={`dialog-feedback-${sessionId}`}
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Share your thoughts..."
          rows={3}
          disabled={isSubmitting}
          className="resize-none"
        />
      </div>

      {/* Submit button */}
      <Button
        onClick={handleSubmit}
        disabled={!canSubmit || isSubmitting}
        className="w-full"
      >
        {isSubmitting ? (
          <>
            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            Submitting...
          </>
        ) : (
          <>
            <Send className="mr-2 h-4 w-4" />
            Submit Feedback
          </>
        )}
      </Button>
    </div>
  );
}

/**
 * RatingPromptSkeleton - Loading skeleton for rating prompt.
 */
export function RatingPromptSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="h-6 w-48 animate-pulse rounded bg-muted" />
        <div className="h-4 w-64 animate-pulse rounded bg-muted" />
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="h-4 w-32 animate-pulse rounded bg-muted" />
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-10 w-10 animate-pulse rounded bg-muted"
              />
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-4 w-32 animate-pulse rounded bg-muted" />
          <div className="flex gap-2">
            <div className="h-9 w-16 animate-pulse rounded-button bg-muted" />
            <div className="h-9 w-16 animate-pulse rounded-button bg-muted" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-4 w-48 animate-pulse rounded bg-muted" />
          <div className="h-20 w-full animate-pulse rounded-lg bg-muted" />
        </div>
      </CardContent>
      <CardFooter className="justify-end">
        <div className="h-10 w-36 animate-pulse rounded-button bg-muted" />
      </CardFooter>
    </Card>
  );
}
