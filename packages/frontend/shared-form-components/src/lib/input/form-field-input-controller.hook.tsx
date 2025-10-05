import { FieldValues, UseControllerProps, UseControllerReturn, useController } from 'react-hook-form';

import { FormLabelProps } from '../common/form-label.type';
import { FormFieldInputProps } from './form-field-input.type';

export const useInputController = <FieldValuesType extends FieldValues>(
  props: FormFieldInputProps<FieldValuesType>,
  labelProps: FormLabelProps<'Regular'>
): UseControllerReturn<FieldValuesType> => {
  const defaultControllerProps: UseControllerProps<FieldValuesType> = {
    name: props.name,
    control: props.control,
    rules: {
      required: {
        value: !!props.required,
        message: 'This field is required',
      },
      ...(props.minLength
        ? {
            minLength: {
              value: props.minLength,
              message: `${labelProps.label} needs to be at least ${props.minLength} characters`,
            },
          }
        : {}),
      maxLength: {
        value: props.maxLength || 500,
        message: `Limit characters to ${props.maxLength || 500}`,
      },
      pattern:
        props.patternValue !== undefined
          ? {
              value: props.patternValue,
              message: props.errorMessage || '',
            }
          : undefined,
    },
  };

  return useController(defaultControllerProps);
};
