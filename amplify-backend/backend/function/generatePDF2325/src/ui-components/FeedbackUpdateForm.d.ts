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
export declare type FeedbackUpdateFormInputValues = {
    content?: string;
    user_sub?: string;
    ratting?: string;
    _version?: number;
    _deleted?: boolean;
    _lastChangedAt?: number;
};
export declare type FeedbackUpdateFormValidationValues = {
    content?: ValidationFunction<string>;
    user_sub?: ValidationFunction<string>;
    ratting?: ValidationFunction<string>;
    _version?: ValidationFunction<number>;
    _deleted?: ValidationFunction<boolean>;
    _lastChangedAt?: ValidationFunction<number>;
};
export declare type PrimitiveOverrideProps<T> = Partial<T> & React.DOMAttributes<HTMLDivElement>;
export declare type FeedbackUpdateFormOverridesProps = {
    FeedbackUpdateFormGrid?: PrimitiveOverrideProps<GridProps>;
    content?: PrimitiveOverrideProps<TextFieldProps>;
    user_sub?: PrimitiveOverrideProps<TextFieldProps>;
    ratting?: PrimitiveOverrideProps<TextFieldProps>;
    _version?: PrimitiveOverrideProps<TextFieldProps>;
    _deleted?: PrimitiveOverrideProps<SwitchFieldProps>;
    _lastChangedAt?: PrimitiveOverrideProps<TextFieldProps>;
} & EscapeHatchProps;
export declare type FeedbackUpdateFormProps = React.PropsWithChildren<{
    overrides?: FeedbackUpdateFormOverridesProps | undefined | null;
} & {
    id?: string;
    feedback?: any;
    onSubmit?: (fields: FeedbackUpdateFormInputValues) => FeedbackUpdateFormInputValues;
    onSuccess?: (fields: FeedbackUpdateFormInputValues) => void;
    onError?: (fields: FeedbackUpdateFormInputValues, errorMessage: string) => void;
    onChange?: (fields: FeedbackUpdateFormInputValues) => FeedbackUpdateFormInputValues;
    onValidate?: FeedbackUpdateFormValidationValues;
} & React.CSSProperties>;
export default function FeedbackUpdateForm(props: FeedbackUpdateFormProps): React.ReactElement;
