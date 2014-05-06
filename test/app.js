/* global $, Bearing */
window.App = {};
App.Views = {};
var TestView = Bearing.View.extend({
	setup: function() {
		// Do stuff when the View is created
	},
	events: {
		'click .btn': 'deliver',
		'click .stop-btn': 'ignoreAll',
		'click .show-clicks': 'showAllClickPositions',
		'click': 'showClickPositions',
		'click .clear-dots': 'clearClicks'
	},
	i: 1,
	deliver: function(evt) {
		var text = 'time';
		if ( this.i > 1 ) {
			text = 'times';
		}
		this.$el.html('<h1>This is View ' + this.id + '</h1><p>It has been rendered ' + this.i + ' ' + text + '.</p><button class="btn">Click Me</button><button class="stop-btn">Stop Listening</button><button class="show-clicks">Show Clicks</button><button class="clear-dots">Clear Clicks</button>');
		console.log(this.$el);
		this.i++;
	},
	x: 0,
	showClickPositions: function(event) {
		var x = this.x;
		this.$el
			.append('<div class="click click-' + x + '"></div>')
			.find('.click-' + x)
			.css({ 'left': event.pageX + 'px', 'top': event.pageY + 'px'});
		this.x++;
	},
	showAllClickPositions: function(event) {
		$('.click').remove();
		for ( var i = 0; i < this.eventHistory.length; i++ ) {
			this.$el
				.append('<div class="click click-' + i + '"></div>')
				.find('.click-' + i)
				.css({ 'left': this.eventHistory[i].pageX + 'px', 'top': this.eventHistory[i].pageY + 'px'});
		}
	},
	clearClicks: function() {
		this.$el.find('.click').remove();
	}
});

App.Views.testView = new TestView({
	el: '.morecontent',
	enableHistory: true
});
App.Views.testView.deliver();
