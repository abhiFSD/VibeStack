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
export declare type ActionItemsUpdateFormInputValues = {
    note?: boolean;
    description?: string;
    title?: string;
    duedate?: string;
    status?: number;
    assignor?: string;
    assignees?: string[];
    attachments?: string[];
    user_sub?: string;
    _version?: number;
    _deleted?: boolean;
    _lastChangedAt?: number;
};
export declare type ActionItemsUpdateFormValidationValues = {
    note?: ValidationFunction<boolean>;
    description?: ValidationFunction<string>;
    title?: ValidationFunction<string>;
    duedate?: ValidationFunction<string>;
    status?: ValidationFunction<number>;
    assignor?: ValidationFunction<string>;
    assignees?: ValidationFunction<string>;
    attachments?: ValidationFunction<string>;
    user_sub?: ValidationFunction<string>;
    _version?: ValidationFunction<number>;
    _deleted?: ValidationFunction<boolean>;
    _lastChangedAt?: ValidationFunction<number>;
};
export declare type PrimitiveOverrideProps<T> = Partial<T> & React.DOMAttributes<HTMLDivElement>;
export declare type ActionItemsUpdateFormOverridesProps = {
    ActionItemsUpdateFormGrid?: PrimitiveOverrideProps<GridProps>;
    note?: PrimitiveOverrideProps<SwitchFieldProps>;
    description?: PrimitiveOverrideProps<TextFieldProps>;
    title?: PrimitiveOverrideProps<TextFieldProps>;
    duedate?: PrimitiveOverrideProps<TextFieldProps>;
    status?: PrimitiveOverrideProps<TextFieldProps>;
    assignor?: PrimitiveOverrideProps<TextFieldProps>;
    assignees?: PrimitiveOverrideProps<TextFieldProps>;
    attachments?: PrimitiveOverrideProps<TextFieldProps>;
    user_sub?: PrimitiveOverrideProps<TextFieldProps>;
    _version?: PrimitiveOverrideProps<TextFieldProps>;
    _deleted?: PrimitiveOverrideProps<SwitchFieldProps>;
    _lastChangedAt?: PrimitiveOverrideProps<TextFieldProps>;
} & EscapeHatchProps;
export declare type ActionItemsUpdateFormProps = React.PropsWithChildren<{
    overrides?: ActionItemsUpdateFormOverridesProps | undefined | null;
} & {
    id?: string;
    actionItems?: any;
    onSubmit?: (fields: ActionItemsUpdateFormInputValues) => ActionItemsUpdateFormInputValues;
    onSuccess?: (fields: ActionItemsUpdateFormInputValues) => void;
    onError?: (fields: ActionItemsUpdateFormInputValues, errorMessage: string) => void;
    onChange?: (fields: ActionItemsUpdateFormInputValues) => ActionItemsUpdateFormInputValues;
    onValidate?: ActionItemsUpdateFormValidationValues;
} & React.CSSProperties>;
export default function ActionItemsUpdateForm(props: ActionItemsUpdateFormProps): React.ReactElement;
