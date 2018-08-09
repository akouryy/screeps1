const YAML = require('js-yaml');
const fs = require('fs');

const settings = YAML.safeLoad(fs.readFileSync('settings.yaml', 'utf8'));

module.exports = function(grunt) {
  grunt.loadNpmTasks('grunt-screeps');

  grunt.initConfig({
    screeps: {
      options: {
        email: settings.deploy.mail,
        password: new Buffer(settings.deploy.pass, 'base64').toString('binary'),
        branch: 'default',
        ptr: false,
      },
      dist: {
        src: ['dist/*.js'],
      },
    },
  });
};
