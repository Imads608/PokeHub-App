import { LoginSubmit } from './submit-form';
import '@pokehub/frontend/global-next-types';
import Image from 'next/image';

export const LoginForm = () => {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="mx-auto flex max-w-md flex-col justify-center rounded-lg border border-gray-300 p-4 px-6 py-12 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-sm">
          <Image
            className="mx-auto h-16 w-16"
            height={100 /* value doesn't matter */}
            width={100 /* value doesn't matter */}
            src="./images/logo.svg"
            alt="Your Company"
          />
          <h2 className="text-indigo-main mt-10 text-center text-2xl font-bold leading-9 tracking-tight">
            Sign in to your account
          </h2>
        </div>

        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
          <div>
            <LoginSubmit />
          </div>
        </div>
      </div>
    </div>
  );
};
