semele.js
=========

'semele.js' is Minimal AMD & CMD module manager. Unlike 'Requirejs', 'semele.js' is focus on 'module-conatiner' and it will not to resolve how to load these modules. 
it just give a module-conatiner, in `AMD` way. It's can be used in prepacked modules.

## Install
```
$ npm install --save-dev semele
```

```
$ bower install --save semele
```

```js
define('moduleA', function() {
  return {
    value: 3;
  }
})

var moduleA = require('moduleA');
console.log(moduleA.value);//3
```

## License

semele.js is [MIT Licensed](https://github.com/alex-zhang/semele/blob/master/LICENSE.md).