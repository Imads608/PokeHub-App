'use client';

import { Button, Input } from '@pokehub/frontend/shared-ui-components';
import { signIn } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';

export const LoginForm = () => {
  console.log('this is the Login Form');

  return (
    <div className="flex flex-1 flex-col justify-center px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <Image
          className="mx-auto h-16 w-auto"
          height={100 /* value doesn't matter */}
          width={100 /* value doesn't matter */}
          src="./images/logo.svg"
          alt="Your Company"
        />
        <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-indigo-main">
          Sign in to your account
        </h2>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        <form className="space-y-6" action="#" method="POST">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium leading-6 text-grey"
            >
              Email address
            </label>
            <div className="mt-2">
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="email"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label
                htmlFor="password"
                className="block text-sm font-medium leading-6 text-grey-text"
              >
                Password
              </label>
              <div className="text-sm">
                <Link
                  href="/login/reset-password"
                  className="font-semibold text-indigo-main-bold hover:text-indigo-main"
                >
                  Forgot Password?
                </Link>
              </div>
            </div>
            <div className="mt-2">
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
              />
            </div>
            <div>
              <Button
                type="submit"
                variant="default"
                color="indigo-main-bold"
                size="full"
                className="my-2"
                disabled={false}
                onClick={() => signIn('google')}
              >
                Sign In With Google
              </Button>
            </div>
          </div>

          <div>
            <Button
              type="submit"
              variant="default"
              color="indigo-main-bold"
              size="full"
              className="my-2"
              disabled={false}
            >
              Sign In
            </Button>
          </div>
        </form>

        <p className="mt-10 text-center text-sm text-gray-main">
          Not a member?{' '}
          <Link
            href="/register"
            className="font-semibold leading-6 text-indigo-main-bold hover:text-indigo-main"
          >
            Register Now!
          </Link>
        </p>
      </div>
    </div>
  );
};
