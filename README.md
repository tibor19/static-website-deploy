# Azure Static Website Action

This action was inspired by  [`Azure Storage Action`](https://github.com/lauchacarro/Azure-Storage-Action). I re-wrote the whole thing using node.js

# Deploy Files to Azure Blob Storage

With [`Azure Static Website Action`](https://github.com/tibor19/static-website-deploy), you can automate your workflow to deploy files to [Azure Blob Storage](https://azure.microsoft.com/en-us/services/storage/blobs/)


# End-to-End Sample Workflows

## Dependencies on other Github Actions

* [Checkout](https://github.com/actions/checkout) Checkout your Git repository content into Github Actions agent.
  
## Create Azure Storage Account and deploy static website using GitHub Actions
1. Follow the tutorial [Azure Storage Account](https://docs.microsoft.com/es-es/learn/modules/create-azure-storage-account/5-exercise-create-a-storage-account))
2. Copy the following example of workflow and create the workflow to `.github/workflows/` in your project repository.
3. Change `folder` to your folder path where files to deploy are.
4. Commit and push your project to GitHub repository, you should see a new GitHub Action initiated in **Actions** tab.


### Sample workflow to deploy a Static Web Site to Azure Blob Storage
```yaml

# File: .github/workflows/workflow.yml

on: [push]
jobs:
  build:
    runs-on: ubuntu-latest
    steps: 
    - uses: actions/checkout@v2
    - uses: tibor19/static-website-deploy@v1
      with:
        enabled-static-website: 'true'
        folder: 'MyFolder'
        connection-string: ${{ secrets.CONNECTION_STRING }}

```

#### Configure connection string:

For any credentials like Azure Service Principal, Publish Profile, Connection Strings, etc add them as [secrets](https://developer.github.com/actions/managing-workflows/storing-secrets/) in the GitHub repository and then use them in the workflow.

The above example uses the Connection String of your Azure Storage Account.

Follow the steps to configure the secret:
  * Follow the tutorial [View and copy a connection string](https://docs.microsoft.com/en-us/azure/storage/common/storage-configure-connection-string#view-and-copy-a-connection-string) and copy the connection string.
  * Define a new secret under your repository settings, Add secret menu.
  * Paste the connection string file into the secret's value field.
  * Now in the workflow file in your branch: `.github/workflows/workflow.yml` replace the secret for the input `connection-string:` of the Azure Storage Action (Refer to the example above).
    
