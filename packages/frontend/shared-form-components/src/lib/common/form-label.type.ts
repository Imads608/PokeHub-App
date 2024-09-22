export type FormLabelType = 'Regular' | 'Radio' | 'Checkbox';

export type FormLabelProps<T extends FormLabelType> = {
  className?: string;
  id?: string;
  label?: string;
  description?: T extends 'Regular' ? string : never;
  required?: T extends 'Regular' ? boolean : T extends 'Radio' ? boolean : never;
};
