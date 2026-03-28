/***************************************************************************
 * The contents of this file were generated with Amplify Studio.           *
 * Please refrain from making any modifications to this file.              *
 * Any changes to this file will be overwritten when running amplify pull. *
 **************************************************************************/

/* eslint-disable */
import * as React from "react";
import {
  Button,
  Flex,
  Grid,
  SwitchField,
  TextField,
} from "@aws-amplify/ui-react";
import { fetchByPath, getOverrideProps, validateField } from "./utils";
import { API } from "aws-amplify";
import { getUser } from "../graphql/queries";
import { updateUser } from "../graphql/mutations";
export default function UserUpdateForm(props) {
  const {
    id: idProp,
    user: userModelProp,
    onSuccess,
    onError,
    onSubmit,
    onValidate,
    onChange,
    overrides,
    ...rest
  } = props;
  const initialValues = {
    cognitoID: "",
    email: "",
    firstName: "",
    lastName: "",
    profileImageKey: "",
    profileImagePath: "",
    profileImageUrl: "",
    lastLogin: "",
    source: "",
    termsAccepted: false,
    termsAcceptedDate: "",
    _version: "",
    _deleted: false,
    _lastChangedAt: "",
  };
  const [cognitoID, setCognitoID] = React.useState(initialValues.cognitoID);
  const [email, setEmail] = React.useState(initialValues.email);
  const [firstName, setFirstName] = React.useState(initialValues.firstName);
  const [lastName, setLastName] = React.useState(initialValues.lastName);
  const [profileImageKey, setProfileImageKey] = React.useState(
    initialValues.profileImageKey
  );
  const [profileImagePath, setProfileImagePath] = React.useState(
    initialValues.profileImagePath
  );
  const [profileImageUrl, setProfileImageUrl] = React.useState(
    initialValues.profileImageUrl
  );
  const [lastLogin, setLastLogin] = React.useState(initialValues.lastLogin);
  const [source, setSource] = React.useState(initialValues.source);
  const [termsAccepted, setTermsAccepted] = React.useState(
    initialValues.termsAccepted
  );
  const [termsAcceptedDate, setTermsAcceptedDate] = React.useState(
    initialValues.termsAcceptedDate
  );
  const [_version, set_version] = React.useState(initialValues._version);
  const [_deleted, set_deleted] = React.useState(initialValues._deleted);
  const [_lastChangedAt, set_lastChangedAt] = React.useState(
    initialValues._lastChangedAt
  );
  const [errors, setErrors] = React.useState({});
  const resetStateValues = () => {
    const cleanValues = userRecord
      ? { ...initialValues, ...userRecord }
      : initialValues;
    setCognitoID(cleanValues.cognitoID);
    setEmail(cleanValues.email);
    setFirstName(cleanValues.firstName);
    setLastName(cleanValues.lastName);
    setProfileImageKey(cleanValues.profileImageKey);
    setProfileImagePath(cleanValues.profileImagePath);
    setProfileImageUrl(cleanValues.profileImageUrl);
    setLastLogin(cleanValues.lastLogin);
    setSource(cleanValues.source);
    setTermsAccepted(cleanValues.termsAccepted);
    setTermsAcceptedDate(cleanValues.termsAcceptedDate);
    set_version(cleanValues._version);
    set_deleted(cleanValues._deleted);
    set_lastChangedAt(cleanValues._lastChangedAt);
    setErrors({});
  };
  const [userRecord, setUserRecord] = React.useState(userModelProp);
  React.useEffect(() => {
    const queryData = async () => {
      const record = idProp
        ? (
            await API.graphql({
              query: getUser.replaceAll("__typename", ""),
              variables: { id: idProp },
            })
          )?.data?.getUser
        : userModelProp;
      setUserRecord(record);
    };
    queryData();
  }, [idProp, userModelProp]);
  React.useEffect(resetStateValues, [userRecord]);
  const validations = {
    cognitoID: [{ type: "Required" }],
    email: [{ type: "Required" }],
    firstName: [],
    lastName: [],
    profileImageKey: [],
    profileImagePath: [],
    profileImageUrl: [],
    lastLogin: [],
    source: [],
    termsAccepted: [],
    termsAcceptedDate: [],
    _version: [],
    _deleted: [],
    _lastChangedAt: [],
  };
  const runValidationTasks = async (
    fieldName,
    currentValue,
    getDisplayValue
  ) => {
    const value =
      currentValue && getDisplayValue
        ? getDisplayValue(currentValue)
        : currentValue;
    let validationResponse = validateField(value, validations[fieldName]);
    const customValidator = fetchByPath(onValidate, fieldName);
    if (customValidator) {
      validationResponse = await customValidator(value, validationResponse);
    }
    setErrors((errors) => ({ ...errors, [fieldName]: validationResponse }));
    return validationResponse;
  };
  const convertTimeStampToDate = (ts) => {
    if (Math.abs(Date.now() - ts) < Math.abs(Date.now() - ts * 1000)) {
      return new Date(ts);
    }
    return new Date(ts * 1000);
  };
  const convertToLocal = (date) => {
    const df = new Intl.DateTimeFormat("default", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      calendar: "iso8601",
      numberingSystem: "latn",
      hourCycle: "h23",
    });
    const parts = df.formatToParts(date).reduce((acc, part) => {
      acc[part.type] = part.value;
      return acc;
    }, {});
    return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
  };
  return (
    <Grid
      as="form"
      rowGap="15px"
      columnGap="15px"
      padding="20px"
      onSubmit={async (event) => {
        event.preventDefault();
        let modelFields = {
          cognitoID,
          email,
          firstName: firstName ?? null,
          lastName: lastName ?? null,
          profileImageKey: profileImageKey ?? null,
          profileImagePath: profileImagePath ?? null,
          profileImageUrl: profileImageUrl ?? null,
          lastLogin: lastLogin ?? null,
          source: source ?? null,
          termsAccepted: termsAccepted ?? null,
          termsAcceptedDate: termsAcceptedDate ?? null,
          _version: _version ?? null,
          _deleted: _deleted ?? null,
          _lastChangedAt: _lastChangedAt ?? null,
        };
        const validationResponses = await Promise.all(
          Object.keys(validations).reduce((promises, fieldName) => {
            if (Array.isArray(modelFields[fieldName])) {
              promises.push(
                ...modelFields[fieldName].map((item) =>
                  runValidationTasks(fieldName, item)
                )
              );
              return promises;
            }
            promises.push(
              runValidationTasks(fieldName, modelFields[fieldName])
            );
            return promises;
          }, [])
        );
        if (validationResponses.some((r) => r.hasError)) {
          return;
        }
        if (onSubmit) {
          modelFields = onSubmit(modelFields);
        }
        try {
          Object.entries(modelFields).forEach(([key, value]) => {
            if (typeof value === "string" && value === "") {
              modelFields[key] = null;
            }
          });
          await API.graphql({
            query: updateUser.replaceAll("__typename", ""),
            variables: {
              input: {
                id: userRecord.id,
                ...modelFields,
              },
            },
          });
          if (onSuccess) {
            onSuccess(modelFields);
          }
        } catch (err) {
          if (onError) {
            const messages = err.errors.map((e) => e.message).join("\n");
            onError(modelFields, messages);
          }
        }
      }}
      {...getOverrideProps(overrides, "UserUpdateForm")}
      {...rest}
    >
      <TextField
        label="Cognito id"
        isRequired={true}
        isReadOnly={false}
        value={cognitoID}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              cognitoID: value,
              email,
              firstName,
              lastName,
              profileImageKey,
              profileImagePath,
              profileImageUrl,
              lastLogin,
              source,
              termsAccepted,
              termsAcceptedDate,
              _version,
              _deleted,
              _lastChangedAt,
            };
            const result = onChange(modelFields);
            value = result?.cognitoID ?? value;
          }
          if (errors.cognitoID?.hasError) {
            runValidationTasks("cognitoID", value);
          }
          setCognitoID(value);
        }}
        onBlur={() => runValidationTasks("cognitoID", cognitoID)}
        errorMessage={errors.cognitoID?.errorMessage}
        hasError={errors.cognitoID?.hasError}
        {...getOverrideProps(overrides, "cognitoID")}
      ></TextField>
      <TextField
        label="Email"
        isRequired={true}
        isReadOnly={false}
        value={email}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              cognitoID,
              email: value,
              firstName,
              lastName,
              profileImageKey,
              profileImagePath,
              profileImageUrl,
              lastLogin,
              source,
              termsAccepted,
              termsAcceptedDate,
              _version,
              _deleted,
              _lastChangedAt,
            };
            const result = onChange(modelFields);
            value = result?.email ?? value;
          }
          if (errors.email?.hasError) {
            runValidationTasks("email", value);
          }
          setEmail(value);
        }}
        onBlur={() => runValidationTasks("email", email)}
        errorMessage={errors.email?.errorMessage}
        hasError={errors.email?.hasError}
        {...getOverrideProps(overrides, "email")}
      ></TextField>
      <TextField
        label="First name"
        isRequired={false}
        isReadOnly={false}
        value={firstName}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              cognitoID,
              email,
              firstName: value,
              lastName,
              profileImageKey,
              profileImagePath,
              profileImageUrl,
              lastLogin,
              source,
              termsAccepted,
              termsAcceptedDate,
              _version,
              _deleted,
              _lastChangedAt,
            };
            const result = onChange(modelFields);
            value = result?.firstName ?? value;
          }
          if (errors.firstName?.hasError) {
            runValidationTasks("firstName", value);
          }
          setFirstName(value);
        }}
        onBlur={() => runValidationTasks("firstName", firstName)}
        errorMessage={errors.firstName?.errorMessage}
        hasError={errors.firstName?.hasError}
        {...getOverrideProps(overrides, "firstName")}
      ></TextField>
      <TextField
        label="Last name"
        isRequired={false}
        isReadOnly={false}
        value={lastName}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              cognitoID,
              email,
              firstName,
              lastName: value,
              profileImageKey,
              profileImagePath,
              profileImageUrl,
              lastLogin,
              source,
              termsAccepted,
              termsAcceptedDate,
              _version,
              _deleted,
              _lastChangedAt,
            };
            const result = onChange(modelFields);
            value = result?.lastName ?? value;
          }
          if (errors.lastName?.hasError) {
            runValidationTasks("lastName", value);
          }
          setLastName(value);
        }}
        onBlur={() => runValidationTasks("lastName", lastName)}
        errorMessage={errors.lastName?.errorMessage}
        hasError={errors.lastName?.hasError}
        {...getOverrideProps(overrides, "lastName")}
      ></TextField>
      <TextField
        label="Profile image key"
        isRequired={false}
        isReadOnly={false}
        value={profileImageKey}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              cognitoID,
              email,
              firstName,
              lastName,
              profileImageKey: value,
              profileImagePath,
              profileImageUrl,
              lastLogin,
              source,
              termsAccepted,
              termsAcceptedDate,
              _version,
              _deleted,
              _lastChangedAt,
            };
            const result = onChange(modelFields);
            value = result?.profileImageKey ?? value;
          }
          if (errors.profileImageKey?.hasError) {
            runValidationTasks("profileImageKey", value);
          }
          setProfileImageKey(value);
        }}
        onBlur={() => runValidationTasks("profileImageKey", profileImageKey)}
        errorMessage={errors.profileImageKey?.errorMessage}
        hasError={errors.profileImageKey?.hasError}
        {...getOverrideProps(overrides, "profileImageKey")}
      ></TextField>
      <TextField
        label="Profile image path"
        isRequired={false}
        isReadOnly={false}
        value={profileImagePath}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              cognitoID,
              email,
              firstName,
              lastName,
              profileImageKey,
              profileImagePath: value,
              profileImageUrl,
              lastLogin,
              source,
              termsAccepted,
              termsAcceptedDate,
              _version,
              _deleted,
              _lastChangedAt,
            };
            const result = onChange(modelFields);
            value = result?.profileImagePath ?? value;
          }
          if (errors.profileImagePath?.hasError) {
            runValidationTasks("profileImagePath", value);
          }
          setProfileImagePath(value);
        }}
        onBlur={() => runValidationTasks("profileImagePath", profileImagePath)}
        errorMessage={errors.profileImagePath?.errorMessage}
        hasError={errors.profileImagePath?.hasError}
        {...getOverrideProps(overrides, "profileImagePath")}
      ></TextField>
      <TextField
        label="Profile image url"
        isRequired={false}
        isReadOnly={false}
        value={profileImageUrl}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              cognitoID,
              email,
              firstName,
              lastName,
              profileImageKey,
              profileImagePath,
              profileImageUrl: value,
              lastLogin,
              source,
              termsAccepted,
              termsAcceptedDate,
              _version,
              _deleted,
              _lastChangedAt,
            };
            const result = onChange(modelFields);
            value = result?.profileImageUrl ?? value;
          }
          if (errors.profileImageUrl?.hasError) {
            runValidationTasks("profileImageUrl", value);
          }
          setProfileImageUrl(value);
        }}
        onBlur={() => runValidationTasks("profileImageUrl", profileImageUrl)}
        errorMessage={errors.profileImageUrl?.errorMessage}
        hasError={errors.profileImageUrl?.hasError}
        {...getOverrideProps(overrides, "profileImageUrl")}
      ></TextField>
      <TextField
        label="Last login"
        isRequired={false}
        isReadOnly={false}
        type="datetime-local"
        value={lastLogin && convertToLocal(new Date(lastLogin))}
        onChange={(e) => {
          let value =
            e.target.value === "" ? "" : new Date(e.target.value).toISOString();
          if (onChange) {
            const modelFields = {
              cognitoID,
              email,
              firstName,
              lastName,
              profileImageKey,
              profileImagePath,
              profileImageUrl,
              lastLogin: value,
              source,
              termsAccepted,
              termsAcceptedDate,
              _version,
              _deleted,
              _lastChangedAt,
            };
            const result = onChange(modelFields);
            value = result?.lastLogin ?? value;
          }
          if (errors.lastLogin?.hasError) {
            runValidationTasks("lastLogin", value);
          }
          setLastLogin(value);
        }}
        onBlur={() => runValidationTasks("lastLogin", lastLogin)}
        errorMessage={errors.lastLogin?.errorMessage}
        hasError={errors.lastLogin?.hasError}
        {...getOverrideProps(overrides, "lastLogin")}
      ></TextField>
      <TextField
        label="Source"
        isRequired={false}
        isReadOnly={false}
        value={source}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              cognitoID,
              email,
              firstName,
              lastName,
              profileImageKey,
              profileImagePath,
              profileImageUrl,
              lastLogin,
              source: value,
              termsAccepted,
              termsAcceptedDate,
              _version,
              _deleted,
              _lastChangedAt,
            };
            const result = onChange(modelFields);
            value = result?.source ?? value;
          }
          if (errors.source?.hasError) {
            runValidationTasks("source", value);
          }
          setSource(value);
        }}
        onBlur={() => runValidationTasks("source", source)}
        errorMessage={errors.source?.errorMessage}
        hasError={errors.source?.hasError}
        {...getOverrideProps(overrides, "source")}
      ></TextField>
      <SwitchField
        label="Terms accepted"
        defaultChecked={false}
        isDisabled={false}
        isChecked={termsAccepted}
        onChange={(e) => {
          let value = e.target.checked;
          if (onChange) {
            const modelFields = {
              cognitoID,
              email,
              firstName,
              lastName,
              profileImageKey,
              profileImagePath,
              profileImageUrl,
              lastLogin,
              source,
              termsAccepted: value,
              termsAcceptedDate,
              _version,
              _deleted,
              _lastChangedAt,
            };
            const result = onChange(modelFields);
            value = result?.termsAccepted ?? value;
          }
          if (errors.termsAccepted?.hasError) {
            runValidationTasks("termsAccepted", value);
          }
          setTermsAccepted(value);
        }}
        onBlur={() => runValidationTasks("termsAccepted", termsAccepted)}
        errorMessage={errors.termsAccepted?.errorMessage}
        hasError={errors.termsAccepted?.hasError}
        {...getOverrideProps(overrides, "termsAccepted")}
      ></SwitchField>
      <TextField
        label="Terms accepted date"
        isRequired={false}
        isReadOnly={false}
        type="datetime-local"
        value={termsAcceptedDate && convertToLocal(new Date(termsAcceptedDate))}
        onChange={(e) => {
          let value =
            e.target.value === "" ? "" : new Date(e.target.value).toISOString();
          if (onChange) {
            const modelFields = {
              cognitoID,
              email,
              firstName,
              lastName,
              profileImageKey,
              profileImagePath,
              profileImageUrl,
              lastLogin,
              source,
              termsAccepted,
              termsAcceptedDate: value,
              _version,
              _deleted,
              _lastChangedAt,
            };
            const result = onChange(modelFields);
            value = result?.termsAcceptedDate ?? value;
          }
          if (errors.termsAcceptedDate?.hasError) {
            runValidationTasks("termsAcceptedDate", value);
          }
          setTermsAcceptedDate(value);
        }}
        onBlur={() =>
          runValidationTasks("termsAcceptedDate", termsAcceptedDate)
        }
        errorMessage={errors.termsAcceptedDate?.errorMessage}
        hasError={errors.termsAcceptedDate?.hasError}
        {...getOverrideProps(overrides, "termsAcceptedDate")}
      ></TextField>
      <TextField
        label="Version"
        isRequired={false}
        isReadOnly={false}
        type="number"
        step="any"
        value={_version}
        onChange={(e) => {
          let value = isNaN(parseInt(e.target.value))
            ? e.target.value
            : parseInt(e.target.value);
          if (onChange) {
            const modelFields = {
              cognitoID,
              email,
              firstName,
              lastName,
              profileImageKey,
              profileImagePath,
              profileImageUrl,
              lastLogin,
              source,
              termsAccepted,
              termsAcceptedDate,
              _version: value,
              _deleted,
              _lastChangedAt,
            };
            const result = onChange(modelFields);
            value = result?._version ?? value;
          }
          if (errors._version?.hasError) {
            runValidationTasks("_version", value);
          }
          set_version(value);
        }}
        onBlur={() => runValidationTasks("_version", _version)}
        errorMessage={errors._version?.errorMessage}
        hasError={errors._version?.hasError}
        {...getOverrideProps(overrides, "_version")}
      ></TextField>
      <SwitchField
        label="Deleted"
        defaultChecked={false}
        isDisabled={false}
        isChecked={_deleted}
        onChange={(e) => {
          let value = e.target.checked;
          if (onChange) {
            const modelFields = {
              cognitoID,
              email,
              firstName,
              lastName,
              profileImageKey,
              profileImagePath,
              profileImageUrl,
              lastLogin,
              source,
              termsAccepted,
              termsAcceptedDate,
              _version,
              _deleted: value,
              _lastChangedAt,
            };
            const result = onChange(modelFields);
            value = result?._deleted ?? value;
          }
          if (errors._deleted?.hasError) {
            runValidationTasks("_deleted", value);
          }
          set_deleted(value);
        }}
        onBlur={() => runValidationTasks("_deleted", _deleted)}
        errorMessage={errors._deleted?.errorMessage}
        hasError={errors._deleted?.hasError}
        {...getOverrideProps(overrides, "_deleted")}
      ></SwitchField>
      <TextField
        label="Last changed at"
        isRequired={false}
        isReadOnly={false}
        type="datetime-local"
        value={
          _lastChangedAt &&
          convertToLocal(convertTimeStampToDate(_lastChangedAt))
        }
        onChange={(e) => {
          let value =
            e.target.value === "" ? "" : Number(new Date(e.target.value));
          if (onChange) {
            const modelFields = {
              cognitoID,
              email,
              firstName,
              lastName,
              profileImageKey,
              profileImagePath,
              profileImageUrl,
              lastLogin,
              source,
              termsAccepted,
              termsAcceptedDate,
              _version,
              _deleted,
              _lastChangedAt: value,
            };
            const result = onChange(modelFields);
            value = result?._lastChangedAt ?? value;
          }
          if (errors._lastChangedAt?.hasError) {
            runValidationTasks("_lastChangedAt", value);
          }
          set_lastChangedAt(value);
        }}
        onBlur={() => runValidationTasks("_lastChangedAt", _lastChangedAt)}
        errorMessage={errors._lastChangedAt?.errorMessage}
        hasError={errors._lastChangedAt?.hasError}
        {...getOverrideProps(overrides, "_lastChangedAt")}
      ></TextField>
      <Flex
        justifyContent="space-between"
        {...getOverrideProps(overrides, "CTAFlex")}
      >
        <Button
          children="Reset"
          type="reset"
          onClick={(event) => {
            event.preventDefault();
            resetStateValues();
          }}
          isDisabled={!(idProp || userModelProp)}
          {...getOverrideProps(overrides, "ResetButton")}
        ></Button>
        <Flex
          gap="15px"
          {...getOverrideProps(overrides, "RightAlignCTASubFlex")}
        >
          <Button
            children="Submit"
            type="submit"
            variation="primary"
            isDisabled={
              !(idProp || userModelProp) ||
              Object.values(errors).some((e) => e?.hasError)
            }
            {...getOverrideProps(overrides, "SubmitButton")}
          ></Button>
        </Flex>
      </Flex>
    </Grid>
  );
}
