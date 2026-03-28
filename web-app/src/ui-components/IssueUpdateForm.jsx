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
  SelectField,
  SwitchField,
  Text,
  TextField,
  useTheme,
} from "@aws-amplify/ui-react";
import { fetchByPath, getOverrideProps, validateField } from "./utils";
import { API } from "aws-amplify";
import { getIssue } from "../graphql/queries";
import { updateIssue } from "../graphql/mutations";
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
export default function IssueUpdateForm(props) {
  const {
    id: idProp,
    issue: issueModelProp,
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
    description: "",
    category: "",
    priority: "",
    status: "",
    attachments: [],
    reporterEmail: "",
    reporterName: "",
    reporterID: "",
    organizationID: "",
    assignedToEmail: "",
    assignedToName: "",
    createdAt: "",
    updatedAt: "",
    _version: "",
    _deleted: false,
    _lastChangedAt: "",
  };
  const [title, setTitle] = React.useState(initialValues.title);
  const [description, setDescription] = React.useState(
    initialValues.description
  );
  const [category, setCategory] = React.useState(initialValues.category);
  const [priority, setPriority] = React.useState(initialValues.priority);
  const [status, setStatus] = React.useState(initialValues.status);
  const [attachments, setAttachments] = React.useState(
    initialValues.attachments
  );
  const [reporterEmail, setReporterEmail] = React.useState(
    initialValues.reporterEmail
  );
  const [reporterName, setReporterName] = React.useState(
    initialValues.reporterName
  );
  const [reporterID, setReporterID] = React.useState(initialValues.reporterID);
  const [organizationID, setOrganizationID] = React.useState(
    initialValues.organizationID
  );
  const [assignedToEmail, setAssignedToEmail] = React.useState(
    initialValues.assignedToEmail
  );
  const [assignedToName, setAssignedToName] = React.useState(
    initialValues.assignedToName
  );
  const [createdAt, setCreatedAt] = React.useState(initialValues.createdAt);
  const [updatedAt, setUpdatedAt] = React.useState(initialValues.updatedAt);
  const [_version, set_version] = React.useState(initialValues._version);
  const [_deleted, set_deleted] = React.useState(initialValues._deleted);
  const [_lastChangedAt, set_lastChangedAt] = React.useState(
    initialValues._lastChangedAt
  );
  const [errors, setErrors] = React.useState({});
  const resetStateValues = () => {
    const cleanValues = issueRecord
      ? { ...initialValues, ...issueRecord }
      : initialValues;
    setTitle(cleanValues.title);
    setDescription(cleanValues.description);
    setCategory(cleanValues.category);
    setPriority(cleanValues.priority);
    setStatus(cleanValues.status);
    setAttachments(cleanValues.attachments ?? []);
    setCurrentAttachmentsValue("");
    setReporterEmail(cleanValues.reporterEmail);
    setReporterName(cleanValues.reporterName);
    setReporterID(cleanValues.reporterID);
    setOrganizationID(cleanValues.organizationID);
    setAssignedToEmail(cleanValues.assignedToEmail);
    setAssignedToName(cleanValues.assignedToName);
    setCreatedAt(cleanValues.createdAt);
    setUpdatedAt(cleanValues.updatedAt);
    set_version(cleanValues._version);
    set_deleted(cleanValues._deleted);
    set_lastChangedAt(cleanValues._lastChangedAt);
    setErrors({});
  };
  const [issueRecord, setIssueRecord] = React.useState(issueModelProp);
  React.useEffect(() => {
    const queryData = async () => {
      const record = idProp
        ? (
            await API.graphql({
              query: getIssue.replaceAll("__typename", ""),
              variables: { id: idProp },
            })
          )?.data?.getIssue
        : issueModelProp;
      setIssueRecord(record);
    };
    queryData();
  }, [idProp, issueModelProp]);
  React.useEffect(resetStateValues, [issueRecord]);
  const [currentAttachmentsValue, setCurrentAttachmentsValue] =
    React.useState("");
  const attachmentsRef = React.createRef();
  const validations = {
    title: [{ type: "Required" }],
    description: [{ type: "Required" }],
    category: [{ type: "Required" }],
    priority: [{ type: "Required" }],
    status: [{ type: "Required" }],
    attachments: [],
    reporterEmail: [{ type: "Required" }],
    reporterName: [{ type: "Required" }],
    reporterID: [{ type: "Required" }],
    organizationID: [{ type: "Required" }],
    assignedToEmail: [],
    assignedToName: [],
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
          title,
          description,
          category,
          priority,
          status,
          attachments: attachments ?? null,
          reporterEmail,
          reporterName,
          reporterID,
          organizationID,
          assignedToEmail: assignedToEmail ?? null,
          assignedToName: assignedToName ?? null,
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
            query: updateIssue.replaceAll("__typename", ""),
            variables: {
              input: {
                id: issueRecord.id,
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
      {...getOverrideProps(overrides, "IssueUpdateForm")}
      {...rest}
    >
      <TextField
        label="Title"
        isRequired={true}
        isReadOnly={false}
        value={title}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              title: value,
              description,
              category,
              priority,
              status,
              attachments,
              reporterEmail,
              reporterName,
              reporterID,
              organizationID,
              assignedToEmail,
              assignedToName,
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
        isRequired={true}
        isReadOnly={false}
        value={description}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              title,
              description: value,
              category,
              priority,
              status,
              attachments,
              reporterEmail,
              reporterName,
              reporterID,
              organizationID,
              assignedToEmail,
              assignedToName,
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
      <SelectField
        label="Category"
        placeholder="Please select an option"
        isDisabled={false}
        value={category}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              title,
              description,
              category: value,
              priority,
              status,
              attachments,
              reporterEmail,
              reporterName,
              reporterID,
              organizationID,
              assignedToEmail,
              assignedToName,
              createdAt,
              updatedAt,
              _version,
              _deleted,
              _lastChangedAt,
            };
            const result = onChange(modelFields);
            value = result?.category ?? value;
          }
          if (errors.category?.hasError) {
            runValidationTasks("category", value);
          }
          setCategory(value);
        }}
        onBlur={() => runValidationTasks("category", category)}
        errorMessage={errors.category?.errorMessage}
        hasError={errors.category?.hasError}
        {...getOverrideProps(overrides, "category")}
      >
        <option
          children="Bug"
          value="BUG"
          {...getOverrideProps(overrides, "categoryoption0")}
        ></option>
        <option
          children="Feature request"
          value="FEATURE_REQUEST"
          {...getOverrideProps(overrides, "categoryoption1")}
        ></option>
        <option
          children="Technical support"
          value="TECHNICAL_SUPPORT"
          {...getOverrideProps(overrides, "categoryoption2")}
        ></option>
        <option
          children="General inquiry"
          value="GENERAL_INQUIRY"
          {...getOverrideProps(overrides, "categoryoption3")}
        ></option>
        <option
          children="Feedback"
          value="FEEDBACK"
          {...getOverrideProps(overrides, "categoryoption4")}
        ></option>
        <option
          children="Other"
          value="OTHER"
          {...getOverrideProps(overrides, "categoryoption5")}
        ></option>
      </SelectField>
      <SelectField
        label="Priority"
        placeholder="Please select an option"
        isDisabled={false}
        value={priority}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              title,
              description,
              category,
              priority: value,
              status,
              attachments,
              reporterEmail,
              reporterName,
              reporterID,
              organizationID,
              assignedToEmail,
              assignedToName,
              createdAt,
              updatedAt,
              _version,
              _deleted,
              _lastChangedAt,
            };
            const result = onChange(modelFields);
            value = result?.priority ?? value;
          }
          if (errors.priority?.hasError) {
            runValidationTasks("priority", value);
          }
          setPriority(value);
        }}
        onBlur={() => runValidationTasks("priority", priority)}
        errorMessage={errors.priority?.errorMessage}
        hasError={errors.priority?.hasError}
        {...getOverrideProps(overrides, "priority")}
      >
        <option
          children="Low"
          value="LOW"
          {...getOverrideProps(overrides, "priorityoption0")}
        ></option>
        <option
          children="Medium"
          value="MEDIUM"
          {...getOverrideProps(overrides, "priorityoption1")}
        ></option>
        <option
          children="High"
          value="HIGH"
          {...getOverrideProps(overrides, "priorityoption2")}
        ></option>
        <option
          children="Critical"
          value="CRITICAL"
          {...getOverrideProps(overrides, "priorityoption3")}
        ></option>
      </SelectField>
      <SelectField
        label="Status"
        placeholder="Please select an option"
        isDisabled={false}
        value={status}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              title,
              description,
              category,
              priority,
              status: value,
              attachments,
              reporterEmail,
              reporterName,
              reporterID,
              organizationID,
              assignedToEmail,
              assignedToName,
              createdAt,
              updatedAt,
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
      >
        <option
          children="Open"
          value="OPEN"
          {...getOverrideProps(overrides, "statusoption0")}
        ></option>
        <option
          children="In progress"
          value="IN_PROGRESS"
          {...getOverrideProps(overrides, "statusoption1")}
        ></option>
        <option
          children="Resolved"
          value="RESOLVED"
          {...getOverrideProps(overrides, "statusoption2")}
        ></option>
        <option
          children="Closed"
          value="CLOSED"
          {...getOverrideProps(overrides, "statusoption3")}
        ></option>
      </SelectField>
      <ArrayField
        onChange={async (items) => {
          let values = items;
          if (onChange) {
            const modelFields = {
              title,
              description,
              category,
              priority,
              status,
              attachments: values,
              reporterEmail,
              reporterName,
              reporterID,
              organizationID,
              assignedToEmail,
              assignedToName,
              createdAt,
              updatedAt,
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
        label="Reporter email"
        isRequired={true}
        isReadOnly={false}
        value={reporterEmail}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              title,
              description,
              category,
              priority,
              status,
              attachments,
              reporterEmail: value,
              reporterName,
              reporterID,
              organizationID,
              assignedToEmail,
              assignedToName,
              createdAt,
              updatedAt,
              _version,
              _deleted,
              _lastChangedAt,
            };
            const result = onChange(modelFields);
            value = result?.reporterEmail ?? value;
          }
          if (errors.reporterEmail?.hasError) {
            runValidationTasks("reporterEmail", value);
          }
          setReporterEmail(value);
        }}
        onBlur={() => runValidationTasks("reporterEmail", reporterEmail)}
        errorMessage={errors.reporterEmail?.errorMessage}
        hasError={errors.reporterEmail?.hasError}
        {...getOverrideProps(overrides, "reporterEmail")}
      ></TextField>
      <TextField
        label="Reporter name"
        isRequired={true}
        isReadOnly={false}
        value={reporterName}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              title,
              description,
              category,
              priority,
              status,
              attachments,
              reporterEmail,
              reporterName: value,
              reporterID,
              organizationID,
              assignedToEmail,
              assignedToName,
              createdAt,
              updatedAt,
              _version,
              _deleted,
              _lastChangedAt,
            };
            const result = onChange(modelFields);
            value = result?.reporterName ?? value;
          }
          if (errors.reporterName?.hasError) {
            runValidationTasks("reporterName", value);
          }
          setReporterName(value);
        }}
        onBlur={() => runValidationTasks("reporterName", reporterName)}
        errorMessage={errors.reporterName?.errorMessage}
        hasError={errors.reporterName?.hasError}
        {...getOverrideProps(overrides, "reporterName")}
      ></TextField>
      <TextField
        label="Reporter id"
        isRequired={true}
        isReadOnly={false}
        value={reporterID}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              title,
              description,
              category,
              priority,
              status,
              attachments,
              reporterEmail,
              reporterName,
              reporterID: value,
              organizationID,
              assignedToEmail,
              assignedToName,
              createdAt,
              updatedAt,
              _version,
              _deleted,
              _lastChangedAt,
            };
            const result = onChange(modelFields);
            value = result?.reporterID ?? value;
          }
          if (errors.reporterID?.hasError) {
            runValidationTasks("reporterID", value);
          }
          setReporterID(value);
        }}
        onBlur={() => runValidationTasks("reporterID", reporterID)}
        errorMessage={errors.reporterID?.errorMessage}
        hasError={errors.reporterID?.hasError}
        {...getOverrideProps(overrides, "reporterID")}
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
              description,
              category,
              priority,
              status,
              attachments,
              reporterEmail,
              reporterName,
              reporterID,
              organizationID: value,
              assignedToEmail,
              assignedToName,
              createdAt,
              updatedAt,
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
        label="Assigned to email"
        isRequired={false}
        isReadOnly={false}
        value={assignedToEmail}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              title,
              description,
              category,
              priority,
              status,
              attachments,
              reporterEmail,
              reporterName,
              reporterID,
              organizationID,
              assignedToEmail: value,
              assignedToName,
              createdAt,
              updatedAt,
              _version,
              _deleted,
              _lastChangedAt,
            };
            const result = onChange(modelFields);
            value = result?.assignedToEmail ?? value;
          }
          if (errors.assignedToEmail?.hasError) {
            runValidationTasks("assignedToEmail", value);
          }
          setAssignedToEmail(value);
        }}
        onBlur={() => runValidationTasks("assignedToEmail", assignedToEmail)}
        errorMessage={errors.assignedToEmail?.errorMessage}
        hasError={errors.assignedToEmail?.hasError}
        {...getOverrideProps(overrides, "assignedToEmail")}
      ></TextField>
      <TextField
        label="Assigned to name"
        isRequired={false}
        isReadOnly={false}
        value={assignedToName}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              title,
              description,
              category,
              priority,
              status,
              attachments,
              reporterEmail,
              reporterName,
              reporterID,
              organizationID,
              assignedToEmail,
              assignedToName: value,
              createdAt,
              updatedAt,
              _version,
              _deleted,
              _lastChangedAt,
            };
            const result = onChange(modelFields);
            value = result?.assignedToName ?? value;
          }
          if (errors.assignedToName?.hasError) {
            runValidationTasks("assignedToName", value);
          }
          setAssignedToName(value);
        }}
        onBlur={() => runValidationTasks("assignedToName", assignedToName)}
        errorMessage={errors.assignedToName?.errorMessage}
        hasError={errors.assignedToName?.hasError}
        {...getOverrideProps(overrides, "assignedToName")}
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
              title,
              description,
              category,
              priority,
              status,
              attachments,
              reporterEmail,
              reporterName,
              reporterID,
              organizationID,
              assignedToEmail,
              assignedToName,
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
              title,
              description,
              category,
              priority,
              status,
              attachments,
              reporterEmail,
              reporterName,
              reporterID,
              organizationID,
              assignedToEmail,
              assignedToName,
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
              title,
              description,
              category,
              priority,
              status,
              attachments,
              reporterEmail,
              reporterName,
              reporterID,
              organizationID,
              assignedToEmail,
              assignedToName,
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
              title,
              description,
              category,
              priority,
              status,
              attachments,
              reporterEmail,
              reporterName,
              reporterID,
              organizationID,
              assignedToEmail,
              assignedToName,
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
              title,
              description,
              category,
              priority,
              status,
              attachments,
              reporterEmail,
              reporterName,
              reporterID,
              organizationID,
              assignedToEmail,
              assignedToName,
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
          isDisabled={!(idProp || issueModelProp)}
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
              !(idProp || issueModelProp) ||
              Object.values(errors).some((e) => e?.hasError)
            }
            {...getOverrideProps(overrides, "SubmitButton")}
          ></Button>
        </Flex>
      </Flex>
    </Grid>
  );
}
