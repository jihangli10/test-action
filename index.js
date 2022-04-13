const core = require('@actions/core');
const github = require('@actions/github');
const { execSync } = require('child_process');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const apiVersion = 'v1';
const serverUrl = 'https://pilot.soteria.dev/api';
const saveFilename = 'soteria-report.sarif';

export async function run() {
    try {
      const password = core.getInput('soteria-token', {required: true});
      execSync(`base=$(basename $PWD)
                cd ..
                tar -czf /tmp/code.tgz $base`);
      const formData = new FormData();
      const commitId = github.context.payload.commit_oid;
      console.log(github.context);
      const taskName = github.context.payload.repository.name + ' ' + commitId;
      formData.append('taskName', taskName);
      formData.append('description', '');
      formData.append('password', password);
      formData.append('commitId', commitId);
      formData.append('code', fs.createReadStream('/tmp/code.tgz'), 'name');
      const formHeaders = formData.getHeaders();

      core.info('Analyzing code...');
      const response = await axios.post(`${serverUrl}/${apiVersion}/action`, formData, {
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
        core.info(`Total number of warnings: ${response.data.numTotalIssues}`);
        core.info(`The report is saved in the workspace as "${saveFilename}"`);
        core.info(`To view and download the report on Soteria web app, visit: ${response.data.reportLink}`);
        if (response.data.numTotalIssues > 0) {
          core.setFailed(`${response.data.numTotalIssues} vulnerabilities are found!`)
        }
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