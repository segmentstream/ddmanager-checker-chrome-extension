import validationsConfig from './validations.json';
import { getProp } from './dotProp';
import each from './each';
import { valueIsLogable, prepareValueForLog} from './logUtils';

const MSG_NOT_EMPTY = 'is required';
const MSG_NOT_ARRAY = 'should be an array';
const MSG_NOT_NUMERIC = 'should be numeric';
const MSG_NOT_STRING = 'shouble be a string';
const MSG_NOT_BOOLEAN = 'shouble be boolean';
const MSG_NOT_EQUAL = 'should be equal';
const MSG_NOT_EMAIL = 'should be valid email';
const MSG_NOT_ONE_OF = 'should be one of';
const MSG_NOT_OBJECT = 'should be an object';

const RULE_NOT_EMPTY = 'notEmpty';
const RULE_ARRAY = 'array';
const RULE_NUMERIC = 'numeric';
const RULE_DATE = 'date'
const RULE_STRING = 'string';
const RULE_BOOLEAN = 'boolean';
const RULE_EQUALS = 'equals';
const RULE_EMAIL = 'email';
const RULE_ONE_OF = 'oneOf';
const RULE_OBJECT = 'object';

const isEnrichableEvent = (eventName) => {
  return (['Added Product', 'Removed Product'].indexOf(eventName) < 0);
};

const notEmpty = (value, notEmpty = true) => {
  if (notEmpty) {
    if (value === undefined || value === null || value === '' || (Array.isArray(value) && !value.length)) {
      return MSG_NOT_EMPTY;
    }
  }
  return true;
};

const isArray = (value, isArray) => {
  if (isArray) {
    if (!Array.isArray(value)) {
      return MSG_NOT_ARRAY;
    }
  }
  return true;
}

const isNumeric = (value, isNumeric) => {
  if (isNumeric) {
    if (typeof value !== 'number') {
      return MSG_NOT_NUMERIC;
    }
  }
  return true;
}

const isString = (value, isString) => {
  if (isString) {
    if (typeof value !== 'string') {
      return MSG_NOT_STRING;
    }
  }
  return true;
}

const isBoolean = (value, isBoolean) => {
  if (isBoolean) {
    if (typeof value !== 'boolean') {
      return MSG_NOT_BOOLEAN;
    }
  }
  return true;
}

const isObject = (value, isObject) => {
  if (typeof value === 'object' && !Array.isArray(value)) {
    return isObject;
  }
  return !isObject
}

const equals = (value, expectedValue) => {
  return (value === expectedValue);
}

const isOneOf = (value, possibleValues = []) => {
  return (possibleValues.indexOf(value) >= 0);
}

const isEmail = (value, isEmail) => {
  const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(value);
}

const ruleHandlers = {
  [RULE_NOT_EMPTY]: notEmpty,
  [RULE_ARRAY]: isArray,
  [RULE_NUMERIC]: isNumeric,
  [RULE_STRING]: isString,
  [RULE_BOOLEAN]: isBoolean,
  [RULE_EQUALS]: equals,
  [RULE_EMAIL]: isEmail,
  [RULE_ONE_OF]: isOneOf,
  [RULE_OBJECT]: isObject,
};

const combineResult = (fieldName, result, value) => {
  return [fieldName, result, value];
};

const validateField = (field, value, rules) => {
  let result = true;

  each(rules, (ruleName, ruleParam) => {
    if (result !== true) return; //TODO refactoring
    result = ruleHandlers[ruleName](value, ruleParam);
  });
  return result;
};

const validateArrayField = (arrayField, arrayFieldValues, subfield, rules) => {
  if (!Array.isArray(arrayFieldValues)) {
    const result = validateField(arrayField, undefined, rules);
    return combineResult(arrayField, result);
  } else {
    const fieldName = [arrayField, subfield].join('[].');
    let i = 1;
    for (const arrayFieldValue of arrayFieldValues) {
      const value = getProp(arrayFieldValue, subfield);
      const result = validateField(subfield, value, rules);
      if (result !== true) {
        return combineResult(fieldName, result);
      }
    }
    return null;
  }
};

const validatePrerequisites = (prerequisites, event, digitalData, settings) => {
  if (prerequisites.setting && !settings[prerequisites.setting]) return false;
  if (prerequisites.dependencies) {
    for (const dependency of prerequisites.dependencies) {
      const [depField, depRules] = dependency;
      let value = getProp(event, depField);
      if (value === undefined && isEnrichableEvent(event.name)) {
        value = getProp(digitalData, depField);
      }
      const result = validateField(depField, value, depRules);
      if (result !== true) {
        return false;
      }
    }
    return true;
  }
};

export default function validateDigitalData(event, digitalData, settings) {
  const eventName = event.name;

  console.log(`%c[EVENT] ${eventName}`, 'font-weight: bold;');
  const validations = validationsConfig[eventName] || [];

  const errors = [];
  for (const validation of validations) {
    const [field, rules, prerequisites] = validation;

    if (prerequisites && !validatePrerequisites(prerequisites, event, digitalData, settings)) {
      continue;
    }

    let result;
    let value;

    if (field.indexOf('[]') > 0) {
      const [ arrayField, subfield ] = field.split('[].');
      value = getProp(event, arrayField);
      if (isEnrichableEvent(eventName) && value === undefined) {
        value = getProp(digitalData, arrayField);
      }
      result = validateArrayField(arrayField, value, subfield, rules, settings);
    } else {
      value = getProp(event, field);
      if (isEnrichableEvent(eventName) && value === undefined) {
        value = getProp(digitalData, field);
      }
      result = combineResult(field, validateField(field, value, rules, settings), value);
    }

    // output result
    if (result) {
      const [fieldName, msg, currentValue] = result;
      if (msg !== true) {
        if (!valueIsLogable(currentValue)) {
          console.log(`%c[ERR] ${fieldName} ${msg}`, 'color: red;');
        } else {
          console.log(`%c[ERR] ${fieldName} ${msg}: ${prepareValueForLog(currentValue)}`, 'color: red;');
        }
      } else {
        if (!valueIsLogable(currentValue)) {
          console.log(`%c[OK] ${fieldName}`, 'color: green;');
        } else {
          console.log(`%c[OK] ${fieldName}: ${prepareValueForLog(currentValue)}`, 'color: green;');
        }
      }
    }
  }
}
