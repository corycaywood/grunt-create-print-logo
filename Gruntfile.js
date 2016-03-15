/*
 * grunt-create-print-logo
 * https://github.com/corycaywood/grunt-create-print-logo
 *
 * Copyright (c) 2016 Cory Caywood
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {
	
	grunt.registerTask('create_tmp', 'Creates tmp folder', function() {
		var fs = require('fs');
		fs.mkdirSync('tmp');
	});

  // Project configuration.
  grunt.initConfig({
    jshint: {
      all: [
        'Gruntfile.js',
        'tasks/*.js'
      ],
      options: {
        jshintrc: '.jshintrc'
      }
    },

    // Before generating any new files, remove any previously-created files.
    clean: {
      tests: ['tmp']
    },

    // Configuration to be run (and then tested).
    create_print_logo: {
		default: {
			options: {
				src: 'test/fixtures/headerLogo.png',
				dest: 'tmp/logo-print.jpg'
			}
		}
    }

  });

  // Actually load this plugin's task(s).
  grunt.loadTasks('tasks');

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-clean');

  // Whenever the "test" task is run, first clean the "tmp" dir, then run this
  // plugin's task(s), then test the result.
  grunt.registerTask('test', ['clean', 'create_tmp', 'create_print_logo:default']);

  // By default, lint and run all tests.
  grunt.registerTask('default', ['jshint', 'test']);

};
