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
  SelectField,
  SwitchField,
  TextField,
} from "@aws-amplify/ui-react";
import { fetchByPath, getOverrideProps, validateField } from "./utils";
import { API } from "aws-amplify";
import { getAwards } from "../graphql/queries";
import { updateAwards } from "../graphql/mutations";
export default function AwardsUpdateForm(props) {
  const {
    id: idProp,
    awards: awardsModelProp,
    onSuccess,
    onError,
    onSubmit,
    onValidate,
    onChange,
    overrides,
    ...rest
  } = props;
  const initialValues = {
    title: "",
    date: "",
    description: "",
    user_sub: "",
    tool_id: "",
    type: "",
    coins: "",
    organizationID: "",
    customType: "",
    _version: "",
    _deleted: false,
    _lastChangedAt: "",
  };
  const [title, setTitle] = React.useState(initialValues.title);
  const [date, setDate] = React.useState(initialValues.date);
  const [description, setDescription] = React.useState(
    initialValues.description
  );
  const [user_sub, setUser_sub] = React.useState(initialValues.user_sub);
  const [tool_id, setTool_id] = React.useState(initialValues.tool_id);
  const [type, setType] = React.useState(initialValues.type);
  const [coins, setCoins] = React.useState(initialValues.coins);
  const [organizationID, setOrganizationID] = React.useState(
    initialValues.organizationID
  );
  const [customType, setCustomType] = React.useState(initialValues.customType);
  const [_version, set_version] = React.useState(initialValues._version);
  const [_deleted, set_deleted] = React.useState(initialValues._deleted);
  const [_lastChangedAt, set_lastChangedAt] = React.useState(
    initialValues._lastChangedAt
  );
  const [errors, setErrors] = React.useState({});
  const resetStateValues = () => {
    const cleanValues = awardsRecord
      ? { ...initialValues, ...awardsRecord }
      : initialValues;
    setTitle(cleanValues.title);
    setDate(cleanValues.date);
    setDescription(cleanValues.description);
    setUser_sub(cleanValues.user_sub);
    setTool_id(cleanValues.tool_id);
    setType(cleanValues.type);
    setCoins(cleanValues.coins);
    setOrganizationID(cleanValues.organizationID);
    setCustomType(cleanValues.customType);
    set_version(cleanValues._version);
    set_deleted(cleanValues._deleted);
    set_lastChangedAt(cleanValues._lastChangedAt);
    setErrors({});
  };
  const [awardsRecord, setAwardsRecord] = React.useState(awardsModelProp);
  React.useEffect(() => {
    const queryData = async () => {
      const record = idProp
        ? (
            await API.graphql({
              query: getAwards.replaceAll("__typename", ""),
              variables: { id: idProp },
            })
          )?.data?.getAwards
        : awardsModelProp;
      setAwardsRecord(record);
    };
    queryData();
  }, [idProp, awardsModelProp]);
  React.useEffect(resetStateValues, [awardsRecord]);
  const validations = {
    title: [],
    date: [],
    description: [],
    user_sub: [],
    tool_id: [],
    type: [],
    coins: [],
    organizationID: [{ type: "Required" }],
    customType: [],
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
          title: title ?? null,
          date: date ?? null,
          description: description ?? null,
          user_sub: user_sub ?? null,
          tool_id: tool_id ?? null,
          type: type ?? null,
          coins: coins ?? null,
          organizationID,
          customType: customType ?? null,
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
            query: updateAwards.replaceAll("__typename", ""),
            variables: {
              input: {
                id: awardsRecord.id,
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
      {...getOverrideProps(overrides, "AwardsUpdateForm")}
      {...rest}
    >
      <TextField
        label="Title"
        isRequired={false}
        isReadOnly={false}
        value={title}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              title: value,
              date,
              description,
              user_sub,
              tool_id,
              type,
              coins,
              organizationID,
              customType,
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
        label="Date"
        isRequired={false}
        isReadOnly={false}
        value={date}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              title,
              date: value,
              description,
              user_sub,
              tool_id,
              type,
              coins,
              organizationID,
              customType,
              _version,
              _deleted,
              _lastChangedAt,
            };
            const result = onChange(modelFields);
            value = result?.date ?? value;
          }
          if (errors.date?.hasError) {
            runValidationTasks("date", value);
          }
          setDate(value);
        }}
        onBlur={() => runValidationTasks("date", date)}
        errorMessage={errors.date?.errorMessage}
        hasError={errors.date?.hasError}
        {...getOverrideProps(overrides, "date")}
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
              title,
              date,
              description: value,
              user_sub,
              tool_id,
              type,
              coins,
              organizationID,
              customType,
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
        label="User sub"
        isRequired={false}
        isReadOnly={false}
        value={user_sub}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              title,
              date,
              description,
              user_sub: value,
              tool_id,
              type,
              coins,
              organizationID,
              customType,
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
              title,
              date,
              description,
              user_sub,
              tool_id: value,
              type,
              coins,
              organizationID,
              customType,
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
      <SelectField
        label="Type"
        placeholder="Please select an option"
        isDisabled={false}
        value={type}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              title,
              date,
              description,
              user_sub,
              tool_id,
              type: value,
              coins,
              organizationID,
              customType,
              _version,
              _deleted,
              _lastChangedAt,
            };
            const result = onChange(modelFields);
            value = result?.type ?? value;
          }
          if (errors.type?.hasError) {
            runValidationTasks("type", value);
          }
          setType(value);
        }}
        onBlur={() => runValidationTasks("type", type)}
        errorMessage={errors.type?.errorMessage}
        hasError={errors.type?.hasError}
        {...getOverrideProps(overrides, "type")}
      >
        <option
          children="Quiz perfect"
          value="QUIZ_PERFECT"
          {...getOverrideProps(overrides, "typeoption0")}
        ></option>
        <option
          children="Quiz mastery"
          value="QUIZ_MASTERY"
          {...getOverrideProps(overrides, "typeoption1")}
        ></option>
        <option
          children="Report complete"
          value="REPORT_COMPLETE"
          {...getOverrideProps(overrides, "typeoption2")}
        ></option>
        <option
          children="Project complete"
          value="PROJECT_COMPLETE"
          {...getOverrideProps(overrides, "typeoption3")}
        ></option>
        <option
          children="Action item complete"
          value="ACTION_ITEM_COMPLETE"
          {...getOverrideProps(overrides, "typeoption4")}
        ></option>
        <option
          children="Highlight added"
          value="HIGHLIGHT_ADDED"
          {...getOverrideProps(overrides, "typeoption5")}
        ></option>
        <option
          children="Vsm complete"
          value="VSM_COMPLETE"
          {...getOverrideProps(overrides, "typeoption6")}
        ></option>
        <option
          children="Category complete"
          value="CATEGORY_COMPLETE"
          {...getOverrideProps(overrides, "typeoption7")}
        ></option>
        <option
          children="Statement complete"
          value="STATEMENT_COMPLETE"
          {...getOverrideProps(overrides, "typeoption8")}
        ></option>
        <option
          children="Feedback provided"
          value="FEEDBACK_PROVIDED"
          {...getOverrideProps(overrides, "typeoption9")}
        ></option>
        <option
          children="Team collaboration"
          value="TEAM_COLLABORATION"
          {...getOverrideProps(overrides, "typeoption10")}
        ></option>
        <option
          children="First login"
          value="FIRST_LOGIN"
          {...getOverrideProps(overrides, "typeoption11")}
        ></option>
        <option
          children="Profile complete"
          value="PROFILE_COMPLETE"
          {...getOverrideProps(overrides, "typeoption12")}
        ></option>
        <option
          children="Weekly goals met"
          value="WEEKLY_GOALS_MET"
          {...getOverrideProps(overrides, "typeoption13")}
        ></option>
        <option
          children="Monthly goals met"
          value="MONTHLY_GOALS_MET"
          {...getOverrideProps(overrides, "typeoption14")}
        ></option>
        <option
          children="Custom achievement"
          value="CUSTOM_ACHIEVEMENT"
          {...getOverrideProps(overrides, "typeoption15")}
        ></option>
        <option
          children="Kpi goal achieved"
          value="KPI_GOAL_ACHIEVED"
          {...getOverrideProps(overrides, "typeoption16")}
        ></option>
        <option
          children="Learning time milestone"
          value="LEARNING_TIME_MILESTONE"
          {...getOverrideProps(overrides, "typeoption17")}
        ></option>
      </SelectField>
      <TextField
        label="Coins"
        isRequired={false}
        isReadOnly={false}
        type="number"
        step="any"
        value={coins}
        onChange={(e) => {
          let value = isNaN(parseInt(e.target.value))
            ? e.target.value
            : parseInt(e.target.value);
          if (onChange) {
            const modelFields = {
              title,
              date,
              description,
              user_sub,
              tool_id,
              type,
              coins: value,
              organizationID,
              customType,
              _version,
              _deleted,
              _lastChangedAt,
            };
            const result = onChange(modelFields);
            value = result?.coins ?? value;
          }
          if (errors.coins?.hasError) {
            runValidationTasks("coins", value);
          }
          setCoins(value);
        }}
        onBlur={() => runValidationTasks("coins", coins)}
        errorMessage={errors.coins?.errorMessage}
        hasError={errors.coins?.hasError}
        {...getOverrideProps(overrides, "coins")}
      ></TextField>
      <TextField
        label="Organization id"
        isRequired={true}
        isReadOnly={false}
        value={organizationID}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              title,
              date,
              description,
              user_sub,
              tool_id,
              type,
              coins,
              organizationID: value,
              customType,
              _version,
              _deleted,
              _lastChangedAt,
            };
            const result = onChange(modelFields);
            value = result?.organizationID ?? value;
          }
          if (errors.organizationID?.hasError) {
            runValidationTasks("organizationID", value);
          }
          setOrganizationID(value);
        }}
        onBlur={() => runValidationTasks("organizationID", organizationID)}
        errorMessage={errors.organizationID?.errorMessage}
        hasError={errors.organizationID?.hasError}
        {...getOverrideProps(overrides, "organizationID")}
      ></TextField>
      <TextField
        label="Custom type"
        isRequired={false}
        isReadOnly={false}
        value={customType}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              title,
              date,
              description,
              user_sub,
              tool_id,
              type,
              coins,
              organizationID,
              customType: value,
              _version,
              _deleted,
              _lastChangedAt,
            };
            const result = onChange(modelFields);
            value = result?.customType ?? value;
          }
          if (errors.customType?.hasError) {
            runValidationTasks("customType", value);
          }
          setCustomType(value);
        }}
        onBlur={() => runValidationTasks("customType", customType)}
        errorMessage={errors.customType?.errorMessage}
        hasError={errors.customType?.hasError}
        {...getOverrideProps(overrides, "customType")}
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
              title,
              date,
              description,
              user_sub,
              tool_id,
              type,
              coins,
              organizationID,
              customType,
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
              title,
              date,
              description,
              user_sub,
              tool_id,
              type,
              coins,
              organizationID,
              customType,
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
              title,
              date,
              description,
              user_sub,
              tool_id,
              type,
              coins,
              organizationID,
              customType,
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
          isDisabled={!(idProp || awardsModelProp)}
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
              !(idProp || awardsModelProp) ||
              Object.values(errors).some((e) => e?.hasError)
            }
            {...getOverrideProps(overrides, "SubmitButton")}
          ></Button>
        </Flex>
      </Flex>
    </Grid>
  );
}
