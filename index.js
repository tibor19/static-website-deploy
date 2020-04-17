const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const { getInput, setFailed } = require('@actions/core');
const { BlobServiceClient } = require('@azure/storage-blob');

const readDirAsync = promisify(fs.readdir);

const listFiles = async function* (dir){
    const files = await readDirAsync(dir);
    for (const file of files){
        const fileName = path.join(dir, file);
        if(fs.statSync(fileName).isDirectory()){
            yield *listFiles(fileName);
        }else{
            yield fileName;
        }
    }
}

const main = async () => {

    const connectionString = getInput('connection-string');
    if (!connectionString) {
        throw "Connection string must be specified!";
    }

    const enableStaticWebSite = getInput('enabled-static-website');
    const containerName = (enableStaticWebSite) ? "$web" : getInput('blob-container-name') ;
    if (!containerName) {
        throw "Either specify a container name, or set enableStaticWebSite to true!";
    }

    const folder = getInput('folder');
    const accessPolicy = getInput('public-access-policy');
    const indexFile = getInput('index-file') || 'index.html';
    const errorFile = getInput('error-file');
    const removeExistingFiles = getInput('remove-existing-files');

    const blobServiceClient = await BlobServiceClient.fromConnectionString(connectionString);

    if (enableStaticWebSite) {
        var props = await blobServiceClient.getProperties();

        props.cors = props.cors || [];
        props.staticWebsite.enabled = true;
        props.staticWebsite.indexDocument = indexFile;
        props.staticWebsite.errorDocument404Path = errorFile;

        await blobServiceClient.setProperties(props);
    }

    const containerService = blobServiceClient.getContainerClient(containerName);
    if (!await containerService.exists()) {
        await containerService.create({ access: accessPolicy });
    }
    else {
        await containerService.setAccessPolicy(accessPolicy);
    }

    if(removeExistingFiles){
        for await (const blob of containerService.listBlobsFlat()){
            await containerService.deleteBlob(blob.name);
        }
    }

    const rootFolder = path.resolve(folder);

    for await (const file of listFiles(rootFolder)) {
        var blobName = path.relative(rootFolder, file);
        var blobClient = containerService.getBlockBlobClient(blobName);
        await blobClient.uploadFile(file);
        console.log(path.relative(rootFolder, file));
    }

};

main().catch(err => {
    console.error(err);
    console.error(err.stack);
    setFailed(err);
    process.exit(-1);
})