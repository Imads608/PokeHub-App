import { APIError } from '../../../../types/api';
import { AxiosError } from 'axios';
import { Control, FieldValues, UseControllerProps } from 'react-hook-form';
import { UseQueryResult } from 'react-query';

export interface UsernameFieldProps {
    control: Control<FieldValues>;
    controllerProps?: UseControllerProps<FieldValues, string>;
    availabilityResults?: UseQueryResult<boolean, Error | AxiosError<APIError>>;
}