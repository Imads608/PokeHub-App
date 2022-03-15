import { UsernameFieldProps } from "../../../components/auth/fields/props/userFieldProps";
import { ComponentType, useEffect, useState } from "react"
import { FieldValues, UseControllerProps, Control } from "react-hook-form";
import { useUsernameAvailability } from "../../../hooks/user/useUsernameAvailability";

export function withUsernameAvailableField(WrappedComponent: ComponentType<UsernameFieldProps>) {
    const Component = (props: UsernameFieldProps) => {
        const [verificationTimeout, setVerificationTimeout] = useState<NodeJS.Timeout>(null);
        const [ enableUsernameCheck, setEnableUsernameCheck ] = useState<boolean>(false);
        const [ usernameText, setUsernameText ] = useState<string>('');
        const result = useUsernameAvailability(usernameText, enableUsernameCheck);

        useEffect(() => {
            result.isLoading && setEnableUsernameCheck(false);
        }, [result.isLoading])

        const usernameFieldControllerProps: UseControllerProps<FieldValues, string> = {
            name: 'username',
            control: props.control,
            rules: {
                required: { value: true, message: 'This field is required' },
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

          console.log('withUsernameAvailableField Vars:', usernameText, enableUsernameCheck);

        return (
            <WrappedComponent {...props} controllerProps={usernameFieldControllerProps} availabilityResults={result} />
        )
    }

    Component.displayName = 'WithUsernameAvailableField';

    return Component;
}