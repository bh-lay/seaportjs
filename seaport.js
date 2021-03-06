/**
 * @author bh-lay
 * 
 * @github https://github.com/bh-lay/seaportjs
 * @modified 2015-8-14 22:59
 * 
 **/
(function(global){
  "use strict";
  var doc = document,
      head = doc.head || doc.getElementsByTagName("head")[0] || doc.documentElement,
      //缓存模块对象
      modules = {},
      //模块加载完成回调事件集合
      moduleInitEvents = [],
      // seaport
      Seaport = {
        base: '',
        map: [],
        config: function(param){
          param = param || {};
          param.base && (this.base = param.base);
          param.map && (this.map = this.map.concat(param.map));
        },
        use: function(path){
          var url = this.base + path;
          for(var i=this.map.length-1;i>=0;i--){
            url = url.replace(this.map[i][0],this.map[i][1]);
          }
          loadJS(url);
        }
      };
  //注册模块加载完成监听（仅触发一次）
  function onceModuleInit(id,callback){
    moduleInitEvents.push([
      id,
      callback
    ]);
  }
  //通知模块加载完成，并立即删除监听
  function emitModuleInit(id,args){
    for(var i = moduleInitEvents.length-1;i!=-1;i--){
      if(moduleInitEvents[i][0] == id){
        moduleInitEvents[i][1].apply(this,args);
        moduleInitEvents.splice(i,1);
      }
    }
  }
  //加载javascript
  function loadJS(url,fn){
    var script = doc.createElement('script');
    script.type = 'text/javascript';
    script.charset = 'UTF-8';
    
    if (script.readyState){
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
  
  //从缓存中读取模块
  function require(id){
    id = id.replace(/\.js$/,'');
    return modules[id] ? modules[id] : null;
  }
  /**
   * 初始化模块（依赖全部加载完毕方可执行）
   **/
  function initModule (id,factory){
    var module = {
          exports: {}
        },
        returns = factory(require,module.exports,module);
    //优先使用return传递的模块接口
    modules[id] = returns || module.exports;
    emitModuleInit(id);
  }
  /**
   * 接收模块定义的主函数
   **/
  function define(id,depends,factory){
    id = id.replace(/\.js$/,'');
    var need_load = depends.length;
    //等待依赖加载完毕，初始化模块
    for(var index=depends.length-1;index>=0;index--){
      if(modules[id]){
        need_load--;
      }else{
        onceModuleInit(depends[index],function(){
          need_load--;
          if(need_load == 0){
            initModule(id,factory);
          }
        });
      }
    }
    if(need_load == 0){
      initModule(id,factory);
    }
  }
  define.cmd = {};
  global.seajs = Seaport;
  global.define = define;
})(window);