const core = require('@actions/core');
const github = require('@actions/github');
const { execSync } = require('child_process');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const apiVersion = 'v1';
const serverUrl = 'https://pilot.soteria.dev/api';

export async function run() {
    try {
      const password = core.getInput('soteria-token', {required: true});
      const issue = github.context.issue;
      execSync(`base=$(basename $PWD)
                cd ..
                tar -czf /tmp/code.tgz $base`);
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
        fs.createReadStream('/tmp/code.tgz'),
        'name'
      );
      const formHeaders = formData.getHeaders();
      const response = await axios.post(`${serverUrl}/${apiVersion}/action`, formData, {
        headers: {...formHeaders}
      });
      if (response.data.reports) {
        console.dir(response.data.reports, { depth: null });
        core.setOutput('reports', response.data.reports);
      } else {
        core.setFailed('Failed to get report');
      }
    }
    catch (error) {
      core.setFailed(error.message);
      throw error;
    }
}

run();