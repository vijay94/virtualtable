/*
Copyright 2017 Vijay s

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE
*/
(function(){
  var initializing = false, fnTest = /xyz/.test(function(){xyz;}) ? /\b_super\b/ : /.*/;

  // The base Class implementation (does nothing)
  this.Class = function(){};

  // Create a new Class that inherits from this class
  Class.extend = function(prop) {
    var _super = this.prototype;

    // Instantiate a base class (but only create the instance,
    // don't run the init constructor)
    initializing = true;
    var prototype = new this();
    initializing = false;

    // Copy the properties over onto the new prototype
    for (var name in prop) {
      // Check if we're overwriting an existing function
      prototype[name] = typeof prop[name] == "function" &&
        typeof _super[name] == "function" && fnTest.test(prop[name]) ?
        (function(name, fn){
          return function() {
            var tmp = this._super;

            // Add a new ._super() method that is the same method
            // but on the super-class
            this._super = _super[name];

            // The method only need to be bound temporarily, so we
            // remove it when we're done executing
            var ret = fn.apply(this, arguments);
            this._super = tmp;

            return ret;
          };
        })(name, prop[name]) :
        prop[name];
    }

    // The dummy class constructor
    function Class() {
      // All construction is actually done in the init method
      if ( !initializing && this.init )
        this.init.apply(this, arguments);
    }

    // Populate our constructed prototype object
    Class.prototype = prototype;

    // Enforce the constructor to be what we expect
    Class.constructor = Class;

    // And make this class extendable
    Class.extend = arguments.callee;

    return Class;
  };
})();


var vTable = Class.extend({
  options:{
    row : 2,
    column : 2,
    selector : ".table",
    values : [],
    style : "table table-stripped",
    mode : "default",
    editableColumns : [],
    columns : [],
    identifier : "id",
    method : "get",
    url : "/",
    optional_data : []
  },
  init: function(option){
    $.extend( this.options, option );
    this.consrtruct();
  },

  consrtruct : function () {
    this.create();
    this.reloadEditable();
  },

  setupAjax :function () {
    var append_url="";
    var first=true;
    $.each(this.options.optional_data,function (key, value) {
      if(first){
        append_url+=key+"="+value;
        first=false;
      }else{
        append_url+="&"+key+"="+value;
      }
      });
    $.ajaxPrefilter( function(option) {
        option.url += (option.url.indexOf("?") < 0 ?  "?" : "&") +append_url;
    });
  },

  create : function () {
    switch (this.options.mode) {
      case "default":
          this.createTable();
          break;
      case "editable":
          this.createEditableTable();
          break;
      default:
          this.createTable();
    }
  },

  isEditable : function (column) {
    var iseditable = true;
    for (var i = 0; i < this.options.editableColumns.length; i++) {
      if(this.options.editableColumns[i][0] == column){
        iseditable = true;
        return iseditable;
      }else{
        iseditable = false;
      }
    }
    return iseditable;
  },

  postRequest: function (formdata) {
    var result="";
    $.ajax({
      url : this.options.url,
      method : this.options.method,
      data : formdata,
      success : function (response) {
        result=response;
      },
      error : function (response) {
          result=response;
      }
    });
  },

  createInput : function(column){
    for (var i = 0; i < this.options.editableColumns.length; i++) {
      if(this.options.editableColumns[i][0] == column){
        switch (this.options.editableColumns[i][1]) {
          case "text":
                var input= document.createElement("input");
                $(input).attr({"type":"text","class":"vinput","name":this.options.editableColumns[i][0]});
            break;
          case "select":
              var input= document.createElement("select");
              $(input).attr({"class":"vinput","name":this.options.editableColumns[i][0]});
              var options =  this.options.editableColumns[i][2];
              $.each(options,function (key, val) {
                    var option = document.createElement("option");
                    $(option).attr("value",val);
                    $(option).html(key);
                    $(input).append(option);
                });
            break;
          case "password":
              var input= document.createElement("input");
              $(input).attr({"type":"password","class":"vinput","name":this.options.editableColumns[i][0]});
            break;
          case "number":
              var input= document.createElement("input");
              $(input).attr({"type":"number","class":"vinput","name":this.options.editableColumns[i][0]});
            break;
          default:
              var input= document.createElement("input");
              $(input).attr({"type":"text","class":"vinput","name":this.options.editableColumns[i][0]});
        }
      }
    }
    return input;
  },

  createTable: function() {
    console.log(this.options.values);
    var table = document.createElement("table");
    $(table).attr({"class":this.options.style+" vtable"});
    $(this.options.selector).append(table);

    var thead = document.createElement("thead");
    $(table).append(thead);
    var tfoot = document.createElement("tfoot");
    $(table).append(tfoot);
    for (var i = 0; i < this.options.columns.length; i++) {
      var th= document.createElement("th");
      $(th).html(this.options.columns[i]);
      $(thead).append(th);
      th= document.createElement("th");
      $(th).html(this.options.columns[i]);
      $(tfoot).append(th);
    }

    for (var i = 0 ; i < this.options.row ; i++) {
      var tr = document.createElement("tr");
      $(table).append(tr);
      for (var j = 0 ; j < this.options.column ; j++) {
          var td= document.createElement("td");
          $(td).html(this.options.values[i][j]);
          $(tr).append(td);
      }
    }
  },

  createEditableTable: function () {
    var table = document.createElement("table");
    $(table).attr({"class":this.options.style+" vtable"});
    $(this.options.selector).append(table);

    var thead = document.createElement("thead");
    $(table).append(thead);
    var tfoot = document.createElement("tfoot");
    $(table).append(tfoot);
    for (var i = 0; i < this.options.columns.length; i++) {
      if(this.options.columns[i] == this.options.identifier){
        continue;
      }
      var th= document.createElement("th");
      $(th).html(this.options.columns[i]);
      $(thead).append(th);
      th= document.createElement("th");
      $(th).html(this.options.columns[i]);
      $(tfoot).append(th);
    }

    for (var i = 0 ; i < this.options.row ; i++) {
        var tr = document.createElement("tr");
        $(table).append(tr);
      for (var j = 0 ; j < this.options.column ; j++) {
          if(this.options.columns[j] == this.options.identifier){
            var input = document.createElement("input");
            $(input).attr({"type":"hidden","name":this.options.identifier,"value":this.options.values[i][j],"class":"vinput"});
            $(tr).append(input);
            continue;
          }
          var td= document.createElement("td");
          var span= document.createElement("span");
          $(span).html(this.options.values[i][j]);
          $(td).append(span);
          if (this.isEditable(this.options.columns[j])) {
            $(td).attr("editable",true);
            var input = this.createInput(this.options.columns[j]);
            $(input).val(this.options.values[i][j]);
            $(td).append(input);
          }
          $(tr).append(td);
      }
    }
  },

  reloadEditable:function () {
      var self=this;
      $(this.options.selector+" .vtable td[editable='true']").on('dblclick',function(){
        $(this).children('.vinput').show().focus();
        $(this).children('span').hide();
      });
      $('.vinput').on('blur',function (e) {
        if($(this).val() == $(this).prev().html()){
          $(this).hide();
          $(this).prev().show();
        }else{
          var tr=$(this).parents('tr');
          var formdata = $(tr).find('.vinput').serialize();
          var result = self.postRequest(formdata);
        }
      });
  },

});

$.fn.vTable = function(option){
    new vTable(this,option);
};
