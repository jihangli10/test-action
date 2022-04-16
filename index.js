const core = require('@actions/core');
const github = require('@actions/github');
const { execSync } = require('child_process');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const apiVersion = 'v1';
const apiUrl = 'https://pilot.soteria.dev/api';
const saveFilename = 'soteria-report.sarif';

export async function run() {
    try {
      const password = core.getInput('soteria-token', {required: true});
      const path = core.getInput('path', {required: false}) || "";
      const commit = github.context.sha;
      const repoName = github.context.payload.repository.name;
      const taskName = repoName + ' ' + commit;

      // execSync(`base=$(basename $PWD)
      //           cd ..
      //           tar -czf /tmp/code.tgz $base`);


      fs.mkdirSync(`/tmp/${repoName}/${path}`, { recursive: true })
      execSync(`
        CODE_DIR=$(pwd)
        cp -r "\${CODE_DIR}/${path}/"* /tmp/${repoName}/${path}
        cd /tmp
        tar -czf code.tgz ${repoName}
      `)

      const formData = new FormData();
      formData.append('taskName', taskName);
      formData.append('description', '');
      formData.append('password', password);
      formData.append('commit', commit);
      formData.append('code', fs.createReadStream('/tmp/code.tgz'), 'name');
      const formHeaders = formData.getHeaders();

      core.info('Analyzing code...');
      const response = await axios.post(`${apiUrl}/${apiVersion}/action`, formData, {
        headers: {...formHeaders}
      });
      if (response.data.report) {
        fs.writeFileSync(saveFilename, JSON.stringify(response.data.report), function (err) {
          if (err) {
            core.setFailed(error.message);
            throw error;
          }
        });

        core.info('Analysis completed!');
        if (response.data.numTotalIssues === 0) {
          core.info(`All tests are passed!`);
        } else {
          core.setFailed(`Total number of warnings: ${response.data.numTotalIssues}`)
        }
        core.info(`The report is saved in the workspace as "${saveFilename}"`);
        core.info(`To view and download the report on Soteria web app, visit: ${response.data.reportLink}`);
      } else {
        core.setFailed('Failed to get report!');
      }
    }
    catch (error) {
      core.setFailed(error.message);
      throw error;
    }
}

run();