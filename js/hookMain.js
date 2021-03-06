/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// identity function for calling harmony imports with the correct context
/******/ 	__webpack_require__.i = function(value) { return value; };
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "http://localhost:63343/mvvm/js/";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 34);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports) {


/**
* 拷贝属性
*/

module.exports = function (obj) {
	var length = arguments.length;
	var that = this, target;
	if(!obj) {
		return null;
	}
	if(length < 2 ) {
		return obj;
	}
	
	for(var i = 1; i < length; i++) {
		target = arguments[i];
		for(var key in target) {
			//if(obj[key] === void 0) 
			obj[key] = target[key];
		}
	}
	return obj;
	
};


/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

//vm类, 

var extend = __webpack_require__(0);
var extendClass = __webpack_require__(3);
var eventBase = __webpack_require__(2);
var tplObj = __webpack_require__(5);
var Log = __webpack_require__(4);
/**
 组件强依赖zepto.js 或 jquery.js

 opt说明：
	element: 容器Dom元素（jquery对象或zepto对象）
	selfParam:存放自定义属性的，对象实例自己的属性和自己的方法（钩子方法可以放在这里）
 	stateBus: 用于组件间通信的(StateBus对象)
    tpl: 视图模板
	data: 跟视图相关的数据
    store：数据流控制
    childComponents：子组件

 component 构建流程
1. 解析模板（可以用这个过程，也可以没有）
2. 定义行为（事件行为 或 定时器行为）
3. 解析事件
4. 将解析模板得到的内容插入到DOM容器中 （可以用这个过程，也可以没有）
5. 添加解析完事件到DOM上
6. 销毁组件 （销毁事件，销毁定时器，销毁dom）
<div>
    <p>$placeholder</p>
    <p>$placeholder</p>
</div>
可以添加子组件
*/
var isDev = false;
function getRandomStr(str) {
    return str+'_'+String((new Date()).getTime()*Math.random()).substr(0,13);
}
function bind (fn, ctx) {
    return function (a) {
        var len = arguments.length
        return len
            ? len > 1
                ? fn.apply(ctx, arguments)
                : fn.call(ctx, a)
            : fn.call(ctx)
    }
}
var _childReg = /\{\{([^\{\}]*)\}\}/g; //匹配子组件在父组件模板的占位符。
var _childRootDomReg =/^<([a-z/][-a-z0-9_:.]*)[^>/]*>/; //子组件模板字符串首个tag的开始标签
var _idReg = /id=[^\s>]*/;
function baseVM(opt) {
	this.element = opt.element;
	this.selfParam = opt.selfParam || {};
	/**
     * 子组件
     * childComponents = {name1: CompObject1, name2: CompObject2}
     * */
	this.childComponents = opt.childComponents || null;
	this.store = opt.store || null;//数据流
	this.stateBus = opt.stateBus || null;
	this.tpl = opt.tpl || null;//视图模板
	this.data = opt.data || null;//跟视图相关的数据
    this._parentComp = null;//父组件 （子组件可以通过属性_parentComp访问父组件的参数）
	this._eventArr = [];//内部使用
    this._cackeHtml = "";// 缓存拼接的html字符串
    this._cId = getRandomStr('comp');//实例的唯一识别
    this._hasChild = false;//是否有子组件
    this._isRoot = true;//是否为根组件
    this._id = null;//获得子组件容器id
    this.isMounted = false; // 是否添加到页面中。
	isDev = opt.isDev || false;
	this._prepareFunc();
}
extend(baseVM.prototype, eventBase, {
    //初始操作
	_prepareFunc: function() {
        var k = this;
        k._bindProxy();
        if(k.childComponents) {
            k._hasChild = true;
            k._setParentForChild();
        }
        if(!k.element) {
            k.element =$('<div></div>');
        }

        if(isDev){
            Log.log('init');
		}
        if(k.tpl) {
            k._initParse();
        } else {
           //初始化操作
			k.init();
            //解析事件
            k._parseEvent();
            //添加事件
			k._addEventToDom();
        }
	},
    /**
     * 代理 selfParam 和 methods
     * */
    _bindProxy: function() {
	    var k = this;
	    if(k.selfParam) {
	        if(Object.defineProperty && Object.keys) {
                k._bindData();
            } else {
                for (var key in k.selfParam) {
                    k[key] = k.selfParam[key];
                }
            }
        }
        if(k.methods) {
            for(var method in k.methods) {
                k[method] = bind(k.methods[method], k);
            }
        }
    },
    _bindData: function () {
      var k = this;
      Object.keys(k.selfParam).forEach(function (key) {
          Object.defineProperty(k, key, {
              configurable: true,
              enumerable: true,
              get: function proxyFunc () {
                  return k.selfParam[key]
              },
              set: function proxyFunc (val) {
                  k.selfParam[key] = val;
              }
          })
      })
    },
    /**
     * 给子组件设置父组件对象
     * */
    _setParentForChild: function () {
        var k = this;
        for(var key in k.childComponents) {
           k.childComponents[key]._parentComp = k;
           k.childComponents[key]._isRoot = false;
        }
    },
    /**
     * 将组件添加到页面中
     * param：路由传来的参数 (如果有路由的)
     * */
    mounted: function(param) {
	    var k = this;
        //如果是根组件
        if(k._isRoot) {
            k.element.append(k._cackeHtml);
            k.init && k.init(param);
            k._addEventToDom();
            if(isDev){
                Log.log('--------add Dom to document-----------');
            }

            for(var key in k.childComponents) {
                k.childComponents[key].element = k.element.find(k.childComponents[key]._id);
                k.childComponents[key].store = k.store;
                k.childComponents[key].mounted(param);
            }
        } else {//如果不是是根组件
            k.init && k.init();
            k._addEventToDom();

            for(var key in k.childComponents) {
                k.childComponents[key].element = k.element.find(k.childComponents[key]._id);
                k.childComponents[key].store = k.store;
                k.childComponents[key].mounted();
            }
        }
        k.isMounted = true;

    },
    /***
	 * 组件的初始化操作
	 * 子类重写
     * param：路由传来的参数
	 * */
    init: function (param) {

	},
    /***
	 * 可以在这里自定义行为方法，
	 * 子类重写
	 * */
    methods: {

	},
    /**
     * 最好通过setData来更新组件的data数据，从而更新组件dom
     * (适用于没有子组件的组件)
    * */
    setData: function (data) {
      var k = this;
      k.data = data;
      k._generateHTML();
      if(k._isRoot) {
          k.element.html(k._cackeHtml);
      } else {
         var cacheDom = $(k._cackeHtml);
         k.element.html(cacheDom.html());
      }

    },
    _generateHTML: function() {
        var k = this;
        if(k.data){
            k._cackeHtml = k.tpl(k.data);
        } else {
            k._cackeHtml = k.tpl({});
        }

        if(isDev) {
            Log.log("genetate html");
        }
       if( k._hasChild ){
           k._joinChildHtml();
       }
    },
    _joinChildHtml: function() {
        var k = this;
        if(isDev){
            Log.log(_childReg);
        }
        k._cackeHtml = k._cackeHtml.replace(_childReg, function(reg, creg) {
            if(isDev){
              //  Log.log(creg);
            }
            var childComp = k.childComponents[creg];
            var chtml = childComp._cackeHtml;
            if(isDev){
               // Log.log(chtml)
            }
            var id = getRandomStr('child').replace('.',"");
            var startTagStr = chtml.match(_childRootDomReg)[0];
            startTagStr = startTagStr.replace(_idReg, '');
            startTagStr = startTagStr.replace(/>$/, ' id="'+id+'">');
            childComp._id="#"+id;
            chtml = chtml.replace(_childRootDomReg, startTagStr)
           return chtml;
        });
    },
    /**
    * 事件对应的回掉函数在methods
	 * 子类重写，
    * {'click .tab': 'get'} 用来给element子元素注册事件(事件代理)
    * {'click': 'get'} 用来给element元素注册事件
    * */
	events: null,
    /**
     * 销毁组件 子组件重写
     * */
    destroy: function() {
        var k = this;
        k.removeEvents();
        k.isMounted = false;
        //k.element = null;
        for(var key in k.childComponents) {
            k.childComponents[key].removeEvents();
            k.childComponents[key].element = null;
            //k.childComponents[key] = null;
        }
        k.element.html('');
    },
	removeEvents: function() {
		var k = this, arr;
        var len = k._eventArr.length;
		if(len === 0) {
		    return;
        }
		for(var i = 0; i < len; i++) {
			arr = k._eventArr[i];
			k.element.off(arr[0]);
		}
        // k._eventArr = []; 不要清空
        if(isDev){
            Log.log('remove Event');
        }
	},
    _initParse: function() {
        var k = this;
        k._parseTpl();
        if(!k._isEventParsed) {
            k._isEventParsed = true;
            k._parseEvent();
        }
        k._generateHTML();
    },
    _parseTpl: function() {
        var k = this;
        k.tpl = tplObj.parse(k._filterSpecialLetter(k.tpl));
        if(isDev){
            Log.log('parse template');
        }
    },
    _filterSpecialLetter: function(tpl) {
		/*
		 控制字符的使用
		 字符编码值	名称	正式名称	用途
		 \u200C	零宽非连接符	<ZWNJ>	IdentifierPart
		 \u200D	零宽连接符	<ZWJ>	IdentifierPart
		 \uFEFF	位序掩码	<BOM>	Whitespace

		 空白字符
		 \u0009	制表符	<TAB>
		 \u000B	纵向制表符	<VT>
		 \u000C	进纸符	<FF>
		 \u0020	空格	<SP>
		 \u00A0	非断空格	<NBSP>
		 \uFEFF	位序掩码	<BOM>

		 行终止字符
		 字符编码值	名称	正式名称
		 \u000A	进行符	<LF>
		 \u000D	回车符	<CR>
		 \u2028	行分隔符	<LS>
		 \u2029	段分隔符	<PS>
		 */
        tpl = tpl.replace(/(\n+)|(\r+)|(\n*\r*)|(\u000A|\u000D|\u2028|\u2029)*/g,"");
        return tpl;
    },
    //解析事件
    _parseEvent: function() {
        var k = this;
        var reg = /\s+/;
        var kongReg = /(^\s*)|(\s*$)/g;
        var eArr = [];
        var l;
        if (!k.events) {
            return;
        }
        for(var key in k.events) {
            key = key.replace(kongReg, '');
            eArr = key.split(reg);
            eArr.push(k.events[key]);
            k._eventArr.push(eArr);
        }
        if(isDev){
            Log.log('parse Event');
        }
    },
    //事件添加到dom
    _addEventToDom: function() {
        var k = this;
        for(var i = 0, len = k._eventArr.length; i < len; i++) {
            eArr = k._eventArr[i];
            l = eArr.length;
            if(l === 2) {
                (function(eArr){
                    k.element.on(eArr[0], function(e) {
                        k.methods[eArr[1]].call(k, e);
                    });
                }(eArr));
            } else {
                (function(eArr){
                    k.element.on(eArr[0], eArr[1], function(e) {
                        var $t = $(this);
                        k.methods[eArr[2]].call(k, e, $t);
                    });
                }(eArr));
            }
        }
        if(isDev){
            Log.log('add Event');
        }
    }
});

baseVM.extend = extendClass;

module.exports =  function(opt){
    var NewClass = baseVM.extend({
        // 组件的初始函数
        init: opt.init,
        // 事件的回调函数 和 一些常规函数 （会代理到组件实例中）
        methods: opt.methods,
        // 事件列表， 事件都绑定到element中
        events: opt.events
    });
    return new NewClass({
        // 组件容器dom
        element: opt.element,
        // 自定义的属性，（会代理到组件实例中）
        selfParam: opt.selfParam,
        // 子组件列表
        childComponents: opt.childComponents,
        // 组件间通信用的
        stateBus: opt.stateBus,
        // 组件模板
        tpl: opt.template,
        // 跟模板相关的数据
        data: opt.data,
        // 数据流
        store: opt.store,
        // 调试用的标志位
        isDev: opt.isDev
    });
}

/***/ }),
/* 2 */
/***/ (function(module, exports) {

//�Զ����¼�����
module.exports = {
	on: function(type, callback, thisArg) {
		this.events || (this.events = {});
		thisArg = thisArg || this;
		if(this.events[type]) {
			this.events[type].push({cb: callback, thisArg: thisArg});
		} else {
			this.events[type] = [];
			this.events[type].push({cb: callback, thisArg: thisArg});
		}
	},
	off: function(type, callback) {
		if(!this.events[type]) {
			return;
		}
		this.events[type] = [];
	},
	trigger: function(type, opt) {
		var funcs = this.events[type];
		if(!funcs) {
			return;
		}
		var len = funcs.length;
		for(var i =0; i < len; i++) {
			var cb = funcs[i].cb;
			var thisArg = funcs[i].thisArg;
			cb.call(thisArg, opt);
		}
	}
};

/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {


/**
* 继承工具方法
*/
var extend = __webpack_require__(0);
module.exports = function (protoProps, staticProps) {
	var parent = this;
	var child;
	if(protoProps && Object.prototype.hasOwnProperty.call(protoProps, 'constructor')) {
		child = protoProps.prototype.constructor;
	} else {
		child = function () {
			return parent.apply(this, arguments);
		};
	}
	//拷贝静态属性
	extend(child, parent, staticProps);
	//子类与父类之间的代理，使子类不能修改父类方法
	var proxy = function() {
		this.constructor = child;
	};
	proxy.prototype = parent.prototype;
	child.prototype = new proxy();
	
	//拷贝原型属性
	if (protoProps) extend(child.prototype, protoProps);
	
	return child;
};

/***/ }),
/* 4 */
/***/ (function(module, exports) {


/**
 *
* 日志类
*/
console = window.console ? window.console : function(e){alert(e)};

module.exports = {
	log: console.log,
	error: console.error
};

/***/ }),
/* 5 */
/***/ (function(module, exports) {


/**
* template
*/

var template = {
	startTag: "<%",
	endTag: "%>",
	parse: function (str) {
		var reg = /^=(.+)/;//来判断是变量还是语句
		var startArr = str.split(this.startTag);//开始标识符分割的数组
		var endArr;//结束标识符分割的数组
		var variable;
		var varArr;//
        var temp;
        var html;
        var l = startArr.length;
        if(startArr.length === 1) {
        	html = 'var str= \''+str+'\'; return str;';
        	return new Function('data', html);
		}
		html = ' var str=""; with(data) {';
		for(var i = 0 ; i < l; i++) {
			temp = startArr[i];
			endArr = temp.split(this.endTag);
			if(endArr.length === 1) {//纯字符串
				html+='str+=\''+endArr[0]+'\';';
			} else {//有变量或语句
				variable = endArr[0];
				varArr = variable.match(reg);
				if(varArr && varArr.length === 2) {//是变量
					
					html +='str+='+ varArr[1]+';'; 
					html += 'str+=\''+endArr[1]+'\';';
				} else {
					html += endArr[0];//是语句
					html += 'str+=\''+endArr[1]+'\';';
				}
			}
		}
		html+='} return str;';
		//console.log(html);
		return new Function('data', html);
	}
};
module.exports = template;

/***/ }),
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

//vm类, 
/**

*/
var Vue = __webpack_require__(1);
var t1 = __webpack_require__(10);
var tg = __webpack_require__(11);

var gobj = new Vue({
    template: tg,
    isDev: true,
    events: {
        'click': 'show'
    },
    methods: {
        show: function(e){
            alert(e.target.innerHTML);
        }
    }
})
var c1obj = new Vue({
    element: $('.box1'),
    childComponents: {
		'grandSon': gobj
	},
    template: t1,
    isDev: true,
    events: {
        'click p': 'show'
    },
    methods: {
        show: function(e, that){
            alert(that.html());
        }
    }

})

module.exports = c1obj

/***/ }),
/* 7 */
/***/ (function(module, exports, __webpack_require__) {

/**
 * SPA 项目程序入口
 * 1. 注册路径
 * 2. 路径管理
 * 3. 显示首页
 * */
var Router = __webpack_require__(12);
var extend = __webpack_require__(0);

/**
 * {{param}}
 *  table : 路由表
 *  beforeRouter: function () 所用导航前都要执行的函数
 * */
function SPA (opt) {
   this.routeTable = opt.table;
   this.beforeRouter = opt.beforeRouter;
}
extend(SPA.prototype, Router, {
    register: function (path, Comp) {
        var k = this;
        k.route(path, function (param) {
            // 异步组件
            if(typeof Comp === 'function') {
                Comp().then(function(module) {
                    k.routeTable[path]= module;
                    module.mounted();
                });
            } else {
                Comp.mounted(param);
            }

        });
    },
    init: function () {
        for(var key in this.routeTable) {
            this.register(key, this.routeTable[key]);
        }
        this.initEvent();
    },
    /**
     * 监听hashchange事件，来导航页面。
     */
    refresh: function (path) {
        this.beforeUrl = this.currentUrl;
        this.currentUrl = location.hash.slice(1) || '/';
        if(this.beforeRouter){
            this.beforeRouter.call(this, this.currentUrl);
        } else {
            this.goToPage();
        }
    },
    /**
     * 用户自定义的beforeRouter函数里使用，
     * 来确定导航的方向
     * this.next(): 进行管道中的下一个钩子。如果全部钩子执行完了，则导航的状态就是 confirmed （确认的）。

     this.next(false): 中断当前的导航。如果浏览器的 URL 改变了（可能是用户手动或者浏览器后退按钮），
     那么 URL 地址会重置到 from 路由对应的地址。

     this.next('/') 跳转到一个不同的地址。
     * */
    next: function (path) {
        if(path === false) {
            this.goBack(-1);
        } else if(path === undefined) {
            this.goToPage();
        } else if(typeof path === 'string'){
            this.setRoute(path, true);
        }
    },
    /**
     * 回退路由
     * */
    goBack: function (num) {
        window.history.go(num);
    },
    /**
     * 根据路由，渲染组件到页面
     * */
    goToPage: function (path) {
        this._destroyComp();
        var url = path || this.currentUrl;
        var param = this.parseParam(url);
        this.routes[url](param);
    },
    /**
     * 解析路由中的参数
     * */
    parseParam: function (url) {
        var arr = url.split('?');
        if(arr.length === 1) {
            return {url: url};
        } else {
            var obj = {}
            var arr2 = arr[1].split('&');
            for(var i = 0, len = arr2.length; i < len; i++) {
                var arr3 = arr2[i].split('=');
                obj[arr3[0]] = arr3[1];
            }
            obj['url'] = url;
            return obj;
        }
    },
    /**
     * 手动设置路由
     * path: 设置的路由
     * isNoUser 是否是用户调用， 默认不传
     * */
    setRoute: function (path, isNoUser) {
      window.location.hash = '#'+path;
      if(isNoUser) {
          if(path === this.currentUrl){
              this.goToPage();
          } else {
              this._destroyComp();
          }
      }
    },
    /**
     *注销前一个页面组件
     */
    _destroyComp: function () {
        if(this.beforeUrl) {
            var comp = this.routeTable[this.beforeUrl];
            if(comp && comp.isMounted) {
                comp.destroy();
            }
        }
    },
    /**
     * 事件监听
     * */
    initEvent: function () {
        var k = this;
        // 显示首页
        window.addEventListener('load', function() {
            k.refresh.call(k)
        }, false);
        window.addEventListener('hashchange', function() {
            console.log('change = '+window.location.hash);
            k.refresh.call(k)
        }, false);
    }
});


module.exports = SPA;

/***/ }),
/* 8 */
/***/ (function(module, exports, __webpack_require__) {

//vm类, 
/**

*/
var Vue = __webpack_require__(1);
var t2 = __webpack_require__(14);

var c2obj = new Vue({
    element: $('.box1'),
    template: t2,
    isDev: true,
    events: {
        'click': 'show'
    },
    methods: {
        show: function(e){
            alert(e.target.innerHTML);
        }
    }
})

module.exports = c2obj

/***/ }),
/* 9 */
/***/ (function(module, exports, __webpack_require__) {

//vm类, 
/**

*/
var Vue = __webpack_require__(1);
var t2 = __webpack_require__(15);

var c2obj = new Vue({
    element: $('.box1'),
    template: t2,
    isDev: true,
    events: {
        'click': 'show'
    },
    methods: {
        show: function(e){
            alert(e.target.innerHTML);
        }
    }
})

module.exports = c2obj

/***/ }),
/* 10 */
/***/ (function(module, exports) {

module.exports = "<div class=\"d\">\r\n    第一子组件\r\n    {{grandSon}}\r\n    <p>测试</p>\r\n</div>"

/***/ }),
/* 11 */
/***/ (function(module, exports) {

module.exports = "<div>\r\n    第一孙子组件\r\n</div>"

/***/ }),
/* 12 */
/***/ (function(module, exports) {

/**
 * 路由类
 * 如果路由中有参数，会解析#/path?a=b&c=d成为 {url: '/path?a=b&c=d', a: b, c: d}
 * */

function Router(routes) {
    this.routes = routes || {};
    this.currentUrl = '/';
    this.beforeUrl = '';
}
//初始化路由事件
Router.prototype.initEvent = function () {
    var k = this;
    window.addEventListener('load', function() {
        k.refresh.call(k)
    }, false);
    window.addEventListener('hashchange', function() {
        k.refresh.call(k)
    }, false);
};
//注册路由
Router.prototype.route = function (path, callback) {
    this.routes[path] = callback;
};
//切换路由
Router.prototype.refresh = function () {
    this.beforeUrl = this.currentUrl;
    this.currentUrl = location.hash.slice(1) || '/';
    this.routes[this.currentUrl]();
};

module.exports = new Router();





/***/ }),
/* 13 */,
/* 14 */
/***/ (function(module, exports) {

module.exports = "<div class=\"d\">\r\n    第二子组件\r\n</div>"

/***/ }),
/* 15 */
/***/ (function(module, exports) {

module.exports = "<div class=\"d\">\r\n    登录\r\n</div>"

/***/ }),
/* 16 */,
/* 17 */,
/* 18 */,
/* 19 */,
/* 20 */,
/* 21 */,
/* 22 */,
/* 23 */,
/* 24 */,
/* 25 */,
/* 26 */,
/* 27 */,
/* 28 */,
/* 29 */,
/* 30 */,
/* 31 */,
/* 32 */,
/* 33 */,
/* 34 */
/***/ (function(module, exports, __webpack_require__) {

/**
单页面应用， 路由钩子
*/
var SPA = __webpack_require__(7);
var child1 = __webpack_require__(6);
var child2 = __webpack_require__(8);
var child3 = __webpack_require__(9);
var table = {
    '/': child1,
    '/test': child2,
    '/login': child3
};

var spa = new SPA({
    table:table,
    // 所用导航前都要执行的函数
    beforeRouter: function (curUrl) {
        console.log('hook = '+curUrl);
        if(curUrl === '/') {
            this.next();
        } else {
            this.next('/login');
        }
    }
});
spa.init();



/***/ })
/******/ ]);