import { Input, Label } from '@pokehub/frontend/shared-ui-components';
import { type FieldValues } from 'react-hook-form';

import { FormFieldWrapper } from '../common/form-field-wrapper';
import type { FormLabelProps } from '../common/form-label.type';
import { useInputController } from './form-field-input-controller.hook';
import type { FormFieldInputProps } from './form-field-input.type';

export const FormFieldInput = <FieldValuesType extends FieldValues>(
  props: FormFieldInputProps<FieldValuesType>,
  label: FormLabelProps<'Regular'>
) => {
  const { field, fieldState } = useInputController(props, label);
  return (
    <FormFieldWrapper>
      <Label htmlFor={label.id} className={label.className}>
        <div className="flex flex-col gap-1">
          <div className="flex flex-row items-end gap-1">
            {label.required && <span className="block pt-1 text-red-error">*</span>}
            <h3 className="text-lg font-medium text-gray-light">{label.label}</h3>
          </div>
          {label.description && <p className="block text-base font-light text-gray-light">{label.description}</p>}
        </div>
      </Label>
      <Input
        name={field.name}
        onChange={field.onChange}
        onBlur={field.onBlur}
        ref={field.ref}
        className={props.className}
        placeholder={props.placeholder}
        required={props.required}
        defaultValue={field.value}
      />
      {props.errorMessage && (
        <p className="mt-2 block text-sm font-normal text-red-error peer-invalid:block">{fieldState.error?.message}</p>
      )}
    </FormFieldWrapper>
  );
};
