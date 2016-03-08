/*
 * grunt-print-logo
 * https://github.com/corycaywood/grunt-print-logo
 *
 * Copyright (c) 2016 Cory Caywood
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {

  grunt.registerMultiTask('print_logo', 'Creates a print version of a logo image.', function() {
	//Async Task
	var done = this.async();

    // Merge task-specific and/or target-specific options with these defaults.
    // var options = this.options({
    //   src: this.data.src,
    //   dest: this.data.dest
    // });
	
	var Jimp = require("jimp"),
		path = require("path"),
		WHITE_THRESHOLD = 0.4,
		PIXEL_THRESHOLD = 0xEEEEEE00,
		TRANSPARENCY_THRESHOLD = 0.25,
		src = this.data.options.src,
		dest = this.data.options.dest;

	createPrintLogo(src, dest);

	function createPrintLogo(imageFile, outputFile) {
		Jimp.read(imageFile, function (err, image) {
			if (err) {
				grunt.fail.warn(err)
			}
			
			var whitePixels = 0,
				transparentPixels = 0,
				imageLength = image.bitmap.width * image.bitmap.height,
				filetype = path.extname(imageFile);

			if (filetype == ".png") {
				var pixelNum = 0;
				var pixels = new Array(image.bitmap.width);
				for (var i = 0; i < pixels.length; i++) {
					pixels[i] = new Array(image.bitmap.height);
				}
				image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
					// x, y is the position of this pixel on the image
					// idx is the position start position of this rgba tuple in the bitmap Buffer
					
					//Get Pixels in array
					var hex = image.getPixelColor(x, y);
					//Strip transarency
					if (hex > 0) {
						hex = hex.toString(16);
						hex = hex.substring(0, hex.length - 2);
						hex = hex + "FF";
					}
					pixels[x][y] = parseInt(hex, 16);
					
					var a = this.bitmap.data[idx + 3];

					//Count number of transparent pixels
					if (a == 0) {
						transparentPixels++;
					}
					
					//Check if loop is on the last pixel
					if (++pixelNum == imageLength) {
						var ratioTransparency = transparentPixels / imageLength;
						
						console.log(ratioTransparency);
						
						if (ratioTransparency > TRANSPARENCY_THRESHOLD) {
							
							function checkPixels(x, y) {
								
								
								if (x < image.bitmap.width && y < image.bitmap.height) {
									var currTrans = x !== 0 ? image.getPixelColor(x, y) : 1;
										currTrans = currTrans.toString(16);
										currTrans = parseInt(currTrans.substring(currTrans.length - 2, currTrans.length), 16);
									var beforeX = x !== 0 ? image.getPixelColor(x - 1, y) : 1;
										beforeX = beforeX.toString(16);
										beforeX = parseInt(beforeX.substring(beforeX.length - 2, beforeX.length), 16);
									var beforeY = y !== 0 ? image.getPixelColor(x, y - 1) : 1;
										beforeY = beforeY.toString(16);
										beforeY = parseInt(beforeY.substring(beforeY.length - 2, beforeY.length), 16);
									var afterX = x < image.bitmap.width-1 ? image.getPixelColor(x + 1, y) : 1;
										afterX = afterX.toString(16);
										afterX = parseInt(afterX.substring(afterX.length - 2, afterX.length), 16);
									var afterY = y < image.bitmap.height-1 ? image.getPixelColor(x, y + 1) : 1;
										afterY = afterY.toString(16);
										afterY = parseInt(afterY.substring(afterY.length - 2, afterY.length), 16);
										// console.log(x + " " + y)
										// console.log(beforeX + " " + beforeY + " " + afterX + " " + afterY)
										
									if (currTrans !== 0 && pixels[x][y] > PIXEL_THRESHOLD && (beforeX === 0 || beforeY === 0 || afterX === 0 || afterY === 0)) {
										
										floodFill(pixels, x, y, pixels[x][y], 0x000000FF, image.bitmap.width, image.bitmap.height, function(filledPixels) {
											pixels = filledPixels;
											if (x < image.bitmap.width - 1) {
												process.nextTick(function(){
													checkPixels(x + 1, y);
												});
											} else if (y < image.bitmap.height - 1) {
												process.nextTick(function(){
													checkPixels(0, y + 1);
												});
											}
										});
									} else {
										if (x < image.bitmap.width - 1) {
											process.nextTick(function(){
												checkPixels(x + 1, y);
											});
										} else if (y < image.bitmap.height - 1) {
											process.nextTick(function(){
												checkPixels(0, y + 1);
											});
										} else {
											checkPixels(image.bitmap.width,  image.bitmap.height);
										}
									}
								} else {

									var scanEnd = 0;
									image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
																				
										var color = pixels[x][y].toString(16);
											color = color.substring(0, color.length - 2);
											color = color + "" + this.bitmap.data[idx + 3].toString(16);
											color = parseInt(color, 16);
											
										// console.log(color.toString(16));
										// console.log(image.getPixelColor(x, y).toString(16))
										
										image.setPixelColor(color, x, y);

										if (++scanEnd == imageLength) {
											// saveImage(imageFile, outputFile);
											image.background(0xFFFFFFFF).write(outputFile, function(){
												console.log("Print logo " + outputFile + " created.");
												done();
											});
										}
										
									});
									
								}
							}
							
							
							checkPixels(0, 0);
							

							
						}
		
						
					}
					
				});
			} else {
				saveImage(imageFile, outputFile, false);
			}

		});
	}

	function saveImage(imageFile, outputFile, invert) {
		Jimp.read(imageFile, function (err, image) {
			if (err) {
				grunt.fail.warn(err);
			}
				
			if (invert) {
				image.greyscale().invert();
			}
			image.background(0xFFFFFFFF).write(outputFile, function(){
				console.log("Print logo " + outputFile + " created.");
				done();
			});
		});
	}
		

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




  });


};



