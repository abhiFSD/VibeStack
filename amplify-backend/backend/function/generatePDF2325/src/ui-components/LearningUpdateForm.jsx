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
import { getLearning } from "../graphql/queries";
import { updateLearning } from "../graphql/mutations";
export default function LearningUpdateForm(props) {
  const {
    id: idProp,
    learning: learningModelProp,
    onSuccess,
    onError,
    onSubmit,
    onValidate,
    onChange,
    overrides,
    ...rest
  } = props;
  const initialValues = {
    orderIndex: "",
    title: "",
    description: "",
    quizScore: "",
    quizStatementsCount: "",
    hasQuizTaken: false,
    isDefault: false,
    readTime: "",
    createdAt: "",
    updatedAt: "",
    _version: "",
    _deleted: false,
    _lastChangedAt: "",
  };
  const [orderIndex, setOrderIndex] = React.useState(initialValues.orderIndex);
  const [title, setTitle] = React.useState(initialValues.title);
  const [description, setDescription] = React.useState(
    initialValues.description
  );
  const [quizScore, setQuizScore] = React.useState(initialValues.quizScore);
  const [quizStatementsCount, setQuizStatementsCount] = React.useState(
    initialValues.quizStatementsCount
  );
  const [hasQuizTaken, setHasQuizTaken] = React.useState(
    initialValues.hasQuizTaken
  );
  const [isDefault, setIsDefault] = React.useState(initialValues.isDefault);
  const [readTime, setReadTime] = React.useState(initialValues.readTime);
  const [createdAt, setCreatedAt] = React.useState(initialValues.createdAt);
  const [updatedAt, setUpdatedAt] = React.useState(initialValues.updatedAt);
  const [_version, set_version] = React.useState(initialValues._version);
  const [_deleted, set_deleted] = React.useState(initialValues._deleted);
  const [_lastChangedAt, set_lastChangedAt] = React.useState(
    initialValues._lastChangedAt
  );
  const [errors, setErrors] = React.useState({});
  const resetStateValues = () => {
    const cleanValues = learningRecord
      ? { ...initialValues, ...learningRecord }
      : initialValues;
    setOrderIndex(cleanValues.orderIndex);
    setTitle(cleanValues.title);
    setDescription(cleanValues.description);
    setQuizScore(cleanValues.quizScore);
    setQuizStatementsCount(cleanValues.quizStatementsCount);
    setHasQuizTaken(cleanValues.hasQuizTaken);
    setIsDefault(cleanValues.isDefault);
    setReadTime(cleanValues.readTime);
    setCreatedAt(cleanValues.createdAt);
    setUpdatedAt(cleanValues.updatedAt);
    set_version(cleanValues._version);
    set_deleted(cleanValues._deleted);
    set_lastChangedAt(cleanValues._lastChangedAt);
    setErrors({});
  };
  const [learningRecord, setLearningRecord] = React.useState(learningModelProp);
  React.useEffect(() => {
    const queryData = async () => {
      const record = idProp
        ? (
            await API.graphql({
              query: getLearning.replaceAll("__typename", ""),
              variables: { id: idProp },
            })
          )?.data?.getLearning
        : learningModelProp;
      setLearningRecord(record);
    };
    queryData();
  }, [idProp, learningModelProp]);
  React.useEffect(resetStateValues, [learningRecord]);
  const validations = {
    orderIndex: [],
    title: [{ type: "Required" }],
    description: [],
    quizScore: [],
    quizStatementsCount: [],
    hasQuizTaken: [],
    isDefault: [],
    readTime: [],
    createdAt: [],
    updatedAt: [],
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
          orderIndex: orderIndex ?? null,
          title,
          description: description ?? null,
          quizScore: quizScore ?? null,
          quizStatementsCount: quizStatementsCount ?? null,
          hasQuizTaken: hasQuizTaken ?? null,
          isDefault: isDefault ?? null,
          readTime: readTime ?? null,
          createdAt: createdAt ?? null,
          updatedAt: updatedAt ?? null,
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
            query: updateLearning.replaceAll("__typename", ""),
            variables: {
              input: {
                id: learningRecord.id,
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
      {...getOverrideProps(overrides, "LearningUpdateForm")}
      {...rest}
    >
      <TextField
        label="Order index"
        isRequired={false}
        isReadOnly={false}
        type="number"
        step="any"
        value={orderIndex}
        onChange={(e) => {
          let value = isNaN(parseInt(e.target.value))
            ? e.target.value
            : parseInt(e.target.value);
          if (onChange) {
            const modelFields = {
              orderIndex: value,
              title,
              description,
              quizScore,
              quizStatementsCount,
              hasQuizTaken,
              isDefault,
              readTime,
              createdAt,
              updatedAt,
              _version,
              _deleted,
              _lastChangedAt,
            };
            const result = onChange(modelFields);
            value = result?.orderIndex ?? value;
          }
          if (errors.orderIndex?.hasError) {
            runValidationTasks("orderIndex", value);
          }
          setOrderIndex(value);
        }}
        onBlur={() => runValidationTasks("orderIndex", orderIndex)}
        errorMessage={errors.orderIndex?.errorMessage}
        hasError={errors.orderIndex?.hasError}
        {...getOverrideProps(overrides, "orderIndex")}
      ></TextField>
      <TextField
        label="Title"
        isRequired={true}
        isReadOnly={false}
        value={title}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              orderIndex,
              title: value,
              description,
              quizScore,
              quizStatementsCount,
              hasQuizTaken,
              isDefault,
              readTime,
              createdAt,
              updatedAt,
              _version,
              _deleted,
              _lastChangedAt,
            };
            const result = onChange(modelFields);
            value = result?.title ?? value;
          }
          if (errors.title?.hasError) {
            runValidationTasks("title", value);
          }
          setTitle(value);
        }}
        onBlur={() => runValidationTasks("title", title)}
        errorMessage={errors.title?.errorMessage}
        hasError={errors.title?.hasError}
        {...getOverrideProps(overrides, "title")}
      ></TextField>
      <TextField
        label="Description"
        isRequired={false}
        isReadOnly={false}
        value={description}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              orderIndex,
              title,
              description: value,
              quizScore,
              quizStatementsCount,
              hasQuizTaken,
              isDefault,
              readTime,
              createdAt,
              updatedAt,
              _version,
              _deleted,
              _lastChangedAt,
            };
            const result = onChange(modelFields);
            value = result?.description ?? value;
          }
          if (errors.description?.hasError) {
            runValidationTasks("description", value);
          }
          setDescription(value);
        }}
        onBlur={() => runValidationTasks("description", description)}
        errorMessage={errors.description?.errorMessage}
        hasError={errors.description?.hasError}
        {...getOverrideProps(overrides, "description")}
      ></TextField>
      <TextField
        label="Quiz score"
        isRequired={false}
        isReadOnly={false}
        type="number"
        step="any"
        value={quizScore}
        onChange={(e) => {
          let value = isNaN(parseFloat(e.target.value))
            ? e.target.value
            : parseFloat(e.target.value);
          if (onChange) {
            const modelFields = {
              orderIndex,
              title,
              description,
              quizScore: value,
              quizStatementsCount,
              hasQuizTaken,
              isDefault,
              readTime,
              createdAt,
              updatedAt,
              _version,
              _deleted,
              _lastChangedAt,
            };
            const result = onChange(modelFields);
            value = result?.quizScore ?? value;
          }
          if (errors.quizScore?.hasError) {
            runValidationTasks("quizScore", value);
          }
          setQuizScore(value);
        }}
        onBlur={() => runValidationTasks("quizScore", quizScore)}
        errorMessage={errors.quizScore?.errorMessage}
        hasError={errors.quizScore?.hasError}
        {...getOverrideProps(overrides, "quizScore")}
      ></TextField>
      <TextField
        label="Quiz statements count"
        isRequired={false}
        isReadOnly={false}
        type="number"
        step="any"
        value={quizStatementsCount}
        onChange={(e) => {
          let value = isNaN(parseInt(e.target.value))
            ? e.target.value
            : parseInt(e.target.value);
          if (onChange) {
            const modelFields = {
              orderIndex,
              title,
              description,
              quizScore,
              quizStatementsCount: value,
              hasQuizTaken,
              isDefault,
              readTime,
              createdAt,
              updatedAt,
              _version,
              _deleted,
              _lastChangedAt,
            };
            const result = onChange(modelFields);
            value = result?.quizStatementsCount ?? value;
          }
          if (errors.quizStatementsCount?.hasError) {
            runValidationTasks("quizStatementsCount", value);
          }
          setQuizStatementsCount(value);
        }}
        onBlur={() =>
          runValidationTasks("quizStatementsCount", quizStatementsCount)
        }
        errorMessage={errors.quizStatementsCount?.errorMessage}
        hasError={errors.quizStatementsCount?.hasError}
        {...getOverrideProps(overrides, "quizStatementsCount")}
      ></TextField>
      <SwitchField
        label="Has quiz taken"
        defaultChecked={false}
        isDisabled={false}
        isChecked={hasQuizTaken}
        onChange={(e) => {
          let value = e.target.checked;
          if (onChange) {
            const modelFields = {
              orderIndex,
              title,
              description,
              quizScore,
              quizStatementsCount,
              hasQuizTaken: value,
              isDefault,
              readTime,
              createdAt,
              updatedAt,
              _version,
              _deleted,
              _lastChangedAt,
            };
            const result = onChange(modelFields);
            value = result?.hasQuizTaken ?? value;
          }
          if (errors.hasQuizTaken?.hasError) {
            runValidationTasks("hasQuizTaken", value);
          }
          setHasQuizTaken(value);
        }}
        onBlur={() => runValidationTasks("hasQuizTaken", hasQuizTaken)}
        errorMessage={errors.hasQuizTaken?.errorMessage}
        hasError={errors.hasQuizTaken?.hasError}
        {...getOverrideProps(overrides, "hasQuizTaken")}
      ></SwitchField>
      <SwitchField
        label="Is default"
        defaultChecked={false}
        isDisabled={false}
        isChecked={isDefault}
        onChange={(e) => {
          let value = e.target.checked;
          if (onChange) {
            const modelFields = {
              orderIndex,
              title,
              description,
              quizScore,
              quizStatementsCount,
              hasQuizTaken,
              isDefault: value,
              readTime,
              createdAt,
              updatedAt,
              _version,
              _deleted,
              _lastChangedAt,
            };
            const result = onChange(modelFields);
            value = result?.isDefault ?? value;
          }
          if (errors.isDefault?.hasError) {
            runValidationTasks("isDefault", value);
          }
          setIsDefault(value);
        }}
        onBlur={() => runValidationTasks("isDefault", isDefault)}
        errorMessage={errors.isDefault?.errorMessage}
        hasError={errors.isDefault?.hasError}
        {...getOverrideProps(overrides, "isDefault")}
      ></SwitchField>
      <TextField
        label="Read time"
        isRequired={false}
        isReadOnly={false}
        value={readTime}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              orderIndex,
              title,
              description,
              quizScore,
              quizStatementsCount,
              hasQuizTaken,
              isDefault,
              readTime: value,
              createdAt,
              updatedAt,
              _version,
              _deleted,
              _lastChangedAt,
            };
            const result = onChange(modelFields);
            value = result?.readTime ?? value;
          }
          if (errors.readTime?.hasError) {
            runValidationTasks("readTime", value);
          }
          setReadTime(value);
        }}
        onBlur={() => runValidationTasks("readTime", readTime)}
        errorMessage={errors.readTime?.errorMessage}
        hasError={errors.readTime?.hasError}
        {...getOverrideProps(overrides, "readTime")}
      ></TextField>
      <TextField
        label="Created at"
        isRequired={false}
        isReadOnly={false}
        type="datetime-local"
        value={createdAt && convertToLocal(new Date(createdAt))}
        onChange={(e) => {
          let value =
            e.target.value === "" ? "" : new Date(e.target.value).toISOString();
          if (onChange) {
            const modelFields = {
              orderIndex,
              title,
              description,
              quizScore,
              quizStatementsCount,
              hasQuizTaken,
              isDefault,
              readTime,
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
        isRequired={false}
        isReadOnly={false}
        type="datetime-local"
        value={updatedAt && convertToLocal(new Date(updatedAt))}
        onChange={(e) => {
          let value =
            e.target.value === "" ? "" : new Date(e.target.value).toISOString();
          if (onChange) {
            const modelFields = {
              orderIndex,
              title,
              description,
              quizScore,
              quizStatementsCount,
              hasQuizTaken,
              isDefault,
              readTime,
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
              orderIndex,
              title,
              description,
              quizScore,
              quizStatementsCount,
              hasQuizTaken,
              isDefault,
              readTime,
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
              orderIndex,
              title,
              description,
              quizScore,
              quizStatementsCount,
              hasQuizTaken,
              isDefault,
              readTime,
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
              orderIndex,
              title,
              description,
              quizScore,
              quizStatementsCount,
              hasQuizTaken,
              isDefault,
              readTime,
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
          isDisabled={!(idProp || learningModelProp)}
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
              !(idProp || learningModelProp) ||
              Object.values(errors).some((e) => e?.hasError)
            }
            {...getOverrideProps(overrides, "SubmitButton")}
          ></Button>
        </Flex>
      </Flex>
    </Grid>
  );
}
