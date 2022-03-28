const core = require('@actions/core');
const github = require('@actions/github');
const { execSync } = require('child_process');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const apiVersion = 'v1';
const serverUrl = 'https://pilot.soteria.dev/api';

function run() {
    try {
      const password = core.getInput('soteria-token', {required: true});
      const issue = github.context.issue;
      execSync(`tar -czvf code.tar.gz *`);
      const formData = new FormData();
      const taskName = github.context.payload.repository.name + ' ' + (new Date()).toLocaleString();
      formData.append(
        'taskName',
        taskName
      );
      formData.append(
        'description',
        ''
      );
      formData.append(
        'password',
        password
      );
      formData.append(
        'code',
        fs.createReadStream('./code.tar.gz'),
        'name'
      );
      formData.submit(`${serverUrl}/${apiVersion}/action`, function(err, res) {
        if (err) {
          core.setFailed('Failed to get report');
          return;
        }
        console.log(res);
        core.setOutput('reports', res.data.reports);
      });
    } catch (error) {
      core.setFailed(error.message);
      throw error;
    }
}

run();