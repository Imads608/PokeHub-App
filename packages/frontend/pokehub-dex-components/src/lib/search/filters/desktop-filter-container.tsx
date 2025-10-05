import { DesktopFilterContents } from './desktop-filter-contents';

export const DesktopFilterContainer = () => {
  return (
    <div className="hidden lg:block">
      <div className="sticky top-24 rounded-xl border bg-card p-4 shadow-sm">
        <DesktopFilterContents />
      </div>
    </div>
  );
};
