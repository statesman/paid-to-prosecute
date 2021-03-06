var ENV_STAGE = process.env.ENV_STAGE || '//cmgdtcpxahost.cmg.int/aas_stage/projects/news/paid-to-prosecute';
var fs = require("fs");

module.exports = function(grunt) {
  'use strict';

  // Project configuration.
  grunt.initConfig({

    // Clean files from dist/ before build
    clean: {
      css: ["public/dist/*.css", "public/dist/*.css.map"],
      js: ["public/dist/*.js", "public/dist/*.js.map"],
      fonts: ["public/fonts/**"],
      pages: ["public/**.html"]
    },

    // Copy FontAwesome files to the fonts/ directory
    copy: {
       fonts: {
        src: [
          'bower_components/font-awesome/fonts/**'
        ],
        dest: 'public/fonts/',
        flatten: true,
        expand: true
      }
    },

    // Transpile LESS
    less: {
      options: {
        sourceMap: true,
        sourceMapFilename: 'public/dist/style.css.map',
        sourceMapURL: 'style.css.map',
        sourceMapRootpath: '../',
        paths: ['bower_components/bootstrap/less']
      },
      prod: {
        options: {
          compress: true,
          yuicompress: true
        },
        files: {
          "public/dist/style.css": "src/css/style.less"
        }
      }
    },

    // Run our JavaScript through JSHint
    jshint: {
      js: {
        src: ['src/js/**.js']
      }
    },


    // Use Uglify to bundle up a pym file for the home page
    uglify: {
      options: {
        sourceMap: true
      },
      prod: {
        files: {
          'public/dist/scripts.js': [
            'bower_components/jquery/dist/jquery.js',
            'bower_components/underscore/underscore.js',
            'bower_components/imagesloaded/imagesloaded.pkgd.js',
            'bower_components/Slides/source/jquery.slides.js',
            'bower_components/twentytwenty/js/jquery.twentytwenty.js',
            'bower_components/twentytwenty/js/jquery.event.move.js',
            'src/js/slider.js',
            'src/js/main.js'
          ]
        }
      }
    },

    // Watch for changes in LESS and JavaScript files,
    // relint/retranspile when a file changes
    watch: {
      options: {
        livereload: true,
      },
      templates: {
        files: ['pages/**/*', 'layouts/*', 'helpers/**', 'partials/*'],
        tasks: ['build:html']
      },
      scripts: {
        files: ['src/js/**.js'],
        tasks: ['build:js']
      },
      styles: {
        files: ['src/css/**.less', 'src/css/**/**.less'],
        tasks: ['build:css']
      }
    },

    // A simple little development server
    connect: {
      server: {
        options: {
          hostname: 'localhost',
          base: 'public',
          keepalive: true,
          livereload: true
        }
      }
    },

    // A tool to run the webserver and livereloader simultaneously
    concurrent: {
      options: {
        logConcurrentOutput: true
      },
      dev: ['connect', 'watch']
    },

    // Bake out static HTML of our pages
    generator: {
      prod: {
        files: [{
          cwd: 'pages',
          src: ['**/*'],
          dest: 'public'
        }],
        options: {
          partialsGlob: 'partials/*.hbs',
          templates: 'layouts',
          templateExt: 'hbs',
          helpers: require('./helpers'),
          base: 'https://projects.statesman.com/news/paid-to-prosecute/',
          nav: [
            {
              title: "Paid to prosecute",
              subtitle: "Overview",
              file: "index"
            },
            {
              title: "Justice for hire?",
              subtitle: "Unusual partnership",
              file: "main"
            },
            {
              title: "A brash prosecutor",
              subtitle: "Independent and opinionated",
              file: "prosecutor"
            },
            {
              title: "Insuring success",
              subtitle: "Forged amid crisis",
              file: "history"
            }
          ]
        }
      }
    },

    // A multi-task to publish static files from public/ to the staging
    // environment
    sync: {
      stage: {
        files: [{
          cwd: 'public',
          src: [
          '**'
          ],
          dest: ENV_STAGE,
        }],
        ignoreInDest: '.htaccess',
        pretend: false,
        verbose: true,
        updateAndDelete: true
      }
    },

    // stage path needs to be set
    ftpush: {
      stage: {
        auth: {
          host: 'cmgdtcpxahost.cmg.int',
          port: 21,
          authKey: 'cmg'
        },
        src: 'public',
        dest: '/stage_aas/projects/news/paid-to-prosecute',
        exclusions: ['dist/tmp','Thumbs.db','.DS_Store'],
        simple: false,
        useList: false
      },
      // prod path will need to change
      prod: {
        auth: {
          host: 'cmgdtcpxahost.cmg.int',
          port: 21,
          authKey: 'cmg'
        },
        src: 'public',
        dest: '/prod_aas/projects/news/paid-to-prosecute/',
        exclusions: ['dist/tmp','Thumbs.db','.DS_Store'],
        simple: false,
        useList: false
      }
    },

    // be sure to set publishing paths
    slack: {
        options: {
          endpoint: fs.readFileSync('.slack', {encoding: 'utf8'}),
          channel: '#bakery',
          username: 'gruntbot',
          icon_url: 'http://vermilion1.github.io/presentations/grunt/images/grunt-logo.png'
        },
        stage: {
          text: 'Project published to stage: http://stage.host.coxmediagroup.com/aas/projects/news/paid-to-prosecute/ {{message}}'
        },
        prod: {
          text: 'Project published to prod: http://projects.statesman.com/news/paid-to-prosecute/ {{message}}'
        }
    }


  });

  // Load the task plugins
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-generator');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-concurrent');
  grunt.loadNpmTasks('grunt-sync');
  grunt.loadNpmTasks('grunt-ftpush');
  grunt.loadNpmTasks('grunt-slack-hook');

  // Assorted build tasks
  grunt.registerTask('build:html', ['clean:pages', 'generator']);
  grunt.registerTask('build:css', ['clean:css', 'clean:fonts', 'copy', 'less']);
  grunt.registerTask('build:js', ['clean:js', 'jshint', 'uglify']);
  grunt.registerTask('build', ['build:html', 'build:css', 'build:js']);

  // Publishing tasks
  grunt.registerTask('stage', ['build', 'ftpush:stage','slack:stage']);
  grunt.registerTask('prod', ['build', 'ftpush:prod','slack:prod']);

  // A dev task that runs a build then launches a dev server w/ livereload
  grunt.registerTask('default', ['build', 'concurrent']);
};
