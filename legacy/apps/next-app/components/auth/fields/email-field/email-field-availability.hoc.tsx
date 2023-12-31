import { EmailFieldProps } from "./email-field.model";
import { ComponentType, useEffect, useState } from "react"
import { FieldValues, UseControllerProps, Control } from "react-hook-form";
import { useEmailAvailability } from "apps/next-app/hooks/user/email-availability.hook";

export function withEmailAvailableField(WrappedComponent: ComponentType<EmailFieldProps>) {
    const Component = (props: EmailFieldProps) => {
        const [verificationTimeout, setVerificationTimeout] = useState<NodeJS.Timeout>(null);
        const [ enableEmailCheck, setEnableEmailCheck ] = useState<boolean>(false);
        const [ emailText, setEmailText ] = useState<string>('');
        const result = useEmailAvailability(emailText, enableEmailCheck);

        useEffect(() => {
            result.isLoading && setEnableEmailCheck(false);
        }, [result.isLoading])

        const emailFieldControllerProps: UseControllerProps<FieldValues, string> = {
            name: 'email',
            control: props.control,
            rules: {
              required: { value: true, message: 'This field is required' },
              pattern: { value: /.+@.+/, message: 'Please enter a valid email' },
              validate: {
                isAvailable: async (email: string) => {
                    return new Promise((resolve, reject) => {
                        verificationTimeout && clearTimeout(verificationTimeout);
                        setVerificationTimeout(setTimeout(() => {
                            console.log('Validation', email);
                        }, 400));
                        setEmailText(email);
                        setEnableEmailCheck(true);
                        resolve(true);//resolve("This is already teaken");
                    })
                },
              }
            }, defaultValue: ''
          }

          console.log('withEmailAvailableField Vars:', emailText, enableEmailCheck);

        return (
            <WrappedComponent {...props} controllerProps={emailFieldControllerProps} availabilityResults={result} />
        )
    }

    Component.displayName = 'WithEmailAvailableField';

    return Component;
}