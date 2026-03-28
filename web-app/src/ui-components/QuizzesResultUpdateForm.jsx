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
import { getQuizzesResult } from "../graphql/queries";
import { updateQuizzesResult } from "../graphql/mutations";
export default function QuizzesResultUpdateForm(props) {
  const {
    id: idProp,
    quizzesResult: quizzesResultModelProp,
    onSuccess,
    onError,
    onSubmit,
    onValidate,
    onChange,
    overrides,
    ...rest
  } = props;
  const initialValues = {
    Correct: "",
    Incorrect: "",
    percentage: "",
    user_sub: "",
    tool_id: "",
    _version: "",
    _deleted: false,
    _lastChangedAt: "",
  };
  const [Correct, setCorrect] = React.useState(initialValues.Correct);
  const [Incorrect, setIncorrect] = React.useState(initialValues.Incorrect);
  const [percentage, setPercentage] = React.useState(initialValues.percentage);
  const [user_sub, setUser_sub] = React.useState(initialValues.user_sub);
  const [tool_id, setTool_id] = React.useState(initialValues.tool_id);
  const [_version, set_version] = React.useState(initialValues._version);
  const [_deleted, set_deleted] = React.useState(initialValues._deleted);
  const [_lastChangedAt, set_lastChangedAt] = React.useState(
    initialValues._lastChangedAt
  );
  const [errors, setErrors] = React.useState({});
  const resetStateValues = () => {
    const cleanValues = quizzesResultRecord
      ? { ...initialValues, ...quizzesResultRecord }
      : initialValues;
    setCorrect(cleanValues.Correct);
    setIncorrect(cleanValues.Incorrect);
    setPercentage(cleanValues.percentage);
    setUser_sub(cleanValues.user_sub);
    setTool_id(cleanValues.tool_id);
    set_version(cleanValues._version);
    set_deleted(cleanValues._deleted);
    set_lastChangedAt(cleanValues._lastChangedAt);
    setErrors({});
  };
  const [quizzesResultRecord, setQuizzesResultRecord] = React.useState(
    quizzesResultModelProp
  );
  React.useEffect(() => {
    const queryData = async () => {
      const record = idProp
        ? (
            await API.graphql({
              query: getQuizzesResult.replaceAll("__typename", ""),
              variables: { id: idProp },
            })
          )?.data?.getQuizzesResult
        : quizzesResultModelProp;
      setQuizzesResultRecord(record);
    };
    queryData();
  }, [idProp, quizzesResultModelProp]);
  React.useEffect(resetStateValues, [quizzesResultRecord]);
  const validations = {
    Correct: [],
    Incorrect: [],
    percentage: [],
    user_sub: [],
    tool_id: [],
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
          Correct: Correct ?? null,
          Incorrect: Incorrect ?? null,
          percentage: percentage ?? null,
          user_sub: user_sub ?? null,
          tool_id: tool_id ?? null,
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
            query: updateQuizzesResult.replaceAll("__typename", ""),
            variables: {
              input: {
                id: quizzesResultRecord.id,
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
      {...getOverrideProps(overrides, "QuizzesResultUpdateForm")}
      {...rest}
    >
      <TextField
        label="Correct"
        isRequired={false}
        isReadOnly={false}
        value={Correct}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              Correct: value,
              Incorrect,
              percentage,
              user_sub,
              tool_id,
              _version,
              _deleted,
              _lastChangedAt,
            };
            const result = onChange(modelFields);
            value = result?.Correct ?? value;
          }
          if (errors.Correct?.hasError) {
            runValidationTasks("Correct", value);
          }
          setCorrect(value);
        }}
        onBlur={() => runValidationTasks("Correct", Correct)}
        errorMessage={errors.Correct?.errorMessage}
        hasError={errors.Correct?.hasError}
        {...getOverrideProps(overrides, "Correct")}
      ></TextField>
      <TextField
        label="Incorrect"
        isRequired={false}
        isReadOnly={false}
        value={Incorrect}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              Correct,
              Incorrect: value,
              percentage,
              user_sub,
              tool_id,
              _version,
              _deleted,
              _lastChangedAt,
            };
            const result = onChange(modelFields);
            value = result?.Incorrect ?? value;
          }
          if (errors.Incorrect?.hasError) {
            runValidationTasks("Incorrect", value);
          }
          setIncorrect(value);
        }}
        onBlur={() => runValidationTasks("Incorrect", Incorrect)}
        errorMessage={errors.Incorrect?.errorMessage}
        hasError={errors.Incorrect?.hasError}
        {...getOverrideProps(overrides, "Incorrect")}
      ></TextField>
      <TextField
        label="Percentage"
        isRequired={false}
        isReadOnly={false}
        value={percentage}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              Correct,
              Incorrect,
              percentage: value,
              user_sub,
              tool_id,
              _version,
              _deleted,
              _lastChangedAt,
            };
            const result = onChange(modelFields);
            value = result?.percentage ?? value;
          }
          if (errors.percentage?.hasError) {
            runValidationTasks("percentage", value);
          }
          setPercentage(value);
        }}
        onBlur={() => runValidationTasks("percentage", percentage)}
        errorMessage={errors.percentage?.errorMessage}
        hasError={errors.percentage?.hasError}
        {...getOverrideProps(overrides, "percentage")}
      ></TextField>
      <TextField
        label="User sub"
        isRequired={false}
        isReadOnly={false}
        value={user_sub}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              Correct,
              Incorrect,
              percentage,
              user_sub: value,
              tool_id,
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
        label="Tool id"
        isRequired={false}
        isReadOnly={false}
        value={tool_id}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              Correct,
              Incorrect,
              percentage,
              user_sub,
              tool_id: value,
              _version,
              _deleted,
              _lastChangedAt,
            };
            const result = onChange(modelFields);
            value = result?.tool_id ?? value;
          }
          if (errors.tool_id?.hasError) {
            runValidationTasks("tool_id", value);
          }
          setTool_id(value);
        }}
        onBlur={() => runValidationTasks("tool_id", tool_id)}
        errorMessage={errors.tool_id?.errorMessage}
        hasError={errors.tool_id?.hasError}
        {...getOverrideProps(overrides, "tool_id")}
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
              Correct,
              Incorrect,
              percentage,
              user_sub,
              tool_id,
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
              Correct,
              Incorrect,
              percentage,
              user_sub,
              tool_id,
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
              Correct,
              Incorrect,
              percentage,
              user_sub,
              tool_id,
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
          isDisabled={!(idProp || quizzesResultModelProp)}
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
              !(idProp || quizzesResultModelProp) ||
              Object.values(errors).some((e) => e?.hasError)
            }
            {...getOverrideProps(overrides, "SubmitButton")}
          ></Button>
        </Flex>
      </Flex>
    </Grid>
  );
}
