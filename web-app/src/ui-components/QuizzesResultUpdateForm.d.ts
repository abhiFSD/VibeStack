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
export declare type QuizzesResultUpdateFormInputValues = {
    Correct?: string;
    Incorrect?: string;
    percentage?: string;
    user_sub?: string;
    tool_id?: string;
    _version?: number;
    _deleted?: boolean;
    _lastChangedAt?: number;
};
export declare type QuizzesResultUpdateFormValidationValues = {
    Correct?: ValidationFunction<string>;
    Incorrect?: ValidationFunction<string>;
    percentage?: ValidationFunction<string>;
    user_sub?: ValidationFunction<string>;
    tool_id?: ValidationFunction<string>;
    _version?: ValidationFunction<number>;
    _deleted?: ValidationFunction<boolean>;
    _lastChangedAt?: ValidationFunction<number>;
};
export declare type PrimitiveOverrideProps<T> = Partial<T> & React.DOMAttributes<HTMLDivElement>;
export declare type QuizzesResultUpdateFormOverridesProps = {
    QuizzesResultUpdateFormGrid?: PrimitiveOverrideProps<GridProps>;
    Correct?: PrimitiveOverrideProps<TextFieldProps>;
    Incorrect?: PrimitiveOverrideProps<TextFieldProps>;
    percentage?: PrimitiveOverrideProps<TextFieldProps>;
    user_sub?: PrimitiveOverrideProps<TextFieldProps>;
    tool_id?: PrimitiveOverrideProps<TextFieldProps>;
    _version?: PrimitiveOverrideProps<TextFieldProps>;
    _deleted?: PrimitiveOverrideProps<SwitchFieldProps>;
    _lastChangedAt?: PrimitiveOverrideProps<TextFieldProps>;
} & EscapeHatchProps;
export declare type QuizzesResultUpdateFormProps = React.PropsWithChildren<{
    overrides?: QuizzesResultUpdateFormOverridesProps | undefined | null;
} & {
    id?: string;
    quizzesResult?: any;
    onSubmit?: (fields: QuizzesResultUpdateFormInputValues) => QuizzesResultUpdateFormInputValues;
    onSuccess?: (fields: QuizzesResultUpdateFormInputValues) => void;
    onError?: (fields: QuizzesResultUpdateFormInputValues, errorMessage: string) => void;
    onChange?: (fields: QuizzesResultUpdateFormInputValues) => QuizzesResultUpdateFormInputValues;
    onValidate?: QuizzesResultUpdateFormValidationValues;
} & React.CSSProperties>;
export default function QuizzesResultUpdateForm(props: QuizzesResultUpdateFormProps): React.ReactElement;
