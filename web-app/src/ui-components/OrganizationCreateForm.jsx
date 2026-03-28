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
import { createOrganization } from "../graphql/mutations";
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
export default function OrganizationCreateForm(props) {
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
    owner: "",
    additionalOwners: [],
    contactEmail: "",
    contactPhone: "",
    location: "",
    coordinates: "",
    logo: "",
    isActive: false,
    leaderboardEnabled: false,
    stripeCustomerId: "",
    stripeSubscriptionId: "",
    stripeSubscriptionItemId: "",
    subscriptionStatus: "",
    subscriptionPeriodEnd: "",
    billingPeriod: "",
    activeUserCount: "",
    purchasedLicenses: "",
    aiDisabledUsers: [],
    learningCoinsPerInterval: "",
    learningCoinInterval: "",
    learningMaxCoinsPerSession: "",
    learningCoinsEnabled: false,
    createdAt: "",
    updatedAt: "",
    _version: "",
    _deleted: false,
    _lastChangedAt: "",
  };
  const [name, setName] = React.useState(initialValues.name);
  const [owner, setOwner] = React.useState(initialValues.owner);
  const [additionalOwners, setAdditionalOwners] = React.useState(
    initialValues.additionalOwners
  );
  const [contactEmail, setContactEmail] = React.useState(
    initialValues.contactEmail
  );
  const [contactPhone, setContactPhone] = React.useState(
    initialValues.contactPhone
  );
  const [location, setLocation] = React.useState(initialValues.location);
  const [coordinates, setCoordinates] = React.useState(
    initialValues.coordinates
  );
  const [logo, setLogo] = React.useState(initialValues.logo);
  const [isActive, setIsActive] = React.useState(initialValues.isActive);
  const [leaderboardEnabled, setLeaderboardEnabled] = React.useState(
    initialValues.leaderboardEnabled
  );
  const [stripeCustomerId, setStripeCustomerId] = React.useState(
    initialValues.stripeCustomerId
  );
  const [stripeSubscriptionId, setStripeSubscriptionId] = React.useState(
    initialValues.stripeSubscriptionId
  );
  const [stripeSubscriptionItemId, setStripeSubscriptionItemId] =
    React.useState(initialValues.stripeSubscriptionItemId);
  const [subscriptionStatus, setSubscriptionStatus] = React.useState(
    initialValues.subscriptionStatus
  );
  const [subscriptionPeriodEnd, setSubscriptionPeriodEnd] = React.useState(
    initialValues.subscriptionPeriodEnd
  );
  const [billingPeriod, setBillingPeriod] = React.useState(
    initialValues.billingPeriod
  );
  const [activeUserCount, setActiveUserCount] = React.useState(
    initialValues.activeUserCount
  );
  const [purchasedLicenses, setPurchasedLicenses] = React.useState(
    initialValues.purchasedLicenses
  );
  const [aiDisabledUsers, setAiDisabledUsers] = React.useState(
    initialValues.aiDisabledUsers
  );
  const [learningCoinsPerInterval, setLearningCoinsPerInterval] =
    React.useState(initialValues.learningCoinsPerInterval);
  const [learningCoinInterval, setLearningCoinInterval] = React.useState(
    initialValues.learningCoinInterval
  );
  const [learningMaxCoinsPerSession, setLearningMaxCoinsPerSession] =
    React.useState(initialValues.learningMaxCoinsPerSession);
  const [learningCoinsEnabled, setLearningCoinsEnabled] = React.useState(
    initialValues.learningCoinsEnabled
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
    setName(initialValues.name);
    setOwner(initialValues.owner);
    setAdditionalOwners(initialValues.additionalOwners);
    setCurrentAdditionalOwnersValue("");
    setContactEmail(initialValues.contactEmail);
    setContactPhone(initialValues.contactPhone);
    setLocation(initialValues.location);
    setCoordinates(initialValues.coordinates);
    setLogo(initialValues.logo);
    setIsActive(initialValues.isActive);
    setLeaderboardEnabled(initialValues.leaderboardEnabled);
    setStripeCustomerId(initialValues.stripeCustomerId);
    setStripeSubscriptionId(initialValues.stripeSubscriptionId);
    setStripeSubscriptionItemId(initialValues.stripeSubscriptionItemId);
    setSubscriptionStatus(initialValues.subscriptionStatus);
    setSubscriptionPeriodEnd(initialValues.subscriptionPeriodEnd);
    setBillingPeriod(initialValues.billingPeriod);
    setActiveUserCount(initialValues.activeUserCount);
    setPurchasedLicenses(initialValues.purchasedLicenses);
    setAiDisabledUsers(initialValues.aiDisabledUsers);
    setCurrentAiDisabledUsersValue("");
    setLearningCoinsPerInterval(initialValues.learningCoinsPerInterval);
    setLearningCoinInterval(initialValues.learningCoinInterval);
    setLearningMaxCoinsPerSession(initialValues.learningMaxCoinsPerSession);
    setLearningCoinsEnabled(initialValues.learningCoinsEnabled);
    setCreatedAt(initialValues.createdAt);
    setUpdatedAt(initialValues.updatedAt);
    set_version(initialValues._version);
    set_deleted(initialValues._deleted);
    set_lastChangedAt(initialValues._lastChangedAt);
    setErrors({});
  };
  const [currentAdditionalOwnersValue, setCurrentAdditionalOwnersValue] =
    React.useState("");
  const additionalOwnersRef = React.createRef();
  const [currentAiDisabledUsersValue, setCurrentAiDisabledUsersValue] =
    React.useState("");
  const aiDisabledUsersRef = React.createRef();
  const validations = {
    name: [{ type: "Required" }],
    owner: [{ type: "Required" }],
    additionalOwners: [],
    contactEmail: [],
    contactPhone: [],
    location: [],
    coordinates: [],
    logo: [],
    isActive: [],
    leaderboardEnabled: [],
    stripeCustomerId: [],
    stripeSubscriptionId: [],
    stripeSubscriptionItemId: [],
    subscriptionStatus: [],
    subscriptionPeriodEnd: [],
    billingPeriod: [],
    activeUserCount: [],
    purchasedLicenses: [],
    aiDisabledUsers: [],
    learningCoinsPerInterval: [],
    learningCoinInterval: [],
    learningMaxCoinsPerSession: [],
    learningCoinsEnabled: [],
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
          name,
          owner,
          additionalOwners,
          contactEmail,
          contactPhone,
          location,
          coordinates,
          logo,
          isActive,
          leaderboardEnabled,
          stripeCustomerId,
          stripeSubscriptionId,
          stripeSubscriptionItemId,
          subscriptionStatus,
          subscriptionPeriodEnd,
          billingPeriod,
          activeUserCount,
          purchasedLicenses,
          aiDisabledUsers,
          learningCoinsPerInterval,
          learningCoinInterval,
          learningMaxCoinsPerSession,
          learningCoinsEnabled,
          createdAt,
          updatedAt,
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
            query: createOrganization.replaceAll("__typename", ""),
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
      {...getOverrideProps(overrides, "OrganizationCreateForm")}
      {...rest}
    >
      <TextField
        label="Name"
        isRequired={true}
        isReadOnly={false}
        value={name}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              name: value,
              owner,
              additionalOwners,
              contactEmail,
              contactPhone,
              location,
              coordinates,
              logo,
              isActive,
              leaderboardEnabled,
              stripeCustomerId,
              stripeSubscriptionId,
              stripeSubscriptionItemId,
              subscriptionStatus,
              subscriptionPeriodEnd,
              billingPeriod,
              activeUserCount,
              purchasedLicenses,
              aiDisabledUsers,
              learningCoinsPerInterval,
              learningCoinInterval,
              learningMaxCoinsPerSession,
              learningCoinsEnabled,
              createdAt,
              updatedAt,
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
        label="Owner"
        isRequired={true}
        isReadOnly={false}
        value={owner}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              name,
              owner: value,
              additionalOwners,
              contactEmail,
              contactPhone,
              location,
              coordinates,
              logo,
              isActive,
              leaderboardEnabled,
              stripeCustomerId,
              stripeSubscriptionId,
              stripeSubscriptionItemId,
              subscriptionStatus,
              subscriptionPeriodEnd,
              billingPeriod,
              activeUserCount,
              purchasedLicenses,
              aiDisabledUsers,
              learningCoinsPerInterval,
              learningCoinInterval,
              learningMaxCoinsPerSession,
              learningCoinsEnabled,
              createdAt,
              updatedAt,
              _version,
              _deleted,
              _lastChangedAt,
            };
            const result = onChange(modelFields);
            value = result?.owner ?? value;
          }
          if (errors.owner?.hasError) {
            runValidationTasks("owner", value);
          }
          setOwner(value);
        }}
        onBlur={() => runValidationTasks("owner", owner)}
        errorMessage={errors.owner?.errorMessage}
        hasError={errors.owner?.hasError}
        {...getOverrideProps(overrides, "owner")}
      ></TextField>
      <ArrayField
        onChange={async (items) => {
          let values = items;
          if (onChange) {
            const modelFields = {
              name,
              owner,
              additionalOwners: values,
              contactEmail,
              contactPhone,
              location,
              coordinates,
              logo,
              isActive,
              leaderboardEnabled,
              stripeCustomerId,
              stripeSubscriptionId,
              stripeSubscriptionItemId,
              subscriptionStatus,
              subscriptionPeriodEnd,
              billingPeriod,
              activeUserCount,
              purchasedLicenses,
              aiDisabledUsers,
              learningCoinsPerInterval,
              learningCoinInterval,
              learningMaxCoinsPerSession,
              learningCoinsEnabled,
              createdAt,
              updatedAt,
              _version,
              _deleted,
              _lastChangedAt,
            };
            const result = onChange(modelFields);
            values = result?.additionalOwners ?? values;
          }
          setAdditionalOwners(values);
          setCurrentAdditionalOwnersValue("");
        }}
        currentFieldValue={currentAdditionalOwnersValue}
        label={"Additional owners"}
        items={additionalOwners}
        hasError={errors?.additionalOwners?.hasError}
        runValidationTasks={async () =>
          await runValidationTasks(
            "additionalOwners",
            currentAdditionalOwnersValue
          )
        }
        errorMessage={errors?.additionalOwners?.errorMessage}
        setFieldValue={setCurrentAdditionalOwnersValue}
        inputFieldRef={additionalOwnersRef}
        defaultFieldValue={""}
      >
        <TextField
          label="Additional owners"
          isRequired={false}
          isReadOnly={false}
          value={currentAdditionalOwnersValue}
          onChange={(e) => {
            let { value } = e.target;
            if (errors.additionalOwners?.hasError) {
              runValidationTasks("additionalOwners", value);
            }
            setCurrentAdditionalOwnersValue(value);
          }}
          onBlur={() =>
            runValidationTasks("additionalOwners", currentAdditionalOwnersValue)
          }
          errorMessage={errors.additionalOwners?.errorMessage}
          hasError={errors.additionalOwners?.hasError}
          ref={additionalOwnersRef}
          labelHidden={true}
          {...getOverrideProps(overrides, "additionalOwners")}
        ></TextField>
      </ArrayField>
      <TextField
        label="Contact email"
        isRequired={false}
        isReadOnly={false}
        value={contactEmail}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              name,
              owner,
              additionalOwners,
              contactEmail: value,
              contactPhone,
              location,
              coordinates,
              logo,
              isActive,
              leaderboardEnabled,
              stripeCustomerId,
              stripeSubscriptionId,
              stripeSubscriptionItemId,
              subscriptionStatus,
              subscriptionPeriodEnd,
              billingPeriod,
              activeUserCount,
              purchasedLicenses,
              aiDisabledUsers,
              learningCoinsPerInterval,
              learningCoinInterval,
              learningMaxCoinsPerSession,
              learningCoinsEnabled,
              createdAt,
              updatedAt,
              _version,
              _deleted,
              _lastChangedAt,
            };
            const result = onChange(modelFields);
            value = result?.contactEmail ?? value;
          }
          if (errors.contactEmail?.hasError) {
            runValidationTasks("contactEmail", value);
          }
          setContactEmail(value);
        }}
        onBlur={() => runValidationTasks("contactEmail", contactEmail)}
        errorMessage={errors.contactEmail?.errorMessage}
        hasError={errors.contactEmail?.hasError}
        {...getOverrideProps(overrides, "contactEmail")}
      ></TextField>
      <TextField
        label="Contact phone"
        isRequired={false}
        isReadOnly={false}
        value={contactPhone}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              name,
              owner,
              additionalOwners,
              contactEmail,
              contactPhone: value,
              location,
              coordinates,
              logo,
              isActive,
              leaderboardEnabled,
              stripeCustomerId,
              stripeSubscriptionId,
              stripeSubscriptionItemId,
              subscriptionStatus,
              subscriptionPeriodEnd,
              billingPeriod,
              activeUserCount,
              purchasedLicenses,
              aiDisabledUsers,
              learningCoinsPerInterval,
              learningCoinInterval,
              learningMaxCoinsPerSession,
              learningCoinsEnabled,
              createdAt,
              updatedAt,
              _version,
              _deleted,
              _lastChangedAt,
            };
            const result = onChange(modelFields);
            value = result?.contactPhone ?? value;
          }
          if (errors.contactPhone?.hasError) {
            runValidationTasks("contactPhone", value);
          }
          setContactPhone(value);
        }}
        onBlur={() => runValidationTasks("contactPhone", contactPhone)}
        errorMessage={errors.contactPhone?.errorMessage}
        hasError={errors.contactPhone?.hasError}
        {...getOverrideProps(overrides, "contactPhone")}
      ></TextField>
      <TextField
        label="Location"
        isRequired={false}
        isReadOnly={false}
        value={location}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              name,
              owner,
              additionalOwners,
              contactEmail,
              contactPhone,
              location: value,
              coordinates,
              logo,
              isActive,
              leaderboardEnabled,
              stripeCustomerId,
              stripeSubscriptionId,
              stripeSubscriptionItemId,
              subscriptionStatus,
              subscriptionPeriodEnd,
              billingPeriod,
              activeUserCount,
              purchasedLicenses,
              aiDisabledUsers,
              learningCoinsPerInterval,
              learningCoinInterval,
              learningMaxCoinsPerSession,
              learningCoinsEnabled,
              createdAt,
              updatedAt,
              _version,
              _deleted,
              _lastChangedAt,
            };
            const result = onChange(modelFields);
            value = result?.location ?? value;
          }
          if (errors.location?.hasError) {
            runValidationTasks("location", value);
          }
          setLocation(value);
        }}
        onBlur={() => runValidationTasks("location", location)}
        errorMessage={errors.location?.errorMessage}
        hasError={errors.location?.hasError}
        {...getOverrideProps(overrides, "location")}
      ></TextField>
      <TextField
        label="Coordinates"
        isRequired={false}
        isReadOnly={false}
        value={coordinates}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              name,
              owner,
              additionalOwners,
              contactEmail,
              contactPhone,
              location,
              coordinates: value,
              logo,
              isActive,
              leaderboardEnabled,
              stripeCustomerId,
              stripeSubscriptionId,
              stripeSubscriptionItemId,
              subscriptionStatus,
              subscriptionPeriodEnd,
              billingPeriod,
              activeUserCount,
              purchasedLicenses,
              aiDisabledUsers,
              learningCoinsPerInterval,
              learningCoinInterval,
              learningMaxCoinsPerSession,
              learningCoinsEnabled,
              createdAt,
              updatedAt,
              _version,
              _deleted,
              _lastChangedAt,
            };
            const result = onChange(modelFields);
            value = result?.coordinates ?? value;
          }
          if (errors.coordinates?.hasError) {
            runValidationTasks("coordinates", value);
          }
          setCoordinates(value);
        }}
        onBlur={() => runValidationTasks("coordinates", coordinates)}
        errorMessage={errors.coordinates?.errorMessage}
        hasError={errors.coordinates?.hasError}
        {...getOverrideProps(overrides, "coordinates")}
      ></TextField>
      <TextField
        label="Logo"
        isRequired={false}
        isReadOnly={false}
        value={logo}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              name,
              owner,
              additionalOwners,
              contactEmail,
              contactPhone,
              location,
              coordinates,
              logo: value,
              isActive,
              leaderboardEnabled,
              stripeCustomerId,
              stripeSubscriptionId,
              stripeSubscriptionItemId,
              subscriptionStatus,
              subscriptionPeriodEnd,
              billingPeriod,
              activeUserCount,
              purchasedLicenses,
              aiDisabledUsers,
              learningCoinsPerInterval,
              learningCoinInterval,
              learningMaxCoinsPerSession,
              learningCoinsEnabled,
              createdAt,
              updatedAt,
              _version,
              _deleted,
              _lastChangedAt,
            };
            const result = onChange(modelFields);
            value = result?.logo ?? value;
          }
          if (errors.logo?.hasError) {
            runValidationTasks("logo", value);
          }
          setLogo(value);
        }}
        onBlur={() => runValidationTasks("logo", logo)}
        errorMessage={errors.logo?.errorMessage}
        hasError={errors.logo?.hasError}
        {...getOverrideProps(overrides, "logo")}
      ></TextField>
      <SwitchField
        label="Is active"
        defaultChecked={false}
        isDisabled={false}
        isChecked={isActive}
        onChange={(e) => {
          let value = e.target.checked;
          if (onChange) {
            const modelFields = {
              name,
              owner,
              additionalOwners,
              contactEmail,
              contactPhone,
              location,
              coordinates,
              logo,
              isActive: value,
              leaderboardEnabled,
              stripeCustomerId,
              stripeSubscriptionId,
              stripeSubscriptionItemId,
              subscriptionStatus,
              subscriptionPeriodEnd,
              billingPeriod,
              activeUserCount,
              purchasedLicenses,
              aiDisabledUsers,
              learningCoinsPerInterval,
              learningCoinInterval,
              learningMaxCoinsPerSession,
              learningCoinsEnabled,
              createdAt,
              updatedAt,
              _version,
              _deleted,
              _lastChangedAt,
            };
            const result = onChange(modelFields);
            value = result?.isActive ?? value;
          }
          if (errors.isActive?.hasError) {
            runValidationTasks("isActive", value);
          }
          setIsActive(value);
        }}
        onBlur={() => runValidationTasks("isActive", isActive)}
        errorMessage={errors.isActive?.errorMessage}
        hasError={errors.isActive?.hasError}
        {...getOverrideProps(overrides, "isActive")}
      ></SwitchField>
      <SwitchField
        label="Leaderboard enabled"
        defaultChecked={false}
        isDisabled={false}
        isChecked={leaderboardEnabled}
        onChange={(e) => {
          let value = e.target.checked;
          if (onChange) {
            const modelFields = {
              name,
              owner,
              additionalOwners,
              contactEmail,
              contactPhone,
              location,
              coordinates,
              logo,
              isActive,
              leaderboardEnabled: value,
              stripeCustomerId,
              stripeSubscriptionId,
              stripeSubscriptionItemId,
              subscriptionStatus,
              subscriptionPeriodEnd,
              billingPeriod,
              activeUserCount,
              purchasedLicenses,
              aiDisabledUsers,
              learningCoinsPerInterval,
              learningCoinInterval,
              learningMaxCoinsPerSession,
              learningCoinsEnabled,
              createdAt,
              updatedAt,
              _version,
              _deleted,
              _lastChangedAt,
            };
            const result = onChange(modelFields);
            value = result?.leaderboardEnabled ?? value;
          }
          if (errors.leaderboardEnabled?.hasError) {
            runValidationTasks("leaderboardEnabled", value);
          }
          setLeaderboardEnabled(value);
        }}
        onBlur={() =>
          runValidationTasks("leaderboardEnabled", leaderboardEnabled)
        }
        errorMessage={errors.leaderboardEnabled?.errorMessage}
        hasError={errors.leaderboardEnabled?.hasError}
        {...getOverrideProps(overrides, "leaderboardEnabled")}
      ></SwitchField>
      <TextField
        label="Stripe customer id"
        isRequired={false}
        isReadOnly={false}
        value={stripeCustomerId}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              name,
              owner,
              additionalOwners,
              contactEmail,
              contactPhone,
              location,
              coordinates,
              logo,
              isActive,
              leaderboardEnabled,
              stripeCustomerId: value,
              stripeSubscriptionId,
              stripeSubscriptionItemId,
              subscriptionStatus,
              subscriptionPeriodEnd,
              billingPeriod,
              activeUserCount,
              purchasedLicenses,
              aiDisabledUsers,
              learningCoinsPerInterval,
              learningCoinInterval,
              learningMaxCoinsPerSession,
              learningCoinsEnabled,
              createdAt,
              updatedAt,
              _version,
              _deleted,
              _lastChangedAt,
            };
            const result = onChange(modelFields);
            value = result?.stripeCustomerId ?? value;
          }
          if (errors.stripeCustomerId?.hasError) {
            runValidationTasks("stripeCustomerId", value);
          }
          setStripeCustomerId(value);
        }}
        onBlur={() => runValidationTasks("stripeCustomerId", stripeCustomerId)}
        errorMessage={errors.stripeCustomerId?.errorMessage}
        hasError={errors.stripeCustomerId?.hasError}
        {...getOverrideProps(overrides, "stripeCustomerId")}
      ></TextField>
      <TextField
        label="Stripe subscription id"
        isRequired={false}
        isReadOnly={false}
        value={stripeSubscriptionId}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              name,
              owner,
              additionalOwners,
              contactEmail,
              contactPhone,
              location,
              coordinates,
              logo,
              isActive,
              leaderboardEnabled,
              stripeCustomerId,
              stripeSubscriptionId: value,
              stripeSubscriptionItemId,
              subscriptionStatus,
              subscriptionPeriodEnd,
              billingPeriod,
              activeUserCount,
              purchasedLicenses,
              aiDisabledUsers,
              learningCoinsPerInterval,
              learningCoinInterval,
              learningMaxCoinsPerSession,
              learningCoinsEnabled,
              createdAt,
              updatedAt,
              _version,
              _deleted,
              _lastChangedAt,
            };
            const result = onChange(modelFields);
            value = result?.stripeSubscriptionId ?? value;
          }
          if (errors.stripeSubscriptionId?.hasError) {
            runValidationTasks("stripeSubscriptionId", value);
          }
          setStripeSubscriptionId(value);
        }}
        onBlur={() =>
          runValidationTasks("stripeSubscriptionId", stripeSubscriptionId)
        }
        errorMessage={errors.stripeSubscriptionId?.errorMessage}
        hasError={errors.stripeSubscriptionId?.hasError}
        {...getOverrideProps(overrides, "stripeSubscriptionId")}
      ></TextField>
      <TextField
        label="Stripe subscription item id"
        isRequired={false}
        isReadOnly={false}
        value={stripeSubscriptionItemId}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              name,
              owner,
              additionalOwners,
              contactEmail,
              contactPhone,
              location,
              coordinates,
              logo,
              isActive,
              leaderboardEnabled,
              stripeCustomerId,
              stripeSubscriptionId,
              stripeSubscriptionItemId: value,
              subscriptionStatus,
              subscriptionPeriodEnd,
              billingPeriod,
              activeUserCount,
              purchasedLicenses,
              aiDisabledUsers,
              learningCoinsPerInterval,
              learningCoinInterval,
              learningMaxCoinsPerSession,
              learningCoinsEnabled,
              createdAt,
              updatedAt,
              _version,
              _deleted,
              _lastChangedAt,
            };
            const result = onChange(modelFields);
            value = result?.stripeSubscriptionItemId ?? value;
          }
          if (errors.stripeSubscriptionItemId?.hasError) {
            runValidationTasks("stripeSubscriptionItemId", value);
          }
          setStripeSubscriptionItemId(value);
        }}
        onBlur={() =>
          runValidationTasks(
            "stripeSubscriptionItemId",
            stripeSubscriptionItemId
          )
        }
        errorMessage={errors.stripeSubscriptionItemId?.errorMessage}
        hasError={errors.stripeSubscriptionItemId?.hasError}
        {...getOverrideProps(overrides, "stripeSubscriptionItemId")}
      ></TextField>
      <TextField
        label="Subscription status"
        isRequired={false}
        isReadOnly={false}
        value={subscriptionStatus}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              name,
              owner,
              additionalOwners,
              contactEmail,
              contactPhone,
              location,
              coordinates,
              logo,
              isActive,
              leaderboardEnabled,
              stripeCustomerId,
              stripeSubscriptionId,
              stripeSubscriptionItemId,
              subscriptionStatus: value,
              subscriptionPeriodEnd,
              billingPeriod,
              activeUserCount,
              purchasedLicenses,
              aiDisabledUsers,
              learningCoinsPerInterval,
              learningCoinInterval,
              learningMaxCoinsPerSession,
              learningCoinsEnabled,
              createdAt,
              updatedAt,
              _version,
              _deleted,
              _lastChangedAt,
            };
            const result = onChange(modelFields);
            value = result?.subscriptionStatus ?? value;
          }
          if (errors.subscriptionStatus?.hasError) {
            runValidationTasks("subscriptionStatus", value);
          }
          setSubscriptionStatus(value);
        }}
        onBlur={() =>
          runValidationTasks("subscriptionStatus", subscriptionStatus)
        }
        errorMessage={errors.subscriptionStatus?.errorMessage}
        hasError={errors.subscriptionStatus?.hasError}
        {...getOverrideProps(overrides, "subscriptionStatus")}
      ></TextField>
      <TextField
        label="Subscription period end"
        isRequired={false}
        isReadOnly={false}
        type="datetime-local"
        value={
          subscriptionPeriodEnd &&
          convertToLocal(new Date(subscriptionPeriodEnd))
        }
        onChange={(e) => {
          let value =
            e.target.value === "" ? "" : new Date(e.target.value).toISOString();
          if (onChange) {
            const modelFields = {
              name,
              owner,
              additionalOwners,
              contactEmail,
              contactPhone,
              location,
              coordinates,
              logo,
              isActive,
              leaderboardEnabled,
              stripeCustomerId,
              stripeSubscriptionId,
              stripeSubscriptionItemId,
              subscriptionStatus,
              subscriptionPeriodEnd: value,
              billingPeriod,
              activeUserCount,
              purchasedLicenses,
              aiDisabledUsers,
              learningCoinsPerInterval,
              learningCoinInterval,
              learningMaxCoinsPerSession,
              learningCoinsEnabled,
              createdAt,
              updatedAt,
              _version,
              _deleted,
              _lastChangedAt,
            };
            const result = onChange(modelFields);
            value = result?.subscriptionPeriodEnd ?? value;
          }
          if (errors.subscriptionPeriodEnd?.hasError) {
            runValidationTasks("subscriptionPeriodEnd", value);
          }
          setSubscriptionPeriodEnd(value);
        }}
        onBlur={() =>
          runValidationTasks("subscriptionPeriodEnd", subscriptionPeriodEnd)
        }
        errorMessage={errors.subscriptionPeriodEnd?.errorMessage}
        hasError={errors.subscriptionPeriodEnd?.hasError}
        {...getOverrideProps(overrides, "subscriptionPeriodEnd")}
      ></TextField>
      <TextField
        label="Billing period"
        isRequired={false}
        isReadOnly={false}
        value={billingPeriod}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              name,
              owner,
              additionalOwners,
              contactEmail,
              contactPhone,
              location,
              coordinates,
              logo,
              isActive,
              leaderboardEnabled,
              stripeCustomerId,
              stripeSubscriptionId,
              stripeSubscriptionItemId,
              subscriptionStatus,
              subscriptionPeriodEnd,
              billingPeriod: value,
              activeUserCount,
              purchasedLicenses,
              aiDisabledUsers,
              learningCoinsPerInterval,
              learningCoinInterval,
              learningMaxCoinsPerSession,
              learningCoinsEnabled,
              createdAt,
              updatedAt,
              _version,
              _deleted,
              _lastChangedAt,
            };
            const result = onChange(modelFields);
            value = result?.billingPeriod ?? value;
          }
          if (errors.billingPeriod?.hasError) {
            runValidationTasks("billingPeriod", value);
          }
          setBillingPeriod(value);
        }}
        onBlur={() => runValidationTasks("billingPeriod", billingPeriod)}
        errorMessage={errors.billingPeriod?.errorMessage}
        hasError={errors.billingPeriod?.hasError}
        {...getOverrideProps(overrides, "billingPeriod")}
      ></TextField>
      <TextField
        label="Active user count"
        isRequired={false}
        isReadOnly={false}
        type="number"
        step="any"
        value={activeUserCount}
        onChange={(e) => {
          let value = isNaN(parseInt(e.target.value))
            ? e.target.value
            : parseInt(e.target.value);
          if (onChange) {
            const modelFields = {
              name,
              owner,
              additionalOwners,
              contactEmail,
              contactPhone,
              location,
              coordinates,
              logo,
              isActive,
              leaderboardEnabled,
              stripeCustomerId,
              stripeSubscriptionId,
              stripeSubscriptionItemId,
              subscriptionStatus,
              subscriptionPeriodEnd,
              billingPeriod,
              activeUserCount: value,
              purchasedLicenses,
              aiDisabledUsers,
              learningCoinsPerInterval,
              learningCoinInterval,
              learningMaxCoinsPerSession,
              learningCoinsEnabled,
              createdAt,
              updatedAt,
              _version,
              _deleted,
              _lastChangedAt,
            };
            const result = onChange(modelFields);
            value = result?.activeUserCount ?? value;
          }
          if (errors.activeUserCount?.hasError) {
            runValidationTasks("activeUserCount", value);
          }
          setActiveUserCount(value);
        }}
        onBlur={() => runValidationTasks("activeUserCount", activeUserCount)}
        errorMessage={errors.activeUserCount?.errorMessage}
        hasError={errors.activeUserCount?.hasError}
        {...getOverrideProps(overrides, "activeUserCount")}
      ></TextField>
      <TextField
        label="Purchased licenses"
        isRequired={false}
        isReadOnly={false}
        type="number"
        step="any"
        value={purchasedLicenses}
        onChange={(e) => {
          let value = isNaN(parseInt(e.target.value))
            ? e.target.value
            : parseInt(e.target.value);
          if (onChange) {
            const modelFields = {
              name,
              owner,
              additionalOwners,
              contactEmail,
              contactPhone,
              location,
              coordinates,
              logo,
              isActive,
              leaderboardEnabled,
              stripeCustomerId,
              stripeSubscriptionId,
              stripeSubscriptionItemId,
              subscriptionStatus,
              subscriptionPeriodEnd,
              billingPeriod,
              activeUserCount,
              purchasedLicenses: value,
              aiDisabledUsers,
              learningCoinsPerInterval,
              learningCoinInterval,
              learningMaxCoinsPerSession,
              learningCoinsEnabled,
              createdAt,
              updatedAt,
              _version,
              _deleted,
              _lastChangedAt,
            };
            const result = onChange(modelFields);
            value = result?.purchasedLicenses ?? value;
          }
          if (errors.purchasedLicenses?.hasError) {
            runValidationTasks("purchasedLicenses", value);
          }
          setPurchasedLicenses(value);
        }}
        onBlur={() =>
          runValidationTasks("purchasedLicenses", purchasedLicenses)
        }
        errorMessage={errors.purchasedLicenses?.errorMessage}
        hasError={errors.purchasedLicenses?.hasError}
        {...getOverrideProps(overrides, "purchasedLicenses")}
      ></TextField>
      <ArrayField
        onChange={async (items) => {
          let values = items;
          if (onChange) {
            const modelFields = {
              name,
              owner,
              additionalOwners,
              contactEmail,
              contactPhone,
              location,
              coordinates,
              logo,
              isActive,
              leaderboardEnabled,
              stripeCustomerId,
              stripeSubscriptionId,
              stripeSubscriptionItemId,
              subscriptionStatus,
              subscriptionPeriodEnd,
              billingPeriod,
              activeUserCount,
              purchasedLicenses,
              aiDisabledUsers: values,
              learningCoinsPerInterval,
              learningCoinInterval,
              learningMaxCoinsPerSession,
              learningCoinsEnabled,
              createdAt,
              updatedAt,
              _version,
              _deleted,
              _lastChangedAt,
            };
            const result = onChange(modelFields);
            values = result?.aiDisabledUsers ?? values;
          }
          setAiDisabledUsers(values);
          setCurrentAiDisabledUsersValue("");
        }}
        currentFieldValue={currentAiDisabledUsersValue}
        label={"Ai disabled users"}
        items={aiDisabledUsers}
        hasError={errors?.aiDisabledUsers?.hasError}
        runValidationTasks={async () =>
          await runValidationTasks(
            "aiDisabledUsers",
            currentAiDisabledUsersValue
          )
        }
        errorMessage={errors?.aiDisabledUsers?.errorMessage}
        setFieldValue={setCurrentAiDisabledUsersValue}
        inputFieldRef={aiDisabledUsersRef}
        defaultFieldValue={""}
      >
        <TextField
          label="Ai disabled users"
          isRequired={false}
          isReadOnly={false}
          value={currentAiDisabledUsersValue}
          onChange={(e) => {
            let { value } = e.target;
            if (errors.aiDisabledUsers?.hasError) {
              runValidationTasks("aiDisabledUsers", value);
            }
            setCurrentAiDisabledUsersValue(value);
          }}
          onBlur={() =>
            runValidationTasks("aiDisabledUsers", currentAiDisabledUsersValue)
          }
          errorMessage={errors.aiDisabledUsers?.errorMessage}
          hasError={errors.aiDisabledUsers?.hasError}
          ref={aiDisabledUsersRef}
          labelHidden={true}
          {...getOverrideProps(overrides, "aiDisabledUsers")}
        ></TextField>
      </ArrayField>
      <TextField
        label="Learning coins per interval"
        isRequired={false}
        isReadOnly={false}
        type="number"
        step="any"
        value={learningCoinsPerInterval}
        onChange={(e) => {
          let value = isNaN(parseInt(e.target.value))
            ? e.target.value
            : parseInt(e.target.value);
          if (onChange) {
            const modelFields = {
              name,
              owner,
              additionalOwners,
              contactEmail,
              contactPhone,
              location,
              coordinates,
              logo,
              isActive,
              leaderboardEnabled,
              stripeCustomerId,
              stripeSubscriptionId,
              stripeSubscriptionItemId,
              subscriptionStatus,
              subscriptionPeriodEnd,
              billingPeriod,
              activeUserCount,
              purchasedLicenses,
              aiDisabledUsers,
              learningCoinsPerInterval: value,
              learningCoinInterval,
              learningMaxCoinsPerSession,
              learningCoinsEnabled,
              createdAt,
              updatedAt,
              _version,
              _deleted,
              _lastChangedAt,
            };
            const result = onChange(modelFields);
            value = result?.learningCoinsPerInterval ?? value;
          }
          if (errors.learningCoinsPerInterval?.hasError) {
            runValidationTasks("learningCoinsPerInterval", value);
          }
          setLearningCoinsPerInterval(value);
        }}
        onBlur={() =>
          runValidationTasks(
            "learningCoinsPerInterval",
            learningCoinsPerInterval
          )
        }
        errorMessage={errors.learningCoinsPerInterval?.errorMessage}
        hasError={errors.learningCoinsPerInterval?.hasError}
        {...getOverrideProps(overrides, "learningCoinsPerInterval")}
      ></TextField>
      <TextField
        label="Learning coin interval"
        isRequired={false}
        isReadOnly={false}
        type="number"
        step="any"
        value={learningCoinInterval}
        onChange={(e) => {
          let value = isNaN(parseInt(e.target.value))
            ? e.target.value
            : parseInt(e.target.value);
          if (onChange) {
            const modelFields = {
              name,
              owner,
              additionalOwners,
              contactEmail,
              contactPhone,
              location,
              coordinates,
              logo,
              isActive,
              leaderboardEnabled,
              stripeCustomerId,
              stripeSubscriptionId,
              stripeSubscriptionItemId,
              subscriptionStatus,
              subscriptionPeriodEnd,
              billingPeriod,
              activeUserCount,
              purchasedLicenses,
              aiDisabledUsers,
              learningCoinsPerInterval,
              learningCoinInterval: value,
              learningMaxCoinsPerSession,
              learningCoinsEnabled,
              createdAt,
              updatedAt,
              _version,
              _deleted,
              _lastChangedAt,
            };
            const result = onChange(modelFields);
            value = result?.learningCoinInterval ?? value;
          }
          if (errors.learningCoinInterval?.hasError) {
            runValidationTasks("learningCoinInterval", value);
          }
          setLearningCoinInterval(value);
        }}
        onBlur={() =>
          runValidationTasks("learningCoinInterval", learningCoinInterval)
        }
        errorMessage={errors.learningCoinInterval?.errorMessage}
        hasError={errors.learningCoinInterval?.hasError}
        {...getOverrideProps(overrides, "learningCoinInterval")}
      ></TextField>
      <TextField
        label="Learning max coins per session"
        isRequired={false}
        isReadOnly={false}
        type="number"
        step="any"
        value={learningMaxCoinsPerSession}
        onChange={(e) => {
          let value = isNaN(parseInt(e.target.value))
            ? e.target.value
            : parseInt(e.target.value);
          if (onChange) {
            const modelFields = {
              name,
              owner,
              additionalOwners,
              contactEmail,
              contactPhone,
              location,
              coordinates,
              logo,
              isActive,
              leaderboardEnabled,
              stripeCustomerId,
              stripeSubscriptionId,
              stripeSubscriptionItemId,
              subscriptionStatus,
              subscriptionPeriodEnd,
              billingPeriod,
              activeUserCount,
              purchasedLicenses,
              aiDisabledUsers,
              learningCoinsPerInterval,
              learningCoinInterval,
              learningMaxCoinsPerSession: value,
              learningCoinsEnabled,
              createdAt,
              updatedAt,
              _version,
              _deleted,
              _lastChangedAt,
            };
            const result = onChange(modelFields);
            value = result?.learningMaxCoinsPerSession ?? value;
          }
          if (errors.learningMaxCoinsPerSession?.hasError) {
            runValidationTasks("learningMaxCoinsPerSession", value);
          }
          setLearningMaxCoinsPerSession(value);
        }}
        onBlur={() =>
          runValidationTasks(
            "learningMaxCoinsPerSession",
            learningMaxCoinsPerSession
          )
        }
        errorMessage={errors.learningMaxCoinsPerSession?.errorMessage}
        hasError={errors.learningMaxCoinsPerSession?.hasError}
        {...getOverrideProps(overrides, "learningMaxCoinsPerSession")}
      ></TextField>
      <SwitchField
        label="Learning coins enabled"
        defaultChecked={false}
        isDisabled={false}
        isChecked={learningCoinsEnabled}
        onChange={(e) => {
          let value = e.target.checked;
          if (onChange) {
            const modelFields = {
              name,
              owner,
              additionalOwners,
              contactEmail,
              contactPhone,
              location,
              coordinates,
              logo,
              isActive,
              leaderboardEnabled,
              stripeCustomerId,
              stripeSubscriptionId,
              stripeSubscriptionItemId,
              subscriptionStatus,
              subscriptionPeriodEnd,
              billingPeriod,
              activeUserCount,
              purchasedLicenses,
              aiDisabledUsers,
              learningCoinsPerInterval,
              learningCoinInterval,
              learningMaxCoinsPerSession,
              learningCoinsEnabled: value,
              createdAt,
              updatedAt,
              _version,
              _deleted,
              _lastChangedAt,
            };
            const result = onChange(modelFields);
            value = result?.learningCoinsEnabled ?? value;
          }
          if (errors.learningCoinsEnabled?.hasError) {
            runValidationTasks("learningCoinsEnabled", value);
          }
          setLearningCoinsEnabled(value);
        }}
        onBlur={() =>
          runValidationTasks("learningCoinsEnabled", learningCoinsEnabled)
        }
        errorMessage={errors.learningCoinsEnabled?.errorMessage}
        hasError={errors.learningCoinsEnabled?.hasError}
        {...getOverrideProps(overrides, "learningCoinsEnabled")}
      ></SwitchField>
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
              name,
              owner,
              additionalOwners,
              contactEmail,
              contactPhone,
              location,
              coordinates,
              logo,
              isActive,
              leaderboardEnabled,
              stripeCustomerId,
              stripeSubscriptionId,
              stripeSubscriptionItemId,
              subscriptionStatus,
              subscriptionPeriodEnd,
              billingPeriod,
              activeUserCount,
              purchasedLicenses,
              aiDisabledUsers,
              learningCoinsPerInterval,
              learningCoinInterval,
              learningMaxCoinsPerSession,
              learningCoinsEnabled,
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
              name,
              owner,
              additionalOwners,
              contactEmail,
              contactPhone,
              location,
              coordinates,
              logo,
              isActive,
              leaderboardEnabled,
              stripeCustomerId,
              stripeSubscriptionId,
              stripeSubscriptionItemId,
              subscriptionStatus,
              subscriptionPeriodEnd,
              billingPeriod,
              activeUserCount,
              purchasedLicenses,
              aiDisabledUsers,
              learningCoinsPerInterval,
              learningCoinInterval,
              learningMaxCoinsPerSession,
              learningCoinsEnabled,
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
              name,
              owner,
              additionalOwners,
              contactEmail,
              contactPhone,
              location,
              coordinates,
              logo,
              isActive,
              leaderboardEnabled,
              stripeCustomerId,
              stripeSubscriptionId,
              stripeSubscriptionItemId,
              subscriptionStatus,
              subscriptionPeriodEnd,
              billingPeriod,
              activeUserCount,
              purchasedLicenses,
              aiDisabledUsers,
              learningCoinsPerInterval,
              learningCoinInterval,
              learningMaxCoinsPerSession,
              learningCoinsEnabled,
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
              name,
              owner,
              additionalOwners,
              contactEmail,
              contactPhone,
              location,
              coordinates,
              logo,
              isActive,
              leaderboardEnabled,
              stripeCustomerId,
              stripeSubscriptionId,
              stripeSubscriptionItemId,
              subscriptionStatus,
              subscriptionPeriodEnd,
              billingPeriod,
              activeUserCount,
              purchasedLicenses,
              aiDisabledUsers,
              learningCoinsPerInterval,
              learningCoinInterval,
              learningMaxCoinsPerSession,
              learningCoinsEnabled,
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
              name,
              owner,
              additionalOwners,
              contactEmail,
              contactPhone,
              location,
              coordinates,
              logo,
              isActive,
              leaderboardEnabled,
              stripeCustomerId,
              stripeSubscriptionId,
              stripeSubscriptionItemId,
              subscriptionStatus,
              subscriptionPeriodEnd,
              billingPeriod,
              activeUserCount,
              purchasedLicenses,
              aiDisabledUsers,
              learningCoinsPerInterval,
              learningCoinInterval,
              learningMaxCoinsPerSession,
              learningCoinsEnabled,
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
