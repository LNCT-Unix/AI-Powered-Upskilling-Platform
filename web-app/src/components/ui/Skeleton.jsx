/**
 * Skeleton — loading placeholder for content blocks
 */
export function Skeleton({ className = '', style = {} }) {
  return (
    <div
      className={`skeleton ${className}`}
      style={style}
      aria-hidden="true"
    />
  );
}

/**
 * SkeletonText — multiple lines of placeholder text
 */
export function SkeletonText({ lines = 3, className = '' }) {
  return (
    <div className={`space-y-2 ${className}`} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-3 rounded"
          style={{ width: i === lines - 1 ? '65%' : '100%' }}
        />
      ))}
    </div>
  );
}

/**
 * CardSkeleton — placeholder for a card block
 */
export function CardSkeleton({ className = '' }) {
  return (
    <div className={`rounded-xl border border-[var(--color-border)] p-5 ${className}`} aria-hidden="true">
      <div className="flex items-center gap-3 mb-4">
        <Skeleton className="h-8 w-8 rounded-lg" />
        <Skeleton className="h-4 w-32 rounded" />
      </div>
      <SkeletonText lines={3} />
    </div>
  );
}
