/*
Copyright 2017 Vijay s

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE
*/
(function(){
  var initializing = false, fnTest = /xyz/.test(function(){xyz;}) ? /\b_super\b/ : /.*/;
  this.Class = function(){};
  Class.extend = function(prop) {
	var _super = this.prototype;
	initializing = true;
	var prototype = new this();
	initializing = false;

	for (var name in prop) {
	  prototype[name] = typeof prop[name] == "function" &&
		typeof _super[name] == "function" && fnTest.test(prop[name]) ?
		(function(name, fn){
		  return function() {
			var tmp = this._super;
			this._super = _super[name];
			var ret = fn.apply(this, arguments);
			this._super = tmp;

			return ret;
		  };
		})(name, prop[name]) :
		prop[name];
	}
	function Class() {
	  if ( !initializing && this.init )
		this.init.apply(this, arguments);
	}
	Class.prototype = prototype;
	Class.constructor = Class;
	Class.extend = arguments.callee;
	return Class;
  };
})();


var vTable = Class.extend({
	element: "",
	table : "",
	options:{
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

	init: function(element, option){
		this.element = element;
		$.extend(this.options, option);
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
		var table = document.createElement("table");
		this.table = table;
		$(this.table).attr({"class":this.options.style+" vtable"});
		$(this.element).append(this.table);
		
		this.createEditableTable();
	},

	isEditable : function (column) {
		var iseditable = true;
		$.each(this.editableColumns, function (columns) {
			if (columns["columnName"] == column) {
				iseditable = true;
				return false;
			}
		});
	
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

	createInput : function(key, value){
		var type = this.options.columns[key].type;
		switch (type) {
			case "text":
				var input= document.createElement("input");
				$(input).attr({"type":"text","class":"vinput","name": key, "value": value});
				break;
			case "select":
				var input= document.createElement("select");
				var options = this.options.columns[key].options;
				$(input).attr({"class":"vinput","name":key, "value": value});
				$.each(options,function (key, val) {
					var option = document.createElement("option");
					$(option).attr("value",val);
					if(val == value)
						$(option).attr("selected", true)
					$(option).html(key);
					$(input).append(option);
				});
				break;
			case "password":
				var input= document.createElement("input");
				$(input).attr({"type":"password","class":"vinput","name": key, "value": value});
				break;
			case "number":
				var input= document.createElement("input");
				$(input).attr({"type":"number","class":"vinput","name": key, "value": value});
				break;
			default:
				var input= document.createElement("input");
				$(input).attr({"type":"text","class":"vinput","name": key, "value": value});
		}
		
		return input;
	},

	createHeaders : function () {
		var thead = document.createElement("thead");
		$(this.table).append(thead);
		var tfoot = document.createElement("tfoot");
		$(this.table).append(tfoot);
		
		$.each(this.options.columns, function(key, column) {
			if(column.identifier)
				return true;

			var th = "<th>"+column.label+"</th>"
			$(thead).append(th);
			$(tfoot).append(th);
		});
	},

 	createEditableTable: function () {
		var self = this;
		this.createHeaders();

		$.each(this.options.values, function(index ,rows) {
			var tr = document.createElement("tr");
			$(this.table).append(tr);
			console.log(rows);
			$.each(rows, function(key, value) {
				if(self.options.columns[key].identifier) {
					var input = document.createElement("input");
					$(input).attr({"type":"hidden", "name":self.options.identifier,"value":value, "class":"vinput"});
					$(tr).append(input);
					return true;		
			  	}
			  	var td= document.createElement("td");
				var span= document.createElement("span");
				$(span).html(value);
				$(td).append(span);
				if (self.options.columns[key].editable) {
					$(td).attr("editable",true);
					var input = self.createInput(key, value);
					$(td).append(input);
				}
				$(tr).append(td);
			});
			self.table.append(tr);
		})
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
