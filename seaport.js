/**
 * @author bh-lay
 * 
 * @github https://github.com/bh-lay/seaportjs
 * @modified 2015-7-24 18:51
 * 
 **/
(function(global){
  "use strict";
  var doc = document,
      head = doc.head || doc.getElementsByTagName("head")[0] || doc.documentElement;
  //处理自定义事件
  function ON(eventName,id,callback){
    this._events = this._events || {};
    //事件堆无该事件，创建一个事件堆
    if(!this._events[eventName]){
      this._events[eventName] = [];
    }
    this._events[eventName].push([
      id,
      callback
    ]);
    //提供链式调用的支持
    return this;
  }
  function EMIT(eventName,id,args){
    this._events = this._events || {};
    var eventsList = this._events[eventName];
    //事件堆无该事件，结束运行
    if(!eventsList){
      return;
    }
    for(var i=0,total=eventsList.length;i<total;i++){
      if(eventsList[i][0] == id){
        eventsList[i][1].apply(this.event_global || this,args);
      }
    }
  }
  //加载javascript
  function loadJS(url,fn){
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.charset = 'UTF-8';
    
    if (script.readyState){  //IE  
      script.onreadystatechange = function(){  
        if (script.readyState == "loaded" || script.readyState == "complete"){  
          script.onreadystatechange = null;  
          fn&&fn();
        }  
      };  
    } else {  //Others  
      script.onload = fn;  
    }  
    
    script.src = url;
    head.appendChild(script);
  }
  
  /**
   * mini seajs类
   *
   **/
  function Seaport(){
    this.base = '';
    this.map = null;
    this._modules = {};
  };
  Seaport.prototype = {
    config: function(param){
      param = param || {};
      param.base && (this.base = param.base);
    },
    use: function(path){
      loadJS(this.base + path);
    },
    on: ON
  };
  
  var miniSea = new Seaport();
  /**
   * 初始化模块（依赖全部加载完毕方可执行）
   **/
  function initModule (id,factory){
    var exports = {},
      returns = factory(require,exports);
    
    miniSea._modules[id] = returns || exports;
    EMIT.call(miniSea,'initModule',id);
    
    //console.log('init',id);
  }
  function define(id,depends,factory){
//    console.log('waiting  define:',id,depends.length);
    var need_load = depends.length;
    //等待依赖加载完毕，初始化模块
    for(var last=depends.length-1;last>=0;last--){
      if(miniSea._modules[id]){
        need_load--;
      }else{
        //FIXME 解绑
        miniSea.on('initModule',depends[last],function(){
          need_load--;
          if(need_load == 0){
            initModule(id,factory);
          }
        });
      }
    }
    //console.log('init',id,need_load);
    if(need_load == 0){
      initModule(id,factory);
    }
  }
  define.cmd = {};
  function require(id){
    id = id.replace(/\.js$/,'');
    return miniSea._modules[id] ? miniSea._modules[id] : null;
  }
  global.seajs = miniSea;
  global.define = define;
})(window);

