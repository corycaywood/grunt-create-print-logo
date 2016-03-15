/*
 * grunt-create-print-logo
 * https://github.com/corycaywood/grunt-creaet-print-logo
 *
 * Copyright (c) 2016 Cory Caywood
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {

	grunt.registerMultiTask('create_print_logo', 'Creates a print version of a logo image.', function() {
		//Async Task
		var done = this.async();

		// Merge task-specific and/or target-specific options with these defaults.
		var options = this.options({
			src: this.data.src,
			dest: this.data.dest,               
			color_threshold: 0xEFEFEF,
			pixel_transparency_threshold: 0,
			background_transparency_threshold: 0.25,
			fill_color: 0x000000
		});
		var Jimp = require("jimp"),
			path = require("path"),
			PIXEL_THRESHOLD = getHexTotalVal(options.color_threshold),
			PIXEL_TRANSPARENCY_THRESHOLD = options.pixel_transparency_threshold,
			BACKGROUND_TRANSPARENCY_THRESHOLD = options.background_transparency_threshold,
			SRC = options.src,
			DEST = options.dest,
			FILL_COLOR = options.fill_color;

		createPrintLogo(SRC, DEST);

		function createPrintLogo(imageFile, outputFile) {
			Jimp.read(imageFile, function (err, image) {
				if (err) {
					grunt.fail.warn(err);
				}
				
				// Set initial variables
				var whitePixels = 0,
					transparentPixels = 0,
					width = image.bitmap.width,
					height = image.bitmap.height,
					imageLength = width * height,
					filetype = path.extname(imageFile);

				if (filetype == ".png") {
					var pixelNum = 0;
					// Initialize pixel array
					var pixels = new Array(width);
					for (var i = 0; i < pixels.length; i++) {
						pixels[i] = new Array(height);
					}
					image.scan(0, 0, width, height, function (x, y, idx) {
						// x, y is the position of this pixel on the image
						// idx is the position start position of this rgba tuple in the bitmap Buffer
						
						// Get Pixels in array
						var hex = image.getPixelColor(x, y);
						hex = "00000000" + hex.toString(16);
						hex = hex.substring(hex.length - 8, hex.length);
						// Strip transarency from pixel
						hex = hex.substring(0, hex.length - 2);
						pixels[x][y] = parseInt(hex, 16);
						var alpha = this.bitmap.data[idx + 3];

						// Count number of transparent pixels
						if (alpha === 0) {
							transparentPixels++;
						}
						
						// Check if loop is on the last pixel
						if (++pixelNum == imageLength) {
							//Run Convert pixels if transparency ratio is over threshold
							var ratioTransparency = transparentPixels / imageLength;
							if (ratioTransparency > BACKGROUND_TRANSPARENCY_THRESHOLD) {
								
								// Convert white pixels to black in pixel array
								convertPixels(pixels, image, width, height, FILL_COLOR, function(newPixels){
									// Reset image pixels to pixels from processed array
									var scanEnd = 0;
									image.scan(0, 0, width, height, function (x, y, idx) {
										//Get 6 digit hex
										var color = "000000" + newPixels[x][y].toString(16);
										color = color.substring(color.length - 6, color.length);
										// Add back in transparency
										var alpha = this.bitmap.data[idx + 3];
											alpha = alpha < 16 ? "0" + alpha.toString(16) : alpha.toString(16);
											color = color + alpha;
											color = parseInt(color, 16);
										
										image.setPixelColor(color, x, y);

										if (++scanEnd == imageLength) {
											// saveImage(imageFile, outputFile);
											saveImage(image, outputFile);
										}
										
									});
								});
															
							} else {
								saveImage(image, outputFile);
							}
						}
					});
				} else {
					saveImage(image, outputFile);
				}

			});
		}

		function saveImage(image, outputFile) {
			image.background(0xFFFFFFFF).write(outputFile, function(){
				console.log("Print logo " + outputFile + " created.");
				done();
			});
		}
		
		// Converts white pixels to black if they are touching transparency - accepts and returns array of rgba pixels (no alpha)
		function convertPixels(pixels, image, width, height, fillColor, callback) {
			checkPixels(0, 0);
			function checkPixels(x, y) {
				if (x < width && y < height) {
					var alpha = getHexAlpha(image.getPixelColor(x, y));
					var beforeX = x !== 0 ? getHexAlpha(image.getPixelColor(x - 1, y)) : 1;
					var beforeY = y !== 0 ? getHexAlpha(image.getPixelColor(x, y - 1)) : 1;
					var afterX = x < width-1 ? getHexAlpha(image.getPixelColor(x + 1, y)) : 1;
					var afterY = y < height-1 ? getHexAlpha(image.getPixelColor(x, y + 1)) : 1;

					// Flood fill if the current pixel is white and surrounded by transparency on one side
					if (alpha !== 0 && getHexTotalVal(pixels[x][y]) >= PIXEL_THRESHOLD && (beforeX <= PIXEL_TRANSPARENCY_THRESHOLD || beforeY <= PIXEL_TRANSPARENCY_THRESHOLD || afterX <= PIXEL_TRANSPARENCY_THRESHOLD || afterY <= PIXEL_TRANSPARENCY_THRESHOLD)) {
						floodFill(pixels, x, y, pixels[x][y], fillColor, width, height, function(filledPixels) {
							pixels = filledPixels;
							nextPixel(x, y);
						});
					} else {
						nextPixel(x, y);
					}
				} else {
					// Callback if all pixels have been checked
					if (typeof callback === "function") {
						callback(pixels);
					}
				}
			}
			// Move to next pixel
			function nextPixel(x, y) {
				if (x < width - 1) {
					process.nextTick(function(){
						checkPixels(x + 1, y);
					});
				} else if (y < height - 1) {
					process.nextTick(function(){
						checkPixels(0, y + 1);
					});
				} else {
					checkPixels(width,  height);
				}
			}
		}
		
		// Floodfill function for array
		function floodFill(arrPixels, x, y, targetColor, replacementColor, width, height, callback){
			if(targetColor === replacementColor) {
				return arrPixels;
			}
			var q = [];
			q.push({x: x, y: y});
			while (q.length > 0) {
				var n = q.shift();
				if (arrPixels[n.x][n.y] !== targetColor) {
					continue;
				}
				var w = n, 
					e = {x: x + 1, y: n.y};
				while ((w.x > 0) && (arrPixels[n.x][n.y] === targetColor)) {
					arrPixels[w.x][w.y] = replacementColor;  // setPixel
					if ((w.y > 0) && (arrPixels[w.x][w.y-1] === targetColor)) {
						q.push({x: w.x, y: w.y - 1});
					}
					if ((w.y < height - 1) && (arrPixels[w.x][w.y + 1] === targetColor)) {
								q.push({x: w.x,y: w.y + 1});
							}
					w.x--;
				}
				while ((e.x < width - 1) && (arrPixels[e.x][e.y] === targetColor)) {
					arrPixels[e.x][e.y] = replacementColor;  // setPixel
					if ((e.y > 0) && (arrPixels[e.x][e.y - 1] === targetColor)) {
						q.push({x: e.x, y: e.y - 1});
					}
					if ((e.y < height - 1) && (arrPixels[e.x][e.y + 1] === targetColor)) {
						q.push({x: e.x, y: e.y + 1});
					}
					e.x++;
				}
			}
			if (typeof callback == "function") {
				callback(arrPixels);
			}
		}

		// Get combined value of r + g + b
		function getHexTotalVal(hex) {
			var r = hex.toString(16).substring(0, 2);
			var g = hex.toString(16).substring(2, 4);
			var b =  hex.toString(16).substring(4, 6);
			var val = parseInt(r, 16) + parseInt(g, 16) + parseInt(b, 16);
			return val;
		}
		
		// Get alpha value from hex
		function getHexAlpha(hex) {
			hex = hex.toString(16);
			hex = parseInt(hex.substring(hex.length - 2, hex.length), 16);
			return hex;
		}


	});


};



