## simple-model-validator
Dead **simple**, strict JSON validator based on models.

**Example**

Define model:
```javascript
var model = new Model([{  
    name: { type: String, required: true },  
    age: { type: Number, required: true },  
    married: { type: Boolean, required: true },  
    children: {  
        type: Array,  
        elements: { type: model }  
    }  
}]);
```
   Receive data:
   
```javascript
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
```

Then just validate like this:
```javascript
model.validate(data)
```

It will return the final object or throw an error.