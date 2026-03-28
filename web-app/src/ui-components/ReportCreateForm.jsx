/***************************************************************************
 * The contents of this file were generated with Amplify Studio.           *
 * Please refrain from making any modifications to this file.              *
 * Any changes to this file will be overwritten when running amplify pull. *
 **************************************************************************/

/* eslint-disable */
import * as React from "react";
import {
  Badge,
  Button,
  Divider,
  Flex,
  Grid,
  Icon,
  ScrollView,
  SwitchField,
  Text,
  TextField,
  useTheme,
} from "@aws-amplify/ui-react";
import { fetchByPath, getOverrideProps, validateField } from "./utils";
import { API } from "aws-amplify";
import { createReport } from "../graphql/mutations";
function ArrayField({
  items = [],
  onChange,
  label,
  inputFieldRef,
  children,
  hasError,
  setFieldValue,
  currentFieldValue,
  defaultFieldValue,
  lengthLimit,
  getBadgeText,
  runValidationTasks,
  errorMessage,
}) {
  const labelElement = <Text>{label}</Text>;
  const {
    tokens: {
      components: {
        fieldmessages: { error: errorStyles },
      },
    },
  } = useTheme();
  const [selectedBadgeIndex, setSelectedBadgeIndex] = React.useState();
  const [isEditing, setIsEditing] = React.useState();
  React.useEffect(() => {
    if (isEditing) {
      inputFieldRef?.current?.focus();
    }
  }, [isEditing]);
  const removeItem = async (removeIndex) => {
    const newItems = items.filter((value, index) => index !== removeIndex);
    await onChange(newItems);
    setSelectedBadgeIndex(undefined);
  };
  const addItem = async () => {
    const { hasError } = runValidationTasks();
    if (
      currentFieldValue !== undefined &&
      currentFieldValue !== null &&
      currentFieldValue !== "" &&
      !hasError
    ) {
      const newItems = [...items];
      if (selectedBadgeIndex !== undefined) {
        newItems[selectedBadgeIndex] = currentFieldValue;
        setSelectedBadgeIndex(undefined);
      } else {
        newItems.push(currentFieldValue);
      }
      await onChange(newItems);
      setIsEditing(false);
    }
  };
  const arraySection = (
    <React.Fragment>
      {!!items?.length && (
        <ScrollView height="inherit" width="inherit" maxHeight={"7rem"}>
          {items.map((value, index) => {
            return (
              <Badge
                key={index}
                style={{
                  cursor: "pointer",
                  alignItems: "center",
                  marginRight: 3,
                  marginTop: 3,
                  backgroundColor:
                    index === selectedBadgeIndex ? "#B8CEF9" : "",
                }}
                onClick={() => {
                  setSelectedBadgeIndex(index);
                  setFieldValue(items[index]);
                  setIsEditing(true);
                }}
              >
                {getBadgeText ? getBadgeText(value) : value.toString()}
                <Icon
                  style={{
                    cursor: "pointer",
                    paddingLeft: 3,
                    width: 20,
                    height: 20,
                  }}
                  viewBox={{ width: 20, height: 20 }}
                  paths={[
                    {
                      d: "M10 10l5.09-5.09L10 10l5.09 5.09L10 10zm0 0L4.91 4.91 10 10l-5.09 5.09L10 10z",
                      stroke: "black",
                    },
                  ]}
                  ariaLabel="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    removeItem(index);
                  }}
                />
              </Badge>
            );
          })}
        </ScrollView>
      )}
      <Divider orientation="horizontal" marginTop={5} />
    </React.Fragment>
  );
  if (lengthLimit !== undefined && items.length >= lengthLimit && !isEditing) {
    return (
      <React.Fragment>
        {labelElement}
        {arraySection}
      </React.Fragment>
    );
  }
  return (
    <React.Fragment>
      {labelElement}
      {isEditing && children}
      {!isEditing ? (
        <>
          <Button
            onClick={() => {
              setIsEditing(true);
            }}
          >
            Add item
          </Button>
          {errorMessage && hasError && (
            <Text color={errorStyles.color} fontSize={errorStyles.fontSize}>
              {errorMessage}
            </Text>
          )}
        </>
      ) : (
        <Flex justifyContent="flex-end">
          {(currentFieldValue || isEditing) && (
            <Button
              children="Cancel"
              type="button"
              size="small"
              onClick={() => {
                setFieldValue(defaultFieldValue);
                setIsEditing(false);
                setSelectedBadgeIndex(undefined);
              }}
            ></Button>
          )}
          <Button size="small" variation="link" onClick={addItem}>
            {selectedBadgeIndex !== undefined ? "Save" : "Add"}
          </Button>
        </Flex>
      )}
      {arraySection}
    </React.Fragment>
  );
}
export default function ReportCreateForm(props) {
  const {
    clearOnSuccess = true,
    onSuccess,
    onError,
    onSubmit,
    onValidate,
    onChange,
    overrides,
    ...rest
  } = props;
  const initialValues = {
    name: "",
    type: "",
    user_sub: "",
    ownerEmail: "",
    ai_id: "",
    completed: false,
    bones: "",
    trend: false,
    target: "",
    media: "",
    xaxis: "",
    yaxis: "",
    assignedMembers: [],
    _version: "",
    _deleted: false,
    _lastChangedAt: "",
  };
  const [name, setName] = React.useState(initialValues.name);
  const [type, setType] = React.useState(initialValues.type);
  const [user_sub, setUser_sub] = React.useState(initialValues.user_sub);
  const [ownerEmail, setOwnerEmail] = React.useState(initialValues.ownerEmail);
  const [ai_id, setAi_id] = React.useState(initialValues.ai_id);
  const [completed, setCompleted] = React.useState(initialValues.completed);
  const [bones, setBones] = React.useState(initialValues.bones);
  const [trend, setTrend] = React.useState(initialValues.trend);
  const [target, setTarget] = React.useState(initialValues.target);
  const [media, setMedia] = React.useState(initialValues.media);
  const [xaxis, setXaxis] = React.useState(initialValues.xaxis);
  const [yaxis, setYaxis] = React.useState(initialValues.yaxis);
  const [assignedMembers, setAssignedMembers] = React.useState(
    initialValues.assignedMembers
  );
  const [_version, set_version] = React.useState(initialValues._version);
  const [_deleted, set_deleted] = React.useState(initialValues._deleted);
  const [_lastChangedAt, set_lastChangedAt] = React.useState(
    initialValues._lastChangedAt
  );
  const [errors, setErrors] = React.useState({});
  const resetStateValues = () => {
    setName(initialValues.name);
    setType(initialValues.type);
    setUser_sub(initialValues.user_sub);
    setOwnerEmail(initialValues.ownerEmail);
    setAi_id(initialValues.ai_id);
    setCompleted(initialValues.completed);
    setBones(initialValues.bones);
    setTrend(initialValues.trend);
    setTarget(initialValues.target);
    setMedia(initialValues.media);
    setXaxis(initialValues.xaxis);
    setYaxis(initialValues.yaxis);
    setAssignedMembers(initialValues.assignedMembers);
    setCurrentAssignedMembersValue("");
    set_version(initialValues._version);
    set_deleted(initialValues._deleted);
    set_lastChangedAt(initialValues._lastChangedAt);
    setErrors({});
  };
  const [currentAssignedMembersValue, setCurrentAssignedMembersValue] =
    React.useState("");
  const assignedMembersRef = React.createRef();
  const validations = {
    name: [],
    type: [],
    user_sub: [],
    ownerEmail: [],
    ai_id: [],
    completed: [],
    bones: [],
    trend: [],
    target: [],
    media: [],
    xaxis: [],
    yaxis: [],
    assignedMembers: [],
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
          name,
          type,
          user_sub,
          ownerEmail,
          ai_id,
          completed,
          bones,
          trend,
          target,
          media,
          xaxis,
          yaxis,
          assignedMembers,
          _version,
          _deleted,
          _lastChangedAt,
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
            query: createReport.replaceAll("__typename", ""),
            variables: {
              input: {
                ...modelFields,
              },
            },
          });
          if (onSuccess) {
            onSuccess(modelFields);
          }
          if (clearOnSuccess) {
            resetStateValues();
          }
        } catch (err) {
          if (onError) {
            const messages = err.errors.map((e) => e.message).join("\n");
            onError(modelFields, messages);
          }
        }
      }}
      {...getOverrideProps(overrides, "ReportCreateForm")}
      {...rest}
    >
      <TextField
        label="Name"
        isRequired={false}
        isReadOnly={false}
        value={name}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              name: value,
              type,
              user_sub,
              ownerEmail,
              ai_id,
              completed,
              bones,
              trend,
              target,
              media,
              xaxis,
              yaxis,
              assignedMembers,
              _version,
              _deleted,
              _lastChangedAt,
            };
            const result = onChange(modelFields);
            value = result?.name ?? value;
          }
          if (errors.name?.hasError) {
            runValidationTasks("name", value);
          }
          setName(value);
        }}
        onBlur={() => runValidationTasks("name", name)}
        errorMessage={errors.name?.errorMessage}
        hasError={errors.name?.hasError}
        {...getOverrideProps(overrides, "name")}
      ></TextField>
      <TextField
        label="Type"
        isRequired={false}
        isReadOnly={false}
        value={type}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              name,
              type: value,
              user_sub,
              ownerEmail,
              ai_id,
              completed,
              bones,
              trend,
              target,
              media,
              xaxis,
              yaxis,
              assignedMembers,
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
              name,
              type,
              user_sub: value,
              ownerEmail,
              ai_id,
              completed,
              bones,
              trend,
              target,
              media,
              xaxis,
              yaxis,
              assignedMembers,
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
        label="Owner email"
        isRequired={false}
        isReadOnly={false}
        value={ownerEmail}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              name,
              type,
              user_sub,
              ownerEmail: value,
              ai_id,
              completed,
              bones,
              trend,
              target,
              media,
              xaxis,
              yaxis,
              assignedMembers,
              _version,
              _deleted,
              _lastChangedAt,
            };
            const result = onChange(modelFields);
            value = result?.ownerEmail ?? value;
          }
          if (errors.ownerEmail?.hasError) {
            runValidationTasks("ownerEmail", value);
          }
          setOwnerEmail(value);
        }}
        onBlur={() => runValidationTasks("ownerEmail", ownerEmail)}
        errorMessage={errors.ownerEmail?.errorMessage}
        hasError={errors.ownerEmail?.hasError}
        {...getOverrideProps(overrides, "ownerEmail")}
      ></TextField>
      <TextField
        label="Ai id"
        isRequired={false}
        isReadOnly={false}
        value={ai_id}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              name,
              type,
              user_sub,
              ownerEmail,
              ai_id: value,
              completed,
              bones,
              trend,
              target,
              media,
              xaxis,
              yaxis,
              assignedMembers,
              _version,
              _deleted,
              _lastChangedAt,
            };
            const result = onChange(modelFields);
            value = result?.ai_id ?? value;
          }
          if (errors.ai_id?.hasError) {
            runValidationTasks("ai_id", value);
          }
          setAi_id(value);
        }}
        onBlur={() => runValidationTasks("ai_id", ai_id)}
        errorMessage={errors.ai_id?.errorMessage}
        hasError={errors.ai_id?.hasError}
        {...getOverrideProps(overrides, "ai_id")}
      ></TextField>
      <SwitchField
        label="Completed"
        defaultChecked={false}
        isDisabled={false}
        isChecked={completed}
        onChange={(e) => {
          let value = e.target.checked;
          if (onChange) {
            const modelFields = {
              name,
              type,
              user_sub,
              ownerEmail,
              ai_id,
              completed: value,
              bones,
              trend,
              target,
              media,
              xaxis,
              yaxis,
              assignedMembers,
              _version,
              _deleted,
              _lastChangedAt,
            };
            const result = onChange(modelFields);
            value = result?.completed ?? value;
          }
          if (errors.completed?.hasError) {
            runValidationTasks("completed", value);
          }
          setCompleted(value);
        }}
        onBlur={() => runValidationTasks("completed", completed)}
        errorMessage={errors.completed?.errorMessage}
        hasError={errors.completed?.hasError}
        {...getOverrideProps(overrides, "completed")}
      ></SwitchField>
      <TextField
        label="Bones"
        isRequired={false}
        isReadOnly={false}
        type="number"
        step="any"
        value={bones}
        onChange={(e) => {
          let value = isNaN(parseInt(e.target.value))
            ? e.target.value
            : parseInt(e.target.value);
          if (onChange) {
            const modelFields = {
              name,
              type,
              user_sub,
              ownerEmail,
              ai_id,
              completed,
              bones: value,
              trend,
              target,
              media,
              xaxis,
              yaxis,
              assignedMembers,
              _version,
              _deleted,
              _lastChangedAt,
            };
            const result = onChange(modelFields);
            value = result?.bones ?? value;
          }
          if (errors.bones?.hasError) {
            runValidationTasks("bones", value);
          }
          setBones(value);
        }}
        onBlur={() => runValidationTasks("bones", bones)}
        errorMessage={errors.bones?.errorMessage}
        hasError={errors.bones?.hasError}
        {...getOverrideProps(overrides, "bones")}
      ></TextField>
      <SwitchField
        label="Trend"
        defaultChecked={false}
        isDisabled={false}
        isChecked={trend}
        onChange={(e) => {
          let value = e.target.checked;
          if (onChange) {
            const modelFields = {
              name,
              type,
              user_sub,
              ownerEmail,
              ai_id,
              completed,
              bones,
              trend: value,
              target,
              media,
              xaxis,
              yaxis,
              assignedMembers,
              _version,
              _deleted,
              _lastChangedAt,
            };
            const result = onChange(modelFields);
            value = result?.trend ?? value;
          }
          if (errors.trend?.hasError) {
            runValidationTasks("trend", value);
          }
          setTrend(value);
        }}
        onBlur={() => runValidationTasks("trend", trend)}
        errorMessage={errors.trend?.errorMessage}
        hasError={errors.trend?.hasError}
        {...getOverrideProps(overrides, "trend")}
      ></SwitchField>
      <TextField
        label="Target"
        isRequired={false}
        isReadOnly={false}
        value={target}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              name,
              type,
              user_sub,
              ownerEmail,
              ai_id,
              completed,
              bones,
              trend,
              target: value,
              media,
              xaxis,
              yaxis,
              assignedMembers,
              _version,
              _deleted,
              _lastChangedAt,
            };
            const result = onChange(modelFields);
            value = result?.target ?? value;
          }
          if (errors.target?.hasError) {
            runValidationTasks("target", value);
          }
          setTarget(value);
        }}
        onBlur={() => runValidationTasks("target", target)}
        errorMessage={errors.target?.errorMessage}
        hasError={errors.target?.hasError}
        {...getOverrideProps(overrides, "target")}
      ></TextField>
      <TextField
        label="Media"
        isRequired={false}
        isReadOnly={false}
        value={media}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              name,
              type,
              user_sub,
              ownerEmail,
              ai_id,
              completed,
              bones,
              trend,
              target,
              media: value,
              xaxis,
              yaxis,
              assignedMembers,
              _version,
              _deleted,
              _lastChangedAt,
            };
            const result = onChange(modelFields);
            value = result?.media ?? value;
          }
          if (errors.media?.hasError) {
            runValidationTasks("media", value);
          }
          setMedia(value);
        }}
        onBlur={() => runValidationTasks("media", media)}
        errorMessage={errors.media?.errorMessage}
        hasError={errors.media?.hasError}
        {...getOverrideProps(overrides, "media")}
      ></TextField>
      <TextField
        label="Xaxis"
        isRequired={false}
        isReadOnly={false}
        value={xaxis}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              name,
              type,
              user_sub,
              ownerEmail,
              ai_id,
              completed,
              bones,
              trend,
              target,
              media,
              xaxis: value,
              yaxis,
              assignedMembers,
              _version,
              _deleted,
              _lastChangedAt,
            };
            const result = onChange(modelFields);
            value = result?.xaxis ?? value;
          }
          if (errors.xaxis?.hasError) {
            runValidationTasks("xaxis", value);
          }
          setXaxis(value);
        }}
        onBlur={() => runValidationTasks("xaxis", xaxis)}
        errorMessage={errors.xaxis?.errorMessage}
        hasError={errors.xaxis?.hasError}
        {...getOverrideProps(overrides, "xaxis")}
      ></TextField>
      <TextField
        label="Yaxis"
        isRequired={false}
        isReadOnly={false}
        value={yaxis}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              name,
              type,
              user_sub,
              ownerEmail,
              ai_id,
              completed,
              bones,
              trend,
              target,
              media,
              xaxis,
              yaxis: value,
              assignedMembers,
              _version,
              _deleted,
              _lastChangedAt,
            };
            const result = onChange(modelFields);
            value = result?.yaxis ?? value;
          }
          if (errors.yaxis?.hasError) {
            runValidationTasks("yaxis", value);
          }
          setYaxis(value);
        }}
        onBlur={() => runValidationTasks("yaxis", yaxis)}
        errorMessage={errors.yaxis?.errorMessage}
        hasError={errors.yaxis?.hasError}
        {...getOverrideProps(overrides, "yaxis")}
      ></TextField>
      <ArrayField
        onChange={async (items) => {
          let values = items;
          if (onChange) {
            const modelFields = {
              name,
              type,
              user_sub,
              ownerEmail,
              ai_id,
              completed,
              bones,
              trend,
              target,
              media,
              xaxis,
              yaxis,
              assignedMembers: values,
              _version,
              _deleted,
              _lastChangedAt,
            };
            const result = onChange(modelFields);
            values = result?.assignedMembers ?? values;
          }
          setAssignedMembers(values);
          setCurrentAssignedMembersValue("");
        }}
        currentFieldValue={currentAssignedMembersValue}
        label={"Assigned members"}
        items={assignedMembers}
        hasError={errors?.assignedMembers?.hasError}
        runValidationTasks={async () =>
          await runValidationTasks(
            "assignedMembers",
            currentAssignedMembersValue
          )
        }
        errorMessage={errors?.assignedMembers?.errorMessage}
        setFieldValue={setCurrentAssignedMembersValue}
        inputFieldRef={assignedMembersRef}
        defaultFieldValue={""}
      >
        <TextField
          label="Assigned members"
          isRequired={false}
          isReadOnly={false}
          value={currentAssignedMembersValue}
          onChange={(e) => {
            let { value } = e.target;
            if (errors.assignedMembers?.hasError) {
              runValidationTasks("assignedMembers", value);
            }
            setCurrentAssignedMembersValue(value);
          }}
          onBlur={() =>
            runValidationTasks("assignedMembers", currentAssignedMembersValue)
          }
          errorMessage={errors.assignedMembers?.errorMessage}
          hasError={errors.assignedMembers?.hasError}
          ref={assignedMembersRef}
          labelHidden={true}
          {...getOverrideProps(overrides, "assignedMembers")}
        ></TextField>
      </ArrayField>
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
              name,
              type,
              user_sub,
              ownerEmail,
              ai_id,
              completed,
              bones,
              trend,
              target,
              media,
              xaxis,
              yaxis,
              assignedMembers,
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
              name,
              type,
              user_sub,
              ownerEmail,
              ai_id,
              completed,
              bones,
              trend,
              target,
              media,
              xaxis,
              yaxis,
              assignedMembers,
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
              name,
              type,
              user_sub,
              ownerEmail,
              ai_id,
              completed,
              bones,
              trend,
              target,
              media,
              xaxis,
              yaxis,
              assignedMembers,
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
          children="Clear"
          type="reset"
          onClick={(event) => {
            event.preventDefault();
            resetStateValues();
          }}
          {...getOverrideProps(overrides, "ClearButton")}
        ></Button>
        <Flex
          gap="15px"
          {...getOverrideProps(overrides, "RightAlignCTASubFlex")}
        >
          <Button
            children="Submit"
            type="submit"
            variation="primary"
            isDisabled={Object.values(errors).some((e) => e?.hasError)}
            {...getOverrideProps(overrides, "SubmitButton")}
          ></Button>
        </Flex>
      </Flex>
    </Grid>
  );
}
