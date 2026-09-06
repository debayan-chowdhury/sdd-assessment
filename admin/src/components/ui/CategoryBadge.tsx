type CategoryBadgeProps = {
  category: "HR" | "Manager" | null;
};

export function CategoryBadge({ category }: CategoryBadgeProps) {
  if (!category) return null;

  return (
    <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
      {category}
    </span>
  );
}
