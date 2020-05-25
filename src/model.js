class ModelError extends Error {
    constructor(...args) {
        super(...args);
        this.name = 'Model Error';
    }
}
var defaultErrors = {
    required: (path) => `Required property "${path}" missing.`,
    type: (path, type) => `Type of property "${path}" should be ${type}.`,
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
    match: (path, regex) => `Property "${path}" should match the following regex ${regex}.`
};

var api = {
    Model: modelBuilder,
    ModelError
};

module.exports = api;

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
function validation(schema, data) {
    var errors = [];
    function doValidation(schema, data, nest = [], result = {}) {
        if(Array.isArray(schema)) {
            errors.push(...checkValue({type: 'object'}, data, nest));
            var object = schema[0];
            for(let [key, rules] of Object.entries(object)) {
                var res = doValidation(rules, data[key], [...nest, key]);
                if(res !== undefined) {
                    result[key] = res;
                }
            }
        } else if(typeof schema == 'object') {
            errors.push(...checkValue(schema, data, nest));
            if(schema.type === 'array') {
                let res = doValidation(buildArrayRules(data, schema), data, nest, []);
                return res;
            } else if(schema instanceof api.Model) {
                let res = doValidation(schema.schema, data, nest);
                return res;
            } else {
                return data;
            }
        } else {
            console.log('invalid Schema');
        }
        return result;
    }
    return {result: doValidation(schema, data), errors};
}

function checkRule(rule, ruleValue, propValue) {
    // Allow native JS type constructors
    var constructedType;
    try {
        constructedType = ruleValue();
    } catch(e) {}
    if(constructedType !== undefined) {
        ruleValue = typeof constructedType;
    }

    // Prevent not present non required value from triggering other rules
    if(propValue === undefined) {
        if(rule == 'required' && ruleValue) {
            return false;
        }
        return true;
    }

    switch (rule) {
        case 'type':
            if(ruleValue == 'array') {
                return Array.isArray(propValue);
            }
            return typeof propValue == ruleValue;
        case 'enum':
            return ruleValue.includes(propValue);
        case 'match':
            if(typeof propValue != 'string') return false;
            var regex = new RegExp(ruleValue);
            return regex.test(propValue);
        case 'range':
            var size;
            if(Array.isArray(propValue)) {
                size = propValue.length;
            }
            if(typeof propValue == 'number') {
                size = propValue;
            }
            if(typeof propValue == 'string')  {
                size = [...propValue].length;
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
    var arrayRules = [{}];
    for (var i in data) {
        arrayRules[0][i] = schema.elements;
    }
    return arrayRules;
}

function throwErrors(errors) {
    if(errors.length > 0) {
        throw new ModelError(errors.join('\n'));
    }
}
