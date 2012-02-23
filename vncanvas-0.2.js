///////////////////////////////////////////////////////////////////////////////
//  Visual Novel JAVASCRIPT for HTML5 CANVAS by [lo'ner]                     //
//  Author: oclabbao@yahoo.com, oclabbao@gmail.com                           //
//  Based on:                                                                //
//      Construct2 - HTML5 game creator (www.scirra.com)                     //
//      js-vine.js by J. David Eisenberg                                     //
//      enchant.js by Ubiquitous Entertainment Inc.                          //
//      Ren'Py Python VN engine (www.renpy.org)                              //
//  Requires:                                                                //
//      CanvasText by Pere Monfort P�mies (www.pmphp.net, www.canvastext.com)//
//          - modded to support \n and hover in text                         //
//      [Optional] JQuery by John Resig (jquery.com)                         //
//  Rationale:                                                               //
//      A generic engine, whether event or messaging based, is a bit bloated //
//      for visual novel use. Not only are visual novels notoriously heavy   //
//      on resources (images, media) which engines try to preload at start,  //
//      they also do not require most of the features offered by these       //
//      engines. Hence, this is an attempt to create an engine suitable for  //
//      web-based visual novels, leaving story-tellers with just the task of //
//      story telling. Of course, this is not limited to visual novels, but  //
//      can also be used for ad promotions, PPT-like presentations, etc.     //
//      Oh, did I mention that it's cross-platform on an HTML5-capable       //
//      browser, absolutely malware/adware/spyware free (go ahead, inspect   //
//      the code. bet you can't do that on a flash or server-side script),   //
//      can be used online/offline and, on top of that, FREE.                //
///////////////////////////////////////////////////////////////////////////////
/******************************************************************************
	Copyright � 2012 by OCLabbao a.k.a [lo'ner]
	
    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU Lesser General Public License as published 
	by the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Lesser General Public License for more details.

    You should have received a copy of the GNU Lesser General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.

******************************************************************************/
/******************************************************************************
Revision history:
Version 0.2 Althea
02.21.12 - Improved memory handling (avoid leaks ?)
		 - Modify Vector2d class
02.13.12 - Recode 'atmosphere' (to be plugin-ready)
02.12.12 - Recode effects (to be plugin-ready)
02.10.12 - Recode 'box', script, stage and 'button'
		 - Added 'preload'
		 - Selectable 'video-on-canvas' or 'video-element'
02.09.12 - Added vector2d class (in anticipation for some future features)
		 - Optimized 'particles' for performance
		 - Recode 'scene', 'overlay'
		 - Recode 'actor'
02.06.12 - Recode 'user variables'
		 - Recode 'audio', 'video'
		 - Recode 'form'
		 - Bug fix for iOS user inputs
02.05.12 - Recode for "cleaner" encapsulation thru functional inheritance
		 - Recode 'atmosphere'
Version 0.1 Preview
02.02.12 - Added atmosphere 'snow', 'rain' direction
01.31.12 - Updated cutscene/movie to play in canvas
		 - Optimized method encapsulation
01.28.12 - Bugfix for non-modal dialog while checkpoint loading
		 - Bugfix for cross-browser compatibility (re:image constructor)
		 - Added timer cform element
		 - Added animated picture cform element
01.25.12 - Added macro for custom javascript
01.12.12 - Updated scene and overlay to accept HTML color
		 - Updated button (cform) to accept HTML color
		 - Optimized memory footprint (a bit)
01.11.12 - Added word filter
		 - Added URL jump
		 - Simplified atmosphere, added cloud and beam
01.09.12 - Added themes
		 - Forms can be instantiated in-game
01.06.12 - Implemented text effects
01.04.12 - Bug fix: avatar, checkpoint
		 - Implemented additional actor effects
		 - Implemented additional overlay effects
		 - Implemented additional background effects
12.30.11 - Simplified 'audio'
12.29.11 - Added configuration file (just the basics)
12.28.11 - Added a subset of HTML forms
12.26.11 - Simplified 'set' and 'jump'
12.25.11 - Added actor avatar
		 - Updated checkpoint saves to include avatar and forms
12.24.11 - Added video for intros, cutscenes, endings
		 - Updated demo and docs
12.21.11 - Added canvas forms (buttons only... so far)
12.20.11 - Added basic saves using checkpoint
         - Completed initial demo
12.08.11 - Added overlay and atmosphere basics
12.06.11 - Added actor basics
12.05.11 - Added script box, flow control using jump
12.01.11 - Basics for background image, music/sounds, flow control using wait
11.27.11 - File creation
******************************************************************************/

///////////////////////////////////////////////////////////////////////////////
// Generic/helper methods
///////////////////////////////////////////////////////////////////////////////
var Helper = {
	// Function for adding an event listener
	_registry: null,
	initialise: function() {
		if (this._registry == null) {
			this._registry = [];
			Helper.addEvent(window, 'unload', this.cleanUp);
		}
	},
	cleanUp: function() {
		for (var i = 0; i < Helper._registry.length; i++) {
			with (Helper._registry[i]) {
				if (obj.removeEventListener)
					obj.removeEventListener(evType, fn, useCapture);
				else if (obj.detachEvent)
					obj.detachEvent("on" + evType, fn);
			}
		}
		Helper._registry = null;
    },	
	addEvent: function (obj, evType, fn, useCapture) {
		this.initialise();
		if (typeof obj == 'string')
			obj = document.getElementById(obj);
		if ((obj == null) || (fn == null))
			return false;
		if (obj.addEventListener) {
			obj.addEventListener(evType, fn, useCapture);
			this._registry.push({obj: obj, evType: evType, fn: fn, useCapture: useCapture});
			return true;
		}
		if (obj.attachEvent) {
			var r = obj.attachEvent("on" + evType, fn);
			if (r) this._registry.push({obj: obj, evType: evType, fn: fn, useCapture: false});
			return r;
		}
		return false;
	},
	// Function for including external javascript files
	includeJs: function (jsFilePath) {
	    var js = document.createElement("script");
	    js.type = "text/javascript";
	    js.src = jsFilePath;
	    //document.getElementsByTagName('head')[0].appendChild(js);
		document.body.appendChild(js);
		js = null;
	},
	// Function to check support for localStorage
	supportsLocalStorage: function () {
	  try {
	    return 'localStorage' in window && window['localStorage'] !== null;
	  } catch(e){
	    return false; 
	  }
	},
	// Helper function to search for user variable
	findVar: function (id) {
		if (Stage.variables[id] != null)
			return Stage.variables[id].Value();
		return null;
	},
	// Helper function to obtain value from stage or config variables
	getValue: function (id) {
		var ret = Helper.findVar(id);
		if (ret != null) return ret;
		return (Config[id]);
	},
	// Helper function to set value to stage or config variables
	setValue: function (id, value) {
		var ret = Helper.findVar(id);
		if (ret != null)
			Stage.variables[id].Set(value);
		else {
			Config[id] = value;
			// a configuration variable has changed, reflect it back
			Helper.configUpdate(id);
			Stage.redraw = true;
		}
	},
	// Helper function to update game config
	configUpdate: function (id) {
		switch(id) {
			case "activeTheme": 
				// formstyle
				if (Config.activeTheme.formFontStyle) {
					Stage.formStyle.splice(0, Stage.formStyle.length);
					var subs = Helper.parseFontString(Config.activeTheme.formFontStyle);
					if (subs.length >= 4) {
						Stage.formStyle.push(subs.slice(0,3).join(' '));
						Stage.formStyle.push(subs.slice(3).join(' '));
					}
					else
						Stage.formStyle.push(param);
				}
				// tooltips are automatically updated
				// script box
				if (Config.activeTheme.boxFontStyle) { 
					var subs = Helper.parseFontString(Config.activeTheme.boxFontStyle);
					
					if (subs.length > 0) Stage.layers[4][0].fontWeight = subs[0];
					if (subs.length > 1) {
						Stage.layers[4][0].fontSize = subs[1];
						Stage.layers[4][0].lineHeight = parseInt(subs[1]) + 4;
					}			
					if (subs.length > 2) Stage.layers[4][0].fontFamily = subs[2].replace(/\'/g,'');
					if (subs.length > 3) Stage.layers[4][0].fontColor = subs[3];
				}
				if (Config.activeTheme.boxTagStyle) {
					var subs = Helper.parseFontString(Config.activeTheme.boxTagStyle);
					
					if (subs.length > 0) Stage.layers[4][0].tagWeight = subs[0];
					if (subs.length > 1) Stage.layers[4][0].tagSize = subs[1];
					if (subs.length > 2) Stage.layers[4][0].tagFamily = subs[2].replace(/\'/g,'');
					if (subs.length > 3) Stage.layers[4][0].tagColor = subs[3];
				}
				if (Config.activeTheme.boxDimStyle) {
					var subs = Config.activeTheme.boxDimStyle.split(' ');
					Stage.layers[4][0].dimStyle.splice(0,Stage.layers[4][0].dimStyle.length);
					for (var idx in subs)
						Stage.layers[4][0].dimStyle.push(subs[idx]);
				}
				if (Config.activeTheme.boxImageStyle)
					Stage.layers[4][0].src = Config.activeTheme.boxImageStyle;
				else
					Stage.layers[4][0].src = null;
				// configure CanvasText
				Stage.layers[4][0].canvasText.config({
			        canvas: Stage.layers[4][0].context.canvas,
			        context: Stage.layers[4][0].context,
			        fontFamily: Stage.layers[4][0].fontFamily,
			        fontSize: Stage.layers[4][0].fontSize,
			        fontWeight: Stage.layers[4][0].fontWeight,
			        fontColor: Stage.layers[4][0].fontColor,
			        lineHeight: Stage.layers[4][0].lineHeight
			    });			
				Stage.layers[4][0].canvasText.defineClass("menu", {
			        fontFamily: Stage.layers[4][0].fontFamily,
			        fontSize: Stage.layers[4][0].fontSize,
			        fontWeight: Stage.layers[4][0].fontWeight,
			        fontColor: Stage.layers[4][0].fontColor,
					fontStyle: "italic"
				});
				break;
			case "volumeAudio":
				for (var idx in Stage.sounds) {
					for (var entry in Stage.sounds[idx]) {
						if ((!Stage.sounds[idx][entry].isPaused) && (!Stage.sounds[idx][entry].isStopping))
							Stage.sounds[idx][entry].audio.volume = Config.volumeAudio;
					}
				}
				break;
			case "volumeVideo":
				for (var idx in Stage.videos) {
					if (!Stage.videos[idx].isStopping) {
						this.videos[idx].movie.volume = Config.volumeVideo;
					}
				}
				break;
		}
	},
	// Helper function to parse string arguments
	parseArg: function (arg) {
		var ret = Helper.findVar(arg);
		if (ret != null) return ret;
		ret = parseFloat(arg)
		if (isNaN(ret)) {
			if (arg.search(/(true|false)/g) != -1)
				return (arg == 'true');
			else
				return arg;
		}
		else
			return ret;
	},
	// Helper function to parse font string
	parseFontString: function (s) {
		var splitText = s.split(' ');
		// combine as needed
		var subs = new Array();
		var combine = false;
		var tempText = '';
		for (var i in splitText) {
			if (splitText[i].search("\'")!=-1) {
				if (combine == false) {
					combine = true;
					tempText = splitText[i];
				}
				else {
					combine = false;
					tempText += " " + splitText[i];
					subs.push(tempText);
				}
			}
			else {
				if (combine == true)
					tempText += " " + splitText[i];
				else
					subs.push(splitText[i]);
			}
		}
		return subs;
	},
	// Helper function to check for image file
	checkIfImage: function(src) {
		// crude way of checking if src is an image
		return (/jpg|jpeg|bmp|png|gif|svg/i.test(src));
	},
	// Helper function to check for audio file
	checkIfAudio: function(src) {
		return (/mp3|m4a|ogg|oga|wav|webma/i.test(src));
	},
	// Helper function to check for video file
	checkIfVideo: function(src) {
		return (/mp4|m4v|ogg|ogv|webm|webmv/i.test(src));
	},
	// Helper function to process audio
	processAudio: function (obj, src, param) {
		var mimeType = {"wav": 'audio/wav',
						"ogg": 'audio/ogg;codecs="vorbis"',
						"oga": 'audio/ogg;codecs="vorbis"',
						"mp3": 'audio/mpeg',
						"m4a": 'audio/mp4;codecs="mp4a.40.2"',
						"webma": 'audio/webm; codecs="vorbis"',};			
		var index = -1;
		for (var i in obj) {
			if (obj[i].src.search(src) != -1) {
				index = i;
				break;
			}
		}
		if (index != -1) {
			switch (param.action) {
				case "stop":
					obj[index].Stop(false);
					break;
				case "pause":
					obj[index].Pause();
					break;
				case "rewind":
					obj[index].Rewind();
					break;
				case "remove":
					if (param.bgs || param.se) {
						obj[index].Stop(true);
						obj[index].audio = null;
						obj.splice(index, 1);
					}
					break;
				case "play":
				default:
					obj[index].Play(false);
					break;
			}
		}
		else {
			var s = new Sounds();
			s.src = null;
			for (var i in param.format) {
				if (s.audio.canPlayType(mimeType[param.format[i]]) != '') {
					s.src = src + '.' + param.format[i];
					break;
				}
			}
			if (s.src != null) {
				if (param.bgm) {
					while (obj.length > 0) {
						var old = obj.shift();
						old.Stop(true);
						old.audio = null;
					}
				}
				if (param.se)
					s.repeat = (param.repeat > 0) ? param.repeat : 0;
				else
					s.repeat = -1;
				s.delay = (param.delay > 0) ? param.delay : 0;
				obj.push(s);
			}
			s = null;
		}
	},
	// Helper function to process actor
	processActor: function (chr, param) {
		if (param.sprite) {
			if (typeof param.sprite == 'string') {
				for (var i in chr.sprites) {
					if (chr.sprites[i] == param.sprite) {
						if (chr.visible) {
							chr.prevSprite = chr.activeSprite;
							chr.alpha = 0;
						}
						chr.activeSprite = i;
						break;
					}
				}
			}
			else {
				if (chr.visible && (chr.activeSprite > -1)) {
					chr.prevSprite = chr.activeSprite;
					chr.alpha = 0;
				}
				chr.AddSprite(param.sprite[0], param.sprite[1]);
			}
		}
		if (param.avatar) chr.AddAvatar(param.avatar);
		var ret = '';
		if (param.position) {
			var subs = param.position.split(' ');
			for (var i in subs) {
				if (subs[i].search(/(left|right|center|auto)/g) != -1) {
					chr.posMode = subs[i];
					if (subs[i] == 'left') {
						chr.pos.vx = (Stage.canvas.width/4)>>0;
						chr.target_pos.vx = chr.pos.vx;
					}
					if (subs[i] == 'right') {
						chr.pos.vx = (Stage.canvas.width*3/4)>>0;
						chr.target_pos.vx = chr.pos.vx;
					}
					if (subs[i] == 'center') {
						chr.pos.vx = (Stage.canvas.width/2)>>0;
						chr.target_pos.vx = chr.pos.vx;
					}
				}
				if (subs[i].search(/(front|back)/g) != -1)
					ret = subs[i];
			}
		}
		var suffix;
		if ((param.show == false) ||
			(param.remove == 'actor') ||
			(chr.sprites[chr.activeSprite].id == param.remove))
			suffix = '_out';
		else
			suffix = '_in';
		if (param.effect) {
			var fxarr = param.effect.split(' ');
			chr.effects = fxarr[0] + suffix;
			chr.prevFx = fxarr[0];
			if (fxarr.length > 1) chr.fxparam = fxarr.slice(1);
			if (TransEffects[fxarr[0]]['_init'])
				TransEffects[fxarr[0]]['_init'](chr, chr.fxparam);
		}
		else {
			chr.effects = chr.prevFx + suffix;
		}
		if (param.remove) {
			if (param.remove == 'actor')
				chr.pendingRemoval = true;
			else
				chr.RemoveSprite(param.remove);
		}
		if (param.time != null) 
			chr.transTime = (param.time>0) ? param.time : 0.1;
		if (param.say) {
			var cont = Helper.checkCurrentSpeaker(chr.nick, param.append);
			Stage.layers[4][0].text = Helper.addTagToDialog(chr.nick, chr.color, param.say, cont);
			Stage.layers[4][0].avatar = (chr.avatar != null) ? chr.avatar : null;
			Stage.layers[4][0].alpha = 1;
			Stage.layers[4][0].effects = "none";
			Stage.layers[4][0].scrollOffsetY = 0;
			Stage.layers[4][0].visible = true;
			Stage.layers[4][0].changed = true;
		}
		return ret;
	},
	// Helper function to process backdrop
	processBackdrop: function (obj, type, param) {
		var nextid = 0;
		if (obj.length > 0) {
			// background/overlay layer has more than one element
			// to conserve memory, maintain only the previous and the incoming backdrop
			while (obj.length > 1) {
				var object = obj.shift();
				object.image = null;
				object = null;
			}
			if (!param.src && (param.show != false)) {
				// show the previous overlay
				if (param.effect) {
					var fxarr = param.effect.split(' ');
					obj[0].effects = fxarr[0] + '_in';
					if (fxarr.length>1) obj[0].fxparam = fxarr.slice(1);
					if (TransEffects[fxarr[0]]['_init'])
						TransEffects[fxarr[0]]['_init'](obj[0], obj[0].fxparam);
				}
				else 
					obj[0].effects = '_in';
				obj[0].drawn = false;
				obj[0].update = false;
				return;
			}
			// do a reverse effect on the previous backdrop
			obj[0].effects = '_out';
			if (param.effect) {
				var fxarr = param.effect.split(' ');
				obj[0].effects = fxarr[0] + '_out';
				if (fxarr.length>1) obj[0].fxparam = fxarr.slice(1);
				if (TransEffects[fxarr[0]]['_init'])
					TransEffects[fxarr[0]]['_init'](obj[0], obj[0].fxparam);
			}
			obj[0].drawn = false;
			obj[0].update = false;
			nextid = parseInt(obj[0].context.canvas.id.substr(2))+1;
			if ((!param.src) && (param.show == false)) {
				return;
			}
		}
		// add the new backdrop
		var bd = new Backdrop();
		bd.type = type;
		var objects = new Array();
		if (param.objects) {
			// assumes multiples of 3
			for (var i=0; i<param.objects.length; i+=3) {
				var item = {src:'', x:0, y:0};
				item.src = param.objects[i];
				item.x = param.objects[i+1];
				item.y = param.objects[i+2];
				objects.push(item);
			}
		}
		bd.Create('bd' + nextid, param.src, (objects.length > 0) ? objects : null);
		if (param.effect) {
			var fxarr = param.effect.split(' ');
			bd.effects = fxarr[0] + '_in';
			if (fxarr.length > 1) 
				bd.fxparam = fxarr.slice(1);
			else {
				if (type == 'scene')
					bd.fxparam = (Stage.layers[0].length > 0);
				else
					bd.fxparam = (Stage.layers[2].length > 0);
			}
			if (TransEffects[fxarr[0]]['_init'])
				TransEffects[fxarr[0]]['_init'](bd, bd.fxparam);
		}
		else 
			bd.effects = '_in';
		if (param.time != null) 
			bd.transTime = (param.time>0) ? param.time : 0.1;
		if (param.offset) {
			if (typeof (param.offset) == "string")
				bd.scroll = (param.offset == 'scroll') ? true : false;
			else {
				bd.scroll = false;
				bd.offset = new Vector2d(param.offset[0],param.offset[1]);
			}
		}
		else {
			bd.scroll = false;
			bd.offset = new Vector2d(0,0);
		}
		obj.push(bd);
		bd = null;
	},
	// Helper function to process effects
	processEffects: function (obj, elapsed) {
		if (obj.effects.indexOf('done')!=-1) {
			obj.drawn = true;
			return;
		}
		var fxarr = obj.effects.split('_');
		if (fxarr[0] == '') fxarr[0] = 'none';
		if (fxarr.length == 1) fxarr.push('in');
		
		obj.target_alpha = 1.0;
		TransEffects[fxarr[0]]['_'+fxarr[1]](obj, elapsed);
	},
	// Helper function to draw visual elements
	drawElements: function(obj, layer) {
		if (!obj.visible) return false;

		Stage.context.save();
		Stage.context.translate(obj.pos.vx - obj.scale * obj.origin.vx + obj.offset.vx,
								obj.pos.vy - obj.scale * obj.origin.vy + obj.offset.vy);
		Stage.context.scale(obj.scale, obj.scale);
		Stage.context.drawImage(obj.context.canvas,
								Stage.AddDepth(layer, Stage.canvas.width/2 - Stage.coord.vx),
								Stage.AddDepth(layer, Stage.canvas.height/2 - Stage.coord.vy)/2,
								obj.context.canvas.width,
								obj.context.canvas.height);	
		Stage.context.restore();
		return (Stage.transTime>0);
	},
	// Helper to interpolate object position
	interpolatePosition: function(obj) {
		if (Stage.transTime <= 0) {
			obj.pos.copy(obj.target_pos);
			obj.startpos = null;
		}
		else {
			if ((obj.startpos == undefined) || (obj.startpos == null))
				obj.startpos = new Vector2d(obj.pos.vx, obj.pos.vy);
			obj.pos.lerp(obj.target_pos, obj.startpos, Stage.transTime/obj.transTime);
		}
	},
	// Helper function to get current speaker
	checkCurrentSpeaker: function(name, append) {
		var current_speaker = '';
		var startIdx = Stage.layers[4][0].text.indexOf(Stage.layers[4][0].tagFamily+";\'>");
		var endIdx = Stage.layers[4][0].text.indexOf("</style><br/>");
		if ((startIdx != -1) && (endIdx != -1)) {
			current_speaker = Stage.layers[4][0].text.substr(startIdx+Stage.layers[4][0].tagFamily.length+3, 
															 endIdx-startIdx-Stage.layers[4][0].tagFamily.length-3);
		}
		//return current_speaker;
		var same_window = false;
		if ((current_speaker != name) || (append == false)) {
			Stage.layers[4][0].cont = false;
			same_window = false;
		}
		else if (append == true) {
			Stage.layers[4][0].cont = true;
			same_window = true;
		}
		else {	// whatever value including undefined
			same_window = Stage.layers[4][0].cont;
		}
		return same_window;
	},
	// Helper function to add name tag, if any, to dialog
	addTagToDialog: function(tag, tagcolor, text, append) {
		var dialog = '';
		if (tag != null) {
			dialog = "<style=\'font-weight:" + Stage.layers[4][0].tagWeight +
						";color:" + tagcolor + 
						";font-size:" + Stage.layers[4][0].tagSize +
						";font-family:" + Stage.layers[4][0].tagFamily +
						";\'>" + tag + "</style><br/>";
		}
		if (append) {
			// strip speaker name here if present
			var index = Stage.layers[4][0].text.indexOf("</style><br/>");
			if (index!=-1)
				dialog += Stage.layers[4][0].text.slice(index+13);
			else 
				dialog += Stage.layers[4][0].text;
			dialog += '\n';
		}
		if (text != null) {
			var ret = Helper.findVar(text);
			if (ret != null)
				dialog += ret.toString().replace(/\n/g,"<br/>");
			else
				dialog += text.replace(/\n/g,"<br/>");
		}
		
		return Helper.filterBadWords(dialog);
	},
	// Helper function to show tooltip on forms
	showTooltip: function(tip) {
		Stage.context.save();
		Stage.context.fillStyle = Config.activeTheme.formTipColor;
		Stage.context.shadowColor = 'black';
		Stage.context.shadowBlur = 2;

		var subs = Helper.parseFontString(Config.activeTheme.formTipStyle);
		Stage.context.font = subs.slice(0,3).join(' ');
		var w = Stage.context.measureText(tip).width;
		var h = parseInt(subs[1]);
		var x = Math.min(Stage.coord.vx, Stage.canvas.width - w - 5);
		var y = Math.min(Stage.coord.vy, Stage.canvas.height - 2*h - 5);
		Stage.context.fillRect(x-5, y-5+h, w+10, h+10);
		//Stage.context.strokeRect(x-5, y-5+h, w+10, h+10);
		
		Stage.context.shadowBlur = 0;
		Stage.context.fillStyle = subs.slice(3).join(' ');
		Stage.context.textBaseline = 'top';
		Stage.context.fillText(tip, x, y + h);
		Stage.context.restore();
	},
	// Helper function to filter words, if enabled
	filterBadWords: function (str) {
		if (Config.gameMatureFilter) {
			var pattern = "/(^|\\n?|\\s*)("+Config.gameBadWords.join('|')+")($|\\n?|\\s*)/img";
			return str.replace(eval(pattern), Config.gameAltWord);
		}
		else
			return str;
	},
	// Helper function to display readable time
	convertTime: function (val) {
		var sec = val % 60;
		var min = (val - sec) / 60;
		min %= 60;
		var hr = (val - sec - 60*min) / 3600;
		if (hr > 0)
			return (hr.toString() + ':' + ((min<10)?'0':'') + min.toString() + ':' + ((sec<10)?'0':'') + sec.toString());
		else
			return (min.toString() + ':' + ((sec<10)?'0':'') + sec.toString());
	}
}
// Function to determine optimal animation frame
window.requestAnimFrame = (function(callback){
    return window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.oRequestAnimationFrame ||
    window.msRequestAnimationFrame ||
    function(callback){
        window.setTimeout(callback, 1000 / 60);
    };
})();
// Helper function on window resize
window.onresize = (function(){
	if (!Config.movieOnCanvas) {
		for (var idx in Stage.videos) {
			var x = Stage.canvas.offsetLeft + (1-Config.movieSize)/2 * Stage.canvas.width;
			var y = Stage.canvas.offsetTop + (1-Config.movieSize)/2 * Stage.canvas.height;
			Stage.videos[idx].movie.setAttribute('style', 'position:absolute; left:'+x+'px; top:'+y+'px');
		}
	}
	for (var i=0; i<document.forms.length; i++) {
		var x = Stage.canvas.offsetLeft;
		var y = Stage.canvas.offsetTop;
		document.forms[i].setAttribute('style', 'position:absolute; left:'+x+'px; top:'+y+'px;');
	}
});

///////////////////////////////////////////////////////////////////////////////
// Effects class
///////////////////////////////////////////////////////////////////////////////
var TransEffects = {
	// effect completed
	done: {
		_in: function(obj, elapsed) {
			obj.drawn = true;
		}
	},
	// default/no effect
	none: {
		_in: function(obj, elapsed) {
			obj.Reset(false);
			obj.alpha = 1.0;
			obj.effects = 'done';
			obj.drawn = true;
		},
		_out: function(obj, elapsed) {
			obj.alpha = 0.0;
			obj.effects = 'done';
			obj.drawn = true;
			obj.redraw = true;
			obj.visible = false;
		}
	},
	// fade effect
	fade: {
		_init: function(obj, param) {
			if ((obj.effects.indexOf('_in')!=-1) && (param==true))
				obj.alpha = -1;
		},
		_in: function(obj, elapsed) {
			obj.Reset(false);
			if (obj.alpha >= obj.target_alpha) {
				obj.effects = 'done';
				obj.drawn = true;
			}
			else {
				obj.alpha += elapsed/(obj.transTime * 1000);
			}
		},
		_out: function(obj, elapsed) {
			if (obj.alpha <= 0.0) {
				obj.effects = 'done';
				obj.drawn = true;
				obj.visible = false;
			}
			else {
				obj.alpha -= elapsed/(obj.transTime * 1000);
			}
			obj.redraw = true;
		}
	},
	// ghost effect
	ghost: {
		_init: function(obj, param) {
			obj.target_alpha = 0.5;
		},
		_in: function(obj, elapsed) {
			TransEffects.fade._in(obj, elapsed);
		},
		_out: function(obj, elapsed) {
			TransEffects.fade._out(obj, elapsed);
		}
	},
	// dissolve effect
	dissolve: {
		_in: function(obj, elapsed) {
			TransEffects.fade._in(obj, elapsed);
		},
		_out: function(obj, elapsed) {
			TransEffects.fade._out(obj, elapsed);
		}
	},
	// scale effect
	scale: {
		_init: function(obj, param) {
			obj.size = Helper.parseArg(param[0]);//parseFloat(param[0]);
			obj.fxparam = obj.size;
		},
		_in: function(obj, elapsed) {
			obj.Reset(false);
			obj.alpha = 1.0;
			obj.drawn = true;
			if (Math.abs(1-obj.scale/obj.fxparam) <= 0.01)
				obj.effects = 'done';
			else
				obj.scale *= Math.exp(Math.log(obj.fxparam/obj.scale)*elapsed/(obj.transTime * 1000));
		},
		_out: function(obj, elapsed) {
			if (obj.type == 'scene')
				TransEffects.none._in(obj, elapsed);
			else
				TransEffects.none._out(obj, elapsed);
		}
	},
	// rotate effect
	rotate: {
		_init: function(obj, param) {
			obj.fxparam = Helper.parseArg(param[0]);//parseFloat(param[0]);
			obj.orientation += obj.fxparam;
			obj.orientation %= 360;
		},
		_in: function(obj, elapsed) {
			obj.Reset(false);
			obj.alpha = 1.0;
			obj.drawn = true;
			if (Math.abs(obj.accum_rotation - obj.fxparam) <= 0.1) {
				obj.effects = 'done';
				obj.rotation = 0;
				obj.accum_rotation = 0;
			}
			else {
				obj.rotation = (obj.fxparam - obj.accum_rotation)* elapsed/(obj.transTime * 1000);
				obj.accum_rotation += obj.rotation;
			}		
		},
		_out: function(obj, elapsed) {
			if (obj.type == 'scene')
				TransEffects.none._in(obj, elapsed);
			else
				TransEffects.none._out(obj, elapsed);
		}		
	},
	// translate effect
	translate: {
		_init: function(obj, param) {
			if (param && (param.length>1)) {
				obj.target_pos.vx += Helper.parseArg(param[0]);//parseFloat(param[0]);
				obj.target_pos.vy += Helper.parseArg(param[1]);//parseFloat(param[1]);
			}
		},
		_in: function(obj, elapsed) {
			obj.Reset(false);
			obj.drawn = true;
			obj.alpha = 1.0;
			Helper.interpolatePosition(obj);
			if (Stage.transTime <=0) obj.effects = 'done';
		},
		_out: function(obj, elapsed) {
			if (obj.type == 'scene')
				TransEffects.none._in(obj, elapsed);
			else
				TransEffects.none._out(obj, elapsed);
		},	
	},
	// movement effects
	left: {
		_init: function(obj, param) {
			if (obj.effects.indexOf('_in')!=-1)
				obj.pos.vx = -obj.context.canvas.width;
			else
				obj.target_pos.vx = -obj.context.canvas.width;
		},
		_in: function(obj, elapsed) {
			obj.Reset(false);
			obj.drawn = true;
			obj.alpha = 1.0;
			Helper.interpolatePosition(obj);
			if (Stage.transTime <=0) obj.effects = 'done';
		},
		_out: function(obj, elapsed) {
			if (obj.type == 'scene') {
				TransEffects.none._in(obj, elapsed);
			}
			else {
				obj.redraw = true;
				obj.drawn = true;
				Helper.interpolatePosition(obj);
				if (Stage.transTime <=0) obj.effects = 'done';
			}
		}
	},
	right: {
		_init: function(obj, param) {
			if (obj.effects.indexOf('_in')!=-1)
				obj.pos.vx = Stage.canvas.width + obj.context.canvas.width;
			else
				obj.target_pos.vx = Stage.canvas.width + obj.context.canvas.width;
		},
		_in: function(obj, elapsed) {
			obj.Reset(false);
			obj.drawn = true;
			obj.alpha = 1.0;
			Helper.interpolatePosition(obj);
			if (Stage.transTime <=0) obj.effects = 'done';
		},
		_out: function(obj, elapsed) {
			if (obj.type == 'scene') {
				TransEffects.none._in(obj, elapsed);
			}
			else {
				obj.redraw = true;
				obj.drawn = true;
				Helper.interpolatePosition(obj);
				if (Stage.transTime <=0) obj.effects = 'done';
			}
		}
	},
	bottom: {
		_init: function(obj, param) {
			if (obj.effects.indexOf('_in')!=-1)
				obj.pos.vy = Stage.canvas.height + obj.context.canvas.height;
			else
				obj.target_pos.vy = Stage.canvas.height + obj.context.canvas.height;
		},
		_in: function(obj, elapsed) {
			obj.Reset(false);
			obj.drawn = true;
			obj.alpha = 1.0;
			Helper.interpolatePosition(obj);
			if (Stage.transTime <=0) obj.effects = 'done';
		},
		_out: function(obj, elapsed) {
			if (obj.type == 'scene') {
				TransEffects.none._in(obj, elapsed);
			}
			else {
				obj.redraw = true;
				obj.drawn = true;
				Helper.interpolatePosition(obj);
				if (Stage.transTime <=0) obj.effects = 'done';
			}
		}
	},
	top: {
		_init: function(obj, param) {
			if (obj.effects.indexOf('_in')!=-1)
				obj.pos.vy = -obj.context.canvas.height;
			else
				obj.target_pos.vy = -obj.context.canvas.height;
		},
		_in: function(obj, elapsed) {
			obj.Reset(false);
			obj.drawn = true;
			obj.alpha = 1.0;
			Helper.interpolatePosition(obj);
			if (Stage.transTime <=0) obj.effects = 'done';
		},
		_out: function(obj, elapsed) {
			if (obj.type == 'scene') {
				TransEffects.none._in(obj, elapsed);
			}
			else {
				obj.redraw = true;
				obj.drawn = true;
				Helper.interpolatePosition(obj);
				if (Stage.transTime <=0) obj.effects = 'done';
			}
		}
	}
};
///////////////////////////////////////////////////////////////////////////////
// Rect class
///////////////////////////////////////////////////////////////////////////////
function Rect(x, y, w, h) {
	this.x = x;
	this.y = y;
	this.w = w;
	this.h = h;
}
///////////////////////////////////////////////////////////////////////////////
// 2D vector class
///////////////////////////////////////////////////////////////////////////////
function Vector2d(x, y) {
	this.vx = x;
	this.vy = y;
}
Vector2d.prototype.copy = function (vec2) {
	this.vx = vec2.vx;
	this.vy = vec2.vy;
};
Vector2d.prototype.scale = function (scale) {
	this.vx *= scale;
	this.vy *= scale;
};
Vector2d.prototype.add = function (vec2) {
	this.vx += vec2.vx;
	this.vy += vec2.vy;
};
Vector2d.prototype.sub = function (vec2) {
	this.vx -= vec2.vx;
	this.vy -= vec2.vy;
};
Vector2d.prototype.equal = function (vec2) {
	return ((this.vx == vec2.vx) && (this.vy == vec2.vy));
};
Vector2d.prototype.length = function () {
	return Math.sqrt(this.vx * this.vx + this.vy * this.vy);
};
Vector2d.prototype.lengthSquared = function () {
	return this.vx * this.vx + vec.vy * vec.vy;
},
Vector2d.prototype.normalize = function () {
	var len = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
	if (len) {
		this.vx /= len;
		this.vy /= len;
	}
    return len;
};
Vector2d.prototype.rotate = function (angle) {
	var vx = this.vx,
		vy = this.vy,
		cosVal = Math.cos(angle),
		sinVal = Math.sin(angle);
		this.vx = vx * cosVal - vy * sinVal;
		this.vy = vx * sinVal + vy * cosVal;
};
Vector2d.prototype.lerp = function (vec1, vec2, amt) {
	this.vx = (1-amt) * vec1.vx + (amt) * vec2.vx;
	this.vy = (1-amt) * vec1.vy + (amt) * vec2.vy;
};

///////////////////////////////////////////////////////////////////////////////
// Script method callback/handlers
///////////////////////////////////////////////////////////////////////////////
// label - marks a position in the script
function label(param) { /*alert(param);*/ }
// message - display a message box
function message(param) { alert(param); }
// wait - pauses execution
function wait(param) {
	Stage.pause = true;
	if (param > 0) {
		Stage.utimer = setTimeout(function() { 
			Stage.pause = false; 
			Stage.utimerOn = false;
		}, param * 1000);
		Stage.utimerOn = true;
	}
}
// macro - execute a user function
function macro(param) {
	if (Config.gameAllowMacro)
		eval(param)();
}
// set - sets a user variable
function set(param) {
	var str_param = JSON.stringify(param);
	var arr_param = str_param.replace(/[{|}]/g,'').split(/[' '|:|,]/g);
	for (var i=0; i<arr_param.length; i+=2) {
		arr_param[i] = eval(arr_param[i]);
		arr_param[i+1] = eval(arr_param[i+1]);
		var value = Helper.findVar(arr_param[i]);
		if (value != null) {
			if (typeof arr_param[i+1] == 'string') {
				// if value is a reference to other variables
				var ref = Helper.findVar(arr_param[i+1]);
				if (ref != null)
					Stage.variables[arr_param[i]].Set(ref);
				else {
					// is it an expression with supported operator
					if (arr_param[i+1].search(/[+|-|*|%|\/]/g) != -1)
						Stage.variables[arr_param[i]].Set(eval(Stage.variables[arr_param[i]].Value() + arr_param[i+1]));
					// or a simple string to set
					else
						Stage.variables[arr_param[i]].Set(arr_param[i+1]);
				}
			}
			else {
				Stage.variables[arr_param[i]].Set(arr_param[i+1]);
			}
		}
		else {
			var uv = new UserVars();
			if (typeof arr_param[i+1] == 'string') {
				var ref = Helper.findVar(arr_param[i+1]);
				uv.Set((ref != null) ? ref : arr_param[i+1]);
			}
			else
				uv.Set(arr_param[i+1]);
			Stage.variables[arr_param[i]] = uv;
			uv = null;
		}	
	}
}
// get - gets value of a user variable
function get(param) {
	return Helper.findVar(param.name);
}
// jump - continues execution at given label
function jump(param) {
	if (typeof param == 'string') {
		if (param == 'return') {
			Stage.script.PopFrame();
			Stage.pause = true;
		}
		else if (param.indexOf("http") != -1) {
			var newwin = window.open(param);
			window.setTimeout('newwin.focus();', 250);
		}
		else {
			Stage.script.PushFrame();
			Stage.script.SetFrame(param);
		}
	}
	else {
		Stage.script.PushFrame();
		var str_param = JSON.stringify(param);
		var arr_param = str_param.replace(/[{|}]/g,'').split(/[' '|:|,]/g);
		for (var i=0; i<arr_param.length; i+=2) {
			arr_param[i] = eval(arr_param[i]);
			arr_param[i+1] = eval(arr_param[i+1]);
			if (arr_param[i] == 'label') continue;

			var val = Helper.getValue(arr_param[i]);
			if (val != null) {
				if (typeof val == 'number') {
					if (val >= arr_param[i+1])
						Stage.script.SetFrame(param.label);
				}
				else if (typeof val ==  'string') {
					if (ret === arr_param[i+1])
						Stage.script.SetFrame(param.label);
				}
				else {
					if (val == arr_param[i+1])
						Stage.script.SetFrame(param.label);
				}
			}
		}
	}
	Stage.layers[4][0].jumpTo.splice(0,Stage.layers[4][0].jumpTo.length);
}
function preload(param) {
	// TODO: here's a crude preload support
	if (Config.gameAllowPreload) {
		if ((typeof param == 'string') && (param == 'auto')){
			var seq = Stage.script.sequence;
			for (var i=Stage.script.frame; i<seq.length; i+=2) {
				if ((seq[i] == scene) || (seq[i] == overlay)) {
					if ((seq[i+1].src) && (Helper.checkIfImage(seq[i+1].src))) {
						var newImage = new Image();
						newImage.src = seq[i+1].src;
						newImage = null;
					}						
					if (seq[i+1].objects) {
						for (var j=0; j<seq[i+1].objects.length; j+=3) {
							var newImage = new Image();
							newImage.src = seq[i+1].objects[j];
							newImage = null;
						}
					}
				}
				if (seq[i] == actor) {
					if (seq[i+1].sprite) {
						var newImage = new Image();
						newImage.src = seq[i+1].sprite[1];
						newImage = null;
					}
					if (seq[i+1].avatar) {
						var newImage = new Image();
						newImage.src = seq[i+1].avatar;
						newImage = null;
					}
				}
				if (seq[i] == audio) {
					var soundfile;
					if (seq[i+1].bgm) soundfile = seq[i+1].bgm;
					if (seq[i+1].bgs) soundfile = seq[i+1].bgs;
					if (seq[i+1].se) soundfile = seq[i+1].se;
					if (seq[i+1].format) {
						for (var j=0; j<seq[i+1].format.length; j++) {
							var newAudio = new Audio();
							newAudio.preload = 'auto';
							newAudio.autoplay = false;
							newAudio.src = soundfile + '.' + seq[i+1].format[j];
							newAudio = null;
						}
					}
				}
				if (seq[i] == video) {
					var videofile;
					if (seq[i+1].src) videofile = seq[i+1].src;
					if (seq[i+1].format) {
						for (var j=0; j<seq[i+1].format.length; j++) {
							var newVideo = document.createElement('video');
							newVideo.preload = 'auto';
							newVideo.autoplay = false;
							newVideo.src = videofile + '.' + seq[i+1].format[j];
							newVideo = null;
						}
					}
				}
			}
			seq = null;
			return;
		}
		var preloadObj = new Array(param.length);
		for (var i=0; i<param.length; i++) {
			if (Helper.checkIfImage(param[i])) {
				preloadObj[i] = new Image();
				preloadObj[i].src = param[i];
			}
			if (Helper.checkIfAudio(param[i])) {
				preloadObj[i] = new Audio();
				preloadObj[i].preload = 'auto';
				preloadObj[i].autoplay = false;
				preloadObj[i].src = param[i];
			}
			if (Helper.checkIfVideo(param[i])) {
				preloadObj[i] = document.createElement('video');
				preloadObj[i].preload = 'auto';
				preloadObj[i].autoplay = false;
				preloadObj[i].src = param[i];
			}
			preloadObj[i] = null;
		}
		preloadObj = null;
	}
}
// scene - displays a background (layer 0)
function scene(param) {
	Helper.processBackdrop(Stage.layers[0], 'scene', param);
	Stage.Transition(param.time);
}
// actor - create and display character (layer 1)
function actor(param) {
	var idx = -1;
	if (Stage.layers[1].length > 0) {
		// look for same id
		for (var i=0; i<Stage.layers[1].length; i++) {
			if (Stage.layers[1][i].id == param.id) {
				idx = i;
				break;
			}
		}
		if (idx != -1) {
			// update an existing actor
			var updchar = Helper.processActor(Stage.layers[1][idx], param);
			// check if a reorder is needed
			if (updchar != '') {
				var chr = Stage.layers[1][idx];
				Stage.layers[1].splice(idx, 1);
				if (updchar == 'front')
					Stage.layers[1].push(chr);
				else if (updchar == 'back')
					Stage.layers[1].unshift(chr);
			}
			// done updating, do not trickle down
			Stage.layers[1][idx].drawn = false;
			Stage.layers[1][idx].update = false;
			//Stage.layers[1][idx].redraw = true;
			if ((Stage.layers[1][idx].visible && (Stage.layers[1][idx].effects.indexOf('out')!=-1)) ||
				(!Stage.layers[1][idx].visible && (Stage.layers[1][idx].effects.indexOf('in')!=-1)) ||
				((param.position) && (param.position.search(/(left|right|center|auto)/g) != -1)))
				Stage.Transition(Stage.layers[1][idx].transTime);	
			return;
		}
	}
	// this is a new actor
	var chr = new Character(param.id);
	//chr.Create(param.id);
	chr.nick = (param.nick) ? param.nick : param.id;
	chr.color = (param.color) ? param.color : Stage.layers[4][0].tagColor;
	var addchar = Helper.processActor(chr, param);
	if (addchar == 'back')
		Stage.layers[1].unshift(chr);
	else
		Stage.layers[1].push(chr);	
	Stage.Transition(chr.transTime);
	chr = null;
}
// overlay - displays an overlay image (layer 2)
function overlay(param) {
	Stage.Transition(param.time);
	Helper.processBackdrop(Stage.layers[2], 'overlay', param);
}
// atmosphere - create atmosphere effects (layer 3)
function atmosphere(param) {
	var str_param = JSON.stringify(param);
	var arr_param = str_param.replace(/[{|}]/g,'').split(/[' '|:|,]/g);
	
	// for plugins compatibility, first parameter must identify type of atmo effect
	var type = eval(arr_param[0]);
	arr_param[1] = eval(arr_param[1]);
	var action = 'start';
	if (arr_param[1].toString().search(/(start|stop)/g) != -1)
		action = arr_param[1];
		
	for (var i=0; i<Stage.layers[3].length; i++) {
		if (Stage.layers[3][i].type == type) {
			Stage.layers[3][i].action = (action) ? action : 'start';
			if (Stage.layers[3][i].action == 'start')
				Stage.layers[3][i].Init(type, param);
			return;
		}
	}
	var nextid = (Stage.layers[3].length > 0) ? 
				parseInt(Stage.layers[3][Stage.layers[3].length-1].context.canvas.id.substr(3))+1 : 0;
	var atm = new Atmosphere('atm'+nextid);
	//atm.Create('atm'+nextid);
	atm.Init(type, param);	
	Stage.layers[3].push(atm);
	atm = null;
}
// box - configures script box (layer 4)
function box(param) {
	if (param.show == true)
		Stage.layers[4][0].visible = true;
	else {
		Stage.layers[4][0].visible = false;
		Stage.layers[4][0].text = '';
	}
	if (param.pos) Stage.layers[4][0].pos = param.pos;
	if (param.back) {
		Stage.layers[4][0].back = param.back;
		Stage.layers[4][0].src = Config.activeTheme.boxImageStyle;
	}
	if (param.prompt) {
		if (param.prompt == "none") {
			Stage.layers[4][0].psrc = '';
		}
		else {
			Stage.layers[4][0].isready = false;
			Stage.layers[4][0].psrc = param.prompt;
			Stage.layers[4][0].prompt.src = param.prompt;
		}
	}
	if (param.align) {
		Stage.layers[4][0].textAlign = param.align;
	}
	// assumes this function won't be called unless there are some changes somewhere
	Stage.layers[4][0].changed = true;
}
// text - display text in script box (layer 4)
function text(param) {
	Stage.layers[4][0].avatar = null;
	Stage.layers[4][0].alpha = 1;
	Stage.layers[4][0].effects = "none";
	Stage.layers[4][0].scrollOffsetY = 0;
	if (typeof param == "string") {
		var str = Helper.filterBadWords(param);
		if (Stage.layers[4][0].cont)
			Stage.layers[4][0].text += '\n' + str.replace(/\n/g,"<br/>");
		else
			Stage.layers[4][0].text = str.replace(/\n/g,"<br/>");
	}
	else {
		if (param.font) { 
			var subs = Helper.parseFontString(param.font);
			
			if (subs.length > 0) Stage.layers[4][0].fontWeight = subs[0];
			if (subs.length > 1) {
				Stage.layers[4][0].fontSize = subs[1];
				Stage.layers[4][0].lineHeight = parseInt(subs[1]) + 4;			
			}			
			if (subs.length > 2) Stage.layers[4][0].fontFamily = subs[2];
			if (subs.length > 3) Stage.layers[4][0].fontColor = subs[3];
		}
		if (param.align)
			Stage.layers[4][0].textAlign = param.align;
		if (param.effect) {
			if (param.effect == "fade")
				Stage.layers[4][0].alpha = 0;
			if (param.effect == "scroll")
				Stage.layers[4][0].scrollOffsetY = Stage.layers[4][0].context.canvas.height;
			Stage.layers[4][0].effects = param.effect;
		}

		var nick = null;
		var color = '';
		if (param.speaker) {
			nick = param.speaker;
			color = Stage.layers[4][0].tagColor;
			for (var i in Stage.layers[1]) {
				if (Stage.layers[1][i].id == param.speaker) {
					nick = Stage.layers[1][i].nick;
					color = Stage.layers[1][i].color;
					Stage.layers[4][0].avatar = (Stage.layers[1][i].avatar != null) ? Stage.layers[1][i].avatar : null;
					break;
				}
			}
		}
		var same_window = Helper.checkCurrentSpeaker((param.speaker) ? param.speaker : '', param.append);
		Stage.layers[4][0].text = Helper.addTagToDialog(nick, color, 
														(param.value) ? param.value : null, same_window);		
		if (param.duration > 0) Stage.layers[4][0].timeout = param.duration;
		if (param.offset) {
			Stage.layers[4][0].textOffset.vx = param.offset[0];
			Stage.layers[4][0].textOffset.vy = param.offset[1];
		}
	}
	Stage.layers[4][0].visible = true;
	Stage.layers[4][0].changed = true;
}
// menu - display choices in script box (layer 4)
function menu(param) {
	// param is an array of choice-jump pair
	if (Stage.layers[4][0].cont != true)
		Stage.layers[4][0].text = '';
	Stage.layers[4][0].text += param[0];	// prompt
	Stage.layers[4][0].jumpTo.splice(0,Stage.layers[4][0].jumpTo.length);
	for (var i=1; i< param.length; i+=2) {
		Stage.layers[4][0].text += "<br/><class=\'menu\'>" + param[i] + "</class>";
		var menuItem = {hotspot:[], link:param[i+1]};
		Stage.layers[4][0].jumpTo.push(menuItem);
	}
	Stage.layers[4][0].avatar = null;
	Stage.layers[4][0].visible = true;
	Stage.layers[4][0].changed = true;
	Stage.layers[4][0].inputFocus = true;
}
// button - create a canvas button (layer 4), independent of cform
function button(param) {
	// check existing button w/ same id ?
	var bt = new ActiveImage();
	var rect = new Rect(param.x, param.y, (param.w)?param.w:0, (param.h)?param.h:0);
	var obj = new Array();
	if (param.base) obj.push(param.base);
	obj.push((param.hover)?param.hover:param.base);
	obj.push((param.click)?param.click:param.base);
	bt.Create(param.name, rect, obj);
	if (param.link) bt.link = param.link;
	if (param.showText == false)
		bt.showText = false;
	if (param.tip)
		bt.tooltip = param.tip;
	Stage.layers[4].push(bt);
	bt = null;
}
// timer - create a canvas form timer (layer 4)
function timer(param) {
	var tm = new ActiveImage();
	tm.type = "animText";
	tm.fps = 1;
	if (param.timeout) tm.timeout = param.timeout;
	if (param.link) tm.link = param.link;
	var rect = new Rect(param.x, param.y, param.w, param.h);
	tm.Create(param.name, rect, null);
	Stage.layers[4].push(tm);
	tm = null;
}
// picture - create a canvas form animated image (layer 4)
function picture(param) {
	var pic = new ActiveImage();
	pic.type = "animImage";
	pic.fps = (param.fps > 1) ? param.fps : 1;
	var rect = new Rect(param.x, param.y, 0, 0);
	var obj = new Array();
	for (var i in param.frames) 
		obj.push(param.frames[i]);
	pic.Create(param.name, rect, obj);
	pic.showText = false;
	Stage.layers[4].push(pic);
	pic = null;
}
// form - container for canvas form elements such as buttons (layer 4)
function cform(param) {
	if (typeof param == "string") {	// TODO: check array count
		switch (param) {
			case 'close':
				var formid = Stage.formStack.pop();
				var idx = -1;
				var count = 0;
				for (var i in Stage.layers[4]) {
					if (Stage.layers[4][i].group == formid) {
						if (idx == -1) idx = i;
						count++;
						for (var j in Stage.layers[4][i].sprites) {
							if ((Stage.layers[4][i].sprites[j].constructor == HTMLImageElement) || 
								(Stage.layers[4][i].sprites[j].constructor == Image))
								Stage.layers[4][i].sprites[j] = null;
						}
					}
				}
				Stage.layers[4].splice(idx, count);
				break;
			case 'hide':
				var formid = Stage.formStack[Stage.formStack.length-1];
				for (var i in Stage.layers[4]) {
					if (Stage.layers[4][i].group == formid) {
						Stage.layers[4][i].visible = false;
						Stage.layers[4][i].inputFocus = false;
						Stage.layers[4][i].redraw = true;
					}
				}
				break;
			case 'show':
				var formid = Stage.formStack[Stage.formStack.length-1];
				for (var i in Stage.layers[4]) {
					if (Stage.layers[4][i].group == formid) {
						Stage.layers[4][i].visible = true;
						//Stage.layers[4][i].inputFocus = true;
						Stage.layers[4][i].redraw = true;
					}
				}
				Stage.pause = true;
				break;
			case 'default':
				// revert back to default style
				Stage.formStyle.splice(0, Stage.formStyle.length);
				var subs = Helper.parseFontString(Config.formStyle);
				if (subs.length >= 4) {
					Stage.formStyle.push(subs.slice(0,3).join(' '));
					Stage.formStyle.push(subs.slice(3).join(' '));
				}
				else
					Stage.formStyle.push(param);
				break;
			default:
				for (var i in Stage.formStack) {
					if (Stage.formStack[i] == param) {
						// put on top of stack
						Stage.formStack.splice(i,1);
						Stage.formStack.push(param)
						// then show it
						for (var i in Stage.layers[4]) {
							if (Stage.layers[4][i].group == param) {
								Stage.layers[4][i].visible = true;
								//Stage.layers[4][i].inputFocus = true;
								Stage.layers[4][i].redraw = true;
							}
						}
						return;
					}
				}
				// else, assume this is a formStyle
				Stage.formStyle.splice(0, Stage.formStyle.length);
				var subs = Helper.parseFontString(param);
				if (subs.length >= 4) {
					Stage.formStyle.push(subs.slice(0,3).join(' '));
					Stage.formStyle.push(subs.slice(3).join(' '));
				}
				else
					Stage.formStyle.push(param);
				break;
		}
	}
	else {
		for (var i in Stage.formStack) {
			if (Stage.formStack[i] == param[0]) {
				// reenable form
				for (var j in Stage.layers[4]) {
					if (Stage.layers[4][j].group == param[0]) {
						Stage.layers[4][j].visible = true;
						//Stage.layers[4][j].inputFocus = true;
						Stage.layers[4][j].redraw = true;
					}
				}
				Stage.pause = param[1];
				return;
			}
		}
		// this is a new form
		Stage.formStack.push(param[0]);
		for (var i=2; i<param.length; i+=2) {
			param[i](param[i+1]);
			Stage.layers[4][Stage.layers[4].length-1].group = param[0];
		}
		Stage.pause = param[1];
	}
}
// audio - plays a sound
function audio(param) {
	/*
		To conserve memory:
		BGM - only one stored at a time; on new bgm, previous is removed
		BGS - can have multiple bgs playing; use "remove" to clear
		SE - can have multiple se; use "remove" to clear
	*/
	if (!document.createElement('audio').canPlayType) return;
	
	if (param.bgm)
		Helper.processAudio (Stage.sounds[0], param.bgm, param);
	if (param.bgs)
		Helper.processAudio (Stage.sounds[1], param.bgs, param);
	if (param.se)
		Helper.processAudio (Stage.sounds[2], param.se, param);
}
// video - plays a video (cutscene, etc.)
function video(param) {
	if (!document.createElement('video').canPlayType) return;
	
	var mimeType = {"mp4": 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"',
					"m4v": 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"',
					"ogg": 'video/ogg; codecs="theora, vorbis"',
					"ogv": 'video/ogg; codecs="theora, vorbis"',
					"webm": 'video/webm; codecs="vp8, vorbis"',			
					"webmv": 'video/webm; codecs="vp8, vorbis"'};			
	var v = new Movie();
	v.src = null;
	for (var i in param.format) {
		if (v.movie.canPlayType(mimeType[param.format[i]]) != '') {
			v.src = param.src + '.' + param.format[i];
			break;
		}
	}	
	Stage.videos.push(v);
	Stage.pause = true;
	v = null;
}
// default form elements (sibling layer)
function input(param) {
	var element = document.createElement("input");
	element.name = param.name;
	element.id = param.name;
	if (param.placeholder) element.placeholder = param.placeholder;
	if (param.autofocus) element.autofocus = param.autofocus;
	if (param.bind) {
		element.value = Helper.getValue(param.bind);
		Stage.formBindings.push([param.name, param.bind]);
	}
	try { return element; }
	finally { element = null; }
}
function input_label(param, tip) {
	var element = document.createElement("label");
	element.htmlFor = param;
	element.innerHTML = param;
	if (tip) element.title = tip;
	try { return element; }
	finally { element = null; }
}
function textarea(param) {
	var element = document.createElement("textarea");
	element.name = param.name;
	element.id = param.name;
	if (param.placeholder) element.placeholder = param.placeholder;
	if (param.autofocus) element.autofocus = param.autofocus;
	//if (param.rows != null) element.rows = param.rows;
	//if (param.cols != null) element.cols = param.cols;
	if (param.bind) {
		element.value = Helper.getValue(param.bind);
		Stage.formBindings.push([param.name, param.bind]);
	}
	try { return element; }
	finally { element = null; }
}
function fieldset(param) {
	var element = document.createElement("fieldset");
	element.id = param;
	try { return element; }
	finally { element = null; }
}
function select(param) {
	var element = document.createElement("select");
	element.name = param.name;
	element.id = param.name;
	
	var opts = (typeof param.options == 'string') ? Helper.getValue(param.options) : param.options;
	for (var i=0; i<opts.length; i+=2) {
		var opt = document.createElement("option");
		opt.innerHTML = opts[i];
		opt.value = JSON.stringify(opts[i+1]);
		element.appendChild(opt);
		if (param.bind) {
			if (opt.value == JSON.stringify(Helper.getValue(param.bind)))
				element.selectedIndex = i/2;
		}
	}	
	if (param.bind) Stage.formBindings.push([param.name, param.bind]);
	try { return element; }
	finally { element = null; }
}
function submit(param) {
	var element = document.createElement("input");
	element.type = "button";
	element.name = param.name;
	element.id = param.name;
	element.value = param.name;
	element.appendChild(document.createTextNode(param.name));
	Helper.addEvent(element, 'click', function(e) {
			if (e.which != 1) return;
			// update bindings here
			for (var idx in Stage.formBindings) {
				var items = document.getElementById(Stage.formBindings[idx][0]);
				if (items.type == "radio") {
					if (items.checked == true) 
						Helper.setValue(Stage.formBindings[idx][1], JSON.stringify(items.value));
				}
				else if (items.type == "checkbox") {
					Helper.setValue(Stage.formBindings[idx][1], items.checked);
				}
				else if ((items.type == "range") || (items.type == "number")) {
					Helper.setValue(Stage.formBindings[idx][1], items.valueAsNumber);
				}
				else if ((items.type == "text") || (items.type == "textarea")) {
					Helper.setValue(Stage.formBindings[idx][1], JSON.stringify(items.value));
				}
				else if (items.type == "select-one") {
					Helper.setValue(Stage.formBindings[idx][1], JSON.parse(items.value));
				}
				else {
					Helper.setValue(Stage.formBindings[idx][1], items.value);
				}
				items = null;
			}
			// remove form here
			Stage.activeForm.parent.removeChild(Stage.activeForm.newForm);
			Stage.activeForm = null;
			Stage.pause = false;
        }, false);
	try { return element; }
	finally { element = null; }
}
function checkbox(param) {
	var element = document.createElement("input");
	element.type = "checkbox";
	element.name = param.name;
	element.id = param.name;
	element.checked = (param.checked) ? param.checked : false;
	if (param.bind) {
		element.checked = Helper.getValue(param.bind);
		Stage.formBindings.push([param.name, param.bind]);
	}
	try { return element; }
	finally { element = null; }
}
function radio(param) {
	var element = document.createElement("input");
	element.type = "radio";
	element.name = param.name;
	element.id = param.value;
	element.value = param.value;
	element.checked = (param.checked) ? param.checked : false;
	if (param.bind) {
		element.checked = (element.value == Helper.getValue(param.bind));
		Stage.formBindings.push([param.value, param.bind]);
	}
	try { return element; }
	finally { element = null; }
}
function spinbox(param) {
	var element = document.createElement("input");
	element.type = "number";
	element.name = param.name;
	element.id = param.name;
	if (param.min != null) element.min = param.min;
	if (param.max != null) element.max = param.max;
	if (param.step != null) element.step = param.step;
	if (param.value != null) element.value = param.value;
	if (param.bind) {
		element.value = Helper.getValue(param.bind);
		Stage.formBindings.push([param.name, param.bind]);
	}
	try { return element; }
	finally { element = null; }
}
function slider(param) {
	var element = document.createElement("input");
	element.type = "range";
	element.name = param.name;
	element.id = param.name;
	if (param.min != null) element.min = param.min;
	if (param.max != null) element.max = param.max;
	if (param.step != null) element.step = param.step;
	if (param.value != null) element.value = param.value;
	if (param.bind) {
		element.value = Helper.getValue(param.bind);
		Stage.formBindings.push([param.name, param.bind]);
	}
	try { return element; }
	finally { element = null; }
}
// form - create a default HTML form
function form(param) {
	var f = new Form(param[0]);
	var fset = null;
	//f.Create(param[0]);
	for (var i=1; i<param.length; i+=2) {
		// if this element is a fieldset, revert to default fieldset
		if (param[i] == fieldset)
			fset = null;
		// append element to active fieldset
		if ((param[i] == input) || 
			(param[i] == select) || 
			(param[i] == spinbox) ||
			(param[i] == slider) ||
			(param[i] == textarea)) {
			f.AddChild(input_label(param[i+1].name, param[i+1].tip), fset);
		}
		f.AddChild(param[i](param[i+1]), fset);	
		if (param[i] == checkbox) {
			f.AddChild(input_label(param[i+1].name, param[i+1].tip), fset);
		}
		if (param[i] == radio) {
			f.AddChild(input_label(param[i+1].value, param[i+1].tip), fset);
		}
		// if this element is a fieldset, attach succeeding elements to it
		if (param[i] == fieldset)
			fset = param[i+1];
	}
	Stage.activeForm = f;
	Stage.pause = true;
	f = null;
}
// checkpoint - loads/saves at a given checkpoint
function checkpoint(param) {
	if (!Helper.supportsLocalStorage()) return;

	if (param == "save") {
		localStorage.clear();
		// Store script entry point
		if (Stage.script.sequence[0] == label) {
			localStorage["sequence"] = Stage.script.sequence[1];
			localStorage["frame"] = Stage.script.frame;
		}
		else {
			localStorage["sequence"] = '';
			localStorage["frame"] = 0;
		}
		// Store jump stack
		localStorage["frameStack"] = JSON.stringify(Stage.script.frameStack);
		// Store layer 0
		localStorage["l0_count"] = Stage.layers[0].length;
		for (var i=0; i<Stage.layers[0].length; i++) {
			localStorage["l0_"+i+"_id"] = Stage.layers[0][i].context.canvas.id;
			if (typeof Stage.layers[0][i].image == 'string')
				localStorage["l0_"+i+"_src"] = Stage.layers[0][i].image;
			else
				localStorage["l0_"+i+"_src"] = Stage.layers[0][i].image.src;
			localStorage["l0_"+i+"_obj_count"] = Stage.layers[0][i].objects.length;
			for (var j=0; j<Stage.layers[0][i].objects.length; j++) {
				localStorage["l0_"+i+"_obj_"+j+"_src"] = Stage.layers[0][i].objects[j].img.src;
				localStorage["l0_"+i+"_obj_"+j+"_x"] = Stage.layers[0][i].objects[j].x;
				localStorage["l0_"+i+"_obj_"+j+"_y"] = Stage.layers[0][i].objects[j].y;
			}
			localStorage["l0_"+i+"_alpha"] = Stage.layers[0][i].alpha;
			localStorage["l0_"+i+"_visible"] = Stage.layers[0][i].visible;
			localStorage["l0_"+i+"_effects"] = Stage.layers[0][i].effects;
			localStorage["l0_"+i+"_time"] = Stage.layers[0][i].transTime;
			//if (Stage.layers[0][i].posMode != '')
			//	localStorage["l0_"+i+"_posMode"] = Stage.layers[0][i].posMode;
			//else
			//	localStorage["l0_"+i+"_posMode"] = "undefined";
			localStorage["l0_"+i+"_orientation"] = Stage.layers[0][i].orientation;
			localStorage["l0_"+i+"_size"] = Stage.layers[0][i].size;
		}
		// Store layer 1
		localStorage["l1_count"] = Stage.layers[1].length;
		for (var i=0; i<Stage.layers[1].length; i++) {
			localStorage["l1_"+i+"_id"] = Stage.layers[1][i].id;
			localStorage["l1_"+i+"_nick"] = Stage.layers[1][i].nick;
			localStorage["l1_"+i+"_color"] = Stage.layers[1][i].color;
			localStorage["l1_"+i+"_spites_count"] = Stage.layers[1][i].sprites.length;
			for (var j=0; j<Stage.layers[1][i].sprites.length; j++) {
				localStorage["l1_"+i+"_sprites_"+j+"_id"] = Stage.layers[1][i].sprites[j].id;
				localStorage["l1_"+i+"_sprites_"+j+"_src"] = Stage.layers[1][i].sprites[j].src.src;			
			}
			if (Stage.layers[1][i].avatar != null)
				localStorage["l1_"+i+"_avatar"] = Stage.layers[1][i].avatar.src;
			else
				localStorage["l1_"+i+"_avatar"] = "undefined";
			localStorage["l1_"+i+"_active"] = Stage.layers[1][i].activeSprite;
			localStorage["l1_"+i+"_alpha"] = Stage.layers[1][i].alpha;
			if (Stage.layers[1][i].prevFx != '')
				localStorage["l1_"+i+"_effects"] = Stage.layers[1][i].prevFx;
			else
				localStorage["l1_"+i+"_effects"] = "undefined";
			localStorage["l1_"+i+"_time"] = Stage.layers[1][i].transTime;
			localStorage["l1_"+i+"_visible"] = Stage.layers[1][i].visible;
			localStorage["l1_"+i+"_pending"] = Stage.layers[1][i].pendingRemoval;
			localStorage["l1_"+i+"_posMode"] = Stage.layers[1][i].posMode;
			//localStorage["l1_"+i+"_fxparam"] = Stage.layers[1][i].fxparam;
			localStorage["l1_"+i+"_orientation"] = Stage.layers[1][i].orientation;
			localStorage["l1_"+i+"_size"] = Stage.layers[1][i].size;
		}
		// Store layer 2
		localStorage["l2_count"] = Stage.layers[2].length;
		for (var i=0; i<Stage.layers[2].length; i++) {
			localStorage["l2_"+i+"_id"] = Stage.layers[2][i].context.canvas.id;
			if (typeof Stage.layers[2][i].image == 'string')
				localStorage["l2_"+i+"_src"] = Stage.layers[2][i].image;
			else
				localStorage["l2_"+i+"_src"] = Stage.layers[2][i].image.src;
			localStorage["l2_"+i+"_alpha"] = Stage.layers[2][i].alpha;
			localStorage["l2_"+i+"_visible"] = Stage.layers[2][i].visible;
			localStorage["l2_"+i+"_effects"] = Stage.layers[2][i].effects;
			localStorage["l2_"+i+"_time"] = Stage.layers[2][i].transTime;
			localStorage["l2_"+i+"_scroll"] = Stage.layers[2][i].scroll;
			localStorage["l2_"+i+"_offset_x"] = Stage.layers[2][i].offset.vx;
			localStorage["l2_"+i+"_offset_y"] = Stage.layers[2][i].offset.vy;
			//if (Stage.layers[2][i].posMode != '')
			//	localStorage["l2_"+i+"_posMode"] = Stage.layers[2][i].posMode;
			//else
			//	localStorage["l2_"+i+"_posMode"] = "undefined";
			localStorage["l2_"+i+"_orientation"] = Stage.layers[2][i].orientation;
			localStorage["l2_"+i+"_size"] = Stage.layers[2][i].size;
		}
		// Store layer 3
		localStorage["l3_count"] = Stage.layers[3].length;
		for (var i=0; i<Stage.layers[3].length; i++) {
			localStorage["l3_"+i+"_id"] = Stage.layers[3][i].context.canvas.id;
			localStorage["l3_"+i+"_type"] = Stage.layers[3][i].type;
			localStorage["l3_"+i+"_action"] = Stage.layers[3][i].action;
			localStorage["l3_"+i+"_visible"] = Stage.layers[3][i].visible;
			localStorage["l3_"+i+"_param"] = JSON.stringify(Stage.layers[3][i].saveparam);
		}
		// Store layer 4
		localStorage["l4_count"] = Stage.layers[4].length;
		for (var i=0; i<Stage.layers[4].length; i++) {
			localStorage["l4_"+i+"_type"] = Stage.layers[4][i].type;
			if (Stage.layers[4][i].type == "box") {
				localStorage["l4_"+i+"_visible"] = Stage.layers[4][i].visible;
				localStorage["l4_"+i+"_text"] = Stage.layers[4][i].text;
				localStorage["l4_"+i+"_pos"] = Stage.layers[4][i].pos;
				localStorage["l4_"+i+"_back"] = Stage.layers[4][i].back;
				if (Stage.layers[4][i].src != null)
					localStorage["l4_"+i+"_src"] = Stage.layers[4][i].src;
				else
					localStorage["l4_"+i+"_src"] = "undefined";
				if (Stage.layers[4][i].psrc != '')
					localStorage["l4_"+i+"_prompt"] = Stage.layers[4][i].psrc;
				else
					localStorage["l4_"+i+"_prompt"] = "undefined";
				localStorage["l4_"+i+"_cont"] = Stage.layers[4][i].cont;
				localStorage["l4_"+i+"_fontFamily"] = Stage.layers[4][i].fontFamily;
				localStorage["l4_"+i+"_fontSize"] = Stage.layers[4][i].fontSize;
				localStorage["l4_"+i+"_lineHeight"] = Stage.layers[4][i].lineHeight;
				localStorage["l4_"+i+"_fontWeight"] = Stage.layers[4][i].fontWeight;
				localStorage["l4_"+i+"_fontColor"] = Stage.layers[4][i].fontColor;
				localStorage["l4_"+i+"_tagFamily"] = Stage.layers[4][i].tagFamily;
				localStorage["l4_"+i+"_tagSize"] = Stage.layers[4][i].tagSize;
				localStorage["l4_"+i+"_tagWeight"] = Stage.layers[4][i].tagWeight;
				localStorage["l4_"+i+"_tagColor"] = Stage.layers[4][i].tagColor;
				localStorage["l4_"+i+"_timeout"] = Stage.layers[4][i].timeout;
				localStorage["l4_"+i+"_textAlign"] = Stage.layers[4][i].textAlign;
				localStorage["l4_"+i+"_offset_x"] = Stage.layers[4][i].textOffset.vx;
				localStorage["l4_"+i+"_offset_y"] = Stage.layers[4][i].textOffset.vy;
				localStorage["l4_"+i+"_inputFocus"] = Stage.layers[4][i].inputFocus;
				localStorage["l4_"+i+"_alpha"] = Stage.layers[4][i].alpha;
				localStorage["l4_"+i+"_effects"] = Stage.layers[4][i].effects;
				localStorage["l4_"+i+"_jumpTo_count"] = Stage.layers[4][i].jumpTo.length;
				for (var j=0; j<Stage.layers[4][i].jumpTo.length; j++) {
					localStorage["l4_"+i+"jumpTo"+j+"hotspot_x"] = Stage.layers[4][i].jumpTo[j].hotspot[0];
					localStorage["l4_"+i+"jumpTo"+j+"hotspot_y"] = Stage.layers[4][i].jumpTo[j].hotspot[1];
					localStorage["l4_"+i+"jumpTo"+j+"link"] = Stage.layers[4][i].jumpTo[j].link;
				}
			}
			if (Stage.layers[4][i].type == "button") {
				if (Stage.layers[4][i].group != '')
					localStorage["l4_"+i+"_group"] = Stage.layers[4][i].group;
				else
					localStorage["l4_"+i+"_group"] = "undefined";
				localStorage["l4_"+i+"_sprites_count"] = Stage.layers[4][i].sprites.length;
				for (var j=0; j<Stage.layers[4][i].sprites.length; j++) {
					if (typeof Stage.layers[4][i].sprites[j] == 'string')
						localStorage["l4_"+i+"_sprites_"+j] = Stage.layers[4][i].sprites[j];
					else
						localStorage["l4_"+i+"_sprites_"+j] = Stage.layers[4][i].sprites[j].src;
				}
				localStorage["l4_"+i+"_text"] = Stage.layers[4][i].text;
				localStorage["l4_"+i+"_link_0"] = Stage.layers[4][i].link[0].toString().split(/[' '|(|)|{|}]/g, 2)[1];
				localStorage["l4_"+i+"_link_1"] = JSON.stringify(Stage.layers[4][i].link[1]);
				localStorage["l4_"+i+"_visible"] = Stage.layers[4][i].visible;
				localStorage["l4_"+i+"_showText"] = Stage.layers[4][i].showText;
				if (Stage.layers[4][i].tooltip != '')
					localStorage["l4_"+i+"_tooltip"] = Stage.layers[4][i].tooltip;
				else
					localStorage["l4_"+i+"_tooltip"] = "undefined";
				localStorage["l4_"+i+"_rect_x"] = Stage.layers[4][i].rect.x;
				localStorage["l4_"+i+"_rect_y"] = Stage.layers[4][i].rect.y;
				localStorage["l4_"+i+"_rect_w"] = Stage.layers[4][i].rect.w;
				localStorage["l4_"+i+"_rect_h"] = Stage.layers[4][i].rect.h;
			}
			if (Stage.layers[4][i].type == "animText") {
				localStorage["l4_"+i+"_id"] = Stage.layers[4][i].context.canvas.id;
				if (Stage.layers[4][i].group != '')
					localStorage["l4_"+i+"_group"] = Stage.layers[4][i].group;
				else
					localStorage["l4_"+i+"_group"] = "undefined";
				localStorage["l4_"+i+"_text"] = Stage.layers[4][i].text;
				if ((Stage.layers[4][i].link != '') && (Stage.layers[4][i].link.length > 0)) {
					localStorage["l4_"+i+"_link_0"] = Stage.layers[4][i].link[0].toString().split(/[' '|(|)|{|}]/g, 2)[1];
					localStorage["l4_"+i+"_link_1"] = JSON.stringify(Stage.layers[4][i].link[1]);
				}
				else {
					localStorage["l4_"+i+"_link_0"] = "undefined";
					localStorage["l4_"+i+"_link_1"] = "undefined";
				}
				localStorage["l4_"+i+"_visible"] = Stage.layers[4][i].visible;
				localStorage["l4_"+i+"_showText"] = Stage.layers[4][i].showText;
				localStorage["l4_"+i+"_rect_x"] = Stage.layers[4][i].rect.x;
				localStorage["l4_"+i+"_rect_y"] = Stage.layers[4][i].rect.y;
				localStorage["l4_"+i+"_rect_w"] = Stage.layers[4][i].rect.w;
				localStorage["l4_"+i+"_rect_h"] = Stage.layers[4][i].rect.h;
				localStorage["l4_"+i+"_fps"] = Stage.layers[4][i].fps;
				localStorage["l4_"+i+"_countup"] = Stage.layers[4][i].countup;
				localStorage["l4_"+i+"_timeout"] = Stage.layers[4][i].timeout;
			}
			if (Stage.layers[4][i].type == "animImage") {
				localStorage["l4_"+i+"_id"] = Stage.layers[4][i].context.canvas.id;
				if (Stage.layers[4][i].group != '')
					localStorage["l4_"+i+"_group"] = Stage.layers[4][i].group;
				else
					localStorage["l4_"+i+"_group"] = "undefined";
				localStorage["l4_"+i+"_sprites_count"] = Stage.layers[4][i].sprites.length;
				for (var j=0; j<Stage.layers[4][i].sprites.length; j++) {
					if (typeof Stage.layers[4][i].sprites[j] == 'string')
						localStorage["l4_"+i+"_sprites_"+j] = Stage.layers[4][i].sprites[j];
					else
						localStorage["l4_"+i+"_sprites_"+j] = Stage.layers[4][i].sprites[j].src;
				}
				localStorage["l4_"+i+"_visible"] = Stage.layers[4][i].visible;
				localStorage["l4_"+i+"_rect_x"] = Stage.layers[4][i].rect.x;
				localStorage["l4_"+i+"_rect_y"] = Stage.layers[4][i].rect.y;
				localStorage["l4_"+i+"_fps"] = Stage.layers[4][i].fps;
			}
			// TODO: other GUI types
		}
		// Store sounds
		for (var i=0; i<3; i++) {
			localStorage["s"+i+"_count"] = Stage.sounds[i].length;
			for (var j=0; j<Stage.sounds[i].length; j++) {
				localStorage["s"+i+"_"+j+"_src"] = Stage.sounds[i][j].src;
				localStorage["s"+i+"_"+j+"_repeat"] = Stage.sounds[i][j].repeat;
				localStorage["s"+i+"_"+j+"_delay"] = Stage.sounds[i][j].delay;
				localStorage["s"+i+"_"+j+"_isStopping"] = Stage.sounds[i][j].isStopping;
				localStorage["s"+i+"_"+j+"_isPaused"] = Stage.sounds[i][j].isPaused;
			}
		}
		// Store video?? No need. Videos are non-persistent data anyway
		// Store user variables
		var str_uv = JSON.stringify(Stage.variables);
		if (str_uv != '{}') {
			var arr_uv = str_uv.replace(/[{|}]/g,'').split(/[' '|:|,]/g);
			localStorage["uv_count"] = arr_uv.length/2;
			for (var i=0; i<arr_uv.length; i+=2) {
				arr_uv[i] = eval(arr_uv[i]);
				localStorage["uv"+i/2+"_name"] = arr_uv[i];
				localStorage["uv"+i/2+"_value"] = Stage.variables[arr_uv[i]].Value();
				localStorage["uv"+i/2+"_type"] = Stage.variables[arr_uv[i]].Type();
			}
			arr_uv = null;
		}
		else {
			localStorage["uv_count"] = 0;
		}
		// Store forms
		localStorage["forms_count"] = Stage.formStack.length;
		for (var i=0; i<Stage.formStack.length; i++) {
			localStorage["formStack_"+i] = Stage.formStack[i];
		}
		localStorage["forms_style_count"] = Stage.formStyle.length;
		for (var i=0; i<Stage.formStyle.length; i++) {
			localStorage["formStyle_"+i] = Stage.formStyle[i];
		}
		// Store config
		localStorage["Config"] = JSON.stringify(Config);
	}
	else if (param == "load") {
		if (localStorage.length <= 0) {
			alert ("No checkpoint data found!\nStarting a new game instead...");
			return;
		}
		// at this point, Stage.Init has been called with empty classes
		// populate layer 0
		Stage.layers[0].splice(0, Stage.layers[0].length);
		for (var i=0; i<parseInt(localStorage["l0_count"]); i++) {
			var bg = new Backdrop();
			bg.type = 'scene';
			var obj = new Array();
			for (var j=0; j<parseInt(localStorage["l0_"+i+"_obj_count"]); j++) {
				var item = {src:'', x:0, y:0};
				item.src = localStorage["l0_"+i+"_obj_"+j+"_src"];
				item.x = parseInt(localStorage["l0_"+i+"_obj_"+j+"_x"]);
				item.y = parseInt(localStorage["l0_"+i+"_obj_"+j+"_y"]);
				obj.push(item);
			}
			bg.Create(localStorage["l0_"+i+"_id"], localStorage["l0_"+i+"_src"], obj);
			bg.effects = localStorage["l0_"+i+"_effects"];
			bg.alpha = parseFloat(localStorage["l0_"+i+"_alpha"]);
			bg.visible = (localStorage["l0_"+i+"_visible"] == "true");
			bg.transTime = parseFloat(localStorage["l0_"+i+"_time"]);
			//if (localStorage["l0_"+i+"_posMode"] != "undefined")
			//	bg.posMode = localStorage["l0_"+i+"_posMode"];
			//else
			//	bg.posMode = '';
			bg.orientation = parseFloat(localStorage["l0_"+i+"_orientation"]);
			bg.rotation = parseFloat(localStorage["l0_"+i+"_orientation"]);
			bg.size = parseFloat(localStorage["l0_"+i+"_size"]);
			bg.scale = parseFloat(localStorage["l0_"+i+"_size"]);
			Stage.layers[0].push(bg);
			obj = null; bg = null;
		}
		// populate layer 1
		Stage.layers[1].splice(0, Stage.layers[1].length);
		for (var i=0; i<parseInt(localStorage["l1_count"]); i++) {
			var chr = new Character(localStorage["l1_"+i+"_id"]);
			//chr.type = 'actor';
			//chr.Create(localStorage["l1_"+i+"_id"]);
			chr.nick = localStorage["l1_"+i+"_nick"];
			chr.color = localStorage["l1_"+i+"_color"];
			for (var j=0; j<parseInt(localStorage["l1_"+i+"_spites_count"]); j++) {
				chr.AddSprite(localStorage["l1_"+i+"_sprites_"+j+"_id"], localStorage["l1_"+i+"_sprites_"+j+"_src"]);
			}
			if (localStorage["l1_"+i+"_avatar"] != "undefined")
				chr.AddAvatar(localStorage["l1_"+i+"_avatar"]);
			else 
				chr.AddAvatar('');
			chr.activeSprite = parseInt(localStorage["l1_"+i+"_active"]);
			chr.alpha = parseFloat(localStorage["l1_"+i+"_alpha"]);
			//chr.effects = localStorage["l1_"+i+"_effects"];
			if (localStorage["l1_"+i+"_effects"] != "undefined")
				chr.prevFx = localStorage["l1_"+i+"_effects"];
			else
				chr.prevFx = 'done';
			chr.transTime = parseFloat(localStorage["l1_"+i+"_time"]);
			chr.visible = (localStorage["l1_"+i+"_visible"] == "true");
			chr.pendingRemoval = (localStorage["l1_"+i+"_pending"] == "true");
			chr.posMode = localStorage["l1_"+i+"_posMode"];
			//chr.fxparam = localStorage["l1_"+i+"_fxparam"];
			chr.orientation = parseFloat(localStorage["l1_"+i+"_orientation"]);
			chr.rotation = parseFloat(localStorage["l1_"+i+"_orientation"]);
			chr.size = parseFloat(localStorage["l1_"+i+"_size"]);
			chr.scale = parseFloat(localStorage["l1_"+i+"_size"]);
			Stage.layers[1].push(chr);
			chr = null;
		}
		// populate layer 2
		Stage.layers[2].splice(0, Stage.layers[2].length);
		for (var i=0; i<parseInt(localStorage["l2_count"]); i++) {
			var ovl = new Backdrop();
			ovl.type = 'overlay';
			ovl.Create(localStorage["l2_"+i+"_id"], localStorage["l2_"+i+"_src"], null);
			ovl.effects = localStorage["l2_"+i+"_effects"];
			ovl.alpha = parseFloat(localStorage["l2_"+i+"_alpha"]);
			ovl.visible = (localStorage["l2_"+i+"_visible"] == "true");
			ovl.transTime = parseFloat(localStorage["l2_"+i+"_time"]);
			ovl.scroll = (localStorage["l2_"+i+"_scroll"] == "true");
			ovl.offset = new Vector2d(parseInt(localStorage["l2_"+i+"_offset_x"]), parseInt(localStorage["l2_"+i+"_offset_y"]))
			//if (localStorage["l2_"+i+"_posMode"] != "undefined")
			//	ovl.posMode = localStorage["l2_"+i+"_posMode"];
			//else
			//	ovl.posMode = '';
			ovl.orientation = parseFloat(localStorage["l2_"+i+"_orientation"]);
			ovl.rotation = parseFloat(localStorage["l2_"+i+"_orientation"]);
			ovl.size = parseFloat(localStorage["l2_"+i+"_size"]);
			ovl.scale = parseFloat(localStorage["l2_"+i+"_size"]);
			Stage.layers[2].push(ovl);
			ovl = null;
		}
		// populate layer 3
		Stage.layers[3].splice(0, Stage.layers[3].length);
		for (var i=0; i<parseInt(localStorage["l3_count"]); i++) {
			var atm = new Atmosphere(localStorage["l3_"+i+"_id"]);
			var param = JSON.parse(localStorage["l3_"+i+"_param"]);
			//atm.Create(localStorage["l3_"+i+"_id"]);
			atm.Init(localStorage["l3_"+i+"_type"], param);
			atm.action = localStorage["l3_"+i+"_action"];
			atm.visible = (localStorage["l3_"+i+"_visible"] == "true");
			Stage.layers[3].push(atm);
			atm = null;
		}
		// populate layer 4
		Stage.layers[4].splice(0, Stage.layers[4].length);
		for (var i=0; i<parseInt(localStorage["l4_count"]); i++) {
			if (localStorage["l4_"+i+"_type"] == 'box') {
				var sb = new ScriptBox();
				sb.Create(Stage.canvas.width, Stage.canvas.height);
				sb.visible = (localStorage["l4_"+i+"_visible"] == "true");
				sb.text = localStorage["l4_"+i+"_text"];
				sb.pos = localStorage["l4_"+i+"_pos"];
				sb.back = localStorage["l4_"+i+"_back"];
				if (localStorage["l4_"+i+"_src"] != "undefined")
					sb.src = localStorage["l4_"+i+"_src"];
				else
					sb.src = null;
				if (localStorage["l4_"+i+"_prompt"] != "undefined") {
					sb.psrc = localStorage["l4_"+i+"_prompt"];
					sb.prompt.src = sb.psrc;
				}
				else 
					sb.psrc = '';
				sb.cont = (localStorage["l4_"+i+"_cont"] == "true");
				sb.fontFamily = localStorage["l4_"+i+"_fontFamily"];
				sb.fontSize = localStorage["l4_"+i+"_fontSize"];
				sb.lineHeight = localStorage["l4_"+i+"_lineHeight"];
				sb.fontWeight = localStorage["l4_"+i+"_fontWeight"];
				sb.fontColor = localStorage["l4_"+i+"_fontColor"];
				sb.tagFamily = localStorage["l4_"+i+"_tagFamily"];
				sb.tagSize = localStorage["l4_"+i+"_tagSize"];
				sb.tagWeight = localStorage["l4_"+i+"_tagWeight"];
				sb.tagColor = localStorage["l4_"+i+"_tagColor"];
				sb.timeout = parseFloat(localStorage["l4_"+i+"_timeout"]);
				sb.textAlign = localStorage["l4_"+i+"_textAlign"];
				sb.textOffset.vx = parseInt(localStorage["l4_"+i+"_offset_x"]);
				sb.textOffset.vy = parseInt(localStorage["l4_"+i+"_offset_y"]);
				sb.inputFocus = (localStorage["l4_"+i+"_inputFocus"] == "true");
				sb.alpha = parseFloat(localStorage["l4_"+i+"_alpha"]);
				sb.effects = localStorage["l4_"+i+"_effects"];
				for (var j=0; j<parseInt(localStorage["l4_"+i+"_jumpTo_count"]); j++) {
					var menuItem = {hotspot:[], link:''};
					menuItem.link = localStorage["l4_"+i+"jumpTo"+j+"link"];
					menuItem.hotspot = [parseInt(localStorage["l4_"+i+"jumpTo"+j+"hotspot_x"]),
										parseInt(localStorage["l4_"+i+"jumpTo"+j+"hotspot_y"])];
					sb.jumpTo.push(menuItem);
				}			
				Stage.layers[4].push(sb);
				sb = null;
			}
			if (localStorage["l4_"+i+"_type"] == 'button') {
				var bt = new ActiveImage();
				var rect = new Rect(0, 0, 0, 0);
				rect.x = parseInt(localStorage["l4_"+i+"_rect_x"]);
				rect.y = parseInt(localStorage["l4_"+i+"_rect_y"]);
				rect.w = parseInt(localStorage["l4_"+i+"_rect_w"]);
				rect.h = parseInt(localStorage["l4_"+i+"_rect_h"]);
				var obj = new Array();
				for (var j=0; j<parseInt(localStorage["l4_"+i+"_sprites_count"]); j++) {
					obj.push(localStorage["l4_"+i+"_sprites_"+j]);
				}
				bt.Create(localStorage["l4_"+i+"_text"], rect, obj);
						  
				bt.visible = (localStorage["l4_"+i+"_visible"] == "true");
				//bt.inputFocus = bt.visible;
				bt.showText = (localStorage["l4_"+i+"_showText"] == "true");
				if (localStorage["l4_"+i+"_group"] != "undefined")
					bt.group = localStorage["l4_"+i+"_group"];
				else
					bt.group = '';
				if (localStorage["l4_"+i+"_tooltip"] != "undefined")
					bt.tooltip = localStorage["l4_"+i+"_tooltip"];
				else
					bt.tooltip = '';
				var link = new Array();
				link.push(eval(localStorage["l4_"+i+"_link_0"]));
				link.push(JSON.parse(localStorage["l4_"+i+"_link_1"]));
				bt.link = link;
				Stage.layers[4].push(bt);
				obj = null; bt = null;
			}
			if (localStorage["l4_"+i+"_type"] == 'animText') {
				var at = new ActiveImage();
				var rect = new Rect(0, 0, 0, 0);
				rect.x = parseInt(localStorage["l4_"+i+"_rect_x"]);
				rect.y = parseInt(localStorage["l4_"+i+"_rect_y"]);
				rect.w = parseInt(localStorage["l4_"+i+"_rect_w"]);
				rect.h = parseInt(localStorage["l4_"+i+"_rect_h"]);
				at.timeout = parseInt(localStorage["l4_"+i+"_timeout"]);
				at.type = localStorage["l4_"+i+"_type"];
				at.Create(localStorage["l4_"+i+"_id"], rect, null);

				at.text = localStorage["l4_"+i+"_text"];
				at.fps = parseInt(localStorage["l4_"+i+"_fps"]);
				at.countup = (localStorage["l4_"+i+"_countup"] == "true");
				at.visible = (localStorage["l4_"+i+"_visible"] == "true");
				at.showText = (localStorage["l4_"+i+"_showText"] == "true");
				if (localStorage["l4_"+i+"_group"] != "undefined")
					at.group = localStorage["l4_"+i+"_group"];
				else
					at.group = '';
				if ((localStorage["l4_"+i+"_link_0"] != "undefined") && 
					(localStorage["l4_"+i+"_link_1"] != "undefined")) {
					var link = new Array();
					link.push(eval(localStorage["l4_"+i+"_link_0"]));
					link.push(JSON.parse(localStorage["l4_"+i+"_link_1"]));
					at.link = link;
				}
				Stage.layers[4].push(at);
				at = null;
			}
			if (localStorage["l4_"+i+"_type"] == 'animImage') {
				var ai = new ActiveImage();
				var rect = new Rect(0, 0, 0, 0);
				rect.x = parseInt(localStorage["l4_"+i+"_rect_x"]);
				rect.y = parseInt(localStorage["l4_"+i+"_rect_y"]);
				ai.type = localStorage["l4_"+i+"_type"];
				var obj = new Array();
				for (var j=0; j<parseInt(localStorage["l4_"+i+"_sprites_count"]); j++) {
					obj.push(localStorage["l4_"+i+"_sprites_"+j]);
				}
				ai.Create(localStorage["l4_"+i+"_id"], rect, obj);

				ai.fps = parseInt(localStorage["l4_"+i+"_fps"]);
				ai.visible = (localStorage["l4_"+i+"_visible"] == "true");
				if (localStorage["l4_"+i+"_group"] != "undefined")
					ai.group = localStorage["l4_"+i+"_group"];
				else
					ai.group = '';
				Stage.layers[4].push(at);
				ai = null;
			}
			// TODO: other gui
		}
		// Populate sounds
		for (var i=0; i<3; i++) {
			Stage.sounds[i].splice(0, Stage.sounds[i].length);
			for (var j=0; j<parseInt(localStorage["s"+i+"_count"]); j++) {
				var s = new Sounds();
				s.src = localStorage["s"+i+"_"+j+"_src"];
				s.repeat = parseInt(localStorage["s"+i+"_"+j+"_repeat"]);
				s.delay = parseFloat(localStorage["s"+i+"_"+j+"_delay"]);
				s.isStopping = (localStorage["s"+i+"_"+j+"_isStopping"] == "true");
				s.isPaused = (localStorage["s"+i+"_"+j+"_isPaused"] == "true");
				Stage.sounds[i].push(s);
				s = null;
			}
		}
		// populate user variables
		Stage.variables = {};
		for (var i=0; i<parseInt(localStorage["uv_count"]); i++) {
			var uv = new UserVars();
			if (localStorage["uv"+i+"_type"] == "number")
				uv.Set(parseFloat(localStorage["uv"+i+"_value"]));
			else if (localStorage["uv"+i+"_type"] == "boolean")
				uv.Set((localStorage["uv"+i+"_value"] == "true"));
			else
				uv.Set(localStorage["uv"+i+"_value"]);
			Stage.variables[localStorage["uv"+i+"_name"]] = uv;
			uv = null;
		}
		// populate form stack and style
		Stage.formStack.splice(0, Stage.formStack.length);
		for (var i=0; i<parseInt(localStorage["forms_count"]); i++) {
			Stage.formStack.push(localStorage["formStack_"+i]);
		}
		Stage.formStyle.splice(0, Stage.formStyle.length);
		for (var i=0; i<parseInt(localStorage["forms_style_count"]); i++) {
			Stage.formStyle.push(localStorage["formStyle_"+i]);
		}
		// populate Config
		Config = JSON.parse(localStorage["Config"]);
		Helper.configUpdate("activeTheme");
		
		// populate frameStack
		Stage.script.frameStack = JSON.parse(localStorage["frameStack"])
		// then jump to checkpoint location
		if (localStorage["sequence"] != '')
			Stage.script.sequence = eval(localStorage["sequence"]);
		Stage.script.frame = parseInt(localStorage["frame"]);
	}
}

///////////////////////////////////////////////////////////////////////////////
// Stage elements
///////////////////////////////////////////////////////////////////////////////
// User variables
///////////////////////////////////////////////////////////////////////////////
function UserVars() {
	this.value = 0;
	this.type = 0;
}
UserVars.prototype.Set = function(v) {
	this.value = v;
	this.type = typeof v;
}
UserVars.prototype.Value = function() {
	return this.value;
}
UserVars.prototype.Type = function() {
	return this.type;
}
///////////////////////////////////////////////////////////////////////////////
// Audio/Video elements
///////////////////////////////////////////////////////////////////////////////
function Sounds() {
	this.initd = false;
	this.src = 0;
	this.audio = new Audio();
	this.repeat = -1;
	this.delay = 0;
	this.isStopping = false;
	this.isPaused = false;		
}
Sounds.prototype.Play = function(init) {
	var that = this;
	if (init && this.initd) return;
	if ((this.audio != null) &&
		(this.src != null)) {
		if (init) {
			this.audio.src = this.src;
			Helper.addEvent(this.audio, 'ended', function(e) {
				if (that.repeat > 0) {
					that.Play(false);
					that.repeat--;
				}
				else if (that.repeat < 0) {
					that.Play(false);
				}
				else {
					that.isPaused = true;
				}
			}, false);
			this.audio.volume = Config.volumeAudio;
			if (!this.isPaused) {
				if (this.delay > 0)
					setTimeout(function() {
						if (!that.isPaused && !that.isStopping)
							that.audio.play();
					}, this.delay * 1000);
				else
					this.audio.play();
			}
			this.initd = true;
		}
		else {
			this.audio.volume = Config.volumeAudio;
			this.isPaused = false;
			if (this.delay > 0)
				setTimeout(function() {
					if (!that.isPaused && !that.isStopping)
						that.audio.play();
				}, this.delay * 1000);
			else
				this.audio.play();
		}
	}
}
Sounds.prototype.Stop = function(immediate) {
	if ((this.audio != null) &&	(this.initd)) {
		this.isStopping = true;
		if ((immediate) || (this.audio.volume <= 0)) {
			this.audio.pause();
			this.audio.currentTime = 0;
			this.isStopping = false;
			this.isPaused = true;
		}
		else {
			this.audio.volume = Math.max(0, this.audio.volume-Math.max(0.01, this.audio.volume/4));
		}
	}
}
Sounds.prototype.Pause = function() {
	if ((this.audio != null) && (this.initd)) {
		this.audio.pause();
		this.isPaused = true;
	}
}
Sounds.prototype.Seek = function(pos) {
	if ((this.audio != null) && (this.initd)) {
		this.audio.currentTime = pos;
	}
}
Sounds.prototype.Rewind = function() {
	if ((this.audio != null) &&	(this.initd)) {
		this.audio.currentTime = 0;
	}
}
function Movie() {
	this.initd = false;
	this.src = 0;
	this.movie = document.createElement('video');
	this.isStopping = false;
	this.pos = new Vector2d(0,0);
	this.parent = 0;
}
Movie.prototype.Play = function() {
	var that = this;
	if (this.initd)	return;
	if ((this.movie != null) && 
		(this.src != null)) {
		Helper.addEvent(this.movie, 'ended', function(){
			that.isStopping = true;
		}, false);
		if (!Config.movieOnCanvas) {
			Helper.addEvent(this.movie, 'mouseup', function(e) {
				if (e.which != 1) return;
				that.isStopping = true;
			}, false);
			Helper.addEvent(this.movie, 'touchend', function(e) {
				e.preventDefault();
				that.isStopping = true;
			}, false);

			this.pos.vx = Stage.canvas.offsetLeft;
			this.pos.vy = Stage.canvas.offsetTop;
		}
		this.movie.src = this.src;
		this.movie.width = Config.movieSize * Stage.canvas.width;
		this.movie.height = Config.movieSize * Stage.canvas.height;
		this.pos.vx += (Stage.canvas.width - this.movie.width)>>1; 
		this.pos.vy += (Stage.canvas.height - this.movie.height)>>1; 

		this.initd = true;
		this.movie.autoplay = true;
		this.movie.volume = Config.volumeVideo;
		if (!Config.movieOnCanvas) {
			this.movie.setAttribute('style', 'position:absolute; left:'+this.pos.vx+'px; top:'+this.pos.vy+'px');
			this.parent = Stage.canvas.parentElement;
			this.parent.appendChild(this.movie);
		}
	}
}
Movie.prototype.Stop = function(init) {
	if ((this.movie != null) && (this.initd)) {
		this.movie.pause();
		if (!Config.movieOnCanvas)
			this.parent.removeChild(this.movie);
		this.movie = null;
		Stage.pause = false;
	}
}
///////////////////////////////////////////////////////////////////////////////
// Default form elements
///////////////////////////////////////////////////////////////////////////////
function Form(id) {
	this.newForm = document.createElement("form");
	this.newFieldset = document.createElement("fieldset");
	//this.parent = 0;
		
	this.newForm.id = id;
	var x = Stage.canvas.offsetLeft;
	var y = Stage.canvas.offsetTop;
	this.newForm.setAttribute('style', 'position:absolute; left:'+x+'px; top:'+y+'px;');
	
	var newHeading = document.createElement("h1");
	newHeading.innerHTML = id;
	this.newForm.appendChild(newHeading);
	var newHr = document.createElement("hr");
	this.newForm.appendChild(newHr);		
	this.newFieldset.id = "_fieldset_";
	this.newForm.appendChild(this.newFieldset);

	this.parent = Stage.canvas.parentElement;
	this.parent.appendChild(this.newForm);
	Stage.formBindings.splice(0, Stage.formBindings.length);
}
Form.prototype.AddChild = function(element, fieldsetname) {
	if (fieldsetname != null)
		document.getElementById(fieldsetname).appendChild(element);
	else
		this.newFieldset.appendChild(element);
}
///////////////////////////////////////////////////////////////////////////////
// Background/Overlay image
///////////////////////////////////////////////////////////////////////////////
function Backdrop() {
	this.isready = false,
	this.loaded = 1;

	this.type = '';
	this.context = 0;
	this.image = 0;
	this.objects = new Array();
	this.drawn = false;
	this.redraw = true;
	this.visible = true;
	this.update = false;
		
	this.effects = 'done';
	this.fxparam = '';
	this.alpha = 0;
	this.target_alpha = 1;
	this.rotation = 0;
	this.accum_rotation = 0;
	this.orientation = 0;
	this.scale = 1;
	this.size = 1;
	this.scroll = false;
	this.transTime = 1;

	this.origin = new Vector2d(0,0);		// backdrop's origin is center
	this.pos = new Vector2d(0,0);
	this.target_pos = new Vector2d(0,0);
	this.offset = new Vector2d(0,0);
	this.backdropDim = new Vector2d(0,0);
}
Backdrop.prototype.Create = function(id, file, obj) {
	var that = this;
	var canvas = document.createElement('canvas');
	canvas.id = escape(id);
	this.context =  canvas.getContext('2d');

	if (obj) {
		this.loaded += obj.length;	// total number of images to load
		for (var i in obj) {
			var item = {img:new Image(), x:obj[i].x, y:obj[i].y};
			Helper.addEvent(item.img, 'load', function() {
				that.IsLoaded();
			}, false);
			item.img.src = obj[i].src;
			this.objects.push(item);
			item = null;
		}
	}
	if (Helper.checkIfImage(file)) {
		this.image = new Image();
		Helper.addEvent(this.image, 'load', function() {
			// use larger canvas to support sprite rotation
			that.backdropDim = new Vector2d(that.image.width, that.image.height);
			var dim = Math.ceil(that.backdropDim.length());
			that.context.canvas.setAttribute('width', dim);
			that.context.canvas.setAttribute('height', dim);
			that.origin = new Vector2d(dim/2, dim/2);
			that.IsLoaded();
		}, false);
		this.image.src = file;
	}
	else {
		// assume valid HTML color
		this.image = file;
		this.context.canvas.setAttribute('width', 1.1*Stage.canvas.width);
		this.context.canvas.setAttribute('height', 1.1*Stage.canvas.height);
		this.origin = new Vector2d(this.context.canvas.width>>1, this.context.canvas.height>>1);
		this.isready = true;
	}
	// configure transition
	this.transTime = (Config.transTime > 0) ? Config.transTime : 0.1;
	this.update = false;
	this.Reset(true);
	canvas = null;
	return this.context.canvas.id;
}		
Backdrop.prototype.IsLoaded = function() {
	if (--this.loaded <= 0)
		this.isready = true;
}
Backdrop.prototype.Reset = function(init) {
	if ((init) || (!this.visible)) {
		this.target_pos = new Vector2d(Stage.canvas.width>>1, Stage.canvas.height>>1);
		this.pos.copy(this.target_pos);
	}
	this.visible = true;
	this.redraw = true;
}
Backdrop.prototype.Update = function(elapsed) {
	if (this.isready)
		Helper.processEffects(this, elapsed);
	return this.update;
}
Backdrop.prototype.Draw = function() {
	if (!this.isready) return false;
	if (!this.redraw) return false;
	
	if (this.visible) {
		this.context.clearRect(0,0,this.context.canvas.width,this.context.canvas.height);		
		this.context.globalAlpha = Math.max(0, Math.min(1, this.alpha));		
		if (this.rotation != 0) {
			this.context.translate(this.context.canvas.width/2, this.context.canvas.height/2);
			this.context.rotate(this.rotation * Math.PI/180);
			this.context.translate(-this.context.canvas.width/2, -this.context.canvas.height/2);
			this.rotation = 0.0;
		}
		if ((this.image.constructor == HTMLImageElement) || (this.image.constructor == Image)) {
			this.context.drawImage(this.image, 
								((this.context.canvas.width - this.backdropDim.vx)/2)>>0,
								((this.context.canvas.height - this.backdropDim.vy)/2)>>0);
		}
		else {
			this.context.fillStyle = this.image;
			this.context.fillRect(0, 0, this.context.canvas.width, this.context.canvas.height);		
		}
		if (this.objects.length > 0) {
			for (var i in this.objects)
				this.context.drawImage(this.objects[i].img, 
									(this.objects[i].x + (this.context.canvas.width - this.backdropDim.vx)/2)>>0,
									(this.objects[i].y + (this.context.canvas.height - this.backdropDim.vy)/2)>>0);
		}
	}
	this.redraw = false;
	if (this.drawn) this.update = true;
	return true;
}
///////////////////////////////////////////////////////////////////////////////
// Selectable/clickable image; use for buttons, imagemaps, etc.
///////////////////////////////////////////////////////////////////////////////
function ActiveImage() {
	this.isready = false,
	this.redraw = true,
	this.loaded = 0,
	this.update = false,
	this.prev_state = '',
	this.aTimer = 0,
	this.aTimerOn = false;

	this.type = 'button';
	this.group = '';
	this.context = 0;
	this.sprites = new Array();
	this.inputFocus = false;
	this.text = '';
	this.link = '';
	this.origin = new Vector2d(0,0);
	this.rect = new Rect(0, 0, 0, 0);
	this.visible = true;
	this.showText = true;
	this.state = '';
	this.tooltip = '';
	
	this.fps = 0;
	this.timeout = 0;
	this.countup = 0;
}
ActiveImage.prototype.Create = function(id, rect, obj) {
	var that = this;
	var canvas = document.createElement('canvas');
	canvas.id = escape(id);
	this.context = canvas.getContext('2d');
	if (this.type == 'animText') {
		// TODO: for now only timer is supported
		this.text = Helper.convertTime(this.timeout);
		// create a user variable with id
		var val = Helper.findVar(escape(id));
		if (val != null) {
			Stage.variables[escape(id)].Set(this.timeout);
		}
		else {
			var uv = new UserVars();
			uv.Set(this.timeout);
			Stage.variables[escape(id)] = uv;
		}
		this.countup = !(this.timeout > 0);
	}
	else
		this.text = id;
	this.rect = rect;
	this.origin = new Vector2d(this.rect.x, this.rect.y);
	
	try {
		if (obj.length>0) {
			this.loaded = obj.length;
			for (var i in obj) {
				if (Helper.checkIfImage(obj[i])) {
					var item = new Image();
					Helper.addEvent(item, 'load', function() {
						that.IsLoaded();
					}, false);
					item.src = obj[i];
					this.sprites.push(item);
					this.rect.w = 0;
					this.rect.h = 0;
					item = null;
				}
				else {
					this.sprites.push(obj[i])
					this.IsLoaded();
				}
			}
		}
	} catch (e) {
		var item = Config.activeTheme.formElementBack;
		this.sprites.push(item);
		this.context.canvas.setAttribute('width',this.rect.w);
		this.context.canvas.setAttribute('height',this.rect.h);
		this.isready = true;
	}
	canvas = null;
},
ActiveImage.prototype.IsLoaded = function() {
	if (--this.loaded <= 0) {
		this.isready = true;
		// all sprites are assumed same size, set canvas size here
		var idx = 0;
		for (var i in this.sprites) {
			if ((this.sprites[i].constructor == HTMLImageElement) || (this.sprites[i].constructor == Image)) {
				idx = i;
				break;
			}
		}
		if (this.rect.w == 0) {
			this.context.canvas.setAttribute('width',this.sprites[idx].width);
			this.rect.w = this.sprites[0].width;
		}
		else 
			this.context.canvas.setAttribute('width',this.rect.w);
		if (this.rect.h == 0) {
			this.context.canvas.setAttribute('height',this.sprites[idx].height);
			this.rect.h = this.sprites[0].height;
		}			
		else 
			this.context.canvas.setAttribute('height',this.rect.h);
	}
}
ActiveImage.prototype.Update = function(elapsed) {
	var that = this;
	if (this.isready) {
		if (!this.visible) {
			this.inputFocus = false;
		}
		else if (this.type == 'button') {
			if (this.prev_state != this.state) {
				this.prev_state = this.state;
				this.redraw = true;	
				if ((this.state == 'hover') || (this.state == 'clicked')) {
					this.inputFocus = true;
					if (this.tooltip != '') Stage.Transition(1.0);
				}
				else
					this.inputFocus = false;
			}
			if (Stage.mouseClick && this.inputFocus) {
				if (this.link != '') {
					this.link[0](this.link[1]);
					Stage.pause = false;
				}
				this.redraw = true;
			}
		}
		else if (this.type == 'animText') {
			// TODO: for now only timer is supported
			if (!this.aTimerOn) {
				this.aTimer = setTimeout(function() {
					if (that.countup)
						Helper.setValue(that.context.canvas.id, Helper.getValue(that.context.canvas.id)+1);
					else
						Helper.setValue(that.context.canvas.id, Helper.getValue(that.context.canvas.id)-1);
					that.text = Helper.convertTime(Helper.getValue(that.context.canvas.id));
					that.redraw = true;
					if (!that.countup) {
						if (Helper.getValue(that.context.canvas.id) > 0) {
							if (that.visible) that.aTimerOn = false;
						}
						else {
							if (that.link != '') {
								that.link[0](that.link[1]);
								Stage.pause = false;
							}
						}
					}
					else {
						if (that.visible) that.aTimerOn = false;
					}
				}, 1000/this.fps )
				this.aTimerOn = true;
			}
		}
		else if (this.type == 'animImage') {
			if ((!this.aTimerOn) && (this.sprites.length > 1)) {
				this.aTimer = setTimeout(function() {
					that.countup++;
					that.countup %= that.sprites.length;
					that.redraw = true;
					if (that.visible) that.aTimerOn = false;
				}, 1000/this.fps);
				this.aTimerOn = true;
			}
		}
	}
	return this.update;
}
ActiveImage.prototype.Draw = function() {
	if (!this.isready) return false;
	if (!this.redraw) return false;

	if (this.visible) {
		this.context.clearRect(0,0,this.context.canvas.width,this.context.canvas.height);
		if (this.type == 'button') {
			if ((this.sprites.length>1) && (this.state=='hover'))
				this.DrawImageOrFill(this.sprites[1]);
			else if ((this.sprites.length>2) && (this.state=='clicked'))
				this.DrawImageOrFill(this.sprites[2]);
			else
				this.DrawImageOrFill(this.sprites[0]);
		}
		else if (this.type == 'animText') {
			this.DrawImageOrFill(this.sprites[0]);
		}
		else if (this.type == 'animImage') {
			this.DrawImageOrFill(this.sprites[this.countup]);
		}
		if ((this.showText) && (this.text != '')) {
			this.context.textBaseline = 'middle';
			this.context.textAlign = 'center';
			if (Stage.formStyle.length > 0)
				this.context.font = Stage.formStyle[0];
			if (Stage.formStyle.length > 1)
				this.context.fillStyle = Stage.formStyle[1];
			this.context.fillText(this.text, this.rect.w/2,this.rect.h/2);
		}			
		if (this.link != '') {
			// create a detectable path
			this.context.beginPath();
			this.context.rect(this.rect.x,this.rect.y,this.rect.w,this.rect.h);
			this.context.closePath();
		}
	}			
	this.redraw = false;
	this.update = true;
	return true;
}
ActiveImage.prototype.DrawImageOrFill = function(obj) {
	if ((obj.constructor == HTMLImageElement) || (obj.constructor == Image))
		this.context.drawImage(obj,0,0);
	else {
		this.context.fillStyle = obj;
		this.context.fillRect(0,0,this.context.canvas.width,this.context.canvas.height);
	}
}
///////////////////////////////////////////////////////////////////////////////
// Script box and script handler for dialogs
///////////////////////////////////////////////////////////////////////////////
function ScriptBox() {	
	this.image = null;
	this.vpwidth = 0;
	this.vpheight = 0;
	this.redraw = true;
	this.update = false;
	this.fxupdate = false;
	this.menuHover = -1;
	this.curLineCount = 0;

	this.type = 'box';				// identifies type of gui
	this.group = '';
	this.pos = 'bottom';
	this.back = 'dim';
	this.src = null;
	this.context = 0;
	this.canvasText = new CanvasText;
	this.dimStyle = new Array();
	this.jumpTo = new Array();
	this.origin = new Vector2d(0,0);		// gui origin is topleft
		
	this.isready = true;				// flow control
	this.changed = true;
	this.cont = false;
	this.visible = false;
	this.inputFocus = false;
	this.timeout = 0;
		
	this.text = '';					// text display
	this.prompt = new Image();
	this.avatar = null;
	this.psrc = '';
	this.alpha = 1;
	this.effects = 'none';
	this.scrollOffsetY = 0;
		
	this.fontFamily = 'Verdana';		// font properties
	this.fontColor = 'white';
	this.fontSize = '14px';
	this.fontWeight = 'normal';
	this.lineHeight = '18';
	this.textOffset = new Vector2d(10, 20);
	this.textAlign = 'start';
	this.tagFamily = this.fontFamily;
	this.tagColor = '#c8ffc8';
	this.tagSize = this.fontSize;
	this.tagWeight = 'bold';
}
ScriptBox.prototype.Create = function(w, h) {
	var that = this;
	this.src = '';
	this.vpwidth = w;	// viewport dimensions
	this.vpheight = h;
	this.origin.vx = this.vpwidth * (1-Config.boxWidth)/2; 	//1/8;
	this.origin.vy = this.vpheight * (1-Config.boxHeight);	//3/4;
	
	// create a default script box: dim at bottom
	var canvas = document.createElement('canvas');
	this.context = canvas.getContext('2d');
	this.context.canvas.setAttribute('width', this.vpwidth * Config.boxWidth);
	this.context.canvas.setAttribute('height', this.vpheight * Config.boxHeight);			
	// create prompt this.images
	if (this.psrc != '') {
		Helper.addEvent(this.prompt, 'load', function() {
			that.isready = true;
		}, false);
		this.prompt.src = this.psrc;			
	}
	canvas = null;
}
ScriptBox.prototype.Update = function(elapsed) {
	var that = this;
	if (this.changed || this.fxupdate) {
		if (this.changed) {
			switch (this.pos) {
				case 'bottom':
					this.origin.vx = this.vpwidth * (1-Config.boxWidth)/2;
					this.origin.vy = this.vpheight * (1-Config.boxHeight);
					this.context.canvas.setAttribute('width', this.vpwidth * Config.boxWidth);
					this.context.canvas.setAttribute('height', this.vpheight * Config.boxHeight);
					break;
				case 'center':
					this.origin.vx = this.vpwidth * (1-Config.boxWidth)/2;
					this.origin.vy = this.vpheight * (1-Config.boxHeight)/2;
					this.context.canvas.setAttribute('width', this.vpwidth * Config.boxWidth);
					this.context.canvas.setAttribute('height', this.vpheight * Config.boxHeight);
					break;
				case 'top':
					this.origin.vx = this.vpwidth * (1-Config.boxWidth)/2;
					this.origin.vy = 0;
					this.context.canvas.setAttribute('width', this.vpwidth * Config.boxWidth);
					this.context.canvas.setAttribute('height', this.vpheight * Config.boxHeight);
					break;
				case 'full':
					this.origin.vx = this.vpwidth * (1-Config.boxWidth)/2;
					this.origin.vy = this.vpheight * (1-Config.boxFullHeight)/2;
					this.context.canvas.setAttribute('width', this.vpwidth * Config.boxWidth);
					this.context.canvas.setAttribute('height', this.vpheight * Config.boxFullHeight)
					break;
			}
			switch (this.back) {
				case 'image':
					if (this.src != null) {
						if ((this.image == null) || (this.image.src.search(this.src)==-1)) {
							this.image = new Image();
							this.isready = false;
							Helper.addEvent(this.image, 'load', function() {
								that.isready = true;
							}, false);
							this.image.src = this.src;
							this.update = false;
						}
					}
					break;
				case 'none':
				case 'dim':
				default:
					break;
			}
			this.canvasText.config({
				canvas: this.context.canvas,
				context: this.context,
				fontFamily: this.fontFamily,
				fontSize: this.fontSize,
				fontWeight: this.fontWeight,
				fontColor: this.fontColor,
				lineHeight: this.lineHeight
			});
			this.canvasText.updateCanvas(this.context.canvas);
		}
		switch (this.effects) {
			case 'fade':
				if (this.alpha >= 1) {
					this.effects = 'none';
				}
				else {
					this.alpha += elapsed/(Config.transTime * 1000);
					this.fxupdate = true;
				}
				this.update = false;
				break;
			case 'scroll':
				if (this.scrollOffsetY <= -(this.curLineCount+1) * this.lineHeight) {
					this.effects = 'none';
					//this.scrollOffsetY = 0;
					this.timeout = 0.1;	// setup timer once scroll is finished
				}
				else {
					this.scrollOffsetY -= Config.boxScrollSpeed * elapsed/(Config.transTime * 25);
					this.fxupdate = true;
					this.timeout = 0;	// disable timer if enabled
				}
				this.update = false;
				break;
			case 'none':
			default:
				this.fxupdate = false;
				break;
		}
		this.changed = false;			
		this.redraw = true;
	}
	if (this.CheckHoverOnHotspot()) {
		this.redraw = true;
	}
	if (Stage.mouseClick && this.inputFocus && (this.menuHover != -1)) {
		Stage.script.SetFrame(this.jumpTo[this.menuHover].link);
		this.inputFocus = false;
		this.menuHover = -1;
		this.jumpTo.splice(0,this.jumpTo.length);
		this.visible = false;
		this.redraw = true;
	}
	return this.update;
}
ScriptBox.prototype.Draw = function() {
	if (!this.isready) return false;
	if (!this.redraw) return false;
	
	if (this.visible == true) {
		this.context.clearRect(0,0,this.context.canvas.width,this.context.canvas.height);	
		if (this.back == 'dim') {
			this.context.globalAlpha = 0.5;
			if (this.dimStyle.length > 1) {
				var grd=this.context.createLinearGradient(0,0,0,this.context.canvas.height);
				grd.addColorStop(0,this.dimStyle[1]);
				grd.addColorStop(1/this.context.canvas.height,this.dimStyle[0]);
				grd.addColorStop(1,this.dimStyle[1]);
				this.context.fillStyle=grd;
			} 
			else {
				this.context.fillStyle = this.dimStyle[0];
			}
			this.context.fillRect(0,0,this.context.canvas.width,this.context.canvas.height);
		}
		if ((this.back == 'image') && (this.src != null)) {
			this.context.globalAlpha = 1;		
			this.context.drawImage(this.image, 0, 0, this.context.canvas.width,this.context.canvas.height);
		}
		if (this.text != '') {
			this.context.globalAlpha = 1;
			// draw the avatar if any
			var avatarOffsetX = 0;
			if (Config.actorShowAvatar == true) {
				if (this.avatar != null) {
					avatarOffsetX = this.avatar.width;
					this.context.drawImage(this.avatar, 
										   (this.textOffset.vx/2)>>0, 
										   ((this.context.canvas.height - this.avatar.height)/2)>>0);
				}
			}
			var ret = this.canvasText.drawText({
				text:this.text,
				x: this.textOffset.vx + avatarOffsetX,
				y: this.textOffset.vy, // + this.scrollOffsetY,
				align: this.textAlign,
				alpha: this.alpha,
				boxWidth:this.context.canvas.width-2*this.textOffset.vx - avatarOffsetX,
				scroll: [(this.effects == 'scroll'), this.scrollOffsetY],
			});
			// draw the prompt icon
			if (typeof ret == "object") {
				//vncanvas doesn't use cache or return this.image
				this.curLineCount = ret.linecount;
				if (ret.hotspot.length == 0) {
					if ((this.effects == 'none') && (this.psrc != ''))
						this.context.drawImage(this.prompt, 
											   ret.endpt[0]>>0, 
											   (ret.endpt[1] - this.prompt.height)>>0);
				}
				else {
					for (var i=0; i<ret.hotspot.length; i++) {
						this.jumpTo[i].hotspot = ret.hotspot[i];
					}
				}
			}
			// draw hover
			if ((this.jumpTo.length > 0) && (this.menuHover != -1)) {
				this.context.save();
				this.context.globalAlpha = 0.25;						
				this.context.fillStyle = Config.activeTheme.boxMenuHilite;
				this.context.fillRect(5,this.jumpTo[this.menuHover].hotspot[1] - this.lineHeight + 4,
										this.context.canvas.width - 10,this.lineHeight);
				this.context.restore();
			}
		}
		// Pauses script box
		Stage.pause = true;
		if (!Stage.utimerOn && (this.timeout > 0)) {
			Stage.utimer = setTimeout((function(self) { 
				return function() {
					Stage.pause = false; 
					Stage.utimerOn = false;
					self.timeout = 0;
				}
			})(this), this.timeout * 1000);
			Stage.utimerOn = true;
		}
	}
	else {
		Stage.pause = false;
	}
	if (!this.changed) this.update = true;
	this.redraw = false;
	return true;
}
ScriptBox.prototype.CheckHoverOnHotspot = function() {
	if (Stage.mouseMove == false) return false;
	if (this.jumpTo.length == 0) return false;
	if (this.jumpTo[0].hotspot.length < 2) return false;
	if (Stage.coord.vx < this.origin.vx) return false;
	if (Stage.coord.vx > this.origin.vx + this.vpwidth * Config.boxWidth) return false;
	
	for (var i in this.jumpTo) {
		if (Stage.coord.vy < this.origin.vy + this.jumpTo[i].hotspot[1] - this.lineHeight) continue;
		if (Stage.coord.vy > this.origin.vy + this.jumpTo[i].hotspot[1]) continue;
		this.menuHover = i;
		return true;
	}
	return false;
}
function Script() {
	this.sequence = 0;		// story board, composed of object-value pairs
	this.frame = 0;			// sequence counter
	this.frameStack = new Array();
}
Script.prototype.Init = function(name) {
	this.sequence = name;
	this.frame = 0;
}
Script.prototype.Update = function() {
	if (this.sequence.length > this.frame) {
		if (typeof(this.sequence[this.frame]) == "function") {
			this.sequence[this.frame](this.sequence[this.frame+1]);
		}
		this.frame += 2;
	}
	else if (this.sequence.length > 0) {
		/*alert("End of script!"); */
		Stage.update = false;
		Stage.pause = true;
	}
}
Script.prototype.SetFrame = function(locator) {
	var str = locator.split('#');
	if (str.length > 1)
		this.sequence = eval(str.shift());
	var newlabel = str.shift();
	for (var i=0; i<this.sequence.length; i+=2){
		if ((this.sequence[i] == label) && (this.sequence[i+1] == newlabel)) {
			this.frame = i;
			return true;
		}
	}
	return false;
}
Script.prototype.PushFrame = function() {
	var seq_name = '';
	if (this.sequence[0] == label)
		seq_name = this.sequence[1];
	// TODO: limit stack to 8 
	while (this.frameStack.length >= 8)
		this.frameStack.shift();
	this.frameStack.push([seq_name, this.frame-2]);
}
Script.prototype.PopFrame = function() {
	if (this.frameStack.length > 0) {
		var ret_frame = this.frameStack.pop();
		this.sequence = eval(ret_frame[0]);
		this.frame = ret_frame[1];
	}
}
///////////////////////////////////////////////////////////////////////////////
// Actors
///////////////////////////////////////////////////////////////////////////////
function Character(id) {
	this.type = 'actor';
	//this.context = 0;
	this.sprites = new Array();
	this.avatar = null;
	//this.id = '';
	this.nick = '';
	this.color = 0;
	this.prevSprite = -1;
	this.activeSprite = -1;
	//this.isready = false;
	this.drawn = false;
	//this.update = false;
	this.redraw = true;
	this.visible = true;
	this.pendingRemoval = false;
	this.activeSpriteRemoval = false;
		
	this.origin = new Vector2d(0,0);		// actor origin is bottom center
	this.pos = new Vector2d(0,0);
	this.target_pos = new Vector2d(0,0);
	this.offset = new Vector2d(0,0);		// dummy
	this.spriteDim = new Vector2d(0,0);
	this.posMode = 'auto';
		
	this.effects = 'done';
	this.prevFx = '';
	this.fxparam = '';
	this.alpha = 0;
	this.target_alpha = 0;
	this.rotation = 0;
	this.accum_rotation = 0;
	this.orientation = 0;
	this.scale = 1;
	this.size = 1;
	//this.transTime = 1;
		
	this.id = id;
	var canvas = document.createElement('canvas');
	canvas.id = escape(id);
	this.context = canvas.getContext('2d');
	this.transTime = (Config.transTime > 0) ? Config.transTime : 0.1;
	this.isready = true;
	this.update = false;
	this.Reset(true);
	canvas = null;
	//return this.context.canvas.id;
}
Character.prototype.AddSprite = function(tag, file) {
	var that = this;
	var idx = -1;
	if (this.sprites.length > 1) {
		for (var i in this.sprites) {
			if (this.sprites[i].id == tag) {
				if (this.sprites[i].src.src.search(file) != -1) {
					// this is same sprite, just do nothing
					this.isready = true;
					this.update = false;
					this.activeSprite = i;
					return;
				}
				else {
					// this is same tag but different sprite
					idx = i;
					break;
				}
			}
		}
	}
	this.isready = false;
	if (idx == -1) {
		var image = new Image();
		var newSprite = {id:tag, src:image};
		this.sprites.push(newSprite);
		image = null;
	} 
	else {
		var tmpSprite = this.sprites[i];
		this.sprites.splice(i, 1)
		tmpSprite.src = new Image();
		this.sprites.push(tmpSprite);
		tmpSprite.src = null; tmpSprite = null;
	}
	Helper.addEvent(this.sprites[this.sprites.length-1].src, 'load', function() {
		// use larger canvas to support sprite rotation
		that.spriteDim = new Vector2d(that.sprites[that.sprites.length-1].src.width, 
							 that.sprites[that.sprites.length-1].src.height);
		var dim = Math.ceil(that.spriteDim.length());
		that.context.canvas.setAttribute('width', dim);
		that.context.canvas.setAttribute('height', dim);
		that.origin = new Vector2d(dim/2, dim/2 + that.spriteDim.vy/2);
		that.isready = true;
	}, false);
	this.sprites[this.sprites.length-1].src.src = file;
	this.activeSprite = this.sprites.length-1;
	this.update = false;
}
Character.prototype.RemoveSprite = function(tag) {
	if (this.sprites.length > 1) {
		for (var i in this.sprites) {
			if (this.sprites[i].id == tag) {
				// if i > activeSprite, just remove
				// if i < activeSprite, remove then set activeSprite+1
				// if i == activeSprite, wait until hidden
				if (i > this.activeSprite) {
					this.sprites[i].src = null;
					this.sprites.splice(i, 1);
				}
				else if (i < this.activeSprite) {
					this.sprites[i].src = null;
					this.sprites.splice(i, 1);
					this.activeSprite = Math.max(this.activeSprite-1, 0);						
				}
				else {
					this.activeSpriteRemoval = true;
				}
				break;
			}
		}
	}
}
Character.prototype.AddAvatar = function(file) {
	var that = this;
	if (file != '') {
		this.isready = false;
		this.avatar = new Image();
		Helper.addEvent(this.avatar, 'load', function() {
			that.isready = true;
		}, false);
		this.avatar.src = file;
		this.update = false;
	}
	else {
		this.avatar = null;
	}
}
Character.prototype.Reset = function (init) {
	if (init || !this.visible) {
		this.target_pos = new Vector2d(Stage.canvas.width/2, 
							Stage.canvas.height*Config.actorYPosition);
		this.pos.copy(this.target_pos);
	}
	this.visible = true;
	this.redraw = true;
}
Character.prototype.Update = function(elapsed) {
	if (this.isready) Helper.processEffects(this, elapsed);
	return this.update;
}
Character.prototype.Draw = function() {
	if (!this.isready) return false;
	if (!this.redraw) return false;
	if (this.activeSprite > this.sprites.length-1) return false;
	
	if (this.visible) {
		this.context.clearRect(0,0,this.context.canvas.width,this.context.canvas.height);		
		if (this.prevSprite >= 0) {
			this.context.globalAlpha = Math.max(0, Math.min(1, this.target_alpha-this.alpha));
			this.context.drawImage(this.sprites[this.prevSprite].src, 								   
								((this.context.canvas.width - this.spriteDim.vx)/2)>>0,
								((this.context.canvas.height - this.spriteDim.vy)/2)>>0);
			if (this.target_alpha - this.alpha <= 0) this.prevSprite = -1;
		}
		this.context.globalAlpha = Math.max(0, Math.min(1, this.alpha));
		if (this.rotation != 0) {
			this.context.translate(this.context.canvas.width/2, this.context.canvas.height/2);
			this.context.rotate(this.rotation * Math.PI/180);
			this.context.translate(-this.context.canvas.width/2, -this.context.canvas.height/2);
			this.rotation = 0.0;
		}
		this.context.drawImage(this.sprites[this.activeSprite].src,
							   ((this.context.canvas.width - this.spriteDim.vx)/2)>>0,
							   ((this.context.canvas.height - this.spriteDim.vy)/2)>>0);
		if (this.activeSpriteRemoval && (this.alpha <= 0)) {
			this.sprites[this.activeSprite].src = null;
			this.sprites.splice(this.activeSprite, 1);
			this.activeSprite = Math.max(this.activeSprite-1, 0);
			this.activeSpriteRemoval = false;
		}
	}					
	this.redraw = false;
	if (this.drawn) this.update = true;
	return true;
}
///////////////////////////////////////////////////////////////////////////////
// Atmosphere special effects
///////////////////////////////////////////////////////////////////////////////
var AtmoEffects = {
	rain: {
		_init: function(obj, param) {
			obj.alpha = 0.5;
			obj.numParticles = (typeof param.rain == 'number') ? param.rain : 0;
			obj.direction = (param.direction != null) ? param.direction%360 : 90;
			obj.particles = new Array(obj.numParticles);
			for (var i=0; i<obj.numParticles; i++) {
				obj.particles[i] = new Particle();
				obj.particles[i].Create(obj.context.canvas,obj.direction,1,1);
			}
			obj.visible = true;
			// saves
			// numParticles is saved in param.rain
			obj.saveparam.direction = obj.direction;
		},
		_update: function(obj, elapsed) {
			var running_draw = false;
			for (var i=0; i<obj.numParticles; i++) {
				var ret = obj.particles[i].Update(elapsed, (obj.action=='start')?true:false);
				if (ret) running_draw = true;
			}
			obj.redraw = running_draw;
			if (!obj.redraw && (obj.numParticles>0)) {
				// free some memory by clearing particles, we'll add later if needed again
				obj.particles.splice(0, obj.numParticles);
				obj.numParticles = 0;
				obj.visible = false;
			}
			//else if (!obj.redraw && (obj.numParticles<=0)) {
			//	obj.update = true;
			//}
		},
		_draw: function(obj) {
			obj.context.lineWidth = "1";
			obj.context.strokeStyle = "rgb(255, 255, 255)";
			obj.context.beginPath();
			for (var i=0; i<obj.numParticles; i++) {			
				obj.context.moveTo(obj.particles[i].pos.vx, obj.particles[i].pos.vy);
				obj.context.lineTo(obj.particles[i].pos.vx - obj.particles[i].size.vx, 
									obj.particles[i].pos.vy - obj.particles[i].size.vy);
			}
			obj.context.closePath();
			// do a per frame stroke or fill, instead of per particle
			obj.context.stroke();
		}
	},
	snow: {
		_init: function(obj, param) {
			obj.alpha = 0.5;
			obj.numParticles = (typeof param.snow == 'number') ? param.snow : 0;
			obj.direction = (param.direction != null) ? param.direction%360 : 90;
			obj.particles = new Array(obj.numParticles);
			for (var i=0; i<obj.numParticles; i++) {
				obj.particles[i] = new Particle();
				obj.particles[i].Create(obj.context.canvas,obj.direction,0.5,0.2);
			}
			obj.visible = true;
			// saves
			// numParticles is saved in param.snow
			obj.saveparam.direction = obj.direction;
		},
		_update: function(obj, elapsed) {
			var running_draw = false;
			for (var i=0; i<obj.numParticles; i++) {
				var ret = obj.particles[i].Update(elapsed, (obj.action=='start')?true:false);
				if (ret) running_draw = true;
			}
			obj.redraw = running_draw;
			if (!obj.redraw && (obj.numParticles>0)) {
				// free some memory by clearing particles, we'll add later if needed again
				obj.particles.splice(0, obj.numParticles);
				obj.numParticles = 0;
				obj.visible = false;
			}
			//else if (!obj.redraw && (obj.numParticles<=0)) {
			//	obj.update = true;
			//}
		},
		_draw: function(obj) {
			obj.context.lineWidth = "1";
			obj.context.strokeStyle = "rgb(255, 255, 255)";
			obj.context.fillStyle = 'white';			
			obj.context.beginPath();
			for (var i=0; i<obj.numParticles; i++) {
				obj.context.moveTo(obj.particles[i].pos.vx, obj.particles[i].pos.vy);
				obj.context.arc(obj.particles[i].pos.vx, obj.particles[i].pos.vy, 
								obj.particles[i].size.vy, 0, 2*Math.PI);
			}
			obj.context.closePath();
			// do a per frame stroke or fill, instead of per particle
			obj.context.fill();
		}
	},
	cloud: {
		_init: function(obj, param) {
			if (param.cloud.search(/(start|stop)/g) == -1)
				obj.src = param.cloud;
			obj.isready = false;
			obj.alpha = 0;
			obj.image = new Image();
			Helper.addEvent(obj.image, 'load', function() {
				obj.isready = true;
				obj.visible = true;
			}, false);
			obj.image.src = obj.src;
			obj.direction = null;
			obj.pos = new Vector2d(0,0);
			if (param.direction != null) {
				obj.direction = param.direction % 360;
				obj.dirVector = new Vector2d(1,0);
				obj.dirVector.rotate(obj.direction * Math.PI/180);
			}
			// saves
			obj.saveparam.cloud = obj.src;
			obj.saveparam.direction = obj.direction;
		},
		_update: function(obj, elapsed) {
			if (obj.action == 'stop') {
				if (obj.alpha > 0) {
					obj.alpha -= elapsed/(Config.transTime * 1000)
					obj.redraw = true;
				}
				else {
					obj.image = null;
					obj.visible = false;
				}
			}
			else {
				if (obj.alpha < 1) {
					obj.alpha += elapsed/(Config.transTime * 1000);
					obj.redraw = true;
				}
				// scroll it here
				if (obj.direction != null) {
					var vel = new Vector2d(obj.dirVector.vx,obj.dirVector.vy);
					vel.scale(elapsed/(Config.transTime * 32));
					obj.pos.add(vel);
					if (obj.pos.vx < -obj.image.width) obj.pos.vx = 0;
					if (obj.pos.vx > 0) obj.pos.vx = -obj.image.width;
					if (obj.pos.vy < -obj.image.height) obj.pos.vy = 0;
					if (obj.pos.vy > 0) obj.pos.vy = -obj.image.height;
					obj.redraw = true;
				}
				else {
					obj.pos = new Vector2d(0,0);
				}
			}
		},
		_draw: function(obj) {
			var x = obj.pos.vx;
			var y = obj.pos.vy;
			while (x < obj.context.canvas.width) {
				while (y < obj.context.canvas.height) {
					obj.context.drawImage(obj.image, x, y);
					y += obj.image.height;
				}
				y = obj.pos.vy;
				x += obj.image.width;
			}
		}
	},
	beam: {
		_init: function(obj, param) {
			obj.pos = new Vector2d(0,0);
			obj.radius = (typeof param.beam == 'number') ? param.beam : 0;
			obj.mask = (param.mask) ? param.mask : 'black';
			obj.alpha = 0;
			obj.visible = true;
			// saves
			// radius is saved in param.beam
			obj.saveparam.mask = obj.mask;
		},
		_update: function(obj, elapsed) {
			if (obj.action == 'stop') {
				if (obj.alpha > 0) {
					obj.alpha -= elapsed/(Config.transTime * 1000)
					obj.redraw = true;
				}
				else {
					obj.visible = false;
				}
			}
			else {
				if (obj.alpha < 1) {
					obj.alpha += elapsed/(Config.transTime * 1000);
					obj.redraw = true;
				}
				if (!obj.pos.equal(Stage.coord)) {
					obj.pos.copy(Stage.coord);
					obj.redraw = true;
				}
			}
		},
		_draw: function(obj) {
			obj.context.fillStyle = obj.mask;
			obj.context.fillRect(0, 0, obj.context.canvas.width, obj.context.canvas.height);		
			obj.context.save();
			obj.context.globalCompositeOperation = "destination-out";
			var grd = obj.context.createRadialGradient(Stage.coord.vx, Stage.coord.vy, 0,
														Stage.coord.vx, Stage.coord.vy, obj.radius);
			grd.addColorStop(0, 'rgba(0,0,0,1)');
			grd.addColorStop(0.6, 'rgba(0,0,0,0.8)');
			grd.addColorStop(1, 'rgba(0,0,0,0)');
			obj.context.fillStyle = grd;
			obj.context.beginPath();
			obj.context.arc(Stage.coord.vx, Stage.coord.vy, obj.radius, 0, 2*Math.PI);
			obj.context.closePath();
			obj.context.fill();
			obj.context.restore();
		}
	}
}
function Atmosphere(id) {
	this.alpha = 0;
	//this.isready = false;
	this.redraw = true;
	//this.update = false;
	//this.context = 0;
	this.type = '';
	this.visible = true;
	this.action = 'start';
	this.saveparam = {};

	var canvas = document.createElement('canvas');
	canvas.id = escape(id);
	this.context = canvas.getContext('2d');
	this.context.canvas.setAttribute('width', Stage.canvas.width);
	this.context.canvas.setAttribute('height', Stage.canvas.height);	
	this.isready = true;
	this.update = false;		
	canvas = null;
	//return this.context.canvas.id;	
}
Atmosphere.prototype.Init = function(type, param) { 
	this.type = type;
	this.saveparam = param;
	AtmoEffects[this.type]['_init'](this, param);
}
Atmosphere.prototype.Update = function(elapsed) {
	if (this.isready) {
		AtmoEffects[this.type]['_update'](this, elapsed);
	}
	return this.update;
}
Atmosphere.prototype.Draw = function() {
	if (!this.isready) return false;
	if (!this.redraw) return false;
	if (this.visible) {
		this.context.clearRect(0,0,this.context.canvas.width,this.context.canvas.height);		
		this.context.globalAlpha = Math.max(0, Math.min(1, this.alpha));
		AtmoEffects[this.type]['_draw'](this);
	}	
	this.redraw = false;
	this.update = true;
	return true;
}
function Particle() {
	this.pos = new Vector2d(0,0);
	this.vel = new Vector2d(0,0);
	this.size = new Vector2d(0,0);
	this.viewh = 0;
	this.vieww = 0;
	this.dir = 0;
}
Particle.prototype.Create = function(canvas, angle, vbase, sbase) {
	this.vieww = canvas.width;
	this.viewh = canvas.height;
	this.dir = (90-angle)*Math.PI/180;

	// fix the size and velocity upon creation
	// to speed up reset and update
	this.vel.vy = Math.random() * 40 * vbase + 10;
	this.vel.vx = this.vel.vy * Math.tan(this.dir);
	this.size.copy(this.vel);
	this.vel.scale(2);
	this.size.scale(sbase);
	this.Reset();
}
Particle.prototype.Reset = function() {
	// randomize position only
	this.pos.vx = this.vieww * (2*Math.random() - 0.5);
	this.pos.vy = this.viewh * (-1*Math.random());
}
Particle.prototype.Update = function(elapsed, reset) {
	this.pos.add(this.vel);
	if (this.pos.vy > this.viewh + 50) {
		if (reset) 
			this.Reset();
		else 
			return false;
	}
	return true;
}
//Particle.prototype.Pos = function() { return this.pos; };
//Particle.prototype.Size = function() { return this.size; };
///////////////////////////////////////////////////////////////////////////////
// Main Stage
///////////////////////////////////////////////////////////////////////////////
var Stage = {
	canvasid: 0,
	canvas: 0,
	context: 0,
	timer: 0,
	redraw: 0,
	update: 0,
	pause: 0,
	script: 0,
	
	/* user inputs */
	coord: new Vector2d(0,0),
	click: new Vector2d(0,0),
	utimer: 0,
	utimerOn: false,
	inputFocus: true,
	
	/* event handling */
	mouseMove: false,
	mouseClick: false,
	mouseUp: false,
	mouseDown: false,
	mouseOut: false,
	touchStart: false,
	touchEnd: false,
	
	/*	FPS count */
	fps: 0,
	curtime: 0,
	prevtime: 0,
	framecount: 0,
	
	/* camera movement */
	// use coord as cameraPos
	targetPos: new Vector2d(0,0),
	prevPos: new Vector2d(0,0),
	camTime: 0,
	
	/* temporary static data */
	transTime: 0,
	spritePos: new Array(8),

	/* 	Normally shouldn't need more than 5 layers,
		the higher the layer, the higher Z order
			- background = 0: backdrop layer
			- foreground = 1: actors in foreground (optionally more than one layer)
			- closeup	 = 2: actors in closeup, overlay image
			- atmosphere = 3: atmospheric effects, e.g. lightning flash, dim/brighten, smoke, rain, etc.
			- interface  = 4: script box, buttons, ads
	*/
	layers: new Array(5),
	
	/*	User variables that the script can set/get
		useful for checking conditions, etc.
	*/
	variables: {},
	
	/*	Sounds to play, 3 types of sound
			- bgm = 0: background music
			- bgs = 1: background sound
			- se  = 2: sound effects
	*/
	sounds: new Array(3),
	
	/* 	Videos to play, currently only one video at a time
			- for intros, cutscenes, etc.
	*/
	videos: new Array(),
	
	/* 	Forms can be used for user required input/configuration
			- top menu (for new game, continue or options)
			- options menu
	*/
	formStack: new Array(),
	formStyle: new Array(),
	formBindings: new Array(),
	activeForm: null,
	
	Init: function(id, width, height) {
		// DEBUG: for FPS monitoring
		this.fps = 0;
		this.prevtime = new Date().getTime();
		this.curtime = this.prevtime;
		this.framecount = 0;
		
		this.canvasid = id;
		this.canvas = document.getElementById(id);
		this.context = this.canvas.getContext('2d');
		this.canvas.setAttribute('width', width);
		this.canvas.setAttribute('height', height);
		this.coord = new Vector2d(width/2, height/2);
		// for camera integrator
		this.targetPos.copy(this.coord);
		this.prevPos.copy(this.coord);
		// add event listeners here for user inputs
		Helper.addEvent(this.canvas, 'mousemove', function(e) {
			Stage.mouseOut = false;
			Stage.mouseUp = false;
			Stage.mouseDown = false;
			Stage.mouseMove = true;
			Stage.HandleEvents(e);
        }, false);
		Helper.addEvent(this.canvas, 'mousedown', function(e) {
			if (e.which != 1) return;
			Stage.mouseDown = true;
			Stage.HandleEvents(e);
        }, false);
		//Helper.addEvent(this.canvas, 'click', function(e) {
		Helper.addEvent(this.canvas, 'mouseup', function(e) {
			if (e.which != 1) return;
			Stage.mouseUp = true;
			Stage.mouseDown = false;
			Stage.HandleEvents(e);
        }, false);
		Helper.addEvent(this.canvas, 'mouseover', function(e) {
			Stage.mouseOut = false;
			Stage.HandleEvents(e);
        }, false);
		Helper.addEvent(this.canvas, 'mouseout', function(e) {
			Stage.mouseOut = true;
			//Stage.HandleEvents(e);
        }, false);
		Helper.addEvent(this.canvas, 'touchstart', function(e) {
			e.preventDefault();
			Stage.mouseOut = false;
			Stage.touchStart = true;
			Stage.HandleEvents(e);
		}, false);
		Helper.addEvent(this.canvas, 'touchmove', function(e) {
			e.preventDefault();
			Stage.mouseOut = false;
			Stage.mouseMove = true;
			Stage.HandleEvents(e);
		}, false);
		Helper.addEvent(this.canvas, 'touchend', function(e) {
			e.preventDefault();
			Stage.mouseOut = false;
			Stage.touchEnd = true;
			Stage.HandleEvents(e);
		}, false);
		// addEventListener to body for 'touchcancel' ?
		Helper.addEvent(document.body, 'touchcancel', function(e) {
			Stage.mouseOut = true;
			Stage.touchStart = false;
			Stage.touchEnd = false;
		}, false);
		// create the stage layers
		this.layers[0] = new Array(); 	//background
		this.layers[1] = new Array();	//foreground
		this.layers[2] = new Array();	//closeup
		this.layers[3] = new Array();	//atmosphere
		this.layers[4] = new Array();	//gui
		// create an auto-position lookup table, up to 8 simultaneous characters
		for (var j=0; j<8; j++) {
			var table = new Array();
			for (var i=1; i<j+2; i++) {
				if (i%2 == 0) // even
					table.push((Stage.canvas.width*(j+2-i/2)/(j+2))>>0);
				else // odd
					table.push((Stage.canvas.width*(((i/2)>>0)+1)/(j+2))>>0);
			}
			this.spritePos[j] = table;
			table = null;
		}
		// auto create script box as first element in layers[4]
		var sb = new ScriptBox();
		sb.Create(width, height);
		this.layers[4].push(sb);
		Helper.configUpdate("activeTheme");
		sb = null;
		// create the sounds playlist
		this.sounds[0] = new Array();
		this.sounds[1] = new Array();
		this.sounds[2] = new Array();
		// create the script
		this.script = new Script();
		// setup default forms theme
		if (Config.activeTheme.formFontStyle) {
			var subs = Helper.parseFontString(Config.activeTheme.formFontStyle);
			this.formStyle.splice(0, this.formStyle.length);
			if (subs.length >= 4) {
				this.formStyle.push(subs.slice(0,3).join(' '));
				this.formStyle.push(subs.slice(3).join(' '));
			}
			else
				this.formStyle.push(param);
		}
		// setup timer tick
		this.update = true;		// use this.update = false to wait when loading resources
		this.redraw = true;		// use this.redraw = false when redraw not necessary
		this.pause = false;		// use this.pause = true to wait with timer or user input
		this.Tick(1000/60);			// for 60fps
	},
	Update: function(elapsed) {
		// Note: set this.redraw to true if update needs a redraw
		this.inputFocus = (this.activeForm == null);
		for (var i in this.layers[4]) {
			if (this.layers[4][i].inputFocus) 
				this.inputFocus = false;
		}
		// handle user inputs
		this.camTime += elapsed;
		if (this.camTime > 40) {
			this.coord = this.GetCameraPosition(elapsed, this.inputFocus);
			this.camTime -= 40;		// about 25fps
		}
		if (this.mouseMove || this.CheckCamera()) {
			this.redraw = true;
		}
		if (this.mouseClick) {
			if (this.inputFocus)
				this.pause = false;	
			if (this.utimerOn) {
				this.utimerOn = false;
				clearTimeout(this.utimer);
				// TODO: cancel all  that uses this timer
				this.layers[4][0].timeout = 0;
			}
		}
		// update the script
		if (this.update && !this.pause) {
			this.script.Update()
		}
		// play sounds if any
		for (var idx in this.sounds) {
			for (var entry in this.sounds[idx]) {
				if (this.sounds[idx][entry].isStopping)
					this.sounds[idx][entry].Stop(false);
				else
					this.sounds[idx][entry].Play(true);
			}
		}
		// play videos if any
		for (var idx in this.videos) {
			if ((this.videos[idx].isStopping) ||
				(this.mouseClick && Config.movieOnCanvas)){
				this.videos[idx].Stop();
				this.videos.pop();
			}
			else
				this.videos[idx].Play();
		}
		// update layers
		var running_update = true;
		for (var idx in this.layers) {
			for (var entry in this.layers[idx]) {
				if (!this.layers[idx][entry].Update(elapsed)) {
					running_update = false;
				}
			}
		}
		this.update = running_update;
		if ((this.update) && (this.transTime > 0)) {
			this.transTime = Math.max(0, this.transTime - elapsed/1000);
		}
		// reset clicked, assumed processing done
		this.mouseClick = false;
		this.mouseMove = false;
	},	
	Draw: function() {
		// TODO: clear entire stage first; manage for improved FPS
		if (this.redraw && ((this.layers[0].length > 0) || 
							(this.layers[1].length > 0) ||
							(this.layers[2].length > 0) ||
							(this.layers[3].length > 0) ||
							(this.layers[4].length > 1)	))
			this.context.clearRect(0,0,this.canvas.width,this.canvas.height);

		var running_draw = false;			
		// draw background here
		for (var i in this.layers[0]) {
			if (this.layers[0][i].Draw()) running_draw = true;
			if (this.redraw) {
				if (Helper.drawElements(this.layers[0][i], 0)) 
					running_draw = true;
			}
		}
		// draw foreground here
		if (this.layers[1].length > 0) {
			// get number of visible && auto-position actors
			var count = 0;
			for (var i in this.layers[1]) {
				if ((this.layers[1][i].visible) && (this.layers[1][i].posMode == 'auto')) count++;
			}						
			// display actors
			var j=0;
			for (var i in this.layers[1]) {
				if (this.layers[1][i].Draw()) running_draw = true;
				if (this.redraw) {
					if (this.layers[1][i].visible) {
						if (this.layers[1][i].posMode == 'auto') {
							this.layers[1][i].target_pos.vx = this.spritePos[count-1][j++];
							Helper.interpolatePosition(this.layers[1][i]);
						}
						if (Helper.drawElements(this.layers[1][i],1))
							running_draw = true;
					}
					else if (this.layers[1][i].pendingRemoval) {
						// free up sprites and avatar
						for (var j in this.layers[1][i].sprites)
							this.layers[1][i].sprites[j].src = null;
						this.layers[1][i].avatar = null;
						this.layers[1].splice(i, 1);
					}
				}
			}
		}		
		// draw overlay/closeup here
		for (var i in this.layers[2]) {
			if (this.layers[2][i].Draw()) running_draw = true;
			if (this.redraw && this.layers[2][i].visible) {
				if (this.layers[2][i].scroll) {
					this.context.save();
					this.context.translate((-this.layers[2][i].scale*(this.layers[2][i].context.canvas.width-this.layers[2][i].backdropDim.vx)/2 
											-(this.layers[2][i].scale*this.layers[2][i].backdropDim.vx-this.canvas.width)*(this.coord.vx/this.canvas.width))>>0,
										   (-this.layers[2][i].scale*(this.layers[2][i].context.canvas.height-this.layers[2][i].backdropDim.vy)/2
											-(this.layers[2][i].scale*this.layers[2][i].backdropDim.vy-this.canvas.height)*(this.coord.vy/this.canvas.height))>>0);
					this.context.scale(this.layers[2][i].scale, this.layers[2][i].scale);
					this.context.drawImage(this.layers[2][i].context.canvas, 0, 0,
											this.layers[2][i].context.canvas.width,
											this.layers[2][i].context.canvas.height);
					this.context.restore();
				}
				else {
					if (Helper.drawElements(this.layers[2][i], 2)) 
						running_draw = true;
				}
			}
		}
		// draw atmosphere effects here
		for (var i in this.layers[3]) {
			if (this.layers[3][i].Draw()) running_draw = true;
			if (this.redraw && this.layers[3][i].visible) {
				this.context.drawImage(this.layers[3][i].context.canvas, 0, 0);
			}
		}		
		// draw gui here
		if (this.layers[4].length > 0) {
			for (var i in this.layers[4]) {
				if (this.layers[4][i].Draw()) running_draw = true;
				if (this.redraw && this.layers[4][i].visible) {
					this.context.drawImage(this.layers[4][i].context.canvas, 
										   this.layers[4][i].origin.vx>>0, 
										   this.layers[4][i].origin.vy>>0);
				}
			}
			// draw tooltips if any
			for (var i in this.layers[4]) {
				if (this.redraw && this.layers[4][i].visible) {
					if ((this.layers[4][i].state == 'hover') && (this.layers[4][i].tooltip)){
						if (this.transTime <= 0)
							Helper.showTooltip(this.layers[4][i].tooltip);
					}
				}
			}
		}
		// draw videos here
		if (Config.movieOnCanvas) {
			for (var i in this.videos) {
				this.context.drawImage(this.videos[i].movie,
									   this.videos[i].pos.vx,
									   this.videos[i].pos.vy,
									   this.videos[i].movie.width, 
									   this.videos[i].movie.height);
			}
		}
		// update redraw variable
		this.redraw = running_draw;
	},
	HandleEvents: function(evt) {
		if (this.mouseOut) return;
		// all mouse and touch moves
		this.targetPos = (this.touchStart) ? this.GetTouchPosition(this.canvas, evt) :
											 this.GetMousePosition(this.canvas, evt);			 
		// mouse click / touch end
		if (this.mouseUp || this.touchEnd) {
			this.click.copy(this.coord);	// used only for debug
			this.mouseClick = true;
			this.mouseUp = false;
			this.touchEnd = false;
			this.touchStart = false;
		}
		else if (this.mouseDown || this.touchStart) {
			for (var i in Stage.layers[4]) {
				if (Stage.layers[4][i].type == "button") {
					if (Stage.layers[4][i].context.isPointInPath(this.targetPos.vx, this.targetPos.vy)) {
						Stage.layers[4][i].state = 'clicked';
					}
					else
						Stage.layers[4][i].state = '';
				}
			}
		}
		else if (this.mouseMove) {
			for (var i in Stage.layers[4]) {
				if (Stage.layers[4][i].type == "button") {
					if (Stage.layers[4][i].context.isPointInPath(this.targetPos.vx, this.targetPos.vy)) {
						Stage.layers[4][i].state = 'hover';
					}
					else
						Stage.layers[4][i].state = '';
				}
			}
		}
	},
	AddDepth: function(layer, dist) {
		if (!Config.actorPerspective) return 0;
		if (layer > 1) return 0;
		// process only background and foreground layers
		return ((layer+1) * 0.1 * dist);
	},
	GetMousePosition: function(obj, event) {
		var pos = new Vector2d(event.pageX, event.pageY);
		pos.vx -= obj.offsetLeft;
		pos.vy -= obj.offsetTop;
		pos.vx = Math.max(0, Math.min(obj.width, pos.vx));
		pos.vy = Math.max(0, Math.min(obj.height, pos.vy));
		try { return pos; }
		finally { pos = null; }
	},
	GetTouchPosition: function(obj, event) {
		var pos = new Vector2d(0,0);
		if (event.targetTouches != null) {
			pos.vx = event.targetTouches[0].pageX - obj.offsetLeft;
			pos.vy = event.targetTouches[0].pageY - obj.offsetTop;
		}
		else {
			pos.vx = event.touches[0].pageX - obj.offsetLeft;
			pos.vy = event.touches[0].pageY - obj.offsetTop;
		}
		pos.vx = Math.max(0, Math.min(obj.width, pos.vx));
		pos.vy = Math.max(0, Math.min(obj.height, pos.vy));
		try { return pos; }
		finally { pos = null; }
	},
	GetCameraPosition: function(elapsed, spring) {
		if (spring) {
			var camPos = new Vector2d(this.coord.vx, this.coord.vy);
			camPos.sub(this.targetPos);
			if (camPos.length() < 0.1) {
				this.prevPos.copy(this.targetPos);
				return this.targetPos;
			}
			// TODO: integrator issues in Opera, for now just do an easing position
			camPos.copy(this.targetPos);
			camPos.add(this.coord);
			camPos.scale(0.5);
			this.prevPos.copy(this.coord);		
			try { return camPos; }
			finally { camPos = null; }
		}	
		else {
			this.prevPos.copy(this.targetPos);
			return this.targetPos;	
		}
	},
	CheckCamera: function() {
		var vec = new Vector2d(this.coord.vx, this.coord.vy);
		vec.sub(this.targetPos);
		if (vec.length() > 0.1) return true;
		return false;
	},
	Transition: function(time) {
		this.transTime = Math.max((time != null) ? time : Config.transTime, 0.1);
	},
	Tick: function(interval) {	
		var now = new Date().getTime();
		var elapsed = now - this.curtime;	// time since last update
		this.curtime = now;
		this.framecount++;
		if (this.curtime - this.prevtime >= 1000) {
			this.prevtime = this.curtime;
			this.fps = this.framecount;
			this.framecount = 0;
		}
		now = null;
		
		if (window.jQuery) {
			// DEBUG:
			//$('#debug').html(Stage.coord.vx +', '+ Stage.coord.vy);
			//$('#debug').html(Stage.targetPos.vx +', '+ Stage.targetPos.vy);
			//$('#debug').html(eval(Stage.coord.vx - Stage.targetPos.vx) +', '+ eval(Stage.coord.vy-Stage.targetPos.vy));
			//$('#debug').html(Stage.click.vx +', '+ Stage.click.vy);
			//$('#debug').html(this.script.frame/2 + ' ' + this.update);
			$('#debug').html('FPS: '+ this.fps + ' Frame: ' + this.script.frame/2);
		}
		// update the stage
		this.Update(elapsed);	
		// draw the stage
		this.Draw();
		// setup next timer tick
		requestAnimFrame(function(){
			Stage.Tick(interval);
		});
	}
}

// ensure config is not null
var Config = {};
// finally, the script and config is loaded
for (var j in TOC) {
	Helper.includeJs(TOC[j]);
}