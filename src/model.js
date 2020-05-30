'use strict';

class ModelError extends Error {
    constructor(errorArray, ...args) {
        super(...args);
        this.name = 'Validation Error';
        this.errors = errorArray;
        this.message = this.errors.join('\n');
    }
}

var defaultErrors = {
    required: (path) => `Required property "${path}" missing.`,
    type: (path, type) => {
        if(typeOf(type) == 'array') {
            return `Type of property "${path}" should be ${type.join(', ')}.`;
        } else {
            return `Type of property "${path}" should be ${type}.`;
        }
    },
    enum: (path, enumVals) => `Property "${path}" should be ${enumVals.join(', ')}.`,
    range: (path, range, value) => {
        function getPredicate(range) {
            var min = range.min !== undefined,
                max = range.max !== undefined;
            if(min && max) {
                return `between ${range.min} and ${range.max}`;
            } else if(min) {
                return `greater than ${range.min}`;
            } else if(max){
                return `under ${range.max}`;
            }
        }
        if(typeof value == 'string') {
            return `Property "${path}" should have a length ${getPredicate(range)} characters.`;
        } else if(typeof value == 'number') {
            return `Property "${path}" should be a number ${getPredicate(range)}.`;
        } else if (Array.isArray(value)) {
            return `Property "${path}" should be ${getPredicate(range)} elements.`;
        }
    },
    match: (path, regex) => `Property "${path}" should match the following regex ${regex}.`,
    custom: (path) => `Validation failed for property "${path}" on custom validator`
};

var api = {
    Model: modelBuilder,
    ModelError
};

/* UMD */
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.returnExports = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    return api;
}));

//****************************************************************************

/*
* @param schema: object | array     Rules or object of props with rules, respectively
*/
function modelBuilder(schema) {
    this.validate = function validate(json) {
        var {result, errors} = validation(schema, json);
        throwErrors(errors);
        return result;
    };
    this.schema = schema;
}

/*
* @param rules: object              Rules to follow
* @param value: primitive           Who needs to follow rules
*/
function checkValue(rules, value, nest) {
    var errors = [];
    for(let [rule, ruleValue] of Object.entries(rules)) {
        // Allow native JS type constructors
        if(rule == 'type') {
            ruleValue = getRuleType(ruleValue);
            if(ruleValue == 'self') continue;
        }
        // Prevent violation of required rule from triggering other rules;
        if(value === undefined && (rule != 'required' || !ruleValue)) {
            continue;
        }
        if(!checkRule(rule, ruleValue, value)) {
            errors.push(getErrorMessage(rule, rules.message, nest, ruleValue, value));
        }
    }
    return errors;
}

/*
* @param schema: object | array                 Rules or object of props with rules, respectively
* @param data: primitive | object | array       Who needs to follow rules
* @param nest: array                            Levels of nesting in recursive tree
* @return result: object | array                The final object or array
* @return errors: array                         All errors that arise in order
*/
function validation(_schema, _data) {
    var errors = [];
    function doValidation(schema, data, nest = [], result = {}) {
        if(typeOf(schema) == 'array') {
            errors.push(...checkValue({type: ['object', 'array']}, data, nest));
            var object = schema[0];
            for(let [key, rules] of Object.entries(object)) {
                var res = doValidation(rules, data[key], [...nest, key]);
                if(res !== undefined) {
                    result[key] = res;
                }
            }
        } else if(typeOf(schema) == 'object') {
            var valueErrors = checkValue(schema, data, nest);
            errors.push(...valueErrors);
            if(shouldProcessAsArray(schema, data) && valueErrors.length == 0) {
                var arrayRules = buildArrayRules(data, schema);
                if(arrayRules !== undefined) {
                    return doValidation(buildArrayRules(data, schema), data, nest, []);
                } else {
                    return data;
                }
            } else if(schema instanceof api.Model) {
                let res = doValidation(schema.schema, data, nest);
                return res;
            } else if(schema.type === 'self' && data !== undefined) {
                let res = doValidation(_schema, data, nest);
                return res;
            } else {
                return data;
            }
        } else {
            console.log('invalid Schema');
        }
        return result;
    }
    return {result: doValidation(_schema, _data), errors};
}

function checkRule(rule, ruleValue, propValue) {
    switch (rule) {
        case 'required':
            return !ruleValue || propValue !== undefined;
        case 'type':
            if(typeOf(ruleValue) == 'array') {
                return ruleValue.includes(typeOf(propValue));
            }
            return typeOf(propValue) == ruleValue;
        case 'enum':
            return ruleValue.includes(propValue);
        case 'match':
            var regex;
            if(propValue instanceof RegExp) {
                regex = propValue.test(propValue);
            } else {
                if(typeof propValue != 'string') return false;
                regex = new RegExp(ruleValue);
            }
            return regex.test(propValue);
        case 'range':
            var size;
            switch (typeOf(propValue)) {
                case 'array':
                    size = propValue.length;
                    break;
                case 'number':
                    size = propValue;
                    break;
                case 'string':
                    size = [...propValue].length;
                    break;
            }
            var min = true,
                max = true;
            if(ruleValue.max !== undefined) {
                max = size <= ruleValue.max;
            }
            if(ruleValue.min !== undefined) {
                min = size >= ruleValue.min;
            }
            return max && min;
        case 'custom':
            return ruleValue(propValue);
        default:
            return true;
    }
}

function getErrorMessage(rule, message, nest, ruleValue, propValue) {
    var path = nest.join('.');
    function getMessage(message) {
        switch (typeof message) {
            case "string":
                return message;
            case "function":
                return message(path, ruleValue, propValue);
            case "object":
                if(message[rule] !== undefined) {
                    return getMessage(message[rule]);
                }
            /* falls through */
            default:
                return defaultErrors[rule](path, ruleValue, propValue);
        }
    }
    return getMessage(message);
}

function buildArrayRules(data, schema) {
    if(schema.elements === undefined) {
        return undefined;
    }
    var arrayRules = [{}];
    for (var i in data) {
        arrayRules[0][i] = schema.elements;
    }
    return arrayRules;
}

function typeOfConstructor(constructor) {
    var constructedType;
    try {
        constructedType = constructor();
    } catch (e) {
    }
    return typeOf(constructedType);
}

function typeOf(variable) {
    if (Array.isArray(variable)) {
        return 'array';
    } else {
        return typeof variable;
    }
}

function getRuleType(typeOrConstructor) {
    if(typeof typeOrConstructor == 'function') {
        var constructor = typeOrConstructor;
        return typeOfConstructor(constructor);
    }
    var type = typeOrConstructor;
    return type;
}

function shouldProcessAsArray(schema, data) {
    return getRuleType(schema.type) == 'array' ||
    (
        typeOf(schema.type) == 'array' &&
        schema.type.includes('array') &&
        typeOf(data) == 'array'
    );
}

function throwErrors(errors) {
    if(errors.length > 0) {
        throw new ModelError(errors);
    }
}
