const YAML = require('js-yaml');
const fs = require('fs');

const settings = YAML.safeLoad(fs.readFileSync('settings.yaml', 'utf8'));

module.exports = function(grunt) {
  grunt.loadNpmTasks('grunt-screeps');
  grunt.loadNpmTasks('grunt-ts');

  grunt.initConfig({
    screeps: {
      options: {
        email: settings.deploy.mail,
        password: new Buffer(settings.deploy.pass, 'base64').toString('binary'),
        branch: grunt.option('br') || grunt.option('branch') || 'default',
        ptr: false,
      },
      dist: {
        src: ['dist/*.js'],
      },
    },

    ts: {
      default: {
        tsconfig: true,
        watch: 'src/',
      },
    },
  });
};
