'use strict';

var modRewrite = require('connect-modrewrite');
var gzip = require('connect-gzip');

var webpackDistConfig = require('./webpack.dist.config.js'),
    webpackDevConfig = require('./webpack.config.js');

module.exports = function (grunt) {
  // Let *load-grunt-tasks* require everything
  require('load-grunt-tasks')(grunt);

  // Read configuration from package.json
  var pkgConfig = grunt.file.readJSON('package.json');

  grunt.initConfig({
    pkg: pkgConfig,

    webpack: {
      options: webpackDistConfig,

      dist: {
        cache: true
      }
    },

    'webpack-dev-server': {
      options: {
        hot: true,
        port: process.env.PORT || 8000,
        webpack: webpackDevConfig,
        publicPath: '/assets/',
        contentBase: './<%= pkg.src %>/',
        historyApiFallback: true
      },

      start: {
        keepAlive: true
      }
    },

    connect: {
      options: {
        port: process.env.PORT || 8000
      },
      dist: {
        options: {
          keepalive: true,
          middleware: function (connect) {
            return [
              gzip.gzip({ matchType: /javascript|json|css/ }),
              modRewrite(['!\\.html|\\.js|\\.swf|\\.json|\\.xml|\\.css|\\.png|\\.jpg|\\.gif|\\.ico|\\.aff|\\.msi|\\.zip|\\.dic|\\.woff|\\.woff2|\\.eot|\\.ttf|\\.svg /\/ [L]']),
              connect.static(require('path').resolve(pkgConfig.dist), { maxAge: 86400000 })
            ];
          }
        }
      }
    },

    open: {
      options: {
        delay: 500
      },
      dev: {
        path: 'http://localhost:<%= connect.options.port %>/'
      },
      dist: {
        path: 'http://localhost:<%= connect.options.port %>/'
      }
    },

    karma: {
      unit: {
        configFile: 'webpack.karma.conf.js'
      }
    },

    copy: {
      dist: {
        files: [
          // includes files within path
          {
            flatten: true,
            expand: true,
            src: ['<%= pkg.src %>/*'],
            dest: '<%= pkg.dist %>/',
            filter: 'isFile'
          },
          {
            expand: true,
            cwd: '<%= pkg.src %>/images/',
            src: ['**/*'],
            dest: '<%= pkg.dist %>/images/'
          },
        ]
      }
    },

    clean: {
      dist: {
        files: [{
          dot: true,
          src: [
            '<%= pkg.dist %>'
          ]
        }]
      }
    }
  });

  grunt.registerTask('serve', function (target) {
    if (target === 'dist') {
      return grunt.task.run(['build','connect:dist']);
    }else{
      grunt.task.run([
        'open:dev',
        'webpack-dev-server'
      ]);
    }
  });

  grunt.registerTask('heroku', function(target){
    return grunt.task.run(['build']);
  });

  grunt.registerTask('test', ['karma']);

  grunt.registerTask('build', ['clean', 'copy', 'webpack']);

  grunt.registerTask('default', []);
};
