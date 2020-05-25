var assert = require('assert').strict;
var {Model, ModelError} = require('../src/model');

describe('Model Builder', function() {
    describe('Names', function () {
        it('should reject required but invalid property names', function() {
            var model = new Model([{
                name: { required: true }
            }]);
            var data = { nrame: 'name' };
            var error = new ModelError('Required property "name" missing.');
            assert.throws(() => {
                model.validate(data);
            }, error);
        });
    });

    describe('Types', function () {
        it('should reject invalid type for: string', function() {
            var model = new Model([{
                name: { type: 'string' }
            }]);
            var data = { name: 5 };
            var error = new ModelError('Type of property "name" should be string.');
            assert.throws(() => {
                model.validate(data);
            }, error);
        });
        it('should reject invalid type for: number', function() {
            var model = new Model([{
                year: { type: 'number' }
            }]);
            var data = { year: '2018' };
            var error = new ModelError('Type of property "year" should be number.');
            assert.throws(() => {
                model.validate(data);
            }, error);
        });
        it('should reject invalid type for: boolean', function() {
            var model = new Model([{
                crashed: { type: 'boolean' }
            }]);
            var data = { crashed: 1 };
            var error = new ModelError('Type of property "crashed" should be boolean.');
            assert.throws(() => {
                model.validate(data);
            }, error);
        });
        it('should reject invalid type for: array', function() {
            var model = new Model([{
                crashed: { type: 'array', elements: { type: 'string' } }
            }]);
            var data = { crashed: "['5']" };
            var error = new ModelError('Type of property "crashed" should be array.');
            assert.throws(() => {
                model.validate(data);
            }, error);
        });
    });

    describe('Enums', function () {
        it('should reject a value not allowed', function () {
            var model = new Model([{
                weather: { enum: ['rainy', 'clear'] }
            }]);
            var data = { weather: 'windy' };
            var error = new ModelError('Property "weather" should be rainy, clear.');
            assert.throws(() => {
                model.validate(data);
            }, error);
        });
        it('should not allow coercion even if type is not enforced', function () {
            var model = new Model([{
                number: { enum: ['420', '911'] }
            }]);
            var data = { number: 420 };
            var error = new ModelError('Property "number" should be 420, 911.');
            assert.throws(() => {
                model.validate(data);
            }, error);
        });
    });

    describe('Regex', function () {
        it('should enforce regex matching', function () {
            var model = new Model([{
                hash: { match: `[0-9A-F]{4}` }
            }]);
            var data = { hash: '9pF2' };
            var error = new ModelError('Property "hash" should match the following regex [0-9A-F]{4}.');
            assert.throws(() => {
                model.validate(data);
            }, error);
        });
        it('should enforce string type implicitly', function () {
            var model = new Model([{
                hash: { match: `[0-9A-F]{4}` }
            }]);
            var data = { hash: 3241 };
            var error = new ModelError('Property "hash" should match the following regex [0-9A-F]{4}.');
            assert.throws(() => {
                model.validate(data);
            }, error);
        });
    });

    describe('Range', function () {
        it('should reject numeric values under range', function () {
            var model = new Model([{
                age: {
                    range: {
                        min: 0,
                        max: 100
                    }
                }
            }]);
            var data = { age: -1 };
            var error = new ModelError('Property "age" should be a number between 0 and 100.');
            assert.throws(() => {
                model.validate(data);
            }, error);
        });
        it('should reject numeric values over range', function () {
            var model = new Model([{
                age: {
                    range: {
                        min: 0,
                        max: 100
                    }
                }
            }]);
            var data = { age: 125 };
            var error = new ModelError('Property "age" should be a number between 0 and 100.');
            assert.throws(() => {
                model.validate(data);
            }, error);
        });
        it('should reject strings under length', function () {
            var model = new Model([{
                nationality: {
                    range: {
                        min: 5
                    }
                }
            }]);
            var data = { nationality: 'us' };
            var error = new ModelError('Property "nationality" should have a length greater than 5 characters.');
            assert.throws(() => {
                model.validate(data);
            }, error);
        });
        it('should reject strings over length', function () {
            var model = new Model([{
                nationality: {
                    range: {
                        max: 10
                    }
                }
            }]);
            var data = { nationality: 'Citizen of the World' };
            var error = new ModelError('Property "nationality" should have a length under 10 characters.');
            assert.throws(() => {
                model.validate(data);
            }, error);
        });
        it('should allow values on range', function () {
            var model = new Model([{
                nationality: {
                    range: {
                        min: 5,
                        max: 10
                    }
                }
            }]);
            var data = { nationality: 'Albania' };
            var error = new ModelError('Property "nationality" should have a length between 5 and 10 characters.');
            assert.deepStrictEqual(model.validate(data), data);
        });
        it('should allow values on range lower bounded', function () {
            var model = new Model([{
                nationality: {
                    range: {
                        min: 5
                    }
                }
            }]);
            var data = { nationality: 'Kazakhstan' };
            assert.deepStrictEqual(model.validate(data), data);
        });
        it('should allow values on range upper bounded', function () {
            var model = new Model([{
                nationality: {
                    range: {
                        max: 30
                    }
                }
            }]);
            var data = { nationality: 'São Tomé and Príncipe' };
            assert.deepStrictEqual(model.validate(data), data);
        });
    });

    describe('Messages', function () {
        it('should show custom string message for the whole property', function () {
            var model = new Model([{
                crashed: {
                    type: 'boolean',
                    message: 'mayday'
                }
            }]);
            var data = {crashed: 1};
            var error = new ModelError('mayday');
            assert.throws(() => {
                model.validate(data);
            }, error);
        });
        it('should show custom string message for each rule', function () {
            var model = new Model([{
                crashed: {
                    type: 'boolean',
                    message: {
                        type: 'mayday'
                    }
                }
            }]);
            var data = {crashed: 1};
            var error = new ModelError('mayday');
            assert.throws(() => {
                model.validate(data);
            }, error);
        });
    });

    describe('Functions', function() {
        it('should display valid nested path', function () {
            var model = new Model([{
                location: [{
                    lon: {
                        type: 'number',
                        message: {
                            type: (path, type) => `"${path}" should be ${type}`
                        }
                    }
                }]
            }]);
            var data = { location: {lon: '54.342'} };
            var error = new ModelError('"location.lon" should be number');
            assert.throws(() => {
                model.validate(data);
            }, error);
        });
    });

    describe('Objects', function() {
        it('should reject primitive in place of object', function () {
            var model = new Model([{
                location: [{
                    lon: {
                        type: 'number',
                    }
                }]
            }]);
            var data = { location: 443 };
            var error = new ModelError('Type of property "location" should be object.');
            assert.throws(() => {
                model.validate(data);
            }, error);
        });
    });

    describe('Primitives', function() {
        it('should give invalid type for primitive', function () {
            var model = new Model({
                type: 'number'
            });
            var data = 'hi';
            var error = new ModelError('Type of property "" should be number.');
            assert.throws(() => {
                model.validate(data);
            }, error);
        });
        it('should give invalid type for array of primitives', function () {
            var model = new Model({
                type: 'array',
                elements: {
                    type: 'number'
                }
            });
            var data = [3, '1', 4];
            var error = new ModelError('Type of property "1" should be number.');
            assert.throws(() => {
                model.validate(data);
            }, error);
        });
    });

    describe('Array', function() {
        it('should reject invalid type inside array', function () {
            var model = new Model({
                type: 'array',
                range: {
                    min: 1
                },
                elements: {type: 'number'}
            });
            var data = [1, 2, 'c'];
            var error = new ModelError('Type of property "2" should be number.');
            assert.throws(() => {
                model.validate(data);
            }, error);
        });
        it('should reject invalid object property inside array', function () {
            var model = new Model([{
                rooms: {
                    type: 'array',
                    range: {
                        min: 1
                    },
                    elements: [{
                        size: {
                            type: 'number'
                        },
                        parke: {
                            type: 'boolean'
                        }
                    }]
                }
            }]);
            var data = {
                rooms: [{size: 4, parke: true}, {size: 2}, {size: '2'}]
            };
            var error = new ModelError('Type of property "rooms.2.size" should be number.');
            assert.throws(() => {
                model.validate(data);
            }, error);
        });
        it('should reject invalid type inside nested arrays', function () {
            var model = new Model({
                type: 'array',
                range: {
                    min: 1,
                    max: 1
                },
                elements: {
                    type: 'array',
                    elements: {
                        type: 'array',
                        elements: { type: 'number' }
                    }
                }
            });
            var data = [[[2,3],['3',1]]];
            var error = new ModelError('Type of property "0.1.0" should be number.');
            assert.throws(() => {
                model.validate(data);
            }, error);
        });
        it('should allow valid case', function () {
            var model = new Model({
                type: 'array',
                elements: [{
                    size: {
                        type: 'number'
                    },
                    parke: {
                        type: 'boolean'
                    }
                }]
            });
            var data = [{size: 4, parke: true}, {size: 2}, {size: 2}];
            assert.deepStrictEqual(model.validate(data), data);
        });
    });

    describe('JavaScript Types', function() {
        it('should handle JS types', function () {
            var model = new Model([{
                name: { type: String, required: true },
                age: { type: Number, required: true },
                married: { type: Boolean, required: true },
                children: {
                    type: Array,
                    elements: { type: model }
                }
            }]);
            var data = {
                name: 'Alice',
                age: 42,
                married: true,
                children: [
                    {
                        name: 'Bob',
                        age: 13,
                        married: false
                    },
                    {
                        name: 'Charlie',
                        age: 21,
                        married: false
                    },
                ]
            };
            assert.deepStrictEqual(model.validate(data), data);
        });
    });

    describe('Model nesting', function () {
        it('should give errors from nested model', function () {
            var user = new Model([{
                name: {
                    type: 'string',
                    required: true
                },
                email: {
                    type: 'string',
                    required: true
                }
            }]);
            var model = new Model([{
                title: {
                    type: 'string',
                    required: true
                },
                content: {
                    type: 'string',
                    required: true
                },
                author: user
            }]);
            var data = {
                title: 'Hola',
                content: 'Como estas',
                author: {
                    name: 'Johnny Bravo',
                    email: 42
                }
            };
            var error = new ModelError('Type of property "author.email" should be string.');
            assert.throws(() => {
                model.validate(data);
            }, error);
        });
        it('should allow deep nesting', function () {
            var model = new Model([{
                name: { type: String, required: true },
                age: { type: Number, required: true },
                married: { type: Boolean, required: true },
                children: {
                    type: Array,
                    elements: { type: model }
                }
            }]);
            var data = {
                name: 'Alice',
                age: 42,
                married: true,
                children: [
                    {
                        name: 'Bob',
                        age: 13,
                        married: false
                    },
                    {
                        name: 'Charlie',
                        age: 21,
                        married: true,
                        children: [
                            {
                                name: 'David',
                                age: 1,
                                married: false
                            }
                        ]
                    },
                ]
            };
            assert.deepStrictEqual(model.validate(data), data);
        });
    });

    describe('Complex', function () {
        var model = new Model([{
            name: {
                required: true,
                type: 'string',
                match: `^[a-zA-Z\x20]*$`,
                message: {
                    required: 'name required',
                    match: 'should be only letters and spaces'
                }
            },
            location: [{
                lat: {
                    required: true,
                    type: 'number',
                    range: {
                        min: -90,
                        max: 90
                    },
                    message: {
                        range: 'invalid latitude'
                    }
                },
                lon: {
                    required: true,
                    type: 'number',
                    message: {
                        required: (path) => `The parameter ${path} is mandatory`,
                        type: 'Type of longitude is number'
                    }
                }
            }],
            extra: {
                required: false,
                type: 'string',
                message: (path, type) => `The parameter ${path} should be of type ${type}`
            },
            rooms: {
                type: 'array',
                elements: [{
                    type: {
                        required: true,
                        type: 'string',
                        enum: ['double', 'king', 'single'],
                        message: "Invalid room"
                    },
                    price: {
                        required: false,
                        type: 'number'
                    },
                    currency: {
                        required: true,
                        type: 'string',
                        range: {
                            min: 1,
                            max: 5
                        }
                    }
                }]
            }
        }]);
        var base = {
            name: 'Bella Vista',
            location: {
                lat: 40.334,
                lon: 12.34235551
            },
            extra: '5 Stars',
            rooms: [
                {
                    type: 'double',
                    price: 58.15,
                    currency: '$'
                },
                {
                    type: 'single',
                    price: 13.85,
                    currency: '$'
                }
            ]
        };

        it('should reject non existing name', function () {
            var data = clone(base);
            delete data.name;
            var error = new ModelError('name required');
            assert.throws(() => {
                model.validate(data);
            }, error);
        });

        it('should reject invalid name', function () {
            var data = clone(base);
            data.name = 'X7!@';
            var error = new ModelError('should be only letters and spaces');
            assert.throws(() => {
                model.validate(data);
            }, error);
        });

        it('should reject invalid name type', function () {
            var data = {};
            Object.assign(data, base);
            data.name = Symbol();
            var error = new ModelError(
                'Type of property "name" should be string.\n' +
                'should be only letters and spaces'
            );
            assert.throws(() => {
                model.validate(data);
            }, error);
        });

        it('should reject invalid name type with default error and regex with custom error', function () {
            var data = clone(base);
            data.name = Symbol();
            var error = new ModelError(
                'Type of property "name" should be string.\n' +
                'should be only letters and spaces'
            );
            assert.throws(() => {
                model.validate(data);
            }, error);
        });

        it('should reject invalid lat type', function () {
            var data = clone(base);
            data.location.lat = Symbol();
            var error = new ModelError(
                'Type of property "location.lat" should be number.\n' +
                'invalid latitude'
            );
            assert.throws(() => {
                model.validate(data);
            }, error);
        });

        it('should allow valid object with non required properties', function () {
            assert.deepStrictEqual(model.validate(base), base);
        });
    });
});

function clone(obj) {
    if (obj === null || typeof (obj) !== 'object' || 'isActiveClone' in obj)
        return obj;

    var temp;
    if (obj instanceof Date)
        temp = new obj.constructor(); //or new Date(obj);
    else
        temp = obj.constructor();

    for (var key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            obj.isActiveClone = null;
            temp[key] = clone(obj[key]);
            delete obj.isActiveClone;
        }
    }
    return temp;
}