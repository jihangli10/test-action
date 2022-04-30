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
      const repoName = github.context.payload.repository? github.context.payload.repository.name : "Unknown Repo";
      // TODO: Better handling of repos without infos.
      const isPrivate = github.context.payload.repository? github.context.payload.repository.private : true;
      const ref = github.context.ref;
      let tag = '';
      if (ref) {
        const refSegments = ref.split('/');
        tag = refSegments[refSegments.length - 1];
      }
      const taskName = `${repoName} ${commit}`;

      fs.mkdirSync(`/tmp/${repoName}/${path}`, { recursive: true })
      execSync(`
        CODE_DIR=$(pwd)
        cp -r "\${CODE_DIR}/${path}/"* /tmp/${repoName}/${path}
        cd /tmp
        tar -czf code.tgz ${repoName}
      `)

      const formData = new FormData();
      formData.append('repoName', repoName);
      formData.append('tag', tag);
      formData.append('taskName', taskName);
      formData.append('isPrivate', isPrivate.toString());
      formData.append('description', '');
      formData.append('password', password);
      formData.append('commit', commit);
      formData.append('code', fs.createReadStream('/tmp/code.tgz'), 'name');
      const formHeaders = formData.getHeaders();

      core.info('Analyzing code...');
      const response = await axios.post(`${apiUrl}/${apiVersion}/action`, formData, {
        headers: {...formHeaders},
        validateStatus: function() {return true},
      });
      if (response.data.report) {
        fs.writeFileSync(saveFilename, JSON.stringify(response.data.report), function (err) {
          if (err) {
            core.setFailed(err.message);
            throw error;
          }
        });

        core.info('Analysis completed!');
        if (response.data.numTotalIssues === 0) {
          core.info(`All tests are passed! A certificate has been issued to you.`);
          core.info(`The report is saved in the workspace as "${saveFilename}"`);
          core.info(`To view and download the report or the certificate on Soteria web app, visit: ${response.data.reportLink}`);
        } else {
          core.setFailed(`Total number of warnings: ${response.data.numTotalIssues}`)
          core.info(`The report is saved in the workspace as "${saveFilename}"`);
          core.info(`To view and download the report on Soteria web app, visit: ${response.data.reportLink}`);
        }

      } else if (response.data.message) {
        core.setFailed('Failed to get report: ' + response.data.message);
      } else {
        core.setFailed('Failed to get report.');
      }
    }
    catch (error) {
      core.setFailed(error.message);
    }
}

run();