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
export declare type IssueUpdateFormInputValues = {
    title?: string;
    description?: string;
    category?: string;
    priority?: string;
    status?: string;
    attachments?: string[];
    reporterEmail?: string;
    reporterName?: string;
    reporterID?: string;
    organizationID?: string;
    assignedToEmail?: string;
    assignedToName?: string;
    createdAt?: string;
    updatedAt?: string;
    _version?: number;
    _deleted?: boolean;
    _lastChangedAt?: number;
};
export declare type IssueUpdateFormValidationValues = {
    title?: ValidationFunction<string>;
    description?: ValidationFunction<string>;
    category?: ValidationFunction<string>;
    priority?: ValidationFunction<string>;
    status?: ValidationFunction<string>;
    attachments?: ValidationFunction<string>;
    reporterEmail?: ValidationFunction<string>;
    reporterName?: ValidationFunction<string>;
    reporterID?: ValidationFunction<string>;
    organizationID?: ValidationFunction<string>;
    assignedToEmail?: ValidationFunction<string>;
    assignedToName?: ValidationFunction<string>;
    createdAt?: ValidationFunction<string>;
    updatedAt?: ValidationFunction<string>;
    _version?: ValidationFunction<number>;
    _deleted?: ValidationFunction<boolean>;
    _lastChangedAt?: ValidationFunction<number>;
};
export declare type PrimitiveOverrideProps<T> = Partial<T> & React.DOMAttributes<HTMLDivElement>;
export declare type IssueUpdateFormOverridesProps = {
    IssueUpdateFormGrid?: PrimitiveOverrideProps<GridProps>;
    title?: PrimitiveOverrideProps<TextFieldProps>;
    description?: PrimitiveOverrideProps<TextFieldProps>;
    category?: PrimitiveOverrideProps<SelectFieldProps>;
    priority?: PrimitiveOverrideProps<SelectFieldProps>;
    status?: PrimitiveOverrideProps<SelectFieldProps>;
    attachments?: PrimitiveOverrideProps<TextFieldProps>;
    reporterEmail?: PrimitiveOverrideProps<TextFieldProps>;
    reporterName?: PrimitiveOverrideProps<TextFieldProps>;
    reporterID?: PrimitiveOverrideProps<TextFieldProps>;
    organizationID?: PrimitiveOverrideProps<TextFieldProps>;
    assignedToEmail?: PrimitiveOverrideProps<TextFieldProps>;
    assignedToName?: PrimitiveOverrideProps<TextFieldProps>;
    createdAt?: PrimitiveOverrideProps<TextFieldProps>;
    updatedAt?: PrimitiveOverrideProps<TextFieldProps>;
    _version?: PrimitiveOverrideProps<TextFieldProps>;
    _deleted?: PrimitiveOverrideProps<SwitchFieldProps>;
    _lastChangedAt?: PrimitiveOverrideProps<TextFieldProps>;
} & EscapeHatchProps;
export declare type IssueUpdateFormProps = React.PropsWithChildren<{
    overrides?: IssueUpdateFormOverridesProps | undefined | null;
} & {
    id?: string;
    issue?: any;
    onSubmit?: (fields: IssueUpdateFormInputValues) => IssueUpdateFormInputValues;
    onSuccess?: (fields: IssueUpdateFormInputValues) => void;
    onError?: (fields: IssueUpdateFormInputValues, errorMessage: string) => void;
    onChange?: (fields: IssueUpdateFormInputValues) => IssueUpdateFormInputValues;
    onValidate?: IssueUpdateFormValidationValues;
} & React.CSSProperties>;
export default function IssueUpdateForm(props: IssueUpdateFormProps): React.ReactElement;
