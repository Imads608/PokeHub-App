import { TopNav } from '@pokehub/frontend/shared-ui-components';
import { DrawerIcon } from '@pokehub/frontend/shared-ui-icons';
import Link from 'next/link';

export const AppNav = () => {
  return (
    <TopNav assetPath="./images/logo.svg">
      <ul className="flex flex-row-reverse gap-8 items-center flex-grow mr-10">
        <Link className="transition ease-in-out duration-200 transform hover:scale-125" href="/login">
          Log In
        </Link>
        <Link className="transition ease-in-out duration-200 transform hover:scale-125" href="/register">
          Sign Up
        </Link>
      </ul>
      <DrawerIcon className="sm:hidden block" />
    </TopNav>
  );
};
