## simple-model-validator
Dead **simple**, strict JSON validator based on models.

**Example**

Define model:
```javascript
var { Model } = require('simple-model-validator')

var model = new Model([{
    name: {
        type: String,
        required: true,
        match: /[A-Za-z\x20]+/
    },
    age: {
        type: Number,
        required: true,
        range: {
            min: 0,
            max: 99
        }
    },
    married: {
        type: Boolean,
        required: true,
    },
    sex: {
        type: 'string',
        enum: ['male', 'female']
    },
    children: {
        type: Array,
        elements: { type: 'self' }
    }
}]);
```
   Receive data:
   
```javascript
var data = {
    name: 'Alice',
    sex: 'female',
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
            sex: 'male',
            age: 21,
            married: false,
            children: []
        },
    ]
};
```

Then just validate like this:
```javascript
model.validate(data)
```

It will return the final object or throw an error instead.