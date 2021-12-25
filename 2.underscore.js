/*jshint esversion: 6 */

/**
 * underscore库 手敲
 */

/** 自执行函数*/
(function () {
  /**
   * 建立根对象
   * 1.浏览器上用self（为什么不用window,考虑到webworker）
   * 2.服务器上用global
   * 3.其他环境
   */
  var root =
    (typeof self === "object" && self === self.self && self) ||
    (typeof global === "object" && global.global === global && global) ||
    this ||
    {};

  /**保存之前的_,解决命名冲突 */
  var previousUnderscore = root._;

  /**保存一些常用的原型，这样可以减少代码数量 */
  var ArrayProto = Array.prototype,
    ObjProto = Objecct.prototype;
  var SymbolProto = typeof Symbol !== "undefined" ? Symbol.prototype : null;

  /**创建一些能够快速访问原型的方法 */
  var push = ArrayProto.push,
    slice = ArrayProto.slice,
    toString = ObjProto.toString,
    hasOwnProperty = ObjProto.hasOwnProperty;

  /**声明一些es5原生的函数，或者说去做兼容，在不支持es5的环境达到相同的效果 */
  var nativeIsArray = Array.isArray,
    nativeKeys = Object.keys,
    nativeCreate = Object.create;

  /**定义一个裸函数 todo */
  var Ctor = function () {};

  /**Create a safe reference to the Underscore object for use below. todo */
  _ = function (obj) {
    if (obj instanceof _) return obj;
    if (!(obj instanceof _)) return new _(obj);
    this._wrapped = obj;
  };

  /**
   * nodejs中用module.exports暴漏_
   * 浏览器中挂载到root下
   */
  if (typeof exports !== "undefined" && !exports.nodeType) {
    if (typeof module != "undefined" && !module.nodeType && module.exports) {
      exports = module.exports = _;
    }
    exports._ = _;
  } else {
    root._ = _;
  }

  /**定义underscore版本 */
  _.VERSION = "1.9.1";

  /**
   * 定义根据参数差异返回函数的函数 todo
   * @param {Function} func
   * @param {Object} context
   * @param {Number} argCount
   */
  var optimizeCb = function (func, context, argCount) {
    if (context === void 0) return func;

    switch (argCount == null ? 3 : argCount) {
      case 1:
        return function (value) {
          return func.call(context, value);
        };
      case 3:
        return function (value, index, collection) {
          return func.call(context, value, index, collection);
        };
      case 4:
        return function (accumulator, value, index, collection) {
          return func.call(context, accumulator, value, index, collection);
        };
    }
    return function () {
      return func.apply(context, arguments);
    };
  };

  /** 定义一个变量来保存我们内部的iteratee函数，以防被外部修改 */
  var builtinIteratee;

  /**
   * 生成callback的函数 todo
   * @param {*} value
   * @param {*} context
   * @param {*} argCount
   */
  var cb = function (value, context, argCount) {
    // 使用我们内部的iteratee函数，以防被外部修改
    if (_.iteratee !== builtinIteratee) return _.iteratee(value, context);
    if (value == null) return _.identity;
    if (_.isFunction(value)) return optimizeCb(value, context, argCount);
    if (_.isObject(value) && !_.isArray(value)) return _.matcher(value);
    return _.property(value);
  };

  /**
   * 定义迭代器函数
   */
  _.iteratee = builtinIteratee = function (value, context) {
    return cb(value, context, Infinity);
  };

  /**
   * 获取函数的剩余参数类似于es6的 function(a,b...args){}
   * @param {*} func
   * @param {*} startIndex
   */
  var restArguments = function (func, startIndex) {
    startIndex = startIndex == null ? func.length - 1 : +startIndex;
    return function () {
      var length = Math.max(arguments.length - startIndex, 0),
        rest = Array(length),
        index = 0;
      for (; index < length; index++) {
        rest[index] = arguments[index + startIndex];
      }
      switch (startIndex) {
        case 0:
          return func.call(this, rest);
        case 1:
          return func.call(this, arguments[0], rest);
        case 2:
          return func.call(this, arguments[0], arguments[1], rest);
      }
      var args = Array(startIndex + 1);
      for (index = 0; index < startIndex; index++) {
        args[index] = arguments[index];
      }
      args[startIndex] = rest;
      return func.apply(this, args);
    };
  };

  /**
   * 根据另一个对象的原型创建对象
   * @param {*} prototype
   */
  var baseCreate = function (prototype) {
    if (!_.isObject(prototype)) return {};
    // Object.create(prototype)
    if (nativeCreate) return nativeCreate(prototype);
    Ctor.prototype = prototype;
    var result = new Ctor();
    Ctor.prototype = null;
    return result;
  };

  /**
   * 获取对象的某个属性值
   * @param {*} key
   */
  var shallowProperty = function (key) {
    return function (obj) {
      return obj == null ? void 0 : obj[key];
    };
  };

  /**
   * 对象本身有没有该属性 === obj.hasOwnProperty(path)
   * @param {*Object} obj
   * @param {*String} path
   */
  var has = function (obj, path) {
    return obj != null && hasOwnProperty.call(obj, path);
  };

  /**
   * 深层次获取对象的属性 deepGet({child:{name:'xxx'}},['child','name']) ='xxx'
   * @param {*Object} obj
   * @param {*Array} path
   */
  var deepGet = function (obj, path) {
    var length = path.length;
    for (var i = 0; i < length; i++) {
      if (obj == null) return void 0;
      obj = obj[path[i]];
    }
    return length ? obj : void 0;
  };

  /**定义数组的最大index */
  var MAX_ARRAY_INDEX = Math.pow(2, 53) - 1;

  /**定义获取length属性的函数 */
  var getLength = shallowProperty("length");
  /**
   * 定义这个collection是不是有length属性，并且length>=0;像一个数组一样
   * @param {*Any} collection
   */
  var isArrayLike = function (collection) {
    var length = getLength(collection);
    return (
      typeof length == "number" && length >= 0 && length <= MAX_ARRAY_INDEX
    );
  };

  /**********************************************
   ***************定义集合（数组）方法*************
   *********************************************
   */

  /**
   * 遍历
   * @param {*} obj 遍历的对象
   * @param {*} iteratee  遍历函数
   * @param {*} context   this指向
   */
  _.each = _.forEach = function (obj, iteratee, context) {
    iteratee = optimizeCb(iteratee, context);
    var i, length;
    if (isArrayLike(obj)) {
      for (i = 0, length = obj.length; i < length; i++) {
        iteratee(obj[i], i, obj);
      }
    } else {
      var keys = _.keys(obj);
      for (i = 0, length = keys.length; i < length; i++) {
        iteratee(obj[keys[i]], keys[i], obj);
      }
    }
    return obj;
  };

  /**
   * _map相当于es6的map函数
   */
  _.map = _.collect = function (obj, iteratee, context) {
    iteratee = cb(iteratee, context);
    // 对象的话取keys
    var keys = !isArrayLike(obj) && _.keys(obj),
      length = (keys || obj).length,
      results = Array(length);
    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;
      results[index] = iteratee(obj[currentKey], currentKey, obj);
    }
    return results;
  };

  /**
   * 创建一个reduce函数
   * @param {*} dir
   */
  var createReduce = function (dir) {
    var reducer = function (obj, iteratee, memo, initial) {
      var keys = !isArrayLike(obj) && _.keys(obj),
        length = (keys || obj).length,
        index = dir > 0 ? 0 : length - 1;
      if (!initial) {
        memo = obj[keys ? keys[index] : index];
        index += dir;
      }
      for (; index >= 0 && index < length; index += dir) {
        var currentKey = keys ? keys[index] : index;
        memo = iteratee(memo, obj[currentKey], currentKey, obj);
      }
      return memo;
    };

    return function (obj, iteratee, memo, context) {
      var initial = arguments.length >= 3;
      return reducer(obj, optimizeCb(iteratee, context, 4), memo, initial);
    };
  };

  /**从左往右 */
  _.reduce = _.foldl = _.inject = createReduce(1);

  /**从右往左 */
  _.reduceRight = _.foldr = createReduce(-1);

  /**
   * 从数组或者对象中查找
   */
  _.find = _.detect = function (obj, predicate, context) {
    var keyFinder = isArrayLike(obj) ? _finIndex : _.findKey;
    var key = keyFinder(obj, predicate, context);
    if (key != void 0 && key !== -1) return obj[key];
  };

  /**
   * 从数组中过滤满足条件的 es6的.filter
   */
  _.filter = _.select = function (obj, predicate, context) {
    var results = [];
    predicate = cb(predicate, context);
    _.each(obj, function (value, index, list) {
      if (predicate(value, index, list)) results.push(value);
    });
    return results;
  };

  /**
   * 返回所有不满足条件的选项
   * @param {*} obj
   * @param {*} predicate
   * @param {*} context
   */
  _.reject = function (obj, predicate, context) {
    return _.filter(obj, _.negate(cb(predicate)), context);
  };

  /**判断是否所有的选项都满足条件 */
  _.every = _.all = function (obj, predicate, context) {
    predicate = cb(predicate, context);
    var keys = !isArrayLike(obj) && _.keys(obj),
      length = (keys || obj).length;
    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;
      if (!predicate(obj[currentKey], currentKey, obj)) return false;
    }
    return true;
  };

  /**
   * 判断所有选项中是否有任意一项满足条件es6中的.some
   */
  _.some = _.any = function (obj, predicate, context) {
    predicate = cb(predicate, context);
    var keys = !isArrayLike(obj) && _.keys(obj),
      length = (keys || obj).length;
    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;
      if (predicate(obj[currentKey], currentKey, obj)) return true;
    }
    return false;
  };

  /**
   * 判断是否包含某个选项
   */
  _.contains = _.includes = _.include = function (obj, item, fromIndex, guard) {
    if (!isArrayLike(obj)) obj = _.values(obj);
    if (typeof fromIndex != "number" || guard) fromIndex = 0;
    return _.indexOf(obj, item, fromIndex) >= 0;
  };

  /**集合中的每一项调用函数
   * _.invoke(list, methodName, *arguments)
   * 例如_.invoke([[1,4,5,2],[5,3,4,2]],'sort') = [[1,2,4,5],[2,3,4,5]]
   */
  _.invoke = restArguments(function (obj, path, args) {
    var contextPath, func;
    if (_.isFunction(path)) {
      func = path;
    } else if (_.isArray(path)) {
      contextPath = path.slice(0, -1);
      path = path[path.length - 1];
    }
    return _.map(obj, function (context) {
      var method = func;
      if (!method) {
        if (contextPath && contextPath.length) {
          context = deepGet(context, contextPath);
        }
        if (context == null) return void 0;
        method = context[path];
      }
      return method == null ? method : method.apply(context, args);
    });
  });

  /**
   * 萃取数组中某个属性的值 _.pluck(list, propertyName)
   * list = [{name:'xx'},{name:'yy'}]
   * _.pluck(list,'name') = ['xx','yy']
   * @param {*} obj
   * @param {*} key
   */
  _.pluck = function (obj, key) {
    return _.map(obj, _.property(key));
  };

  /**
   * 萃取出数组中所有符合attrs key-value的选项
   * @param {*} obj
   * @param {*} attrs
   */
  _.where = function (obj, attrs) {
    return _.filter(obj, _.matcher(attrs));
  };

  /**
   * 萃取出数组中第一个符合attrs key-value的选项
   * @param {*} obj
   * @param {*} attrs
   */
  _.findWhere = function (obj, attrs) {
    return _.find(obj, _.matcher(attrs));
  };

  /**
   * 返回list中的最大值。如果传递iteratee参数，iteratee将作为list中每个值的排序依据
   * @param {*} obj
   * @param {*} iteratee
   * @param {*} context
   */
  _.max = function (obj, iteratee, context) {
    var result = -Infinity,
      lastComputed = -Infinity,
      value,
      computed;
    if (
      iteratee == null ||
      (typeof iteratee == "number" && typeof obj[0] != "object" && obj != null)
    ) {
      obj = isArrayLike(obj) ? obj : _.values(obj);
      for (var i = 0, length = obj.length; i < length; i++) {
        value = obj[i];
        if (value != null && value > result) {
          result = value;
        }
      }
    } else {
      iteratee = cb(iteratee, context);
      _.each(obj, function (v, index, list) {
        computed = iteratee(v, index, list);
        if (
          computed > lastComputed ||
          (computed === -Infinity && result === -Infinity)
        ) {
          result = v;
          lastComputed = computed;
        }
      });
    }
    return result;
  };

  /**
   * 返回list中的最小值。如果传递iteratee参数，iteratee将作为list中每个值的排序依据
   * @param {*} obj
   * @param {*} iteratee
   * @param {*} context
   */
  _.min = function (obj, iteratee, context) {
    var result = Infinity,
      lastComputed = Infinity,
      value,
      computed;
    if (
      iteratee == null ||
      (typeof iteratee == "number" && typeof obj[0] != "object" && obj != null)
    ) {
      obj = isArrayLike(obj) ? obj : _.values(obj);
      for (var i = 0, length = obj.length; i < length; i++) {
        value = obj[i];
        if (value != null && value < result) {
          result = value;
        }
      }
    } else {
      iteratee = cb(iteratee, context);
      _.each(obj, function (v, index, list) {
        computed = iteratee(v, index, list);
        if (
          computed < lastComputed ||
          (computed === Infinity && result === Infinity)
        ) {
          result = v;
          lastComputed = computed;
        }
      });
    }
    return result;
  };

  /**
   * 返回一个随机乱序的 list 副本
   * @param {*} obj
   */
  _.shuffle = function (obj) {
    return _.sample(obj, Infinity);
  };

  /**
   * 从 list中产生一个随机样本。传递一个数字表示从list中返回n个随机元素。否则将返回一个单一的随机项。
   * @param {*} obj
   * @param {*} n
   * @param {*} guard
   */
  _.sample = function (obj, n, guard) {
    if (n == null || guard) {
      if (!isArrayLike(obj)) obj = _.values(obj);
      return obj[_.random(obj.length - 1)];
    }
    var sample = isArrayLike(obj) ? _.clone(obj) : _.values(obj);
    var length = getLength(sample);
    n = Math.max(Math.min(n, length), 0);
    var last = length - 1;
    for (var index = 0; index < n; index++) {
      var rand = _.random(index, last);
      var temp = sample[index];
      sample[index] = sample[rand];
      sample[rand] = temp;
    }
    return sample.slice(0, n);
  };

  /**
   * 返回一个（稳定的）排序后的list拷贝副本。如果传递iteratee参数，iteratee将作为list中每个值的排序依据
   * @param {*} obj
   * @param {*} iteratee
   * @param {*} context
   */
  _.sortBy = function (obj, iteratee, context) {
    var index = 0;
    iteratee = cb(iteratee, context);
    return _.pluck(
      _.map(obj, function (value, key, list) {
        return {
          value: value,
          index: index++,
          criteria: iteratee(value, key, list),
        };
      }).sort(function (left, right) {
        var a = left.criteria;
        var b = right.criteria;
        if (a !== b) {
          if (a > b || a === void 0) return 1;
          if (a < b || b === void 0) return -1;
        }
        return left.index - right.index;
      }),
      "value"
    );
  };
})();
