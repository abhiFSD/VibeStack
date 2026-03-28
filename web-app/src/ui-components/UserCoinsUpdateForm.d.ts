/***************************************************************************
 * The contents of this file were generated with Amplify Studio.           *
 * Please refrain from making any modifications to this file.              *
 * Any changes to this file will be overwritten when running amplify pull. *
 **************************************************************************/

import * as React from "react";
import { GridProps, SwitchFieldProps, TextFieldProps } from "@aws-amplify/ui-react";
export declare type EscapeHatchProps = {
    [elementHierarchy: string]: Record<string, unknown>;
} | null;
export declare type VariantValues = {
    [key: string]: string;
};
export declare type Variant = {
    variantValues: VariantValues;
    overrides: EscapeHatchProps;
};
export declare type ValidationResponse = {
    hasError: boolean;
    errorMessage?: string;
};
export declare type ValidationFunction<T> = (value: T, validationResponse: ValidationResponse) => ValidationResponse | Promise<ValidationResponse>;
export declare type UserCoinsUpdateFormInputValues = {
    user_sub?: string;
    total_coins?: number;
    organizationID?: string;
    _version?: number;
    _deleted?: boolean;
    _lastChangedAt?: number;
};
export declare type UserCoinsUpdateFormValidationValues = {
    user_sub?: ValidationFunction<string>;
    total_coins?: ValidationFunction<number>;
    organizationID?: ValidationFunction<string>;
    _version?: ValidationFunction<number>;
    _deleted?: ValidationFunction<boolean>;
    _lastChangedAt?: ValidationFunction<number>;
};
export declare type PrimitiveOverrideProps<T> = Partial<T> & React.DOMAttributes<HTMLDivElement>;
export declare type UserCoinsUpdateFormOverridesProps = {
    UserCoinsUpdateFormGrid?: PrimitiveOverrideProps<GridProps>;
    user_sub?: PrimitiveOverrideProps<TextFieldProps>;
    total_coins?: PrimitiveOverrideProps<TextFieldProps>;
    organizationID?: PrimitiveOverrideProps<TextFieldProps>;
    _version?: PrimitiveOverrideProps<TextFieldProps>;
    _deleted?: PrimitiveOverrideProps<SwitchFieldProps>;
    _lastChangedAt?: PrimitiveOverrideProps<TextFieldProps>;
} & EscapeHatchProps;
export declare type UserCoinsUpdateFormProps = React.PropsWithChildren<{
    overrides?: UserCoinsUpdateFormOverridesProps | undefined | null;
} & {
    id?: string;
    userCoins?: any;
    onSubmit?: (fields: UserCoinsUpdateFormInputValues) => UserCoinsUpdateFormInputValues;
    onSuccess?: (fields: UserCoinsUpdateFormInputValues) => void;
    onError?: (fields: UserCoinsUpdateFormInputValues, errorMessage: string) => void;
    onChange?: (fields: UserCoinsUpdateFormInputValues) => UserCoinsUpdateFormInputValues;
    onValidate?: UserCoinsUpdateFormValidationValues;
} & React.CSSProperties>;
export default function UserCoinsUpdateForm(props: UserCoinsUpdateFormProps): React.ReactElement;
