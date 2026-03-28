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
export declare type UserCoinsCreateFormInputValues = {
    user_sub?: string;
    total_coins?: number;
    organizationID?: string;
    _version?: number;
    _deleted?: boolean;
    _lastChangedAt?: number;
};
export declare type UserCoinsCreateFormValidationValues = {
    user_sub?: ValidationFunction<string>;
    total_coins?: ValidationFunction<number>;
    organizationID?: ValidationFunction<string>;
    _version?: ValidationFunction<number>;
    _deleted?: ValidationFunction<boolean>;
    _lastChangedAt?: ValidationFunction<number>;
};
export declare type PrimitiveOverrideProps<T> = Partial<T> & React.DOMAttributes<HTMLDivElement>;
export declare type UserCoinsCreateFormOverridesProps = {
    UserCoinsCreateFormGrid?: PrimitiveOverrideProps<GridProps>;
    user_sub?: PrimitiveOverrideProps<TextFieldProps>;
    total_coins?: PrimitiveOverrideProps<TextFieldProps>;
    organizationID?: PrimitiveOverrideProps<TextFieldProps>;
    _version?: PrimitiveOverrideProps<TextFieldProps>;
    _deleted?: PrimitiveOverrideProps<SwitchFieldProps>;
    _lastChangedAt?: PrimitiveOverrideProps<TextFieldProps>;
} & EscapeHatchProps;
export declare type UserCoinsCreateFormProps = React.PropsWithChildren<{
    overrides?: UserCoinsCreateFormOverridesProps | undefined | null;
} & {
    clearOnSuccess?: boolean;
    onSubmit?: (fields: UserCoinsCreateFormInputValues) => UserCoinsCreateFormInputValues;
    onSuccess?: (fields: UserCoinsCreateFormInputValues) => void;
    onError?: (fields: UserCoinsCreateFormInputValues, errorMessage: string) => void;
    onChange?: (fields: UserCoinsCreateFormInputValues) => UserCoinsCreateFormInputValues;
    onValidate?: UserCoinsCreateFormValidationValues;
} & React.CSSProperties>;
export default function UserCoinsCreateForm(props: UserCoinsCreateFormProps): React.ReactElement;
