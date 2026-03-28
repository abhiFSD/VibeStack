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
export declare type AwardDefinitionUpdateFormInputValues = {
    type?: string;
    coins?: number;
    title?: string;
    description?: string;
    _version?: number;
    _deleted?: boolean;
    _lastChangedAt?: number;
};
export declare type AwardDefinitionUpdateFormValidationValues = {
    type?: ValidationFunction<string>;
    coins?: ValidationFunction<number>;
    title?: ValidationFunction<string>;
    description?: ValidationFunction<string>;
    _version?: ValidationFunction<number>;
    _deleted?: ValidationFunction<boolean>;
    _lastChangedAt?: ValidationFunction<number>;
};
export declare type PrimitiveOverrideProps<T> = Partial<T> & React.DOMAttributes<HTMLDivElement>;
export declare type AwardDefinitionUpdateFormOverridesProps = {
    AwardDefinitionUpdateFormGrid?: PrimitiveOverrideProps<GridProps>;
    type?: PrimitiveOverrideProps<SelectFieldProps>;
    coins?: PrimitiveOverrideProps<TextFieldProps>;
    title?: PrimitiveOverrideProps<TextFieldProps>;
    description?: PrimitiveOverrideProps<TextFieldProps>;
    _version?: PrimitiveOverrideProps<TextFieldProps>;
    _deleted?: PrimitiveOverrideProps<SwitchFieldProps>;
    _lastChangedAt?: PrimitiveOverrideProps<TextFieldProps>;
} & EscapeHatchProps;
export declare type AwardDefinitionUpdateFormProps = React.PropsWithChildren<{
    overrides?: AwardDefinitionUpdateFormOverridesProps | undefined | null;
} & {
    id?: string;
    awardDefinition?: any;
    onSubmit?: (fields: AwardDefinitionUpdateFormInputValues) => AwardDefinitionUpdateFormInputValues;
    onSuccess?: (fields: AwardDefinitionUpdateFormInputValues) => void;
    onError?: (fields: AwardDefinitionUpdateFormInputValues, errorMessage: string) => void;
    onChange?: (fields: AwardDefinitionUpdateFormInputValues) => AwardDefinitionUpdateFormInputValues;
    onValidate?: AwardDefinitionUpdateFormValidationValues;
} & React.CSSProperties>;
export default function AwardDefinitionUpdateForm(props: AwardDefinitionUpdateFormProps): React.ReactElement;
