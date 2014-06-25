//     Bearing.js 0.0.1

//     (c) 2014 Wes Cravens
//     Bearing may be freely distributed under the MIT license.
//     Bearing Views are an adaptation of Backbone Views but are not dependent on Underscore
//     For more details and documentation:
//     https://github.com/wescravens/bearing

(function(root, factory) {

	// AMD support
	if ( typeof define === 'function' && define.amd ) {
		define(['jquery', 'exports'], function($, exports) {
			return factory(root, exports, $);
		});
	}

	// Node Support
	else if (typeof exports !== 'undefined') {
	    var $ = require('jquery');
	    factory(root, exports, $);
	}

	// Expose Global
	else {
		root.Bearing = factory(root, {}, (root.jQuery || root.$));
	}

}(this, function(root, Bearing, $) {

	// Create an instance of '$' under the Bearing namespace
	Bearing.$ = $;

	// Create an object to store global Bearing options
	Bearing.options = {};

	// Create the a namespace to store views in
	var views = Bearing.Views = {};
	var namespace = Bearing.options.namespace || Bearing.Views;

	// Cache common Array prototype functions
	var ArrayProto = Array.prototype,
		ObjectProto = Object.prototype;

	var forEach = ArrayProto.forEach,
		slice = ArrayProto.slice;

	// Utility function based on Underscore's extend function using native forEach
	var assign = function(obj) {
		forEach.call(slice.call(arguments, 1), function(origin) {
			if (origin) {
				for (var prop in origin) {
					obj[prop] = origin[prop];
				}
			}
		});
		return obj;
	};

	// Utility function for object size
	var size = function(obj) {
		var size = 0, key;
		for (key in obj) {
			if (obj.hasOwnProperty(key)) size++;
		}
		return size;
	};

	// Setup the Bearing View object
	var View = Bearing.View = function(options) {
		// Create a unique id for the view
		this.id = '_' + Math.random().toString(36).substr(2, 9);

		options = options || {};

		// Add options object passed in parameter to the View
		assign(this, addOptions(options));

		// Set the root DOM element
		this._appropriateElement();

		// Call View Setup function
		this.setup();

		// Listen for defined events
		this.listen(this.events);
	};

	// Utility function to copy the parameters object into the View
	var addOptions = function(options) {
		var results = {}, key;
		for ( key in options ) {
			results[key] = options[key];
		}
		return results;
	};

	// Regex for splitting event hash
	var eventSplitter = /^(\S+)\s*(.*)$/;

	// Create the View prototype functions
	assign(
		View.prototype,
		{
			// Set the default view name to null
			name: null,

			// Limit DOM traversion to the View's root element via this.$
			$: function(selector) {
				return this.$el.find(selector);
			},

			// Override this with your own setup function that is called when the View is created
			setup: function() {},

			// *deliver* is where the DOM manipulations should take place
			deliver: function() {
				return this;
			},

			// *events* is where you can bind events to DOM elements to execute appropriate functions
			// this is syntactically identical to Backbone's View events, but utilizes jQuery's event delegation
			// example: events: { 'click .button': 'doSomething' }
			events: {},

			// Events will be stored in this array if enableHistory = true
			eventHistory: [],

			// Active event listeners will be referenced here.
			listeningTo: {},

			// attach event listeners based on the View events object
			listen: function(events) {
				events = events || {};
				this.listeningTo = {};
				this.ignoreAll();
				for (var key in events) {
					var callbackName = events[key],
						callback = this[callbackName],
						match = key.match(eventSplitter),
						eventName = match[1],
						selector = match[2];

					eventName += '.listen' + this.id;

					var eventData = {
						event_id: eventName,
						listening_for: match[1],
						description: key,
						selector: selector,
						method: callbackName
					};

					this.listeningTo[key] = eventData;

					// If event history is enabled send the event to the beforeEvent function
					if ( this.eventHistory ) {
						callback = this.beforeEvent;
					}

					// Events are delegated via jQuery's 'on' function
					// The 'on' function will scope the function passed in to
					// the element the event is attached to, so $.proxy() is
					// used to retain the View scope within the function
					if ( selector === '' ) {
						this.$el.on(eventName, eventData, Bearing.$.proxy(callback, this));
					} else {
						this.$el.on(eventName, selector, eventData, Bearing.$.proxy(callback, this));
					}
				}
			},

			// Pushes event object into the eventHistory before calling the function
			// if event history is turned on
			beforeEvent: function(event) {
				if ( event ) {
					var method = event.data.method;
					if ( this.enableHistory ) { this.eventHistory.push(event); }
					this[method].apply(this, arguments);
				}
			},


			// Ignores the event name passed in ie: 'click .button'
			ignore: function(eventString) {
				this.$el.off(eventString);
				delete this.listeningTo[eventString];
			},

			// Remove all active event listeners for this View
			ignoreAll: function() {
				if ( !size(this.listeningTo) ) { return false; }
				for ( var key in this.listeningTo ) {
					this.$el.off(key);
				}
				this.listeningTo = {};
			},

			destroy: function() {
				this.$el.remove();
				this.ignoreAll();
				this.listeningTo = {};
				this.eventHistory = [];
				return this;
			},

			// Sets this.$el to the correct DOM element.
			// If it's a string, it gets wrapped by jQuery first
			// TODO: optimize this by element type
			_appropriateElement: function() {
				if ( !this.el ) {
					throw new Error('An DOM element must be assigned to view ' + this.id + ' via the "el" property.');
				}
				if ( typeof this.el === 'string' ) {
					this.$el = Bearing.$(this.el);
				} else {
					this.$el = this.el;
					this.el = this.el[0];
				}
			}
		}
	);

	var classes = {};

	var createClass = Bearing.createClass = function(name, options) {
		if ( !name ) { throw new Error('Cannot create class with name of ' + name) }
		options = options || {};

		classes[name] = View.extend(options);

	};

	// Based on Backbone's *extend* function
	// Adapted for use without Underscore
	var extend = function(proto, props) {
		var origin = this;
		var BearingView;

		if ( proto && proto.hasOwnProperty('constructor') ) {
			BearingView = proto.constructor;
		} else {
			BearingView = function() {
				return origin.apply(this, arguments);
			};
		}

		// Add specified properties to the constructor
		assign(BearingView, origin, props);

		// Set the prototype chain to inherit from `origin`, without calling
		// `origin`'s constructor function.
		var Surrogate = function(){ this.constructor = BearingView; };
		Surrogate.prototype = origin.prototype;
		BearingView.prototype = new Surrogate();

		// Add prototype properties (instance properties) to the subclass,
		// if supplied.
		if (proto) assign(BearingView.prototype, proto);

		BearingView.prototype.__super__ = origin.prototype;

		return BearingView;
	};

	// Give View the extend function
	View.extend = extend;

	// Delivers	views based on data-use on the rool el
	var loader = Bearing.Loader = (function(loader) {

		/**
		 * Utility function used to flatten nested arrays
		 * @private
		 * @param  {Array} arr Array to be flattened
		 * @return {Array} Flattened Array
		 */
		function flatten(arr) {
			var flattened = [];
			(function flattener(a) {
				if ( typeof a.length !== "undefined" ) {
					var index = -1,
						length = a.length;
					while( ++index < length ) {
						flattener(a[index]);
					}
				} else {
					flattened.push(a);
				}
			})(arr)
			return flattened;
		}

		/**
		 * Creates an array of objects that store the function name and root DOM node of the feature ($.map())
		 * Flattenes the nested arrays created by splitting the data-features string (flatten())
		 * Loops through the array created by $.map(). Setup and initialize the features ($.each())
		 * @return {undefined} void
		 */
		loader.load = function() {
			var $bearingEls = $('[data-use]'),
				_this = this;

			if ( !$bearingEls.length ) { return; }

			var stringSplitter = /\s*[\s,]\s*/;

			// Create an array of objects that store the class name and root DOM node of the feature class
			var classMap = $bearingEls.map(function() {
				var element = this,
					classString = $(element).data('use');
					classArray = classString.split(stringSplitter),
					classMap = $.map(classArray, function(className) {
						return {
							className: className,
							element: element
						};
					});

				return classMap;
			});

			// Flatten the nested arrays created by splitting the data-use string
			classMap = flatten(classMap);

			// Loop through the array created by $.map(). Setup and initialize the features.
			$.each(classMap, function() {
				if ( classes[this.className] && typeof classes[this.className] === 'function' ) {
					views[this.className] = new classes[this.className]({ el: $(this.element) });
					views[this.className].deliver();
				}
			});
		};

		return loader;

	})({});

	$(document).ready(function() {
		loader.load();
	});

	return Bearing;
}));
