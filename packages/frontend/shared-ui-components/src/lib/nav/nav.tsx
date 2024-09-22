import { LogoIcon } from '@pokehub/frontend/shared-ui-icons';

export interface TopNavProps {
  assetPath: string;
  children: React.ReactNode | React.ReactNode[];
}

export const TopNav = ({ assetPath, children }: TopNavProps) => {
  return (
    <nav className="w-full bg-red-main flex flex-row py-4 px-2 items-center text-white text-xl">
      <LogoIcon className="mr-10" assetPath={assetPath} />
      {children}
    </nav>
  );
};
