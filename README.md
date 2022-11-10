# Azure Static Website Action

This action was inspired by  [`Azure Storage Action`](https://github.com/lauchacarro/Azure-Storage-Action). I re-wrote the whole thing using node.js

# Deploy Files to Azure Blob Storage

With [`Azure Static Website Action`](https://github.com/tibor19/static-website-deploy), you can automate your workflow to deploy files to [Azure Blob Storage](https://azure.microsoft.com/en-us/services/storage/blobs/)


# End-to-End Sample Workflows

## Dependencies on other Github Actions

* [Checkout](https://github.com/actions/checkout) your Git repository content into Github Actions agent.
  
## Create Azure Storage Account and deploy static website using GitHub Actions
1. Follow the tutorial to [Create an Azure Storage Account](https://docs.microsoft.com/es-es/learn/modules/create-azure-storage-account/5-exercise-create-a-storage-account)
2. Create an empty workflow (`.yml` file) in the `.github/workflows/` folder of your repository.
3. Copy the sample workflow into your workflow file.
4. Change `MyFolder` to the relative path where your files are.
5. Commit and push your repository.
6. You should see a new GitHub Action started under **Actions** tab.

### Sample workflow to deploy a Static Web Site to Azure Blob Storage
```yaml

# File: .github/workflows/workflow.yml

on: [push]

jobs:
  build:
    runs-on: ubuntu-latest
    steps: 
    - name: Checkout the code
      uses: actions/checkout@v3
    - name: Deploy the website
      uses: tibor19/static-website-deploy@v2
      with:
        enabled-static-website: 'true'
        folder: 'MyFolder'
        connection-string: ${{ secrets.CONNECTION_STRING }}

```

#### Configure connection string:

For any credentials like Azure Service Principal, Publish Profile, Connection Strings, etc add them as [secrets](https://developer.github.com/actions/managing-workflows/storing-secrets/) in the GitHub repository and then use them in the workflow.

The above example uses the Connection String of your Azure Storage Account.

Follow the steps to configure the secret:
  * Follow the tutorial [View and copy a connection string](https://docs.microsoft.com/en-us/azure/storage/common/storage-configure-connection-string#view-and-copy-a-connection-string).
  * Define a new secret as part of your repository or organization settings.
  * Give the secret a name ex `CONNECTION_STRING`.
  * Paste the connection string file into the secret's value field.