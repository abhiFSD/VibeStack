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
export declare type LearningUpdateFormInputValues = {
    orderIndex?: number;
    title?: string;
    description?: string;
    quizScore?: number;
    quizStatementsCount?: number;
    hasQuizTaken?: boolean;
    isDefault?: boolean;
    readTime?: string;
    createdAt?: string;
    updatedAt?: string;
    _version?: number;
    _deleted?: boolean;
    _lastChangedAt?: number;
};
export declare type LearningUpdateFormValidationValues = {
    orderIndex?: ValidationFunction<number>;
    title?: ValidationFunction<string>;
    description?: ValidationFunction<string>;
    quizScore?: ValidationFunction<number>;
    quizStatementsCount?: ValidationFunction<number>;
    hasQuizTaken?: ValidationFunction<boolean>;
    isDefault?: ValidationFunction<boolean>;
    readTime?: ValidationFunction<string>;
    createdAt?: ValidationFunction<string>;
    updatedAt?: ValidationFunction<string>;
    _version?: ValidationFunction<number>;
    _deleted?: ValidationFunction<boolean>;
    _lastChangedAt?: ValidationFunction<number>;
};
export declare type PrimitiveOverrideProps<T> = Partial<T> & React.DOMAttributes<HTMLDivElement>;
export declare type LearningUpdateFormOverridesProps = {
    LearningUpdateFormGrid?: PrimitiveOverrideProps<GridProps>;
    orderIndex?: PrimitiveOverrideProps<TextFieldProps>;
    title?: PrimitiveOverrideProps<TextFieldProps>;
    description?: PrimitiveOverrideProps<TextFieldProps>;
    quizScore?: PrimitiveOverrideProps<TextFieldProps>;
    quizStatementsCount?: PrimitiveOverrideProps<TextFieldProps>;
    hasQuizTaken?: PrimitiveOverrideProps<SwitchFieldProps>;
    isDefault?: PrimitiveOverrideProps<SwitchFieldProps>;
    readTime?: PrimitiveOverrideProps<TextFieldProps>;
    createdAt?: PrimitiveOverrideProps<TextFieldProps>;
    updatedAt?: PrimitiveOverrideProps<TextFieldProps>;
    _version?: PrimitiveOverrideProps<TextFieldProps>;
    _deleted?: PrimitiveOverrideProps<SwitchFieldProps>;
    _lastChangedAt?: PrimitiveOverrideProps<TextFieldProps>;
} & EscapeHatchProps;
export declare type LearningUpdateFormProps = React.PropsWithChildren<{
    overrides?: LearningUpdateFormOverridesProps | undefined | null;
} & {
    id?: string;
    learning?: any;
    onSubmit?: (fields: LearningUpdateFormInputValues) => LearningUpdateFormInputValues;
    onSuccess?: (fields: LearningUpdateFormInputValues) => void;
    onError?: (fields: LearningUpdateFormInputValues, errorMessage: string) => void;
    onChange?: (fields: LearningUpdateFormInputValues) => LearningUpdateFormInputValues;
    onValidate?: LearningUpdateFormValidationValues;
} & React.CSSProperties>;
export default function LearningUpdateForm(props: LearningUpdateFormProps): React.ReactElement;
