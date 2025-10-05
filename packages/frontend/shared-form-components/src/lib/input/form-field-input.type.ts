import { InputProps } from '@pokehub/frontend/shared-ui-components';
import { Control, FieldPathValue, FieldValues, Path, Validate } from 'react-hook-form';

export type FormFieldInputProps<FieldValuesType extends FieldValues> = Omit<InputProps, 'name'> & {
  name: Path<FieldValuesType>;
  control: Control<FieldValuesType, unknown>;
  isPhoneNumber?: boolean;
  minLength?: number;
  maxLength?: number;
  patternValue?: RegExp;
  validate?: Validate<FieldPathValue<FieldValuesType, Path<FieldValuesType>>, unknown>;
  errorMessage?: string;
};
