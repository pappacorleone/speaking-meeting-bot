'use client';

import * as React from 'react';
import { Circle, CheckCircle2, ListTodo, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// =============================================================================
// Types
// =============================================================================

interface ActionItem {
  id: string;
  text: string;
  completed: boolean;
}

interface ActionItemsProps {
  items: string[];
  className?: string;
}

interface ActionItemsInteractiveProps {
  items: ActionItem[];
  onToggle?: (id: string, completed: boolean) => void;
  onAdd?: (text: string) => void;
  className?: string;
}

interface ActionItemRowProps {
  item: ActionItem;
  onToggle?: (id: string, completed: boolean) => void;
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Convert string array to ActionItem array for interactive use.
 */
export function toActionItems(items: string[]): ActionItem[] {
  return items.map((text, index) => ({
    id: `action-${index}`,
    text,
    completed: false,
  }));
}

// =============================================================================
// Sub-Components
// =============================================================================

/**
 * Single action item row with checkbox.
 */
function ActionItemRow({ item, onToggle }: ActionItemRowProps) {
  const handleToggle = () => {
    onToggle?.(item.id, !item.completed);
  };

  return (
    <div
      className={cn(
        'group flex items-start gap-3 rounded-lg p-2 transition-colors',
        onToggle && 'cursor-pointer hover:bg-muted/50'
      )}
      onClick={onToggle ? handleToggle : undefined}
      role={onToggle ? 'checkbox' : undefined}
      aria-checked={onToggle ? item.completed : undefined}
      tabIndex={onToggle ? 0 : undefined}
      onKeyDown={
        onToggle
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleToggle();
              }
            }
          : undefined
      }
    >
      {/* Checkbox icon */}
      <div className="mt-0.5 shrink-0">
        {item.completed ? (
          <CheckCircle2 className="h-5 w-5 text-secondary" />
        ) : (
          <Circle
            className={cn(
              'h-5 w-5 text-muted-foreground',
              onToggle && 'group-hover:text-secondary'
            )}
          />
        )}
      </div>

      {/* Item text */}
      <span
        className={cn(
          'flex-1 text-sm',
          item.completed && 'text-muted-foreground line-through'
        )}
      >
        {item.text}
      </span>
    </div>
  );
}

/**
 * Static action item row (no interaction).
 */
function ActionItemStatic({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3 p-2">
      <Circle className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
      <span className="flex-1 text-sm">{text}</span>
    </div>
  );
}

// =============================================================================
// Main Components
// =============================================================================

/**
 * ActionItems - Static list of action items from session summary.
 *
 * Reference: requirements.md Section 6.9 Post-Session Recap Design
 */
export function ActionItems({ items, className }: ActionItemsProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {/* Section header */}
      <div className="flex items-center justify-between">
        <h4 className="section-header">ACTION ITEMS</h4>
        {items.length > 0 && (
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
            {items.length}
          </span>
        )}
      </div>

      {/* Items list */}
      {items.length === 0 ? (
        <div className="py-4 text-center">
          <ListTodo className="mx-auto h-8 w-8 text-muted-foreground/50" />
          <p className="mt-2 text-sm text-muted-foreground">
            No action items from this session.
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          {items.map((text, index) => (
            <ActionItemStatic key={index} text={text} />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * ActionItemsInteractive - Interactive checklist with toggle functionality.
 */
export function ActionItemsInteractive({
  items,
  onToggle,
  onAdd,
  className,
}: ActionItemsInteractiveProps) {
  const [newItemText, setNewItemText] = React.useState('');
  const [isAdding, setIsAdding] = React.useState(false);

  const completedCount = items.filter((item) => item.completed).length;
  const totalCount = items.length;

  const handleAdd = () => {
    if (newItemText.trim() && onAdd) {
      onAdd(newItemText.trim());
      setNewItemText('');
      setIsAdding(false);
    }
  };

  return (
    <Card className={cn(className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">
            <span className="section-header">ACTION ITEMS</span>
          </CardTitle>
          {totalCount > 0 && (
            <span className="text-sm text-muted-foreground">
              {completedCount}/{totalCount} done
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {/* Items list */}
        {items.length === 0 ? (
          <p className="py-2 text-center text-sm text-muted-foreground">
            No action items yet.
          </p>
        ) : (
          <div className="-mx-2 space-y-0.5">
            {items.map((item) => (
              <ActionItemRow key={item.id} item={item} onToggle={onToggle} />
            ))}
          </div>
        )}

        {/* Add new item */}
        {onAdd && (
          <>
            {isAdding ? (
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="text"
                  value={newItemText}
                  onChange={(e) => setNewItemText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleAdd();
                    } else if (e.key === 'Escape') {
                      setIsAdding(false);
                      setNewItemText('');
                    }
                  }}
                  placeholder="Add action item..."
                  className="flex-1 rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-secondary"
                  autoFocus
                />
                <Button size="sm" onClick={handleAdd} disabled={!newItemText.trim()}>
                  Add
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setIsAdding(false);
                    setNewItemText('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsAdding(true)}
                className="w-full justify-start text-muted-foreground"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add action item
              </Button>
            )}
          </>
        )}

        {/* Progress bar */}
        {totalCount > 0 && (
          <div className="pt-2">
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-secondary transition-all duration-300"
                style={{ width: `${(completedCount / totalCount) * 100}%` }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * ActionItemsCompact - Minimal inline version for sidebar.
 */
export function ActionItemsCompact({
  items,
  maxItems = 3,
  className,
}: {
  items: string[];
  maxItems?: number;
  className?: string;
}) {
  const displayedItems = items.slice(0, maxItems);
  const hasMore = items.length > maxItems;

  return (
    <div className={cn('space-y-2', className)}>
      <h4 className="section-header">ACTION ITEMS</h4>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No action items.</p>
      ) : (
        <>
          <ul className="space-y-1.5">
            {displayedItems.map((text, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <Circle className="mt-1 h-3 w-3 shrink-0 text-muted-foreground" />
                <span className="line-clamp-1">{text}</span>
              </li>
            ))}
          </ul>

          {hasMore && (
            <p className="text-xs text-muted-foreground">
              +{items.length - maxItems} more
            </p>
          )}
        </>
      )}
    </div>
  );
}

/**
 * ActionItemsSkeleton - Loading skeleton for action items.
 */
export function ActionItemsSkeleton() {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="h-4 w-28 animate-pulse rounded bg-muted" />
        <div className="h-5 w-8 animate-pulse rounded-full bg-muted" />
      </div>

      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 p-2">
            <div className="h-5 w-5 animate-pulse rounded-full bg-muted" />
            <div className="h-4 flex-1 animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}
