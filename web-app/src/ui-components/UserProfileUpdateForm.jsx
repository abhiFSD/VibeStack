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
import { getUserProfile } from "../graphql/queries";
import { updateUserProfile } from "../graphql/mutations";
export default function UserProfileUpdateForm(props) {
  const {
    id: idProp,
    userProfile: userProfileModelProp,
    onSuccess,
    onError,
    onSubmit,
    onValidate,
    onChange,
    overrides,
    ...rest
  } = props;
  const initialValues = {
    user_sub: "",
    createdAt: "",
    updatedAt: "",
    _version: "",
    _deleted: false,
    _lastChangedAt: "",
  };
  const [user_sub, setUser_sub] = React.useState(initialValues.user_sub);
  const [createdAt, setCreatedAt] = React.useState(initialValues.createdAt);
  const [updatedAt, setUpdatedAt] = React.useState(initialValues.updatedAt);
  const [_version, set_version] = React.useState(initialValues._version);
  const [_deleted, set_deleted] = React.useState(initialValues._deleted);
  const [_lastChangedAt, set_lastChangedAt] = React.useState(
    initialValues._lastChangedAt
  );
  const [errors, setErrors] = React.useState({});
  const resetStateValues = () => {
    const cleanValues = userProfileRecord
      ? { ...initialValues, ...userProfileRecord }
      : initialValues;
    setUser_sub(cleanValues.user_sub);
    setCreatedAt(cleanValues.createdAt);
    setUpdatedAt(cleanValues.updatedAt);
    set_version(cleanValues._version);
    set_deleted(cleanValues._deleted);
    set_lastChangedAt(cleanValues._lastChangedAt);
    setErrors({});
  };
  const [userProfileRecord, setUserProfileRecord] =
    React.useState(userProfileModelProp);
  React.useEffect(() => {
    const queryData = async () => {
      const record = idProp
        ? (
            await API.graphql({
              query: getUserProfile.replaceAll("__typename", ""),
              variables: { id: idProp },
            })
          )?.data?.getUserProfile
        : userProfileModelProp;
      setUserProfileRecord(record);
    };
    queryData();
  }, [idProp, userProfileModelProp]);
  React.useEffect(resetStateValues, [userProfileRecord]);
  const validations = {
    user_sub: [{ type: "Required" }],
    createdAt: [{ type: "Required" }],
    updatedAt: [{ type: "Required" }],
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
          user_sub,
          createdAt,
          updatedAt,
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
            query: updateUserProfile.replaceAll("__typename", ""),
            variables: {
              input: {
                id: userProfileRecord.id,
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
      {...getOverrideProps(overrides, "UserProfileUpdateForm")}
      {...rest}
    >
      <TextField
        label="User sub"
        isRequired={true}
        isReadOnly={false}
        value={user_sub}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              user_sub: value,
              createdAt,
              updatedAt,
              _version,
              _deleted,
              _lastChangedAt,
            };
            const result = onChange(modelFields);
            value = result?.user_sub ?? value;
          }
          if (errors.user_sub?.hasError) {
            runValidationTasks("user_sub", value);
          }
          setUser_sub(value);
        }}
        onBlur={() => runValidationTasks("user_sub", user_sub)}
        errorMessage={errors.user_sub?.errorMessage}
        hasError={errors.user_sub?.hasError}
        {...getOverrideProps(overrides, "user_sub")}
      ></TextField>
      <TextField
        label="Created at"
        isRequired={true}
        isReadOnly={false}
        type="datetime-local"
        value={createdAt && convertToLocal(new Date(createdAt))}
        onChange={(e) => {
          let value =
            e.target.value === "" ? "" : new Date(e.target.value).toISOString();
          if (onChange) {
            const modelFields = {
              user_sub,
              createdAt: value,
              updatedAt,
              _version,
              _deleted,
              _lastChangedAt,
            };
            const result = onChange(modelFields);
            value = result?.createdAt ?? value;
          }
          if (errors.createdAt?.hasError) {
            runValidationTasks("createdAt", value);
          }
          setCreatedAt(value);
        }}
        onBlur={() => runValidationTasks("createdAt", createdAt)}
        errorMessage={errors.createdAt?.errorMessage}
        hasError={errors.createdAt?.hasError}
        {...getOverrideProps(overrides, "createdAt")}
      ></TextField>
      <TextField
        label="Updated at"
        isRequired={true}
        isReadOnly={false}
        type="datetime-local"
        value={updatedAt && convertToLocal(new Date(updatedAt))}
        onChange={(e) => {
          let value =
            e.target.value === "" ? "" : new Date(e.target.value).toISOString();
          if (onChange) {
            const modelFields = {
              user_sub,
              createdAt,
              updatedAt: value,
              _version,
              _deleted,
              _lastChangedAt,
            };
            const result = onChange(modelFields);
            value = result?.updatedAt ?? value;
          }
          if (errors.updatedAt?.hasError) {
            runValidationTasks("updatedAt", value);
          }
          setUpdatedAt(value);
        }}
        onBlur={() => runValidationTasks("updatedAt", updatedAt)}
        errorMessage={errors.updatedAt?.errorMessage}
        hasError={errors.updatedAt?.hasError}
        {...getOverrideProps(overrides, "updatedAt")}
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
              user_sub,
              createdAt,
              updatedAt,
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
              user_sub,
              createdAt,
              updatedAt,
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
              user_sub,
              createdAt,
              updatedAt,
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
          isDisabled={!(idProp || userProfileModelProp)}
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
              !(idProp || userProfileModelProp) ||
              Object.values(errors).some((e) => e?.hasError)
            }
            {...getOverrideProps(overrides, "SubmitButton")}
          ></Button>
        </Flex>
      </Flex>
    </Grid>
  );
}
