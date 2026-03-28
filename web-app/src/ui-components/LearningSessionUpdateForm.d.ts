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
export declare type LearningSessionUpdateFormInputValues = {
    userSub?: string;
    organizationID?: string;
    learningID?: string;
    startTime?: string;
    endTime?: string;
    duration?: number;
    sectionsViewed?: string[];
    createdAt?: string;
    updatedAt?: string;
    _version?: number;
    _deleted?: boolean;
    _lastChangedAt?: number;
};
export declare type LearningSessionUpdateFormValidationValues = {
    userSub?: ValidationFunction<string>;
    organizationID?: ValidationFunction<string>;
    learningID?: ValidationFunction<string>;
    startTime?: ValidationFunction<string>;
    endTime?: ValidationFunction<string>;
    duration?: ValidationFunction<number>;
    sectionsViewed?: ValidationFunction<string>;
    createdAt?: ValidationFunction<string>;
    updatedAt?: ValidationFunction<string>;
    _version?: ValidationFunction<number>;
    _deleted?: ValidationFunction<boolean>;
    _lastChangedAt?: ValidationFunction<number>;
};
export declare type PrimitiveOverrideProps<T> = Partial<T> & React.DOMAttributes<HTMLDivElement>;
export declare type LearningSessionUpdateFormOverridesProps = {
    LearningSessionUpdateFormGrid?: PrimitiveOverrideProps<GridProps>;
    userSub?: PrimitiveOverrideProps<TextFieldProps>;
    organizationID?: PrimitiveOverrideProps<TextFieldProps>;
    learningID?: PrimitiveOverrideProps<TextFieldProps>;
    startTime?: PrimitiveOverrideProps<TextFieldProps>;
    endTime?: PrimitiveOverrideProps<TextFieldProps>;
    duration?: PrimitiveOverrideProps<TextFieldProps>;
    sectionsViewed?: PrimitiveOverrideProps<TextFieldProps>;
    createdAt?: PrimitiveOverrideProps<TextFieldProps>;
    updatedAt?: PrimitiveOverrideProps<TextFieldProps>;
    _version?: PrimitiveOverrideProps<TextFieldProps>;
    _deleted?: PrimitiveOverrideProps<SwitchFieldProps>;
    _lastChangedAt?: PrimitiveOverrideProps<TextFieldProps>;
} & EscapeHatchProps;
export declare type LearningSessionUpdateFormProps = React.PropsWithChildren<{
    overrides?: LearningSessionUpdateFormOverridesProps | undefined | null;
} & {
    id?: string;
    learningSession?: any;
    onSubmit?: (fields: LearningSessionUpdateFormInputValues) => LearningSessionUpdateFormInputValues;
    onSuccess?: (fields: LearningSessionUpdateFormInputValues) => void;
    onError?: (fields: LearningSessionUpdateFormInputValues, errorMessage: string) => void;
    onChange?: (fields: LearningSessionUpdateFormInputValues) => LearningSessionUpdateFormInputValues;
    onValidate?: LearningSessionUpdateFormValidationValues;
} & React.CSSProperties>;
export default function LearningSessionUpdateForm(props: LearningSessionUpdateFormProps): React.ReactElement;
