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
import { getActionItems } from "../graphql/queries";
import { updateActionItems } from "../graphql/mutations";
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
export default function ActionItemsUpdateForm(props) {
  const {
    id: idProp,
    actionItems: actionItemsModelProp,
    onSuccess,
    onError,
    onSubmit,
    onValidate,
    onChange,
    overrides,
    ...rest
  } = props;
  const initialValues = {
    note: false,
    description: "",
    title: "",
    duedate: "",
    status: "",
    assignor: "",
    assignees: [],
    attachments: [],
    user_sub: "",
    _version: "",
    _deleted: false,
    _lastChangedAt: "",
  };
  const [note, setNote] = React.useState(initialValues.note);
  const [description, setDescription] = React.useState(
    initialValues.description
  );
  const [title, setTitle] = React.useState(initialValues.title);
  const [duedate, setDuedate] = React.useState(initialValues.duedate);
  const [status, setStatus] = React.useState(initialValues.status);
  const [assignor, setAssignor] = React.useState(initialValues.assignor);
  const [assignees, setAssignees] = React.useState(initialValues.assignees);
  const [attachments, setAttachments] = React.useState(
    initialValues.attachments
  );
  const [user_sub, setUser_sub] = React.useState(initialValues.user_sub);
  const [_version, set_version] = React.useState(initialValues._version);
  const [_deleted, set_deleted] = React.useState(initialValues._deleted);
  const [_lastChangedAt, set_lastChangedAt] = React.useState(
    initialValues._lastChangedAt
  );
  const [errors, setErrors] = React.useState({});
  const resetStateValues = () => {
    const cleanValues = actionItemsRecord
      ? { ...initialValues, ...actionItemsRecord }
      : initialValues;
    setNote(cleanValues.note);
    setDescription(cleanValues.description);
    setTitle(cleanValues.title);
    setDuedate(cleanValues.duedate);
    setStatus(cleanValues.status);
    setAssignor(cleanValues.assignor);
    setAssignees(cleanValues.assignees ?? []);
    setCurrentAssigneesValue("");
    setAttachments(cleanValues.attachments ?? []);
    setCurrentAttachmentsValue("");
    setUser_sub(cleanValues.user_sub);
    set_version(cleanValues._version);
    set_deleted(cleanValues._deleted);
    set_lastChangedAt(cleanValues._lastChangedAt);
    setErrors({});
  };
  const [actionItemsRecord, setActionItemsRecord] =
    React.useState(actionItemsModelProp);
  React.useEffect(() => {
    const queryData = async () => {
      const record = idProp
        ? (
            await API.graphql({
              query: getActionItems.replaceAll("__typename", ""),
              variables: { id: idProp },
            })
          )?.data?.getActionItems
        : actionItemsModelProp;
      setActionItemsRecord(record);
    };
    queryData();
  }, [idProp, actionItemsModelProp]);
  React.useEffect(resetStateValues, [actionItemsRecord]);
  const [currentAssigneesValue, setCurrentAssigneesValue] = React.useState("");
  const assigneesRef = React.createRef();
  const [currentAttachmentsValue, setCurrentAttachmentsValue] =
    React.useState("");
  const attachmentsRef = React.createRef();
  const validations = {
    note: [],
    description: [],
    title: [],
    duedate: [],
    status: [],
    assignor: [],
    assignees: [],
    attachments: [],
    user_sub: [],
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
          note: note ?? null,
          description: description ?? null,
          title: title ?? null,
          duedate: duedate ?? null,
          status: status ?? null,
          assignor: assignor ?? null,
          assignees: assignees ?? null,
          attachments: attachments ?? null,
          user_sub: user_sub ?? null,
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
            query: updateActionItems.replaceAll("__typename", ""),
            variables: {
              input: {
                id: actionItemsRecord.id,
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
      {...getOverrideProps(overrides, "ActionItemsUpdateForm")}
      {...rest}
    >
      <SwitchField
        label="Note"
        defaultChecked={false}
        isDisabled={false}
        isChecked={note}
        onChange={(e) => {
          let value = e.target.checked;
          if (onChange) {
            const modelFields = {
              note: value,
              description,
              title,
              duedate,
              status,
              assignor,
              assignees,
              attachments,
              user_sub,
              _version,
              _deleted,
              _lastChangedAt,
            };
            const result = onChange(modelFields);
            value = result?.note ?? value;
          }
          if (errors.note?.hasError) {
            runValidationTasks("note", value);
          }
          setNote(value);
        }}
        onBlur={() => runValidationTasks("note", note)}
        errorMessage={errors.note?.errorMessage}
        hasError={errors.note?.hasError}
        {...getOverrideProps(overrides, "note")}
      ></SwitchField>
      <TextField
        label="Description"
        isRequired={false}
        isReadOnly={false}
        value={description}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              note,
              description: value,
              title,
              duedate,
              status,
              assignor,
              assignees,
              attachments,
              user_sub,
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
        label="Title"
        isRequired={false}
        isReadOnly={false}
        value={title}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              note,
              description,
              title: value,
              duedate,
              status,
              assignor,
              assignees,
              attachments,
              user_sub,
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
        label="Duedate"
        isRequired={false}
        isReadOnly={false}
        value={duedate}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              note,
              description,
              title,
              duedate: value,
              status,
              assignor,
              assignees,
              attachments,
              user_sub,
              _version,
              _deleted,
              _lastChangedAt,
            };
            const result = onChange(modelFields);
            value = result?.duedate ?? value;
          }
          if (errors.duedate?.hasError) {
            runValidationTasks("duedate", value);
          }
          setDuedate(value);
        }}
        onBlur={() => runValidationTasks("duedate", duedate)}
        errorMessage={errors.duedate?.errorMessage}
        hasError={errors.duedate?.hasError}
        {...getOverrideProps(overrides, "duedate")}
      ></TextField>
      <TextField
        label="Status"
        isRequired={false}
        isReadOnly={false}
        type="number"
        step="any"
        value={status}
        onChange={(e) => {
          let value = isNaN(parseInt(e.target.value))
            ? e.target.value
            : parseInt(e.target.value);
          if (onChange) {
            const modelFields = {
              note,
              description,
              title,
              duedate,
              status: value,
              assignor,
              assignees,
              attachments,
              user_sub,
              _version,
              _deleted,
              _lastChangedAt,
            };
            const result = onChange(modelFields);
            value = result?.status ?? value;
          }
          if (errors.status?.hasError) {
            runValidationTasks("status", value);
          }
          setStatus(value);
        }}
        onBlur={() => runValidationTasks("status", status)}
        errorMessage={errors.status?.errorMessage}
        hasError={errors.status?.hasError}
        {...getOverrideProps(overrides, "status")}
      ></TextField>
      <TextField
        label="Assignor"
        isRequired={false}
        isReadOnly={false}
        value={assignor}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              note,
              description,
              title,
              duedate,
              status,
              assignor: value,
              assignees,
              attachments,
              user_sub,
              _version,
              _deleted,
              _lastChangedAt,
            };
            const result = onChange(modelFields);
            value = result?.assignor ?? value;
          }
          if (errors.assignor?.hasError) {
            runValidationTasks("assignor", value);
          }
          setAssignor(value);
        }}
        onBlur={() => runValidationTasks("assignor", assignor)}
        errorMessage={errors.assignor?.errorMessage}
        hasError={errors.assignor?.hasError}
        {...getOverrideProps(overrides, "assignor")}
      ></TextField>
      <ArrayField
        onChange={async (items) => {
          let values = items;
          if (onChange) {
            const modelFields = {
              note,
              description,
              title,
              duedate,
              status,
              assignor,
              assignees: values,
              attachments,
              user_sub,
              _version,
              _deleted,
              _lastChangedAt,
            };
            const result = onChange(modelFields);
            values = result?.assignees ?? values;
          }
          setAssignees(values);
          setCurrentAssigneesValue("");
        }}
        currentFieldValue={currentAssigneesValue}
        label={"Assignees"}
        items={assignees}
        hasError={errors?.assignees?.hasError}
        runValidationTasks={async () =>
          await runValidationTasks("assignees", currentAssigneesValue)
        }
        errorMessage={errors?.assignees?.errorMessage}
        setFieldValue={setCurrentAssigneesValue}
        inputFieldRef={assigneesRef}
        defaultFieldValue={""}
      >
        <TextField
          label="Assignees"
          isRequired={false}
          isReadOnly={false}
          value={currentAssigneesValue}
          onChange={(e) => {
            let { value } = e.target;
            if (errors.assignees?.hasError) {
              runValidationTasks("assignees", value);
            }
            setCurrentAssigneesValue(value);
          }}
          onBlur={() => runValidationTasks("assignees", currentAssigneesValue)}
          errorMessage={errors.assignees?.errorMessage}
          hasError={errors.assignees?.hasError}
          ref={assigneesRef}
          labelHidden={true}
          {...getOverrideProps(overrides, "assignees")}
        ></TextField>
      </ArrayField>
      <ArrayField
        onChange={async (items) => {
          let values = items;
          if (onChange) {
            const modelFields = {
              note,
              description,
              title,
              duedate,
              status,
              assignor,
              assignees,
              attachments: values,
              user_sub,
              _version,
              _deleted,
              _lastChangedAt,
            };
            const result = onChange(modelFields);
            values = result?.attachments ?? values;
          }
          setAttachments(values);
          setCurrentAttachmentsValue("");
        }}
        currentFieldValue={currentAttachmentsValue}
        label={"Attachments"}
        items={attachments}
        hasError={errors?.attachments?.hasError}
        runValidationTasks={async () =>
          await runValidationTasks("attachments", currentAttachmentsValue)
        }
        errorMessage={errors?.attachments?.errorMessage}
        setFieldValue={setCurrentAttachmentsValue}
        inputFieldRef={attachmentsRef}
        defaultFieldValue={""}
      >
        <TextField
          label="Attachments"
          isRequired={false}
          isReadOnly={false}
          value={currentAttachmentsValue}
          onChange={(e) => {
            let { value } = e.target;
            if (errors.attachments?.hasError) {
              runValidationTasks("attachments", value);
            }
            setCurrentAttachmentsValue(value);
          }}
          onBlur={() =>
            runValidationTasks("attachments", currentAttachmentsValue)
          }
          errorMessage={errors.attachments?.errorMessage}
          hasError={errors.attachments?.hasError}
          ref={attachmentsRef}
          labelHidden={true}
          {...getOverrideProps(overrides, "attachments")}
        ></TextField>
      </ArrayField>
      <TextField
        label="User sub"
        isRequired={false}
        isReadOnly={false}
        value={user_sub}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              note,
              description,
              title,
              duedate,
              status,
              assignor,
              assignees,
              attachments,
              user_sub: value,
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
              note,
              description,
              title,
              duedate,
              status,
              assignor,
              assignees,
              attachments,
              user_sub,
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
              note,
              description,
              title,
              duedate,
              status,
              assignor,
              assignees,
              attachments,
              user_sub,
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
              note,
              description,
              title,
              duedate,
              status,
              assignor,
              assignees,
              attachments,
              user_sub,
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
          isDisabled={!(idProp || actionItemsModelProp)}
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
              !(idProp || actionItemsModelProp) ||
              Object.values(errors).some((e) => e?.hasError)
            }
            {...getOverrideProps(overrides, "SubmitButton")}
          ></Button>
        </Flex>
      </Flex>
    </Grid>
  );
}
