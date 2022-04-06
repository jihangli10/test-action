# Github action for security auditing by Soteria

This action conducts security auditing on Solana smart contract using Soteria tool.

Note: The action will send your source code to Soteria's server for the analysis. By using this action, you certify that you agree to the [Terms of Use]() and the [Privacy Policies]() of Soteria.

## Input

### `soteria-token`

**Required.** The token provided by Soteria.

For those who have previously used the Soteria web app, the token is the same as the invitation code.

If you wish to get a token and try Soteria tool, please email [contact@soteria.dev](contact@soteria.dev).

After acquiring the token, navigate to your repository, click Settings -> Secrets -> Actions -> New Repository Secret, Name the token in the `Name` field, paste the token in the `Value` field and click `Add secret`. The token is now accessible in the workflow as `${{ secrets.YOUR_TOKEN_NAME }}`

Warning: **DO NOT** explicitly include your token in the workflow.

## Output

The output of the action is a file in the format of [Static Analysis Results Interchange Format (SARIF) Version 2.1.0](https://docs.oasis-open.org/sarif/sarif/v2.1.0/sarif-v2.1.0.html). It can be accessed by:

### Direct download
A download link will be provided in the log of the action.

### File in the workspace
A file named `soteria-report.sarif` will be generated in the workspace.

## Example usage
    # Checkout the source code into the github workspace
    - uses: actions/checkout@v2
    # Call the action for Soteria tool.
    - uses: coderrect/soteria-analysis@v1
      with:
        soteria-token: ${{ secrets.SOTERIA_TOKEN }}
    # Optional. Upload the report to github code scanning
    - uses: github/codeql-action/upload-sarif@v1
      with:
        sarif_file: soteria-report.sarif