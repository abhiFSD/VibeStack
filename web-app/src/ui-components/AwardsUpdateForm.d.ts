/***************************************************************************
 * The contents of this file were generated with Amplify Studio.           *
 * Please refrain from making any modifications to this file.              *
 * Any changes to this file will be overwritten when running amplify pull. *
 **************************************************************************/

import * as React from "react";
import { GridProps, SelectFieldProps, SwitchFieldProps, TextFieldProps } from "@aws-amplify/ui-react";
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
export declare type AwardsUpdateFormInputValues = {
    title?: string;
    date?: string;
    description?: string;
    user_sub?: string;
    tool_id?: string;
    type?: string;
    coins?: number;
    organizationID?: string;
    customType?: string;
    _version?: number;
    _deleted?: boolean;
    _lastChangedAt?: number;
};
export declare type AwardsUpdateFormValidationValues = {
    title?: ValidationFunction<string>;
    date?: ValidationFunction<string>;
    description?: ValidationFunction<string>;
    user_sub?: ValidationFunction<string>;
    tool_id?: ValidationFunction<string>;
    type?: ValidationFunction<string>;
    coins?: ValidationFunction<number>;
    organizationID?: ValidationFunction<string>;
    customType?: ValidationFunction<string>;
    _version?: ValidationFunction<number>;
    _deleted?: ValidationFunction<boolean>;
    _lastChangedAt?: ValidationFunction<number>;
};
export declare type PrimitiveOverrideProps<T> = Partial<T> & React.DOMAttributes<HTMLDivElement>;
export declare type AwardsUpdateFormOverridesProps = {
    AwardsUpdateFormGrid?: PrimitiveOverrideProps<GridProps>;
    title?: PrimitiveOverrideProps<TextFieldProps>;
    date?: PrimitiveOverrideProps<TextFieldProps>;
    description?: PrimitiveOverrideProps<TextFieldProps>;
    user_sub?: PrimitiveOverrideProps<TextFieldProps>;
    tool_id?: PrimitiveOverrideProps<TextFieldProps>;
    type?: PrimitiveOverrideProps<SelectFieldProps>;
    coins?: PrimitiveOverrideProps<TextFieldProps>;
    organizationID?: PrimitiveOverrideProps<TextFieldProps>;
    customType?: PrimitiveOverrideProps<TextFieldProps>;
    _version?: PrimitiveOverrideProps<TextFieldProps>;
    _deleted?: PrimitiveOverrideProps<SwitchFieldProps>;
    _lastChangedAt?: PrimitiveOverrideProps<TextFieldProps>;
} & EscapeHatchProps;
export declare type AwardsUpdateFormProps = React.PropsWithChildren<{
    overrides?: AwardsUpdateFormOverridesProps | undefined | null;
} & {
    id?: string;
    awards?: any;
    onSubmit?: (fields: AwardsUpdateFormInputValues) => AwardsUpdateFormInputValues;
    onSuccess?: (fields: AwardsUpdateFormInputValues) => void;
    onError?: (fields: AwardsUpdateFormInputValues, errorMessage: string) => void;
    onChange?: (fields: AwardsUpdateFormInputValues) => AwardsUpdateFormInputValues;
    onValidate?: AwardsUpdateFormValidationValues;
} & React.CSSProperties>;
export default function AwardsUpdateForm(props: AwardsUpdateFormProps): React.ReactElement;
