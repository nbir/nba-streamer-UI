/* GAMBIT NBA Streamer
*
* Copyright (C) USC Information Sciences Institute
* Author: Nibir Bora <nbora@usc.edu>
* URL: <http://cbg.isi.edu/>
* For license information, see LICENSE
*/

$(function() {
	
	/*
	* URLs
	*/
	var URL_SCRAPER = "http://cb.isi.edu:5001";
	var URL_BROKER = "http://brain.isi.edu:5002";
	var URL_STREAMER = "http://brain.isi.edu:5003";

	$('#a-scrapy-log').attr('href', URL_SCRAPER + '/log/');
	$('#a-broker-log').attr('href', URL_BROKER + '/log/');
	$('#a-streamer-log').attr('href', URL_STREAMER + '/log/');

	var CONNECTED = 1;
    var CONNECTING = 0;
    var FAILED = -1;

	var scrapers = {};


	/*
	* Start here
	*/
	start();

	function start() {
		update_streamer();
		setInterval(update_streamer, 15000);
		update_broker();
		setInterval(update_broker, 5000);
		update_scraper();
		setInterval(update_scraper, 30000);
		update_hoops();
		setInterval(update_hoops, 5000);

		render_chart();
		setInterval(render_chart, 60000);

		update_streams();
		setInterval(update_streams, 2000);
	}

	/*
	* Update services
	*/
	function update_streamer() {
		$.ajax({
			url: URL_STREAMER + '/collected/',
			type: 'GET',
			dataType:'json',
			error: function(data) {
				console.log('Error!');
				console.log(data);
				change_indicator($('#status-streamer'), 'red-light');
			},
			success: function(data) {
				if('total' in data) {
					change_indicator($('#status-streamer'), 'green-light');
					$('#val-tweets-total').text(data["total"]);
					$('#val-tweets-geo').text(data["geo"]);

					// Pie chart
					var chart_data = [{
							value: data["total"],
							color:"#69D2E7"
						}, {
							value : data["geo"],
							color : "#F38630"
						}];
					var pie_chart = new Chart($("#pie-canvas").get(0).getContext("2d")).Pie(chart_data, {
						"segmentShowStroke" : true,
						"animationSteps" : 25,
					});
				}
				else {
					change_indicator($('#status-streamer'), 'red-light');
					$('#val-tweets-total').text('--');
					$('#val-tweets-geo').text('--');
				}
			}
		});
	}

	function update_broker() {
		$.ajax({
			url: URL_BROKER + '/available/',
			type: 'GET',
			dataType:'json',
			error: function(data) {
				console.log('Error!');
				console.log(data);
				change_indicator($('#status-broker'), 'red-light');
			},
			success: function(data) {
				if('total' in data) {
					change_indicator($('#status-broker'), 'green-light');
					$('#val-tokens-total').text(data["total"]);
					$('#val-tokens-used').text(data["used"]);
					$('#val-tokens-available').text(data["available"]);
				}
				else {
					change_indicator($('#status-broker'), 'red-light');
					$('#val-tokens-total').text('--');
					$('#val-tokens-used').text('--');
					$('#val-tokens-available').text('--');
				}
			}
		});
	}

	function update_scraper() {
		$.ajax({
			url: URL_SCRAPER + '/list/',
			type: 'GET',
			dataType:'json',
			error: function(data) {
				console.log('Error!');
				console.log(data);
				change_indicator($('#status-scraper'), 'red-light')
			},
			success: function(data) {
				var len = Object.keys(data).length;
				if(len > 0) {
					change_indicator($('#status-scraper'), 'green-light');
				}
				else {
					change_indicator($('#status-scraper'), 'red-light');
				}
				$('#val-streams-total').text(len);
			}
		});
	}

	function update_hoops() {
		$.ajax({
			url: URL_STREAMER + '/hoops_users/',
			type: 'GET',
			dataType:'text',
			error: function(data) {
				console.log('Error!');
				console.log(data);
				change_indicator($('#status-hoops'), 'red-light')
			},
			success: function(data) {
				if(data.length > 0) {
					change_indicator($('#status-hoops'), 'green-light');
				}
				else {
					change_indicator($('#status-hoops'), 'red-light');
				}
				$('#val-hoops-users').text(data);
			}
		});
	}

	function change_indicator(dom, light) {
		dom.removeClass('grey-light');
		dom.removeClass('green-light');
		dom.removeClass('red-light');
		dom.addClass(light);
	}

	/*
	* Data chart
	*/
	function render_chart() {
		$.ajax({
			url: URL_STREAMER + '/data/',
			type: 'GET',
			dataType:'json',
			error: function(data) {
				console.log('Error!');
				console.log(data);
				change_indicator($('#status-streamer'), 'red-light');
			},
			success: function(data) {
				var len = Object.keys(data).length;
				if(len > 0) {
					change_indicator($('#status-streamer'), 'green-light');
					while (data.length > 120) {
						data.shift();
					}
					do {
						data.unshift(0);
					} while(data.length < 120);

					var chart_data = {
						labels : Array(data.length + 1).join(' '),
						datasets : [
							{
								fillColor : "rgba(151,187,205,0.5)",
								strokeColor : "rgba(151,187,205,1)",
								pointColor : "rgba(151,187,205,1)",
								pointStrokeColor : "#fff",
								data : data
							}]
					}
					var data_chart = new Chart($("#data-canvas").get(0).getContext("2d")).Line(chart_data, {
						"scaleShowGridLines" : false,
						"pointDot" : false,
						"animation" : false,
					});
				}
				else {
					change_indicator($('#status-streamer'), 'grey-light');
				}
			}
		});
	}


	/*
	* Streams status
	*/

	function update_streams() {
		$.ajax({
			url: URL_SCRAPER + '/list/',
			type: 'GET',
			dataType:'json',
			error: function(data) {
				console.log('Error!');
				console.log(data);
				change_indicator($('#status-scraper'), 'grey-light')
			},
			success: function(data) {
				var len = Object.keys(data).length;
				if(len > 0) {
					var scraper_info = {}
					$.each(data, function(i, scraper) {
						var id = scraper['filter']['id'];
						scraper_info[id] = {
							'name' : scraper['name'],
							'status' : scraper['status'],
							'rate' : scraper['rate'].toFixed(2),
							'session' : scraper['received'],
							'limits' : scraper['limits'],
							'filter' : scraper['filter']
						};
						if('track' in scraper_info[id]['filter']) {
							scraper_info[id]['filter'] = scraper_info[id]['filter']['track'].join(', ');
						}
						else if('follow' in scraper_info[id]['filter']) {
							var len = scraper_info[id]['filter']['follow'].length;
							scraper_info[id]['filter'] = 'Following ' + len + ' users.';
						}
					});

					render_streams(scraper_info);
				}
				else {
					change_indicator($('#status-scraper'), 'red-light');
					$.each(scrapers, function(id, scraper) {
						change_indicator($('#' + scrapers[id]['dom-light']), 'grey-light');
					});
				}
				$('#val-streams-total').text(len);
			}
		});
	}

	function render_streams(scraper_info) {
		$.each(scrapers, function(id, scraper) {
			if(! id in scraper_info) {
				$('#' + scrapers[id]['dom-ref']).remove();
				delete scrapers[id];
			}
		});

		$.each(scraper_info, function(id, scraper) {
			if(id in scrapers) {
				scrapers[id]['status'] = scraper['status'];
				scrapers[id]['rate'] = scraper['rate'];
				scrapers[id]['session'] = scraper['session'];
				scrapers[id]['limits'] = scraper['limits'];
				scrapers[id]['filter'] = scraper['filter'];

				change_indicator($('#' + scrapers[id]['dom-light']), indicator_color(scrapers[id]['status']));
				$('#' + scrapers[id]['dom-rate']).text(scrapers[id]['rate']);
				$('#' + scrapers[id]['dom-session']).text(scrapers[id]['session']);
				$('#' + scrapers[id]['dom-limits']).text(scrapers[id]['limits']);
				$('#' + scrapers[id]['dom-filter']).val(scrapers[id]['filter']);
			}

			else {
				scrapers[id] = scraper;
				scrapers[id]['dom-ref'] = 'sid' + id;
				scrapers[id]['dom-light'] = 'sid' + id + '-light';
				scrapers[id]['dom-rate'] = 'sid' + id + '-rate';
				scrapers[id]['dom-session'] = 'sid' + id + '-session';
				scrapers[id]['dom-limits'] = 'sid' + id + '-limits';
				scrapers[id]['dom-filter'] = 'sid' + id + '-filter';
				var html = ' \
					<div id="' + scrapers[id]['dom-ref'] + '" class="span8"> \
						<h3>' + scrapers[id]['name'] + '</h3> \
						<div class="row"> \
							<div class="span1"> \
								<div id="' + scrapers[id]['dom-light'] + '" class="grey-light"></div> \
							</div> \
							<div class="span2"> \
								<p><span id="' + scrapers[id]['dom-rate'] + '" class="big-text">--</span> \
								<span class="muted">tpm</span></p> \
							</div> \
							<div class="span2"> \
								<p><span id="' + scrapers[id]['dom-session'] + '" class="big-text">--</span> \
								<span class="muted">this session</span></p> \
							</div> \
							<div class="span2"> \
								<p><span id="' + scrapers[id]['dom-limits'] + '" class="big-text">--</span> \
								<span class="muted">limits</span></p> \
							</div> \
							<div class="span1"> \
								<a class="btn" href="#"><i class="icon-refresh"></i></a> \
							</div> \
						</div> \
						<textarea id="' + scrapers[id]['dom-filter'] + '"  class="span8" rows="3" cols="100" readonly="readonly"></textarea> \
					</div> \
					'
				$('#div-scrapers').append(html);

				change_indicator($('#' + scrapers[id]['dom-light']), indicator_color(scrapers[id]['status']));
				$('#' + scrapers[id]['dom-rate']).text(scrapers[id]['rate']);
				$('#' + scrapers[id]['dom-session']).text(scrapers[id]['session']);
				$('#' + scrapers[id]['dom-limits']).text(scrapers[id]['limits']);
				$('#' + scrapers[id]['dom-filter']).val(scrapers[id]['filter']);
			}
		});
	}

	function indicator_color(status) {
		if(status == CONNECTED) {
			return 'green-light';
		}
		else if(status == FAILED) {
			return 'red-light';
		}
		else {
			return 'grey-light';
		}
	}
	
	var cl = console.log;
});

