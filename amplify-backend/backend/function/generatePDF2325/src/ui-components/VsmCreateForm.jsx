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
  TextAreaField,
  TextField,
} from "@aws-amplify/ui-react";
import { fetchByPath, getOverrideProps, validateField } from "./utils";
import { API } from "aws-amplify";
import { createVsm } from "../graphql/mutations";
export default function VsmCreateForm(props) {
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
    process: "",
    informationFlow: "",
    kaizenProject: "",
    demandData: "",
    summaryData: "",
    reportID: "",
    inventory: "",
    _version: "",
    _deleted: false,
    _lastChangedAt: "",
  };
  const [process, setProcess] = React.useState(initialValues.process);
  const [informationFlow, setInformationFlow] = React.useState(
    initialValues.informationFlow
  );
  const [kaizenProject, setKaizenProject] = React.useState(
    initialValues.kaizenProject
  );
  const [demandData, setDemandData] = React.useState(initialValues.demandData);
  const [summaryData, setSummaryData] = React.useState(
    initialValues.summaryData
  );
  const [reportID, setReportID] = React.useState(initialValues.reportID);
  const [inventory, setInventory] = React.useState(initialValues.inventory);
  const [_version, set_version] = React.useState(initialValues._version);
  const [_deleted, set_deleted] = React.useState(initialValues._deleted);
  const [_lastChangedAt, set_lastChangedAt] = React.useState(
    initialValues._lastChangedAt
  );
  const [errors, setErrors] = React.useState({});
  const resetStateValues = () => {
    setProcess(initialValues.process);
    setInformationFlow(initialValues.informationFlow);
    setKaizenProject(initialValues.kaizenProject);
    setDemandData(initialValues.demandData);
    setSummaryData(initialValues.summaryData);
    setReportID(initialValues.reportID);
    setInventory(initialValues.inventory);
    set_version(initialValues._version);
    set_deleted(initialValues._deleted);
    set_lastChangedAt(initialValues._lastChangedAt);
    setErrors({});
  };
  const validations = {
    process: [{ type: "JSON" }],
    informationFlow: [],
    kaizenProject: [],
    demandData: [{ type: "JSON" }],
    summaryData: [{ type: "JSON" }],
    reportID: [{ type: "Required" }],
    inventory: [{ type: "JSON" }],
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
          process,
          informationFlow,
          kaizenProject,
          demandData,
          summaryData,
          reportID,
          inventory,
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
            query: createVsm.replaceAll("__typename", ""),
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
      {...getOverrideProps(overrides, "VsmCreateForm")}
      {...rest}
    >
      <TextAreaField
        label="Process"
        isRequired={false}
        isReadOnly={false}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              process: value,
              informationFlow,
              kaizenProject,
              demandData,
              summaryData,
              reportID,
              inventory,
              _version,
              _deleted,
              _lastChangedAt,
            };
            const result = onChange(modelFields);
            value = result?.process ?? value;
          }
          if (errors.process?.hasError) {
            runValidationTasks("process", value);
          }
          setProcess(value);
        }}
        onBlur={() => runValidationTasks("process", process)}
        errorMessage={errors.process?.errorMessage}
        hasError={errors.process?.hasError}
        {...getOverrideProps(overrides, "process")}
      ></TextAreaField>
      <TextField
        label="Information flow"
        isRequired={false}
        isReadOnly={false}
        value={informationFlow}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              process,
              informationFlow: value,
              kaizenProject,
              demandData,
              summaryData,
              reportID,
              inventory,
              _version,
              _deleted,
              _lastChangedAt,
            };
            const result = onChange(modelFields);
            value = result?.informationFlow ?? value;
          }
          if (errors.informationFlow?.hasError) {
            runValidationTasks("informationFlow", value);
          }
          setInformationFlow(value);
        }}
        onBlur={() => runValidationTasks("informationFlow", informationFlow)}
        errorMessage={errors.informationFlow?.errorMessage}
        hasError={errors.informationFlow?.hasError}
        {...getOverrideProps(overrides, "informationFlow")}
      ></TextField>
      <TextField
        label="Kaizen project"
        isRequired={false}
        isReadOnly={false}
        value={kaizenProject}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              process,
              informationFlow,
              kaizenProject: value,
              demandData,
              summaryData,
              reportID,
              inventory,
              _version,
              _deleted,
              _lastChangedAt,
            };
            const result = onChange(modelFields);
            value = result?.kaizenProject ?? value;
          }
          if (errors.kaizenProject?.hasError) {
            runValidationTasks("kaizenProject", value);
          }
          setKaizenProject(value);
        }}
        onBlur={() => runValidationTasks("kaizenProject", kaizenProject)}
        errorMessage={errors.kaizenProject?.errorMessage}
        hasError={errors.kaizenProject?.hasError}
        {...getOverrideProps(overrides, "kaizenProject")}
      ></TextField>
      <TextAreaField
        label="Demand data"
        isRequired={false}
        isReadOnly={false}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              process,
              informationFlow,
              kaizenProject,
              demandData: value,
              summaryData,
              reportID,
              inventory,
              _version,
              _deleted,
              _lastChangedAt,
            };
            const result = onChange(modelFields);
            value = result?.demandData ?? value;
          }
          if (errors.demandData?.hasError) {
            runValidationTasks("demandData", value);
          }
          setDemandData(value);
        }}
        onBlur={() => runValidationTasks("demandData", demandData)}
        errorMessage={errors.demandData?.errorMessage}
        hasError={errors.demandData?.hasError}
        {...getOverrideProps(overrides, "demandData")}
      ></TextAreaField>
      <TextAreaField
        label="Summary data"
        isRequired={false}
        isReadOnly={false}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              process,
              informationFlow,
              kaizenProject,
              demandData,
              summaryData: value,
              reportID,
              inventory,
              _version,
              _deleted,
              _lastChangedAt,
            };
            const result = onChange(modelFields);
            value = result?.summaryData ?? value;
          }
          if (errors.summaryData?.hasError) {
            runValidationTasks("summaryData", value);
          }
          setSummaryData(value);
        }}
        onBlur={() => runValidationTasks("summaryData", summaryData)}
        errorMessage={errors.summaryData?.errorMessage}
        hasError={errors.summaryData?.hasError}
        {...getOverrideProps(overrides, "summaryData")}
      ></TextAreaField>
      <TextField
        label="Report id"
        isRequired={true}
        isReadOnly={false}
        value={reportID}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              process,
              informationFlow,
              kaizenProject,
              demandData,
              summaryData,
              reportID: value,
              inventory,
              _version,
              _deleted,
              _lastChangedAt,
            };
            const result = onChange(modelFields);
            value = result?.reportID ?? value;
          }
          if (errors.reportID?.hasError) {
            runValidationTasks("reportID", value);
          }
          setReportID(value);
        }}
        onBlur={() => runValidationTasks("reportID", reportID)}
        errorMessage={errors.reportID?.errorMessage}
        hasError={errors.reportID?.hasError}
        {...getOverrideProps(overrides, "reportID")}
      ></TextField>
      <TextAreaField
        label="Inventory"
        isRequired={false}
        isReadOnly={false}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              process,
              informationFlow,
              kaizenProject,
              demandData,
              summaryData,
              reportID,
              inventory: value,
              _version,
              _deleted,
              _lastChangedAt,
            };
            const result = onChange(modelFields);
            value = result?.inventory ?? value;
          }
          if (errors.inventory?.hasError) {
            runValidationTasks("inventory", value);
          }
          setInventory(value);
        }}
        onBlur={() => runValidationTasks("inventory", inventory)}
        errorMessage={errors.inventory?.errorMessage}
        hasError={errors.inventory?.hasError}
        {...getOverrideProps(overrides, "inventory")}
      ></TextAreaField>
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
              process,
              informationFlow,
              kaizenProject,
              demandData,
              summaryData,
              reportID,
              inventory,
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
              process,
              informationFlow,
              kaizenProject,
              demandData,
              summaryData,
              reportID,
              inventory,
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
              process,
              informationFlow,
              kaizenProject,
              demandData,
              summaryData,
              reportID,
              inventory,
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
