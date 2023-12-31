import { useUsernameAvailability } from "apps/next-app/hooks/user/username-availability.hook";
import { ComponentType, useEffect, useState } from "react"
import { FieldValues, UseControllerProps } from "react-hook-form";
import { UsernameFieldProps } from "./username-field.model";

export function withUsernameAvailableField(WrappedComponent: ComponentType<UsernameFieldProps>) {
    const Component = (props: UsernameFieldProps) => {
        const [verificationTimeout, setVerificationTimeout] = useState<NodeJS.Timeout>(null);
        const [ enableUsernameCheck, setEnableUsernameCheck ] = useState<boolean>(false);
        const [ usernameText, setUsernameText ] = useState<string>('');
        const result = useUsernameAvailability(usernameText, enableUsernameCheck);

        const usernameFieldControllerProps: UseControllerProps<FieldValues, string> = {
            name: 'username',
            control: props.control,
            rules: {
                required: { value: props.required || props.required === undefined, message: 'This field is required' },
                minLength: {
                  value: 5,
                  message: 'Username should be at least 5 characters',
                },
                validate: {
                    isAvailable: async (username: string) => {
                        return new Promise((resolve, reject) => {
                            verificationTimeout && clearTimeout(verificationTimeout);
                            setVerificationTimeout(setTimeout(() => {
                                console.log('withUsernameAvailableField Validation', username);
                            }, 400));
                            setUsernameText(username)
                            setEnableUsernameCheck(true);
                            resolve(true);//resolve("This is already teaken");
                        })
                    },
                }
            }, defaultValue: ''
          }

          useEffect(() => {
            result.isLoading && setEnableUsernameCheck(false);
        }, [result.isLoading])

          console.log('withUsernameAvailableField Vars:', usernameText, enableUsernameCheck);

        return (
            <WrappedComponent {...props} controllerProps={usernameFieldControllerProps} availabilityResults={result} />
        )
    }

    Component.displayName = 'WithUsernameAvailableField';

    return Component;
}