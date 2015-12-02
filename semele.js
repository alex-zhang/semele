var define, require;

(function(global) {
  var registry = {};
  var uuid = 0;

  //const
  var defaultDeps = ['require', 'exports', 'module'];

  //utils fn
  //---------------------------------------------------------------------------
  function isArray(value) {
    //see support http://kangax.github.io/compat-table/es5/#Array.isArray
    return Array.isArray(value);
  }

  function isString(value) {
    return typeof value === 'string';
  }

  function isFunction(value) {
    return typeof value === 'function';
  }

  function defineModuleArgumentsError(name, deps, factory) {
    throw new Error("expected `define(name?, deps?, factory)` instead got: " +
          name + " " + deps + " " + factory + " to define");
  }

  function missingModuleError(name, importFrom) {
    throw new Error("Could not find module " + name + " imported from: " + importFrom);
  }
  //----------------------------------------------------------------------------

  //Cls Def.
  //----------------------------------------------------------------------------

  //Moudle Cls.
  function Module(name, deps, factory) {
    this.loaded   = false;
    this.name     = name;
    this.exports  = {};
    this._deps    = deps;
    this._factory = factory;
  };

  Module.prototype.require = function(name) {
    return require(resolveModuleAbsPath(name, this.name));
  };

  Module.prototype.load = function() {
    if (this.loaded) { return this.exports; };
    //do load.
    //load deps.
    var selfName = this.name;
    var deps = this._deps;
    var depsLen = deps.length;
    var depRefs = new Array(depsLen);
    var dep;
    var factory = this._factory;

    for (var i = 0, l = depsLen; i < l; i++) {
      dep = deps[i];
      if (dep === 'exports') {
        depRefs[i] = this.exports;
      } else if (dep === 'module') {
        depRefs[i] = this;
      } else if (dep === 'require') {
        //here require is base the asb mod name, use module.require to base to cur mod.
        depRefs[i] = requireModule;
      } else {
        depRefs[i] = this.require(dep);
      }
    }

    //we get the factory exports.
    if(isFunction(factory)) {
      var factoryResult = factory.apply(this, depRefs);
      if(factoryResult !== undefined) {
        this.exports = factoryResult;
      }
    } else {
      this.exports = factory;
    }

    if(this.exports === undefined) { this.exports == {} };

    //clear the ref
    delete this._deps;
    delete this._factory;

    //ensure the default.
    // if ((typeof exportsResult === 'object' || typeof exportsResult === 'function') &&
    //       exportsResult['default'] === undefined) {
    //   exportsResult['default'] = exportsResult;
    // }
    this.loaded = true;
    return this.exports;
  };


  //----------------------------------------------------------------------------

  //AMD API
  //----------------------------------------------------------------------------
  define = defineModule;
  define.amd = {};
  define.registry = function() {
    return registry;
  }

  require = requireModule;

  //defineModule(name?, dependencies?, factory)
  //string, [], object.
  //string, object
  //[], object
  //object
  function defineModule(name, deps, factory) {
    var argsLen = arguments.length;

    if(argsLen == 0) {
      defineModuleArgumentsError.apply(null, arguments);
    }

    if(argsLen === 1) {
      factory = name;
      name = deps = undefined;
    } else if(argsLen === 2) {
      if(isArray(name)) {
        factory = deps;
        deps = name;
        name = undefined;
      } else if(isString(name)) {
        factory = deps;
        deps = undefined;
      } else {
        defineModuleArgumentsError.apply(null, arguments);
      }
    }

    if(isFunction(factory)) {
      if(!!deps && deps.length === 0 && factory.length > 0) {
        deps = defaultDeps;
      }
    } else if(factory === undefined) {
      defineModuleArgumentsError.apply(null, arguments);
    }

    if(!isString(name)) {
      name = "anonymous-" + (uuid++);
    }

    if(!isArray(deps)) {
      deps = [];
    }

    registry[name] = new Module(name, deps, factory);
  }

  function loadModule(name, importFrom) {
    var mod = registry[name];
    if (!mod) {
      missingModuleError.apply(null, arguments);
    }
    mod.load();
    return mod;
  }

  function requireModule(name) {
    return loadModule(name).exports;
  }

  function resolveModuleAbsPath(relativePath, absPath) {
    //if we not start with '.', it means a abs Path.
    if (relativePath.charAt(0) !== '.') { return relativePath; }

    var relativePathParts = relativePath.split('/');
    var n = relativePathParts.length;
    var relativePathPart;
    var absPathParts = absPath.split('/');

    var resultAbsParts = absPathParts.slice(0, -1);

    for (var i = 0; i < n; i++) {
      relativePathPart = relativePathParts[i];

      if (relativePathPart === '..') {
        if (resultAbsParts.length === 0) {
          throw new Error('Cannot access parent module of root');
        }

        resultAbsParts.pop();
      } else if (relativePathPart === '.') {
        continue;
      } else {
        resultAbsParts.push(relativePathPart);
      }
    }

    return resultAbsParts.join('/');
  }

//end iffe
})(this);