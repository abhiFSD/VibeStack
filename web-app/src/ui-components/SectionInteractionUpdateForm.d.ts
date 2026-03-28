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
export declare type SectionInteractionUpdateFormInputValues = {
    userSub?: string;
    organizationID?: string;
    learningID?: string;
    chapterID?: string;
    sectionID?: string;
    timeSpent?: number;
    viewCount?: number;
    lastViewedAt?: string;
    firstViewedAt?: string;
    completed?: boolean;
    createdAt?: string;
    updatedAt?: string;
    _version?: number;
    _deleted?: boolean;
    _lastChangedAt?: number;
};
export declare type SectionInteractionUpdateFormValidationValues = {
    userSub?: ValidationFunction<string>;
    organizationID?: ValidationFunction<string>;
    learningID?: ValidationFunction<string>;
    chapterID?: ValidationFunction<string>;
    sectionID?: ValidationFunction<string>;
    timeSpent?: ValidationFunction<number>;
    viewCount?: ValidationFunction<number>;
    lastViewedAt?: ValidationFunction<string>;
    firstViewedAt?: ValidationFunction<string>;
    completed?: ValidationFunction<boolean>;
    createdAt?: ValidationFunction<string>;
    updatedAt?: ValidationFunction<string>;
    _version?: ValidationFunction<number>;
    _deleted?: ValidationFunction<boolean>;
    _lastChangedAt?: ValidationFunction<number>;
};
export declare type PrimitiveOverrideProps<T> = Partial<T> & React.DOMAttributes<HTMLDivElement>;
export declare type SectionInteractionUpdateFormOverridesProps = {
    SectionInteractionUpdateFormGrid?: PrimitiveOverrideProps<GridProps>;
    userSub?: PrimitiveOverrideProps<TextFieldProps>;
    organizationID?: PrimitiveOverrideProps<TextFieldProps>;
    learningID?: PrimitiveOverrideProps<TextFieldProps>;
    chapterID?: PrimitiveOverrideProps<TextFieldProps>;
    sectionID?: PrimitiveOverrideProps<TextFieldProps>;
    timeSpent?: PrimitiveOverrideProps<TextFieldProps>;
    viewCount?: PrimitiveOverrideProps<TextFieldProps>;
    lastViewedAt?: PrimitiveOverrideProps<TextFieldProps>;
    firstViewedAt?: PrimitiveOverrideProps<TextFieldProps>;
    completed?: PrimitiveOverrideProps<SwitchFieldProps>;
    createdAt?: PrimitiveOverrideProps<TextFieldProps>;
    updatedAt?: PrimitiveOverrideProps<TextFieldProps>;
    _version?: PrimitiveOverrideProps<TextFieldProps>;
    _deleted?: PrimitiveOverrideProps<SwitchFieldProps>;
    _lastChangedAt?: PrimitiveOverrideProps<TextFieldProps>;
} & EscapeHatchProps;
export declare type SectionInteractionUpdateFormProps = React.PropsWithChildren<{
    overrides?: SectionInteractionUpdateFormOverridesProps | undefined | null;
} & {
    id?: string;
    sectionInteraction?: any;
    onSubmit?: (fields: SectionInteractionUpdateFormInputValues) => SectionInteractionUpdateFormInputValues;
    onSuccess?: (fields: SectionInteractionUpdateFormInputValues) => void;
    onError?: (fields: SectionInteractionUpdateFormInputValues, errorMessage: string) => void;
    onChange?: (fields: SectionInteractionUpdateFormInputValues) => SectionInteractionUpdateFormInputValues;
    onValidate?: SectionInteractionUpdateFormValidationValues;
} & React.CSSProperties>;
export default function SectionInteractionUpdateForm(props: SectionInteractionUpdateFormProps): React.ReactElement;
