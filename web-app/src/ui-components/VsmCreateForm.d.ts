/***************************************************************************
 * The contents of this file were generated with Amplify Studio.           *
 * Please refrain from making any modifications to this file.              *
 * Any changes to this file will be overwritten when running amplify pull. *
 **************************************************************************/

import * as React from "react";
import { GridProps, SwitchFieldProps, TextAreaFieldProps, TextFieldProps } from "@aws-amplify/ui-react";
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
export declare type VsmCreateFormInputValues = {
    process?: string;
    informationFlow?: string;
    kaizenProject?: string;
    demandData?: string;
    summaryData?: string;
    reportID?: string;
    inventory?: string;
    _version?: number;
    _deleted?: boolean;
    _lastChangedAt?: number;
};
export declare type VsmCreateFormValidationValues = {
    process?: ValidationFunction<string>;
    informationFlow?: ValidationFunction<string>;
    kaizenProject?: ValidationFunction<string>;
    demandData?: ValidationFunction<string>;
    summaryData?: ValidationFunction<string>;
    reportID?: ValidationFunction<string>;
    inventory?: ValidationFunction<string>;
    _version?: ValidationFunction<number>;
    _deleted?: ValidationFunction<boolean>;
    _lastChangedAt?: ValidationFunction<number>;
};
export declare type PrimitiveOverrideProps<T> = Partial<T> & React.DOMAttributes<HTMLDivElement>;
export declare type VsmCreateFormOverridesProps = {
    VsmCreateFormGrid?: PrimitiveOverrideProps<GridProps>;
    process?: PrimitiveOverrideProps<TextAreaFieldProps>;
    informationFlow?: PrimitiveOverrideProps<TextFieldProps>;
    kaizenProject?: PrimitiveOverrideProps<TextFieldProps>;
    demandData?: PrimitiveOverrideProps<TextAreaFieldProps>;
    summaryData?: PrimitiveOverrideProps<TextAreaFieldProps>;
    reportID?: PrimitiveOverrideProps<TextFieldProps>;
    inventory?: PrimitiveOverrideProps<TextAreaFieldProps>;
    _version?: PrimitiveOverrideProps<TextFieldProps>;
    _deleted?: PrimitiveOverrideProps<SwitchFieldProps>;
    _lastChangedAt?: PrimitiveOverrideProps<TextFieldProps>;
} & EscapeHatchProps;
export declare type VsmCreateFormProps = React.PropsWithChildren<{
    overrides?: VsmCreateFormOverridesProps | undefined | null;
} & {
    clearOnSuccess?: boolean;
    onSubmit?: (fields: VsmCreateFormInputValues) => VsmCreateFormInputValues;
    onSuccess?: (fields: VsmCreateFormInputValues) => void;
    onError?: (fields: VsmCreateFormInputValues, errorMessage: string) => void;
    onChange?: (fields: VsmCreateFormInputValues) => VsmCreateFormInputValues;
    onValidate?: VsmCreateFormValidationValues;
} & React.CSSProperties>;
export default function VsmCreateForm(props: VsmCreateFormProps): React.ReactElement;
