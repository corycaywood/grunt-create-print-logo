# grunt-create-print-logo

> Creates a print version of a PNG logo image. The task will intelligently reverse any white pixel areas that are touching transparency.

## Getting Started
This plugin requires Grunt ``

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install grunt-create-print-logo --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-create-print-logo');
```

## The "create_print_logo" task

### Overview
In your project's Gruntfile, add a section named `create_print_logo` to the data object passed into `grunt.initConfig()`.

```js
grunt.initConfig({
	create_print_logo: {
		options: {
			src: 'pathToSourceImage',
			dest: 'pathToOutputImage'
		}
	},
});
```

### Options

#### Default Options

```js
grunt.initConfig({
	create_print_logo: {
		options: {
			src: 'test/fixtures/logo.png',
			dest: 'tmp/logo-print.jpg'
			color_threshold: 0xEFEFEF,
			background_transparency_threshold: 0.25,
			fill_color: 0x000000
		}
	},
});
```