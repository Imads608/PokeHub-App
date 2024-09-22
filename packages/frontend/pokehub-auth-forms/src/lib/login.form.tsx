import Image from 'next/image';

export const LoginForm = async () => {
  console.log('IsServer: ', typeof window === 'undefined');
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
            <label htmlFor="email" className="block text-sm font-medium leading-6 text-grey">
              Email address
            </label>
            <div className="mt-2">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="test"
                className="block w-full rounded-md py-1.5 text-grey-text shadow-sm ring-1 ring-inset ring-gray-border placeholder:text-gray-disabled focus:ring-2 focus:ring-inset focus:ring-offset-indigo-main sm:text-sm sm:leading-6"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="block text-sm font-medium leading-6 text-grey-text">
                Password
              </label>
              <div className="text-sm">
                <a href="#" className="font-semibold text-indigo-main-bold hover:text-indigo-main">
                  Forgot password?
                </a>
              </div>
            </div>
            <div className="mt-2">
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="block w-full rounded-md border-0 py-1.5 text-grey-text shadow-sm ring-1 ring-inset ring-gray-border placeholder:text-gray-disabled focus:ring-2 focus:ring-inset focus:ring-indigo-main-bold sm:text-sm sm:leading-6"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="flex w-full justify-center rounded-md bg-indigo-main-bold px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-main focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-main-bold"
            >
              Sign in
            </button>
          </div>
        </form>

        <p className="mt-10 text-center text-sm text-gray-main">
          Not a member?{' '}
          <a href="#" className="font-semibold leading-6 text-indigo-main-bold hover:text-indigo-main">
            Register Now!
          </a>
        </p>
      </div>
    </div>
  );
};
