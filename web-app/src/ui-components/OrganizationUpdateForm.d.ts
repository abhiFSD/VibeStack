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
export declare type OrganizationUpdateFormInputValues = {
    name?: string;
    owner?: string;
    additionalOwners?: string[];
    contactEmail?: string;
    contactPhone?: string;
    location?: string;
    coordinates?: string;
    logo?: string;
    isActive?: boolean;
    leaderboardEnabled?: boolean;
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    stripeSubscriptionItemId?: string;
    subscriptionStatus?: string;
    subscriptionPeriodEnd?: string;
    billingPeriod?: string;
    activeUserCount?: number;
    purchasedLicenses?: number;
    aiDisabledUsers?: string[];
    learningCoinsPerInterval?: number;
    learningCoinInterval?: number;
    learningMaxCoinsPerSession?: number;
    learningCoinsEnabled?: boolean;
    createdAt?: string;
    updatedAt?: string;
    _version?: number;
    _deleted?: boolean;
    _lastChangedAt?: number;
};
export declare type OrganizationUpdateFormValidationValues = {
    name?: ValidationFunction<string>;
    owner?: ValidationFunction<string>;
    additionalOwners?: ValidationFunction<string>;
    contactEmail?: ValidationFunction<string>;
    contactPhone?: ValidationFunction<string>;
    location?: ValidationFunction<string>;
    coordinates?: ValidationFunction<string>;
    logo?: ValidationFunction<string>;
    isActive?: ValidationFunction<boolean>;
    leaderboardEnabled?: ValidationFunction<boolean>;
    stripeCustomerId?: ValidationFunction<string>;
    stripeSubscriptionId?: ValidationFunction<string>;
    stripeSubscriptionItemId?: ValidationFunction<string>;
    subscriptionStatus?: ValidationFunction<string>;
    subscriptionPeriodEnd?: ValidationFunction<string>;
    billingPeriod?: ValidationFunction<string>;
    activeUserCount?: ValidationFunction<number>;
    purchasedLicenses?: ValidationFunction<number>;
    aiDisabledUsers?: ValidationFunction<string>;
    learningCoinsPerInterval?: ValidationFunction<number>;
    learningCoinInterval?: ValidationFunction<number>;
    learningMaxCoinsPerSession?: ValidationFunction<number>;
    learningCoinsEnabled?: ValidationFunction<boolean>;
    createdAt?: ValidationFunction<string>;
    updatedAt?: ValidationFunction<string>;
    _version?: ValidationFunction<number>;
    _deleted?: ValidationFunction<boolean>;
    _lastChangedAt?: ValidationFunction<number>;
};
export declare type PrimitiveOverrideProps<T> = Partial<T> & React.DOMAttributes<HTMLDivElement>;
export declare type OrganizationUpdateFormOverridesProps = {
    OrganizationUpdateFormGrid?: PrimitiveOverrideProps<GridProps>;
    name?: PrimitiveOverrideProps<TextFieldProps>;
    owner?: PrimitiveOverrideProps<TextFieldProps>;
    additionalOwners?: PrimitiveOverrideProps<TextFieldProps>;
    contactEmail?: PrimitiveOverrideProps<TextFieldProps>;
    contactPhone?: PrimitiveOverrideProps<TextFieldProps>;
    location?: PrimitiveOverrideProps<TextFieldProps>;
    coordinates?: PrimitiveOverrideProps<TextFieldProps>;
    logo?: PrimitiveOverrideProps<TextFieldProps>;
    isActive?: PrimitiveOverrideProps<SwitchFieldProps>;
    leaderboardEnabled?: PrimitiveOverrideProps<SwitchFieldProps>;
    stripeCustomerId?: PrimitiveOverrideProps<TextFieldProps>;
    stripeSubscriptionId?: PrimitiveOverrideProps<TextFieldProps>;
    stripeSubscriptionItemId?: PrimitiveOverrideProps<TextFieldProps>;
    subscriptionStatus?: PrimitiveOverrideProps<TextFieldProps>;
    subscriptionPeriodEnd?: PrimitiveOverrideProps<TextFieldProps>;
    billingPeriod?: PrimitiveOverrideProps<TextFieldProps>;
    activeUserCount?: PrimitiveOverrideProps<TextFieldProps>;
    purchasedLicenses?: PrimitiveOverrideProps<TextFieldProps>;
    aiDisabledUsers?: PrimitiveOverrideProps<TextFieldProps>;
    learningCoinsPerInterval?: PrimitiveOverrideProps<TextFieldProps>;
    learningCoinInterval?: PrimitiveOverrideProps<TextFieldProps>;
    learningMaxCoinsPerSession?: PrimitiveOverrideProps<TextFieldProps>;
    learningCoinsEnabled?: PrimitiveOverrideProps<SwitchFieldProps>;
    createdAt?: PrimitiveOverrideProps<TextFieldProps>;
    updatedAt?: PrimitiveOverrideProps<TextFieldProps>;
    _version?: PrimitiveOverrideProps<TextFieldProps>;
    _deleted?: PrimitiveOverrideProps<SwitchFieldProps>;
    _lastChangedAt?: PrimitiveOverrideProps<TextFieldProps>;
} & EscapeHatchProps;
export declare type OrganizationUpdateFormProps = React.PropsWithChildren<{
    overrides?: OrganizationUpdateFormOverridesProps | undefined | null;
} & {
    id?: string;
    organization?: any;
    onSubmit?: (fields: OrganizationUpdateFormInputValues) => OrganizationUpdateFormInputValues;
    onSuccess?: (fields: OrganizationUpdateFormInputValues) => void;
    onError?: (fields: OrganizationUpdateFormInputValues, errorMessage: string) => void;
    onChange?: (fields: OrganizationUpdateFormInputValues) => OrganizationUpdateFormInputValues;
    onValidate?: OrganizationUpdateFormValidationValues;
} & React.CSSProperties>;
export default function OrganizationUpdateForm(props: OrganizationUpdateFormProps): React.ReactElement;
