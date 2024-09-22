import classNames from 'classnames';

export interface FormFieldWrapperProps {
  children: React.ReactNode;
  className?: string;
}

export const FormFieldWrapper = ({ children, className }: FormFieldWrapperProps) => {
  return <div className={classNames('flex flex-col w-full', className)}>{children}</div>;
};
