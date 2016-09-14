Number.prototype.mod = function(n) {
	return ((this % n) + n) % n;
}

var data = {
	"tunings": {
		"standard": {
			"name": "Standard",
			"openNotes": ['E2', 'A2', 'D3', 'G3', 'B3', 'E4']
		},
		"openE": {
			"name": "Open E",
			"openNotes": ['E2', 'B2', 'E3', 'G#3', 'B3', 'E4']
		},
		"openG": {
			"name": "Open G",
			"openNotes": ['D2', 'G2', 'D3', 'G3', 'B3', 'E4']
		}
	},
	"scales": {
		"minorBlues": {
			"name": "Minor Blues",
			"intervals": [0, 3, 5, 6, 7, 10, 12]
		},
		"majorBlues": {
			"name": "Major Blues",
			"intervals": [0, 2, 5, 7, 9, 12]
		},
		"minor": {
			"name": "Minor",
			"intervals": [0, 2, 3, 5, 7, 8, 11, 12]
		},
		"major": {
			"name": "Major",
			"intervals": [0, 2, 4, 5, 7, 9, 11, 12]
		}
	},
	"speeds": {
		"1": 1,
		"1/2": .5,
		"1/4": .25,
		"1/8": .125,
		"1/16": .0625
	}
};

window.jsTuner = {
	fullScale: ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'],
	intervals: ['R', 'm2', 'M2', 'm3', 'M3', 'P4', 'A4', 'P5', 'm6', 'M6', 'm7', 'M7'],
	colors: ['00bce6', 'ff842c', '00d24a', 'efff00', 'ae55ff', 'ff3f3f', '2961ff', '52fff7', 'ff5ac5', 'a6dd99', '1bff00', '7a15ff'],
	freqC0: 16.352,
	
	numFrets: 12,
	tuning: 'standard',
	key: 'E',
	scale: 'minorBlues',
	displayMode: 'notes',
	speed: .125,
	
	timer: null,
	playing: false,
	
	frets: [],
	intervalMap: {},

	running: {},
	
	parseSciNote: function(note) {
		return {
			note: note.substring(0, note.length - 1),
			octave: parseInt(high.slice(-1))
		}
	},
	
	relPos: function(note) {
		
		if (note.slice(-1).match(/\d/)) {
			note = note.substring(0, note.length - 1);
		}
	
		return this.fullScale.indexOf(note);
	},
	
	absPos: function(note) {
	
		var octave = note.slice(-1);
		if (!octave.match(/\d/)) {
			octave = 0;
		}
		
		return octave * 12 + this.relPos(note);
	},
	
	noteFromOffset(offset) {
		return this.fullScale[offset % 12] + Math.floor(offset / 12);
	},
	
	noteFromStringFret(string, fret) {
		return this.noteFromOffset(this.absPos(data.tunings[this.tuning].openNotes[string]) + fret);
	},
	
	getScaleDiff: function(high, low) {
		return (this.absPos(high) - this.absPos(low)).mod(12);
	},
	
	renderNeck: function() {
		var self = this;
		
		$('#button-table').empty();
		
		// create interval mapping
		$.each(this.fullScale, function(k, note) {
			self.intervalMap[note] = self.intervals[self.getScaleDiff(note, self.key)];
		});

		// create neck
		for (var string = 0, fretID = 0; string < 6; ++string) {
		
			var openNotes = data.tunings[this.tuning].openNotes;
		
			var stringOffset = this.getScaleDiff(openNotes[string], 'C0');
			var $row = $('<tr></tr>');

			for (var fret = 0; fret <= this.numFrets; ++fret) {
			
				var i = stringOffset + fret;
				var note = this.fullScale[i % 12];
				var octave = Math.floor(i / 12);
				
				var ref = '';
				if ((string == 2 &&
					((fret % 12) == 2 ||
					(fret % 12) == 4 ||
					(fret % 12) == 6 ||
					(fret % 12) == 8)) ||
					((string == 1 || string == 3) && (fret % 11) == 0 && fret != 0)) {

					ref = 'ref';
				}
				
				this.frets[fretID] = {
					note: note,
					noteOffset: $.inArray(note, this.fullScale),
					stringPosition: fret,
					octave: octave,
					string: string,
					root: fret == 0
				};
				
				var fretDisplay = (this.displayMode == 'notes') ? note : this.intervalMap[note];
				
				$row.append($('<td class="note"><div class="' + ref + '"></div><div class="button" data-fret-id="' + fretID++ + '">' + fretDisplay + '</div></td>'));
			}
			
			$('#button-table').prepend($row);
		}

		// color neck
		switch($('#highlight-select').val()) {
			case 'all':
				$('.button').each(function() {
					var fretInfo = self.frets[$(this).data('fret-id')];
					$(this).css('border-color', '#' + self.colors[fretInfo.noteOffset]);
				});
			break;
			case 'root':
				$('.button').css('border-color', '#CCCCCC');
				$('.button').each(function() {
					var fretInfo = self.frets[$(this).data('fret-id')];
					if (fretInfo.note == self.key) {
						$(this).css('border-color', '#' + self.colors[fretInfo.noteOffset]);
					}
				});
			break;
			case 'scale':
				$('.button').css('border-color', '#CCCCCC');
				
				var scaleNotes = [];
				var rootOffset = $.inArray($('#key-select').val(), self.fullScale);
				$.each(data.scales[$('#scale-select').val()].intervals, function(k, v) {
					scaleNotes.push(self.fullScale[(rootOffset + v).mod(12)]); 
				});
				
				$('.button').each(function() {
					var fretInfo = self.frets[$(this).data('fret-id')];
					if ($.inArray(fretInfo.note, scaleNotes) != -1) {
						$(this).css('border-color', '#' + self.colors[fretInfo.noteOffset]);
					}
				});
			break;
		}
	},
	
	go: function() {
	
		var self = this;
		
		for (var i = 0; i < 24; ++i) {
			$('#frets-select').append($('<option value="' + i + '" ' + ((self.numFrets == i) ? 'selected="selected"' : '') + '>' + i + '</option>'));
		}
		
		$.each(data.tunings, function(k, v) {
			$('#tuning-select').append($('<option value="' + k + '" ' + ((self.tuning == k) ? 'selected="selected"' : '') + '>' + v.name + '</option>'));
		});
		
		$.each(data.scales, function(k, v) {
			$('#scale-select').append($('<option value="' + k + '" ' + ((self.scale == k) ? 'selected="selected"' : '') + '>' + v.name + '</option>'));
		});
		
		$.each(this.fullScale, function(k, v) {
			$('#key-select').append($('<option value="' + v + '" ' + ((self.key == v) ? 'selected="selected"' : '') + '>' + v + '</option>'));
		});
		
		$.each(data.speeds, function(k, v) {
			$('#speed-select').append($('<option value="' + v + '" ' + ((self.speed == v) ? 'selected="selected"' : '') + '>' + k + '</option>'));
		});
		
		$('#go').on('click', function(e) {
			if (!self.playing) {
				$(this).html('Stop');
				self.playTab();
			} else {
				$(this).html('Play');
				self.stopTab();
			}
		});
		
		$('select').on('change', function(e) {
		
			var val = $(e.currentTarget).val();
			switch ($(e.currentTarget).attr('id')) {
				case 'tuning-select':
					self.tuning = val;
				break;
				case 'scale-select':
					self.scale = val;
				break;
				case 'key-select':
					self.key = val;
				break;
				case 'frets-select':
					self.numFrets = parseInt(val);
				break;
				case 'display-select':
					self.displayMode = val;
				break;
				case 'speed-select':
					self.speed = val;
					return;
				break;
			}
			
			self.renderNeck();
		});
		
		$(document).on('click', '.button', function(e) {
			var fretInfo = self.frets[$(e.target).data('fret-id')];
			self.playNote(fretInfo.string, fretInfo.stringPosition);
		});
		
		this.renderNeck();
	},
	
	playNote: function(string, fret, callback) {
		var self = this;

		var fretID = string * (this.numFrets + 1) + fret;
		var $button = $('[data-fret-id = ' + fretID + ']');

		var info = this.running[string];
		if (info) {
			if (info.audio) {
				info.audio.pause();
				info.audio.currentTime = 0;
			}
			
			if ($button != info.$button) {
				info.$button.removeClass('active');
			}
		}

		var audio = new Audio('./resources/' + string + fret + '.mp3');
		audio.play().then(function() {
		
			$button.addClass('active');
			
			self.running[string] = {
				$button: $button,
				audio: audio
			}
			
			audio.onended = function() {
				$button.removeClass('active');
			};
		});
	},
	
/*
^ bend up
r release
h hammer on
p pull off
x
/ slide up
\ slide down

*/
	
	tabsReader: function() {
		
		var validChars = /[0-9]/;
		var timeChars = /[0-9hp\-]/;
		var timeSeries = {};
	
		var lines = $('#tab-text').val().split('\n');
		var maxTime;
		
		for (var i = 0, time = 0; i < lines.length; time += maxTime) {
		
			maxTime = 0;
			
			for (var string = 5; string >= 0 && i < lines.length; --string, ++i) {
		
				var line = lines[i];
				var buffer = '';
				
				for (var i2 = 0, lineTime = 0; i2 < line.length; ++i2) {
					var char = line[i2];
					
					if (char.match(validChars) || char.match(timeChars)) { ++lineTime; }
					
					if (!char.match(validChars)) {
						if (buffer.length) {
							var ctime = time + lineTime;
							if (!timeSeries[ctime]) { timeSeries[ctime] = {}; }

							timeSeries[ctime][string] = parseInt(buffer);
							buffer = '';
						}
					} else {
						buffer += char;
					}
					
					if (lineTime > maxTime) { maxTime = lineTime; }
				}
			}
		}
		
		return timeSeries;
	},
	
	stopTab: function() {
		clearInterval(this.timer);
		this.playing = false;
	},
	
	playTab: function() {
		var self = this;
		var timeSeries = this.tabsReader();

		var i = 0;
		this.timer = setInterval(function() {
		
			if (i == timeSeries.length - 1) { clearInterval(self.timer); }
			if (timeSeries[i]) {
			
				$.each(timeSeries[i], function(k, v) {
					self.playNote(k, v);
				});
			}
			
			++i;
		}, self.speed * 1000);
		
		self.playing = true;
	}
};

$(function() {
	jsTuner.go();
});