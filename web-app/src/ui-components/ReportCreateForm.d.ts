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
export declare type ReportCreateFormInputValues = {
    name?: string;
    type?: string;
    user_sub?: string;
    ownerEmail?: string;
    ai_id?: string;
    completed?: boolean;
    bones?: number;
    trend?: boolean;
    target?: string;
    media?: string;
    xaxis?: string;
    yaxis?: string;
    assignedMembers?: string[];
    _version?: number;
    _deleted?: boolean;
    _lastChangedAt?: number;
};
export declare type ReportCreateFormValidationValues = {
    name?: ValidationFunction<string>;
    type?: ValidationFunction<string>;
    user_sub?: ValidationFunction<string>;
    ownerEmail?: ValidationFunction<string>;
    ai_id?: ValidationFunction<string>;
    completed?: ValidationFunction<boolean>;
    bones?: ValidationFunction<number>;
    trend?: ValidationFunction<boolean>;
    target?: ValidationFunction<string>;
    media?: ValidationFunction<string>;
    xaxis?: ValidationFunction<string>;
    yaxis?: ValidationFunction<string>;
    assignedMembers?: ValidationFunction<string>;
    _version?: ValidationFunction<number>;
    _deleted?: ValidationFunction<boolean>;
    _lastChangedAt?: ValidationFunction<number>;
};
export declare type PrimitiveOverrideProps<T> = Partial<T> & React.DOMAttributes<HTMLDivElement>;
export declare type ReportCreateFormOverridesProps = {
    ReportCreateFormGrid?: PrimitiveOverrideProps<GridProps>;
    name?: PrimitiveOverrideProps<TextFieldProps>;
    type?: PrimitiveOverrideProps<TextFieldProps>;
    user_sub?: PrimitiveOverrideProps<TextFieldProps>;
    ownerEmail?: PrimitiveOverrideProps<TextFieldProps>;
    ai_id?: PrimitiveOverrideProps<TextFieldProps>;
    completed?: PrimitiveOverrideProps<SwitchFieldProps>;
    bones?: PrimitiveOverrideProps<TextFieldProps>;
    trend?: PrimitiveOverrideProps<SwitchFieldProps>;
    target?: PrimitiveOverrideProps<TextFieldProps>;
    media?: PrimitiveOverrideProps<TextFieldProps>;
    xaxis?: PrimitiveOverrideProps<TextFieldProps>;
    yaxis?: PrimitiveOverrideProps<TextFieldProps>;
    assignedMembers?: PrimitiveOverrideProps<TextFieldProps>;
    _version?: PrimitiveOverrideProps<TextFieldProps>;
    _deleted?: PrimitiveOverrideProps<SwitchFieldProps>;
    _lastChangedAt?: PrimitiveOverrideProps<TextFieldProps>;
} & EscapeHatchProps;
export declare type ReportCreateFormProps = React.PropsWithChildren<{
    overrides?: ReportCreateFormOverridesProps | undefined | null;
} & {
    clearOnSuccess?: boolean;
    onSubmit?: (fields: ReportCreateFormInputValues) => ReportCreateFormInputValues;
    onSuccess?: (fields: ReportCreateFormInputValues) => void;
    onError?: (fields: ReportCreateFormInputValues, errorMessage: string) => void;
    onChange?: (fields: ReportCreateFormInputValues) => ReportCreateFormInputValues;
    onValidate?: ReportCreateFormValidationValues;
} & React.CSSProperties>;
export default function ReportCreateForm(props: ReportCreateFormProps): React.ReactElement;
